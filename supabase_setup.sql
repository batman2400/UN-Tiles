-- Create categories table for the product catalog
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  image text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone." on public.categories
  for select using (true);

create policy "Categories can be inserted by anyone (seed)." on public.categories
  for insert with check (true);

create policy "Categories can be updated by anyone (seed)." on public.categories
  for update using (true);

-- Create products table for the product catalog
create table if not exists public.products (
  id text primary key,
  sku text not null,
  name text not null,
  dimensions text not null,
  price_per_sqft numeric not null,
  image text not null,
  category_slug text references public.categories(slug) not null,
  featured boolean default false,
  finish text,
  application text,
  stock_sqft numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone." on public.products
  for select using (true);

create policy "Products can be inserted by anyone (seed)." on public.products
  for insert with check (true);

create policy "Products can be updated by anyone (seed)." on public.products
  for update using (true);

-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  email text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signups and auto-create profile
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for addresses
create table public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text,
  line1 text,
  line2 text,
  country text default 'Sri Lanka',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.addresses enable row level security;

create policy "Users can view own addresses." on public.addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert own addresses." on public.addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own addresses." on public.addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete own addresses." on public.addresses
  for delete using (auth.uid() = user_id);

-- Create a table for orders
create table public.orders (
  id text primary key, -- e.g. UN-2026-001
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text,
  total text,
  items text,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Users can view own orders." on public.orders
  for select using (auth.uid() = user_id);

-- (Orders would typically be inserted by a secure backend process, so we don't allow public insert here)

-- Create a table for contact form inquiries
create table if not exists public.inquiries (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inquiries enable row level security;

create policy "Anyone can submit an inquiry." on public.inquiries
  for insert with check (true);

create policy "Only admins can view inquiries." on public.inquiries
  for select using (
    auth.role() = 'authenticated'
    and auth.jwt() ->> 'email' in ('uvarammohan90@gmail.com')
  );
