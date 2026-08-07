-- ============================================================
-- Migration 006: Version-controlled process_checkout RPC
-- Fixes: CRITICAL-4 (delivery_method outside transaction)
--        HIGH-11   (RPC not in version control)
--
-- This function handles ACID-compliant checkout:
--   1. Row-level locking (SELECT ... FOR UPDATE)
--   2. Stock validation & deduction
--   3. Order creation with delivery method
--   All within a single database transaction.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Allow the orders table to accept insert via RPC (security definer)
DROP POLICY IF EXISTS "RPC can insert orders." ON public.orders;
CREATE POLICY "RPC can insert orders." ON public.orders
  FOR INSERT WITH CHECK (true);

-- Drop the old function if it exists (to replace signature)
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text);

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
BEGIN
  -- Validate delivery method
  IF p_delivery_method NOT IN ('Cash on Delivery', 'Pickup from Store') THEN
    RAISE EXCEPTION 'Invalid delivery method: %', p_delivery_method;
  END IF;

  -- Validate that items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please add items before checkout.';
  END IF;

  -- Process each item with row-level locking
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity_sqft')::numeric;

    -- Validate quantity
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    -- Lock the product row and check stock
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

    -- Deduct stock
    UPDATE public.products
    SET stock_sqft = stock_sqft - v_quantity
    WHERE id = v_product_id;

    -- Accumulate total
    v_total := v_total + (v_price * v_quantity);

    -- Build items summary
    v_item_count := v_item_count + 1;
    IF v_items_summary <> '' THEN
      v_items_summary := v_items_summary || ', ';
    END IF;
    v_items_summary := v_items_summary || v_product_name || ' (' || v_quantity || ' sq ft)';
  END LOOP;

  -- Generate order ID
  v_order_id := 'UN-' || to_char(now(), 'YYYY') || '-' || lpad(
    (SELECT COALESCE(MAX(
      CASE WHEN id ~ '^UN-[0-9]{4}-[0-9]+$'
        THEN split_part(id, '-', 3)::int
        ELSE 0
      END
    ), 0) + 1 FROM public.orders)::text, 4, '0'
  );

  -- Create the order (delivery_method included in the same transaction)
  INSERT INTO public.orders (id, user_id, status, total, items, delivery_method, date)
  VALUES (
    v_order_id,
    p_user_id,
    'Pending',
    v_total::text,
    v_items_summary,
    p_delivery_method,
    now()
  );

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, jsonb, text) TO authenticated;
