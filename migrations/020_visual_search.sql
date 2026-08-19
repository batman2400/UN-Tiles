-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Create product_embeddings table for Gemini multimodal embeddings (768-d)
create table if not exists public.product_embeddings (
  product_id text primary key references public.products(id) on delete cascade,
  embedding vector(768) not null,
  model text not null default 'gemini-embedding-2',
  image_url text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.product_embeddings enable row level security;

-- Drop existing policies if any
drop policy if exists "Embeddings are readable by everyone" on public.product_embeddings;
drop policy if exists "Admins can manage product embeddings" on public.product_embeddings;

-- Strict RLS: No public SELECT on product_embeddings.
-- Only admins and service role can inspect or manage embeddings directly.
create policy "Admins can manage product embeddings"
  on public.product_embeddings
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- SECURITY DEFINER function to match product embeddings by cosine similarity.
-- Public clients call this function rather than querying product_embeddings table directly.
create or replace function public.match_product_embeddings (
  query_embedding vector(768),
  match_count int default 8,
  similarity_threshold float default 0.0
)
returns table (
  product_id text,
  similarity float
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    pe.product_id,
    (1 - (pe.embedding <=> query_embedding))::float as similarity
  from public.product_embeddings pe
  where (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
  order by pe.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant execution permissions on RPC
grant execute on function public.match_product_embeddings(vector(768), int, float) to anon, authenticated, service_role;
