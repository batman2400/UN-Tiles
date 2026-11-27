-- ============================================================
-- Migration 023b: Checkout, Visual Search & Inquiries Lockdown (Contract Phase)
--
-- Zero-downtime Step 2 of 2 (run AFTER 023a has been applied AND
-- the updated Next.js deployment using process_checkout_v2 &
-- service_role inquiries insert is live):
--   1. Revokes & drops legacy authenticated-callable process_checkout
--      to eliminate direct PostgREST payment forgery.
--   2. Locks match_product_embeddings to service_role and clamps
--      match_count to [1, 50].
--   3. Revokes direct anon INSERT on public.inquiries so all contact
--      submissions must pass through rate-limited /api/contact.
--
-- Safe to re-run.
-- ============================================================

BEGIN;

-- 1. Remove legacy authenticated-callable process_checkout
REVOKE ALL ON FUNCTION public.process_checkout(uuid, jsonb, text, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.process_checkout(uuid, jsonb, text, uuid, text, text, jsonb);

-- 2. Harden match_product_embeddings: clamp match_count <= 50 and restrict to service_role
CREATE OR REPLACE FUNCTION public.match_product_embeddings (
  query_embedding vector(768),
  match_count int default 8,
  similarity_threshold float default 0.0
)
RETURNS TABLE (
  product_id text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_limit int := LEAST(GREATEST(COALESCE(match_count, 8), 1), 50);
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    pe.product_id,
    (1 - (pe.embedding <=> query_embedding))::float AS similarity
  FROM public.product_embeddings pe
  WHERE (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.match_product_embeddings(vector(768), int, float) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_product_embeddings(vector(768), int, float) TO service_role;

-- 3. Block direct unauthenticated PostgREST spam inserts into inquiries
DROP POLICY IF EXISTS "Allow public inquiry inserts" ON public.inquiries;
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.inquiries;
REVOKE INSERT ON TABLE public.inquiries FROM anon;

COMMIT;

NOTIFY pgrst, 'reload schema';
