-- ============================================================
-- Migration 012: Restore stock when an order is cancelled
--
-- Checkout already deducts stock. Cancelling only flipped the
-- status, so inventory stayed reduced. This migration:
--   1. Stores structured line items on each new order
--   2. Restores that quantity when status becomes Cancelled
--   3. Re-deducts if a cancelled order is reopened
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS line_items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── Resolve product lines for an order ───────────────────
-- Prefers structured line_items. Falls back to parsing the
-- human-readable "Name (qty sq ft), ..." summary for older orders.

CREATE OR REPLACE FUNCTION public.order_stock_lines(p_order public.orders)
RETURNS TABLE(product_id text, quantity_sqft numeric)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_order.line_items IS NOT NULL AND jsonb_array_length(p_order.line_items) > 0 THEN
    RETURN QUERY
    SELECT
      elem->>'product_id',
      (elem->>'quantity_sqft')::numeric
    FROM jsonb_array_elements(p_order.line_items) AS elem
    WHERE elem->>'product_id' IS NOT NULL
      AND (elem->>'quantity_sqft') IS NOT NULL
      AND (elem->>'quantity_sqft')::numeric > 0;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, parsed.qty
  FROM (
    SELECT trim(m[1]) AS product_name, m[2]::numeric AS qty
    FROM regexp_matches(
      COALESCE(p_order.items, ''),
      '(.+?) \(([0-9]+(?:\.[0-9]+)?) sq ft\)(?:, |$)',
      'g'
    ) AS m
  ) AS parsed
  JOIN LATERAL (
    SELECT id
    FROM public.products
    WHERE name = parsed.product_name
    LIMIT 1
  ) AS p ON true;
END;
$$;

-- ── Trigger: keep inventory in sync with cancel / reopen ─

CREATE OR REPLACE FUNCTION public.handle_order_status_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line record;
  v_stock numeric;
  v_name text;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Cancelled ← any other status: put deducted stock back
  IF NEW.status = 'Cancelled' AND OLD.status IS DISTINCT FROM 'Cancelled' THEN
    FOR v_line IN SELECT * FROM public.order_stock_lines(OLD) LOOP
      UPDATE public.products
      SET stock_sqft = stock_sqft + v_line.quantity_sqft
      WHERE id = v_line.product_id;
    END LOOP;
    RETURN NEW;
  END IF;

  -- Any other status ← Cancelled: take the stock again
  IF OLD.status = 'Cancelled' AND NEW.status IS DISTINCT FROM 'Cancelled' THEN
    FOR v_line IN SELECT * FROM public.order_stock_lines(NEW) LOOP
      SELECT stock_sqft, name
      INTO v_stock, v_name
      FROM public.products
      WHERE id = v_line.product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot reopen order %: product % no longer exists.', NEW.id, v_line.product_id;
      END IF;

      IF v_stock < v_line.quantity_sqft THEN
        RAISE EXCEPTION 'Cannot reopen order %: insufficient stock for "%". Available: % sq ft, needed: % sq ft.',
          NEW.id, v_name, v_stock, v_line.quantity_sqft;
      END IF;

      UPDATE public.products
      SET stock_sqft = stock_sqft - v_line.quantity_sqft
      WHERE id = v_line.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_status_stock_trigger ON public.orders;
CREATE TRIGGER order_status_stock_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_stock();

-- ── Checkout: persist structured line items ──────────────

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_user_id uuid,
  p_items jsonb,
  p_delivery_method text DEFAULT 'Pickup from Store'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_product_id text;
  v_quantity numeric;
  v_current_stock numeric;
  v_price numeric;
  v_total numeric := 0;
  v_order_id text;
  v_items_summary text := '';
  v_item_count int := 0;
  v_product_name text;
  v_line_items jsonb := '[]'::jsonb;
BEGIN
  IF p_delivery_method NOT IN ('Cash on Delivery', 'Pickup from Store') THEN
    RAISE EXCEPTION 'Invalid delivery method: %', p_delivery_method;
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please add items before checkout.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity_sqft')::numeric;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT stock_sqft, price_per_sqft, name
    INTO v_current_stock, v_price, v_product_name
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found.', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: % sq ft, Requested: % sq ft',
        v_product_name, v_current_stock, v_quantity;
    END IF;

    UPDATE public.products
    SET stock_sqft = stock_sqft - v_quantity
    WHERE id = v_product_id;

    v_total := v_total + (v_price * v_quantity);

    v_item_count := v_item_count + 1;
    IF v_items_summary <> '' THEN
      v_items_summary := v_items_summary || ', ';
    END IF;
    v_items_summary := v_items_summary || v_product_name || ' (' || v_quantity || ' sq ft)';

    v_line_items := v_line_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product_id,
        'quantity_sqft', v_quantity,
        'name', v_product_name
      )
    );
  END LOOP;

  v_order_id := 'UN-' || to_char(now(), 'YYYY') || '-' || lpad(
    (SELECT COALESCE(MAX(
      CASE WHEN id ~ '^UN-[0-9]{4}-[0-9]+$'
        THEN split_part(id, '-', 3)::int
        ELSE 0
      END
    ), 0) + 1 FROM public.orders)::text, 4, '0'
  );

  INSERT INTO public.orders (id, user_id, status, total, items, line_items, delivery_method, date)
  VALUES (
    v_order_id,
    p_user_id,
    'Pending',
    v_total::text,
    v_items_summary,
    v_line_items,
    p_delivery_method,
    now()
  );

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, jsonb, text) TO authenticated;

COMMIT;
