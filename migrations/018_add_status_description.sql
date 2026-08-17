-- ============================================================
-- Migration 018: Add status description & status history to orders
--
-- Enables admins to provide a short description/note when updating
-- an order's status (e.g., dispatch tracking info, warehouse update,
-- cancellation reason). Customers can view the latest status description
-- and interactive timeline in their profile.
--
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status_description text,
  ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now();

COMMIT;

NOTIFY pgrst, 'reload schema';
