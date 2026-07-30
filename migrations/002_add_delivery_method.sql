-- Add delivery_method column to orders table
-- Tracks whether the customer chose "Cash on Delivery" or "Pickup from Store"
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'Pickup from Store';
