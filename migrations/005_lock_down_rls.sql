-- ============================================================
-- Migration 005: Lock Down RLS Policies
-- Fixes: CRITICAL-2 (permissive INSERT/UPDATE on products & categories)
--        CRITICAL-3 (add role column to profiles, prevent client escalation)
--        MEDIUM-15  (inquiries admin check uses hardcoded email)
-- Run this in the Supabase SQL Editor
-- ============================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1. PROFILES: Add role column (if missing) with safe default
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Drop the old permissive update policy
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Users can update their own profile BUT cannot change their role
CREATE POLICY "Users can update own profile (no role change)." ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      role IS NOT DISTINCT FROM (
        SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 2. PRODUCTS: Remove permissive seed policies, restrict to admin
-- ═══════════════════════════════════════════════════════════

-- Remove all permissive INSERT/UPDATE policies
DROP POLICY IF EXISTS "Products can be inserted by anyone (seed)." ON public.products;
DROP POLICY IF EXISTS "Products can be inserted by anyone." ON public.products;
DROP POLICY IF EXISTS "Products can be updated by anyone (seed)." ON public.products;
DROP POLICY IF EXISTS "Products can be updated by anyone." ON public.products;

-- Only admins can insert products
DROP POLICY IF EXISTS "Only admins can insert products." ON public.products;
CREATE POLICY "Only admins can insert products." ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update products (may already exist from migration 004, ensure it's present)
DROP POLICY IF EXISTS "Admins can update products." ON public.products;
CREATE POLICY "Admins can update products." ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 3. CATEGORIES: Remove permissive seed policies, restrict to admin
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Categories can be inserted by anyone (seed)." ON public.categories;
DROP POLICY IF EXISTS "Categories can be inserted by anyone." ON public.categories;
DROP POLICY IF EXISTS "Categories can be updated by anyone (seed)." ON public.categories;
DROP POLICY IF EXISTS "Categories can be updated by anyone." ON public.categories;

DROP POLICY IF EXISTS "Only admins can insert categories." ON public.categories;
CREATE POLICY "Only admins can insert categories." ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can update categories." ON public.categories;
CREATE POLICY "Only admins can update categories." ON public.categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 4. INQUIRIES: Replace hardcoded email check with role-based
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Only admins can view inquiries." ON public.inquiries;
CREATE POLICY "Only admins can view inquiries." ON public.inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMIT;
