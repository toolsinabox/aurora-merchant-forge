
-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Store owners/admins can CRUD coupons
CREATE POLICY "Store members can manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), 'staff'))
  WITH CHECK (public.has_store_role(store_id, auth.uid(), 'staff'));

-- Anyone can read active coupons (for storefront validation)
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Add coupon_id to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0;
