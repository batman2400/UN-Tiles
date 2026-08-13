-- ============================================================
-- Migration 009: Admin Products Delete Policy
-- Allows admins to delete products from the inventory table.
-- Run this in the Supabase SQL Editor.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "Admins can delete products." ON public.products;
CREATE POLICY "Admins can delete products." ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMIT;
