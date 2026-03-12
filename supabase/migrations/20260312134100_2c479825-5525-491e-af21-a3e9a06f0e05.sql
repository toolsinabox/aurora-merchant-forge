
-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Public can read approved reviews" ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

-- Tenant can read all reviews
CREATE POLICY "Tenant select reviews" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

-- Tenant can manage reviews
CREATE POLICY "Tenant update reviews" ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete reviews" ON public.product_reviews
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON public.product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND store_id IN (SELECT id FROM public.stores));

-- Users can update/delete own reviews
CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
