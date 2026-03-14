
-- Automatic discount / price rules (apply without coupon codes)
CREATE TABLE public.price_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed_amount, buy_x_get_y, free_shipping
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC,
  min_quantity INTEGER,
  applies_to TEXT NOT NULL DEFAULT 'all', -- all, specific_products, specific_categories
  product_ids UUID[],
  category_ids UUID[],
  customer_group_ids UUID[],
  buy_quantity INTEGER, -- for buy_x_get_y
  get_quantity INTEGER, -- for buy_x_get_y
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage price rules" ON public.price_rules
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
