-- Create categories table for the product catalog
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  image text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

drop policy if exists "Categories are viewable by everyone." on public.categories;
create policy "Categories are viewable by everyone." on public.categories
  for select using (true);

drop policy if exists "Categories can be inserted by anyone (seed)." on public.categories;
create policy "Categories can be inserted by anyone (seed)." on public.categories
  for insert with check (true);

drop policy if exists "Categories can be updated by anyone (seed)." on public.categories;
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

drop policy if exists "Products are viewable by everyone." on public.products;
create policy "Products are viewable by everyone." on public.products
  for select using (true);

drop policy if exists "Products can be inserted by anyone (seed)." on public.products;
create policy "Products can be inserted by anyone (seed)." on public.products
  for insert with check (true);

drop policy if exists "Products can be updated by anyone (seed)." on public.products;
create policy "Products can be updated by anyone (seed)." on public.products
  for update using (true);

-- Create a table for public profiles
create table if not exists public.profiles (
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

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signups and auto-create profile
create or replace function public.handle_new_user()
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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for addresses
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text,
  line1 text,
  line2 text,
  country text default 'Sri Lanka',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.addresses enable row level security;

drop policy if exists "Users can view own addresses." on public.addresses;
create policy "Users can view own addresses." on public.addresses
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own addresses." on public.addresses;
create policy "Users can insert own addresses." on public.addresses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own addresses." on public.addresses;
create policy "Users can update own addresses." on public.addresses
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own addresses." on public.addresses;
create policy "Users can delete own addresses." on public.addresses
  for delete using (auth.uid() = user_id);

-- Create a table for orders
create table if not exists public.orders (
  id text primary key, -- e.g. UN-2026-001
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text,
  total text,
  items text,
  delivery_method text default 'Pickup from Store',
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

drop policy if exists "Users can view own orders." on public.orders;
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

drop policy if exists "Anyone can submit an inquiry." on public.inquiries;
create policy "Anyone can submit an inquiry." on public.inquiries
  for insert with check (true);

drop policy if exists "Only admins can view inquiries." on public.inquiries;
create policy "Only admins can view inquiries." on public.inquiries
  for select using (
    auth.role() = 'authenticated'
    and auth.jwt() ->> 'email' in ('uvarammohan90@gmail.com')
  );

-- ═══════════════════════════════════════════════════════════
-- SEED DATA — Categories & Products (Sri Lankan Tile Catalog)
-- ═══════════════════════════════════════════════════════════

-- Clear out old demo data
delete from public.products;
delete from public.categories;

-- Categories
insert into public.categories (slug, name, image) values
  ('floor-tiles', 'Floor Tiles', '/images/tiles/floor_porcelain.png'),
  ('wall-tiles', 'Wall Tiles', '/images/tiles/wall_ceramic.png'),
  ('outdoor-tiles', 'Outdoor Tiles', '/images/tiles/outdoor_stone.png'),
  ('tile-slabs', 'Tile Slabs', '/images/tiles/large_slab.png'),
  ('mosaics', 'Mosaics', '/images/tiles/mosaic_pattern.png')
on conflict (slug) do nothing;

-- Products (prices in LKR per tile)
insert into public.products (id, sku, name, dimensions, price_per_sqft, image, category_slug, featured, finish, application, stock_sqft) values
  ('flt-001', 'FLT-IVR-6060-PL', 'Ivory Pearl - Cream', '60x60 cm', 2350, '/images/tiles/floor_porcelain.png', 'floor-tiles', true, 'Polished', 'Interior', 240),
  ('flt-002', 'FLT-SND-6060-MT', 'Sandura - Beige', '60x60 cm', 1850, '/images/tiles/floor_porcelain.png', 'floor-tiles', false, 'Matt', 'Interior', 520),
  ('flt-003', 'FLT-WLN-6060-RS', 'Tavola - Walnut', '60x60 cm', 2480, '/images/tiles/floor_porcelain.png', 'floor-tiles', true, 'Rustic', 'Interior', 185),
  ('flt-004', 'FLT-GRN-3060-MT', 'Granita - Dark Grey', '30x60 cm', 1250, '/images/tiles/floor_porcelain.png', 'floor-tiles', false, 'Matt', 'Interior', 410),
  ('flt-005', 'FLT-CMT-6060-MT', 'Cementa - Ash', '60x60 cm', 1980, '/images/tiles/floor_porcelain.png', 'floor-tiles', false, 'Matt', 'Interior', 380),
  ('flt-006', 'FLT-MBL-6060-PL', 'Marmo - Bianco', '60x60 cm', 2750, '/images/tiles/floor_porcelain.png', 'floor-tiles', true, 'Polished', 'Interior', 150),
  ('wlt-001', 'WLT-CRM-3045-GL', 'Silka - Cream', '30x45 cm', 850, '/images/tiles/wall_ceramic.png', 'wall-tiles', true, 'Glossy', 'Interior', 600),
  ('wlt-002', 'WLT-WHT-3060-GL', 'Arctic - White', '30x60 cm', 1150, '/images/tiles/wall_ceramic.png', 'wall-tiles', false, 'Glossy', 'Interior', 450),
  ('wlt-003', 'WLT-STN-3060-ST', 'Pietra - Stone Wash', '30x60 cm', 1350, '/images/tiles/wall_ceramic.png', 'wall-tiles', false, 'Satin', 'Interior', 320),
  ('wlt-004', 'WLT-BLU-3045-MT', 'Marina - Ocean Blue', '30x45 cm', 920, '/images/tiles/wall_ceramic.png', 'wall-tiles', false, 'Matt', 'Interior', 390),
  ('wlt-005', 'WLT-DCR-3060-GL', 'Flora - Décor Panel', '30x60 cm', 1480, '/images/tiles/wall_ceramic.png', 'wall-tiles', false, 'Glossy', 'Interior', 210),
  ('wlt-006', 'WLT-SUB-75150-GL', 'Metro - Classic White', '7.5x15 cm', 280, '/images/tiles/kitchen_subway.png', 'wall-tiles', true, 'Glossy', 'Interior', 1200),
  ('out-001', 'OUT-LAT-3060-AS', 'Terrana - Laterite Red', '30x60 cm', 1450, '/images/tiles/outdoor_stone.png', 'outdoor-tiles', true, 'Anti-Slip', 'Exterior', 480),
  ('out-002', 'OUT-COB-3030-AS', 'Cobalta - Charcoal', '30x30 cm', 680, '/images/tiles/outdoor_stone.png', 'outdoor-tiles', false, 'Anti-Slip', 'Exterior', 750),
  ('out-003', 'OUT-TRV-6060-TX', 'Petra - Sand', '60x60 cm', 2280, '/images/tiles/outdoor_stone.png', 'outdoor-tiles', false, 'Textured', 'Exterior', 290),
  ('out-004', 'OUT-SLT-3060-AS', 'Ardesia - Slate Grey', '30x60 cm', 1580, '/images/tiles/outdoor_stone.png', 'outdoor-tiles', false, 'Anti-Slip', 'Exterior', 360),
  ('slb-001', 'SLB-STT-8080-PL', 'Statuario - Grande', '80x80 cm', 4200, '/images/tiles/large_slab.png', 'tile-slabs', true, 'Polished', 'Interior', 68),
  ('slb-002', 'SLB-ONX-60120-PL', 'Onyx - Vein Dark', '60x120 cm', 5800, '/images/tiles/large_slab.png', 'tile-slabs', true, 'Polished', 'Interior', 45),
  ('slb-003', 'SLB-CMT-60120-MT', 'Cementa - Industrial Grey', '60x120 cm', 3650, '/images/tiles/large_slab.png', 'tile-slabs', false, 'Matt', 'Interior', 85),
  ('slb-004', 'SLB-CLC-80120-SF', 'Calacatta - Gold', '80x120 cm', 6500, '/images/tiles/large_slab.png', 'tile-slabs', false, 'Sugar-Finish', 'Interior', 32),
  ('mos-001', 'MOS-GLS-2525-GL', 'Aqua - Pool Blue', '2.5x2.5 cm sheet', 4500, '/images/tiles/mosaic_pattern.png', 'mosaics', false, 'Glossy', 'Interior / Pool', 95),
  ('mos-002', 'MOS-MRB-4848-PL', 'Carrara - Chip Marble', '4.8x4.8 cm sheet', 5200, '/images/tiles/mosaic_pattern.png', 'mosaics', true, 'Polished', 'Interior', 48),
  ('mos-003', 'MOS-PNY-25-MT', 'Penny - Round White', '2.5 cm round sheet', 3800, '/images/tiles/mosaic_pattern.png', 'mosaics', false, 'Matt', 'Interior', 72),
  ('mos-004', 'MOS-HEX-5050-ST', 'Hexara - Blend', '5x5 cm sheet', 4800, '/images/tiles/mosaic_pattern.png', 'mosaics', false, 'Satin', 'Interior', 55)
on conflict (id) do nothing;
- -   A d d   R L S   p o l i c y   s o   a d m i n s   c a n   S E L E C T   a l l   o r d e r s   ( c u r r e n t l y   o n l y   u s e r s   c a n   s e e   t h e i r   o w n ) 
 d r o p   p o l i c y   i f   e x i s t s   " A d m i n s   c a n   v i e w   a l l   o r d e r s . "   o n   p u b l i c . o r d e r s ; 
 c r e a t e   p o l i c y   " A d m i n s   c a n   v i e w   a l l   o r d e r s . "   o n   p u b l i c . o r d e r s 
     f o r   s e l e c t   u s i n g   ( 
         e x i s t s   ( 
             s e l e c t   1   f r o m   p u b l i c . p r o f i l e s 
             w h e r e   p r o f i l e s . i d   =   a u t h . u i d ( ) 
             a n d   p r o f i l e s . r o l e   =   ' a d m i n ' 
         ) 
     ) ; 
 
 - -   A d d   R L S   p o l i c y   s o   a d m i n s   c a n   U P D A T E   o r d e r s   ( t o   u p d a t e   s t a t u s ) 
 d r o p   p o l i c y   i f   e x i s t s   " A d m i n s   c a n   u p d a t e   o r d e r s . "   o n   p u b l i c . o r d e r s ; 
 c r e a t e   p o l i c y   " A d m i n s   c a n   u p d a t e   o r d e r s . "   o n   p u b l i c . o r d e r s 
     f o r   u p d a t e   u s i n g   ( 
         e x i s t s   ( 
             s e l e c t   1   f r o m   p u b l i c . p r o f i l e s 
             w h e r e   p r o f i l e s . i d   =   a u t h . u i d ( ) 
             a n d   p r o f i l e s . r o l e   =   ' a d m i n ' 
         ) 
     ) ;  
 