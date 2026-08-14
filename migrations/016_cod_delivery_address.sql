-- ============================================================
-- Migration 016: Require and snapshot a COD delivery address
--
-- Cash on Delivery must ship somewhere. Saved addresses stay on
-- the customer profile; the order stores a copy so admins can
-- still see it after the customer edits or deletes the original.
--
-- Run this in the Supabase SQL Editor after 015. Safe to re-run.
-- ============================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_address jsonb;

CREATE SEQUENCE IF NOT EXISTS public.order_id_seq;

DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text, uuid);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_user_id uuid,
  p_items jsonb,
  p_delivery_method text DEFAULT 'Pickup from Store',
  p_address_id uuid DEFAULT NULL
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
  v_delivery_address jsonb;
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

  IF p_delivery_method = 'Cash on Delivery' THEN
    IF p_address_id IS NULL THEN
      RAISE EXCEPTION 'A delivery address is required for Cash on Delivery.';
    END IF;

    SELECT jsonb_build_object(
      'id', a.id,
      'label', a.label,
      'line1', a.line1,
      'line2', a.line2,
      'country', COALESCE(NULLIF(btrim(a.country), ''), 'Sri Lanka')
    )
    INTO v_delivery_address
    FROM public.addresses a
    WHERE a.id = p_address_id
      AND a.user_id = v_user_id;

    IF v_delivery_address IS NULL THEN
      RAISE EXCEPTION 'Delivery address not found.';
    END IF;

    IF btrim(COALESCE(v_delivery_address->>'line1', '')) = '' THEN
      RAISE EXCEPTION 'Delivery address is incomplete.';
    END IF;
  ELSE
    v_delivery_address := NULL;
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
    v_order_id := 'UN-' || to_char(now(), 'YYYY') || '-' ||
      CASE
        WHEN v_order_n < 10000 THEN lpad(v_order_n::text, 4, '0')
        ELSE v_order_n::text
      END;

    BEGIN
      INSERT INTO public.orders (
        id, user_id, status, total, items, line_items, delivery_method, delivery_address, date
      )
      VALUES (
        v_order_id,
        v_user_id,
        'Pending',
        v_total::text,
        v_items_summary,
        v_line_items,
        p_delivery_method,
        v_delivery_address,
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

REVOKE ALL ON FUNCTION public.process_checkout(uuid, jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, jsonb, text, uuid) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
