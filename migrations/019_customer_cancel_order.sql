-- ============================================================
-- Migration 019: Customer Order Cancellation RPC
--
-- Enables authenticated customers to cancel their own orders while
-- the order is in 'Pending' or 'Processing' status.
--
-- Security & Business Logic:
--   1. Validates auth.uid() matches order.user_id.
--   2. Enforces cancellation window: allowed only when status is 'Pending'
--      or 'Processing'. Once 'Shipped' or 'Delivered', cancellation is rejected.
--   3. Updates status to 'Cancelled', logs the reason in status_description,
--      appends to status_history (with updated_by: 'Customer'), and updates status_updated_at.
--   4. Automatically fires the existing trigger (handle_order_status_stock)
--      which restores the reserved tile square footage back to warehouse inventory.
--
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_customer_order(
  p_order_id text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
  v_clean_reason text;
  v_history jsonb;
  v_new_history_entry jsonb;
  v_updated_history jsonb;
  v_now timestamptz := now();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please log in to cancel your order.';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found.', p_order_id;
  END IF;

  IF v_order.user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only cancel your own orders.';
  END IF;

  IF lower(v_order.status) NOT IN ('pending', 'processing') THEN
    IF lower(v_order.status) = 'cancelled' THEN
      RAISE EXCEPTION 'This order has already been cancelled.';
    ELSIF lower(v_order.status) IN ('shipped', 'delivered') THEN
      RAISE EXCEPTION 'Orders cannot be cancelled online once they are %; please contact customer support for assistance.', v_order.status;
    ELSE
      RAISE EXCEPTION 'Order cannot be cancelled at this stage (current status: %).', v_order.status;
    END IF;
  END IF;

  v_clean_reason := COALESCE(NULLIF(btrim(p_reason), ''), 'Order cancelled by customer.');
  v_history := COALESCE(v_order.status_history, '[]'::jsonb);
  IF jsonb_typeof(v_history) IS DISTINCT FROM 'array' THEN
    v_history := '[]'::jsonb;
  END IF;

  v_new_history_entry := jsonb_build_object(
    'status', 'Cancelled',
    'description', v_clean_reason,
    'timestamp', v_now,
    'updated_by', 'Customer'
  );

  v_updated_history := v_history || jsonb_build_array(v_new_history_entry);

  UPDATE public.orders
  SET
    status = 'Cancelled',
    status_description = v_clean_reason,
    status_history = v_updated_history,
    status_updated_at = v_now
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'Cancelled',
    'status_description', v_clean_reason,
    'status_history', v_updated_history,
    'status_updated_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_customer_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_customer_order(text, text) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
