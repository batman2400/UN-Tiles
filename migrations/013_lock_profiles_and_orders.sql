-- ============================================================
-- Migration 013: Lock profiles PII, pending-order edits, admin self-insert
--
-- Fixes:
--   1. profiles SELECT using (true) leaked every customer's email/phone
--   2. Users could UPDATE own Pending orders (poison line_items;
--      cancel then restored attacker-controlled stock)
--   3. profiles INSERT allowed role = 'admin' when no row existed
--
-- NOTE: production `profiles.role` is enum user_role_type (not text).
-- Do not use the literal 'user' — that label is not in the enum.
-- Non-admin is whatever non-'admin' label exists (often customer/member).
--
-- Run this in the Supabase SQL Editor after 012.
-- Safe to re-run if a previous attempt failed.
-- ============================================================

BEGIN;

-- Bypass RLS when checking admin so policies on profiles cannot recurse.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Default (non-admin) role label for this database: enum label or 'user' for text columns.
CREATE OR REPLACE FUNCTION public.default_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role_type'
        AND e.enumlabel <> 'admin'
      ORDER BY e.enumsortorder
      LIMIT 1
    ),
    'user'
  );
$$;

REVOKE ALL ON FUNCTION public.default_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.default_profile_role() TO authenticated;

-- ── 1. Profiles: own row + admins only ───────────────────

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
CREATE POLICY "Users can view own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
CREATE POLICY "Admins can view all profiles." ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
    AND (role IS NULL OR role::text IS DISTINCT FROM 'admin')
  );

-- ── 2. Force default (non-admin) role for authenticated writes ─
-- SQL editor / service role (no JWT) can still promote admins.

CREATE OR REPLACE FUNCTION public.prevent_role_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_default := public.default_profile_role();

  IF TG_OP = 'INSERT' THEN
    -- Assign via text so this works for both enum and text columns.
    NEW.role := v_default;
  ELSIF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_role_privilege_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_privilege_escalation();

-- ── 3. Customers cannot rewrite pending orders ───────────
-- Checkout writes via process_checkout (SECURITY DEFINER).
-- Cancel/status changes are admin-only.

DROP POLICY IF EXISTS "Users can update own pending orders." ON public.orders;

COMMIT;
