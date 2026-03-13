
-- Webhooks table for event notifications
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select webhooks" ON public.webhooks
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant insert webhooks" ON public.webhooks
  FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant update webhooks" ON public.webhooks
  FOR UPDATE TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant delete webhooks" ON public.webhooks
  FOR DELETE TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

-- Customer files/documents
CREATE TABLE public.customer_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select customer_files" ON public.customer_files
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant insert customer_files" ON public.customer_files
  FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant delete customer_files" ON public.customer_files
  FOR DELETE TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

-- Media library table
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',
  width INTEGER,
  height INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select media_assets" ON public.media_assets
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant insert media_assets" ON public.media_assets
  FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant update media_assets" ON public.media_assets
  FOR UPDATE TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Tenant delete media_assets" ON public.media_assets
  FOR DELETE TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE id = store_id));
