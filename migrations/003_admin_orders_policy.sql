-- Add RLS policy so admins can SELECT all orders (currently only users can see their own)
drop policy if exists "Admins can view all orders." on public.orders;
create policy "Admins can view all orders." on public.orders
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Add RLS policy so admins can UPDATE orders (to update status)
drop policy if exists "Admins can update orders." on public.orders;
create policy "Admins can update orders." on public.orders
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
