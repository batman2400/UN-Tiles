-- ============================================================
-- Migration: Add missing fields to public.inquiries table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add new columns for company, phone, and project_type
alter table public.inquiries
  add column if not exists company text,
  add column if not exists phone text,
  add column if not exists project_type text;
