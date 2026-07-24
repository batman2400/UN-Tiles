-- ============================================================
-- Migration: Create public.inquiries table for contact form
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create the inquiries table
create table if not exists public.inquiries (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.inquiries enable row level security;

-- 3. Allow anyone (including unauthenticated users) to INSERT
--    This lets the public contact form submit without login.
create policy "Anyone can submit an inquiry."
  on public.inquiries
  for insert
  with check (true);

-- 4. Only authenticated admin users can SELECT inquiries.
--    Adjust the email check to match your actual admin email(s).
create policy "Only admins can view inquiries."
  on public.inquiries
  for select
  using (
    auth.role() = 'authenticated'
    and auth.jwt() ->> 'email' in (
      'uvarammohan90@gmail.com'
    )
  );
