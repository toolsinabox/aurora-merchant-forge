CREATE TABLE IF NOT EXISTS public.back_in_stock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.back_in_stock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request back in stock notifications"
  ON public.back_in_stock_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners can view back in stock requests"
  ON public.back_in_stock_requests FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));