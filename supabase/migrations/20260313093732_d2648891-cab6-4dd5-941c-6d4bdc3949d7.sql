
-- Store content templates with B@SE data tags
CREATE TABLE IF NOT EXISTS public.store_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL DEFAULT '',
  template_type text NOT NULL DEFAULT 'content_block',
  content text NOT NULL DEFAULT '',
  context_type text NOT NULL DEFAULT 'product',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.store_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select store_templates" ON public.store_templates FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert store_templates" ON public.store_templates FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update store_templates" ON public.store_templates FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete store_templates" ON public.store_templates FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- Public read for storefront rendering
CREATE POLICY "Public read active templates" ON public.store_templates FOR SELECT TO anon
  USING (is_active = true);
