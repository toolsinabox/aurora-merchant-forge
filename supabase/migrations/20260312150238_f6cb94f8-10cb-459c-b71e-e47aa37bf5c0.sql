
-- Activity log table for admin audit trail
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select activity_log" ON public.activity_log
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert activity_log" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

-- Store theme settings table
CREATE TABLE public.store_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#64748b',
  accent_color TEXT DEFAULT '#f59e0b',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#0f172a',
  heading_font TEXT DEFAULT 'Inter',
  body_font TEXT DEFAULT 'Inter',
  button_radius TEXT DEFAULT 'md',
  layout_style TEXT DEFAULT 'standard',
  hero_style TEXT DEFAULT 'banner',
  product_card_style TEXT DEFAULT 'minimal',
  footer_style TEXT DEFAULT 'standard',
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view store themes" ON public.store_themes
  FOR SELECT TO anon USING (true);

CREATE POLICY "Tenant select store_themes" ON public.store_themes
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Owner manage store_themes" ON public.store_themes
  FOR ALL TO authenticated
  USING (has_store_role(auth.uid(), store_id, 'owner'))
  WITH CHECK (has_store_role(auth.uid(), store_id, 'owner'));

CREATE INDEX idx_activity_log_store_created ON public.activity_log(store_id, created_at DESC);
