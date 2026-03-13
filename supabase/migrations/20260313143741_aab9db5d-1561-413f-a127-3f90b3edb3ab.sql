
-- Create warranty_disputes table for warranty claims / disputes
CREATE TABLE public.warranty_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  dispute_type text NOT NULL DEFAULT 'refund',
  reason text NOT NULL DEFAULT '',
  description text,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warranty_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select warranty_disputes"
  ON public.warranty_disputes FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert warranty_disputes"
  ON public.warranty_disputes FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant update warranty_disputes"
  ON public.warranty_disputes FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Storefront insert warranty_disputes"
  ON public.warranty_disputes FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT stores.id FROM stores));

-- Add default_low_stock_threshold to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS default_low_stock_threshold integer DEFAULT 10;
