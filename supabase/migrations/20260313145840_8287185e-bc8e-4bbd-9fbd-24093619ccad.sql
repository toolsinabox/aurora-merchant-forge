
-- Kit components table: defines which products are components of a kit/bundle
CREATE TABLE public.kit_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  is_swappable BOOLEAN NOT NULL DEFAULT false,
  swap_group TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kit_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select kit_components" ON public.kit_components
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant manage kit_components" ON public.kit_components
  FOR ALL TO authenticated
  USING (has_store_role(auth.uid(), store_id))
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public read kit_components" ON public.kit_components
  FOR SELECT TO anon
  USING (true);

-- Layby / Lay-Away plans table
CREATE TABLE public.layby_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  deposit_amount NUMERIC NOT NULL DEFAULT 0,
  installment_amount NUMERIC NOT NULL DEFAULT 0,
  installments_count INTEGER NOT NULL DEFAULT 4,
  installments_paid INTEGER NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  next_due_date TIMESTAMP WITH TIME ZONE,
  frequency TEXT NOT NULL DEFAULT 'fortnightly',
  status TEXT NOT NULL DEFAULT 'active',
  cancelled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.layby_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select layby_plans" ON public.layby_plans
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant manage layby_plans" ON public.layby_plans
  FOR ALL TO authenticated
  USING (has_store_role(auth.uid(), store_id))
  WITH CHECK (has_store_role(auth.uid(), store_id));

-- Layby payments table
CREATE TABLE public.layby_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layby_plan_id UUID NOT NULL REFERENCES public.layby_plans(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.layby_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select layby_payments" ON public.layby_payments
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant manage layby_payments" ON public.layby_payments
  FOR ALL TO authenticated
  USING (has_store_role(auth.uid(), store_id))
  WITH CHECK (has_store_role(auth.uid(), store_id));
