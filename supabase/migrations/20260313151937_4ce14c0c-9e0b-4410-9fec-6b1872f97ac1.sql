
-- Payment gateway configurations per store
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  gateway_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_test_mode BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (store_id, gateway_type)
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select payment_gateways" ON public.payment_gateways
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert payment_gateways" ON public.payment_gateways
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update payment_gateways" ON public.payment_gateways
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete payment_gateways" ON public.payment_gateways
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- Store plans
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan_limits JSONB NOT NULL DEFAULT '{"products": 50, "orders_per_month": 100, "staff": 2, "storage_mb": 500}';

-- Content reviews
CREATE TABLE public.content_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  content_page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL DEFAULT 5,
  title TEXT,
  body TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select content_reviews" ON public.content_reviews
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant manage content_reviews" ON public.content_reviews
  FOR ALL TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public read approved content_reviews" ON public.content_reviews
  FOR SELECT TO anon
  USING (is_approved = true);

CREATE POLICY "Authenticated users can submit content_reviews" ON public.content_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
