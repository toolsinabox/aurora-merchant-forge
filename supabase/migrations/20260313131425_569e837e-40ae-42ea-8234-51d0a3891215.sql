
-- Add billing_address to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address text;

-- Add free_shipping flag to product_shipping
ALTER TABLE public.product_shipping ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false;

-- Add dangerous_goods flag to product_shipping
ALTER TABLE public.product_shipping ADD COLUMN IF NOT EXISTS dangerous_goods boolean DEFAULT false;

-- Create customer_groups table
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  discount_percent numeric DEFAULT 0,
  is_tax_exempt boolean DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage customer groups for their store"
  ON public.customer_groups
  FOR ALL
  TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Add customer_group_id to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_group_id uuid REFERENCES public.customer_groups(id) ON DELETE SET NULL;
