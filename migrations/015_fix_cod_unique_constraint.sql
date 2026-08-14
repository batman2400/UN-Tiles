-- ============================================================
-- Migration 015: COD checkout was not an order-id problem
--
-- Pickup worked and Cash on Delivery returned:
--   "Could not allocate a unique order id. Please try again."
--
-- That message came from 014 swallowing EVERY unique_violation
-- and retrying a new id 50 times. COD (and a second checkout of
-- the same cart) can hit a unique constraint on another column
-- (delivery_method, items, user_id, …). New ids never help, so
-- it always looked like an order-number failure.
--
-- This migration:
--   1. Drops extra UNIQUE constraints/indexes on orders
--      (primary key on id is the only unique key orders need)
--   2. Retries only orders_pkey collisions
--   3. Stops using lpad(..., 4) which truncates after 9999
--
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.order_id_seq;

-- ── Keep only the primary key unique on orders ───────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'orders'
      AND c.contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  FOR r IN
    SELECT i.relname AS idxname
    FROM pg_index x
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'orders'
      AND x.indisunique
      AND NOT x.indisprimary
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.idxname);
  END LOOP;
END $$;

DO $$
DECLARE
  v_max int;
  v_seq bigint;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN id ~ '^UN-[0-9]{4}-[0-9]+$'
      THEN split_part(id, '-', 3)::int
      ELSE 0
    END
  ), 0) INTO v_max FROM public.orders;

  SELECT last_value INTO v_seq FROM public.order_id_seq;

  IF v_max > 0 THEN
    PERFORM setval('public.order_id_seq', GREATEST(v_max, COALESCE(v_seq, 1)), true);
  END IF;
END $$;

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
  v_order_n bigint;
  v_items_summary text := '';
  v_product_name text;
  v_line_items jsonb := '[]'::jsonb;
  v_attempts int := 0;
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

  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 50 THEN
      RAISE EXCEPTION 'Could not allocate a unique order id. Please try again.';
    END IF;

    v_order_n := nextval('public.order_id_seq');
    -- lpad(..., 4) truncates values >= 10000 to the same suffix.
    v_order_id := 'UN-' || to_char(now(), 'YYYY') || '-' ||
      CASE
        WHEN v_order_n < 10000 THEN lpad(v_order_n::text, 4, '0')
        ELSE v_order_n::text
      END;

    BEGIN
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
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        IF SQLERRM LIKE '%orders_pkey%' THEN
          NULL;
        ELSE
          RAISE;
        END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, jsonb, text) TO authenticated;

COMMIT;
