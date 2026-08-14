-- ============================================================
-- Migration 017: Allow authenticated users to manage addresses
--
-- Add-address from the app was failing when the table had RLS
-- policies but the authenticated role had no GRANT, or when
-- INSERT policies were missing.
--
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;

DROP POLICY IF EXISTS "Users can view own addresses." ON public.addresses;
CREATE POLICY "Users can view own addresses." ON public.addresses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses." ON public.addresses;
CREATE POLICY "Users can insert own addresses." ON public.addresses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses." ON public.addresses;
CREATE POLICY "Users can update own addresses." ON public.addresses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses." ON public.addresses;
CREATE POLICY "Users can delete own addresses." ON public.addresses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
