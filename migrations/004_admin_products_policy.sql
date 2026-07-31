-- Remove any existing permissive update policies for products
drop policy if exists "Products can be updated by anyone (seed)." on public.products;
drop policy if exists "Products can be updated by anyone." on public.products;
drop policy if exists "Admins can update products." on public.products;

-- Create a strict policy: Only Admins can update products
create policy "Admins can update products." on public.products
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
