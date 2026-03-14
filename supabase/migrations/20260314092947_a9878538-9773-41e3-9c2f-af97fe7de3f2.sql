
-- Subscription plans (recurring product subscriptions)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  interval_count INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_order_date DATE,
  last_order_date DATE,
  total_orders_created INT NOT NULL DEFAULT 0,
  max_orders INT,
  shipping_address JSONB,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscription plans of their stores"
  ON public.subscription_plans FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage subscription plans of their stores"
  ON public.subscription_plans FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Customer communication log
CREATE TABLE public.customer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  direction TEXT NOT NULL DEFAULT 'outbound',
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  related_entity_type TEXT,
  related_entity_id TEXT,
  sent_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communications of their stores"
  ON public.customer_communications FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage communications of their stores"
  ON public.customer_communications FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
