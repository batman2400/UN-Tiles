-- ============================================================
-- Migration 012: Atomic checkout + restore stock on cancel
--
-- Checkout must create the order, persist structured line_items,
-- and deduct stock in one transaction. Cancelling previously only
-- flipped status, so inventory stayed reduced.
--
-- This migration:
--   1. Adds orders.line_items
--   2. Restores stock when status becomes Cancelled (and re-deducts
--      if a cancelled order is reopened)
--   3. Replaces process_checkout with a race-safe version:
--        - auth.uid() must match p_user_id
--        - product rows locked FOR UPDATE in id order
--        - duplicate cart lines merged
--        - order IDs from a sequence (fixes the UN-YYYY-NNNN collision)
--   4. Drops the open INSERT policy on orders (only the RPC inserts)
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS line_items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Race-safe order numbers. nextval() is not transactional (skipped
-- numbers on rollback are OK); MAX()+1 is not safe under concurrency.
CREATE SEQUENCE IF NOT EXISTS public.order_id_seq;

DO $$
DECLARE
  v_max int;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN id ~ '^UN-[0-9]{4}-[0-9]+$'
      THEN split_part(id, '-', 3)::int
      ELSE 0
    END
  ), 0) INTO v_max FROM public.orders;

  IF v_max > 0 THEN
    PERFORM setval('public.order_id_seq', v_max, true);
  ELSE
    PERFORM setval('public.order_id_seq', 1, false);
  END IF;
END $$;

REVOKE ALL ON SEQUENCE public.order_id_seq FROM PUBLIC;

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
  IF p_order.line_items IS NOT NULL
     AND jsonb_typeof(p_order.line_items) = 'array'
     AND jsonb_array_length(p_order.line_items) > 0 THEN
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

-- ── Checkout: one transaction for order + stock + line_items ─

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
  v_user_id uuid;
  v_item record;
  v_current_stock numeric;
  v_price numeric;
  v_total numeric := 0;
  v_order_id text;
  v_items_summary text := '';
  v_product_name text;
  v_line_items jsonb := '[]'::jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR v_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_delivery_method NOT IN ('Cash on Delivery', 'Pickup from Store') THEN
    RAISE EXCEPTION 'Invalid delivery method: %', p_delivery_method;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please add items before checkout.';
  END IF;

  -- Merge duplicate product lines and lock rows in a stable order
  -- so two concurrent checkouts cannot oversell or deadlock.
  FOR v_item IN
    SELECT
      elem->>'product_id' AS product_id,
      SUM((elem->>'quantity_sqft')::numeric) AS quantity_sqft
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY elem->>'product_id'
    ORDER BY elem->>'product_id'
  LOOP
    IF v_item.product_id IS NULL OR btrim(v_item.product_id) = '' THEN
      RAISE EXCEPTION 'Invalid product in cart';
    END IF;

    IF v_item.quantity_sqft IS NULL OR v_item.quantity_sqft <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_item.product_id;
    END IF;

    SELECT stock_sqft, price_per_sqft, name
    INTO v_current_stock, v_price, v_product_name
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found.', v_item.product_id;
    END IF;

    IF v_current_stock < v_item.quantity_sqft THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: % sq ft, Requested: % sq ft',
        v_product_name, v_current_stock, v_item.quantity_sqft;
    END IF;

    UPDATE public.products
    SET stock_sqft = stock_sqft - v_item.quantity_sqft
    WHERE id = v_item.product_id;

    v_total := v_total + (v_price * v_item.quantity_sqft);

    IF v_items_summary <> '' THEN
      v_items_summary := v_items_summary || ', ';
    END IF;
    v_items_summary := v_items_summary || v_product_name || ' (' || v_item.quantity_sqft || ' sq ft)';

    v_line_items := v_line_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_item.product_id,
        'quantity_sqft', v_item.quantity_sqft,
        'name', v_product_name
      )
    );
  END LOOP;

  v_order_id := 'UN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_id_seq')::text, 4, '0');

  INSERT INTO public.orders (id, user_id, status, total, items, line_items, delivery_method, date)
  VALUES (
    v_order_id,
    v_user_id,
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

-- Clients must not insert orders directly. process_checkout is
-- SECURITY DEFINER and writes the row as the function owner.
DROP POLICY IF EXISTS "RPC can insert orders." ON public.orders;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, jsonb, text) TO authenticated;

COMMIT;
