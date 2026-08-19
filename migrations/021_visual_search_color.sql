-- Colour histograms for Visual Match re-rank (v2).
-- Embeddings stay vector(768). This column is optional at query time:
-- if it is missing, Matcher falls back to cosine-only ranking.

alter table public.product_embeddings
  add column if not exists color_histogram real[];
