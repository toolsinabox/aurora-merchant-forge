
-- Static content blocks / widgets
CREATE TABLE public.content_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  identifier TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  block_type TEXT NOT NULL DEFAULT 'html',
  is_active BOOLEAN NOT NULL DEFAULT true,
  placement TEXT DEFAULT 'custom',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_blocks ADD CONSTRAINT content_blocks_unique_identifier UNIQUE (store_id, identifier);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select content_blocks" ON public.content_blocks
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert content_blocks" ON public.content_blocks
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update content_blocks" ON public.content_blocks
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete content_blocks" ON public.content_blocks
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public can read active content_blocks" ON public.content_blocks
  FOR SELECT TO anon
  USING (is_active = true);

-- Backorders table
CREATE TABLE public.backorders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  expected_date TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select backorders" ON public.backorders
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert backorders" ON public.backorders
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update backorders" ON public.backorders
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete backorders" ON public.backorders
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));
