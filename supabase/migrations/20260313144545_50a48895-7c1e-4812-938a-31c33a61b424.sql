
-- Add batch/lot and expiry tracking to inventory_stock
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS batch_number text DEFAULT NULL;
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS lot_number text DEFAULT NULL;
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS expiry_date date DEFAULT NULL;

-- Create product_addons table for custom options
CREATE TABLE public.product_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  price_adjustment numeric DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product addons"
  ON public.product_addons FOR SELECT TO anon
  USING (true);

CREATE POLICY "Tenant select product_addons"
  ON public.product_addons FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert product_addons"
  ON public.product_addons FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update product_addons"
  ON public.product_addons FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete product_addons"
  ON public.product_addons FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));
