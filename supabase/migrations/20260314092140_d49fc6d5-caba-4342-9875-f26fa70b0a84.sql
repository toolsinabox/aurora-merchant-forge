
-- Smart Collections table for automated product grouping
CREATE TABLE public.smart_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_type TEXT NOT NULL DEFAULT 'all' CHECK (match_type IN ('all', 'any')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Enable RLS
ALTER TABLE public.smart_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own store smart_collections"
  ON public.smart_collections FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can insert own store smart_collections"
  ON public.smart_collections FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can update own store smart_collections"
  ON public.smart_collections FOR UPDATE TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can delete own store smart_collections"
  ON public.smart_collections FOR DELETE TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Public read for storefront
CREATE POLICY "Public can view active smart_collections"
  ON public.smart_collections FOR SELECT TO anon
  USING (is_active = true);

-- Add product scheduling columns
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_unpublish_at TIMESTAMPTZ;
