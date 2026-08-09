-- ============================================================
-- Migration 007: Admin Audit Log
-- Adds an append-only audit trail for admin actions (stock
-- changes, order status updates, product/category creation)
-- so it's always possible to see who changed what and when.
-- Run this in the Supabase SQL Editor.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  admin_email text,
  action text not null,        -- e.g. 'order.status_updated', 'product.stock_updated'
  entity_type text not null,   -- 'order' | 'product' | 'category'
  entity_id text not null,
  details jsonb,                -- freeform context, e.g. { "from": "Pending", "to": "Shipped" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit trail.
DROP POLICY IF EXISTS "Admins can view audit log." ON public.audit_log;
CREATE POLICY "Admins can view audit log." ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can append entries — and only attributed to themselves.
DROP POLICY IF EXISTS "Admins can insert their own audit log entries." ON public.audit_log;
CREATE POLICY "Admins can insert their own audit log entries." ON public.audit_log
  FOR INSERT WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- No UPDATE/DELETE policies are defined on purpose: the audit log is
-- append-only. Even admins cannot modify or erase past entries via the API.

COMMIT;
