
-- Add min_order_amount to customer_groups for wholesale minimum order enforcement
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS min_order_amount numeric DEFAULT 0;

-- Create supplier_products junction table
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  supplier_sku text,
  supplier_cost numeric DEFAULT 0,
  is_preferred boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store supplier_products" ON public.supplier_products
  FOR ALL TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT get_user_store_ids(auth.uid())));
