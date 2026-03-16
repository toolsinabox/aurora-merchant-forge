
-- Content Zones: named zones that can hold ordered content blocks for template rendering
CREATE TABLE public.content_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  zone_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  block_type TEXT NOT NULL DEFAULT 'html',
  placement TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, zone_key)
);

ALTER TABLE public.content_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage content zones for their stores"
  ON public.content_zones FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE TRIGGER update_content_zones_updated_at
  BEFORE UPDATE ON public.content_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
