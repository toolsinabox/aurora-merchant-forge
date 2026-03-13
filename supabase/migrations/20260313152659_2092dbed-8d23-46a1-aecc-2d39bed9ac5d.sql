
CREATE TABLE public.adverts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  advert_type TEXT NOT NULL DEFAULT 'banner',
  image_url TEXT,
  link_url TEXT,
  title TEXT,
  subtitle TEXT,
  button_text TEXT,
  html_content TEXT,
  placement TEXT NOT NULL DEFAULT 'homepage_top',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adverts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view adverts for their store"
  ON public.adverts FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM public.stores));

CREATE POLICY "Users can manage adverts for their store"
  ON public.adverts FOR ALL TO authenticated
  USING (store_id IN (SELECT id FROM public.stores))
  WITH CHECK (store_id IN (SELECT id FROM public.stores));

CREATE POLICY "Public can view active adverts"
  ON public.adverts FOR SELECT TO anon
  USING (is_active = true);
