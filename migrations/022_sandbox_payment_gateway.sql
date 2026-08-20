-- ============================================================
-- Migration 022: Sandbox & Online Payment Gateway Support
--
-- Adds payment tracking columns to public.orders:
--   - payment_method (e.g., 'Online Payment (Sandbox)', 'Cash on Delivery', 'Pickup from Store')
--   - payment_status (e.g., 'Paid', 'Pending', 'Failed', 'Refunded')
--   - payment_details (jsonb metadata: txn id, card brand, last4, auth code, timestamp)
--
-- Updates process_checkout stored procedure to record payment details.
-- Safe to re-run.
-- ============================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Cash on Delivery',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS payment_details jsonb DEFAULT '{}'::jsonb;

-- Drop previous overloaded signatures to avoid ambigous signature resolution
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text, uuid);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text, uuid, text);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text, uuid, text, text);
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text, uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.process_checkout(
  p_user_id uuid,
  p_items jsonb,
  p_delivery_method text DEFAULT 'Pickup from Store',
  p_address_id uuid DEFAULT NULL,
  p_payment_method text DEFAULT 'Cash on Delivery',
  p_payment_status text DEFAULT 'Pending',
  p_payment_details jsonb DEFAULT '{}'::jsonb
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
  v_status_history jsonb := '[]'::jsonb;
  v_initial_status text := 'Pending';
  v_initial_desc text := 'Order placed and awaiting verification by UN Tiles fulfillment team.';
  v_payment_method text;
  v_payment_status text;
  v_clean_payment_details jsonb;
  v_now timestamptz := now();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR v_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_delivery_method NOT IN ('Cash on Delivery', 'Pickup from Store', 'Island-wide Delivery') THEN
    RAISE EXCEPTION 'Invalid delivery method: %', p_delivery_method;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please add items before checkout.';
  END IF;

  v_payment_method := COALESCE(NULLIF(btrim(p_payment_method), ''), 'Cash on Delivery');
  v_payment_status := COALESCE(NULLIF(btrim(p_payment_status), ''), 'Pending');
  v_clean_payment_details := COALESCE(p_payment_details, '{}'::jsonb);

  -- Delivery address handling for delivery orders
  IF p_delivery_method IN ('Cash on Delivery', 'Island-wide Delivery') THEN
    IF p_address_id IS NULL THEN
      RAISE EXCEPTION 'A delivery address is required for delivery orders.';
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

  -- If paid online via Sandbox gateway, initialize status to Processing
  IF v_payment_status = 'Paid' THEN
    v_initial_status := 'Processing';
    v_initial_desc := 'Payment verified via Sandbox Gateway. Order confirmed and queued for tile fulfillment.';
  END IF;

  v_status_history := jsonb_build_array(
    jsonb_build_object(
      'status', v_initial_status,
      'description', v_initial_desc,
      'timestamp', v_now,
      'updated_by', 'System'
    )
  );

  -- Process line items and stock reservation
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

  -- Generate unique Order ID
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
        id,
        user_id,
        status,
        status_description,
        status_history,
        status_updated_at,
        total,
        items,
        line_items,
        delivery_method,
        delivery_address,
        payment_method,
        payment_status,
        payment_details,
        date
      )
      VALUES (
        v_order_id,
        v_user_id,
        v_initial_status,
        v_initial_desc,
        v_status_history,
        v_now,
        v_total::text,
        v_items_summary,
        v_line_items,
        p_delivery_method,
        v_delivery_address,
        v_payment_method,
        v_payment_status,
        v_clean_payment_details,
        v_now
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

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'total', v_total,
    'payment_status', v_payment_status,
    'payment_method', v_payment_method
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(uuid, jsonb, text, uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, jsonb, text, uuid, text, text, jsonb) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
