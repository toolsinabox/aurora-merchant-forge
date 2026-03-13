
-- Store credit transactions table
CREATE TABLE public.store_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'credit',
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select store_credit_transactions" ON public.store_credit_transactions
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert store_credit_transactions" ON public.store_credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete store_credit_transactions" ON public.store_credit_transactions
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- Add visibility_groups to products (array of customer_group IDs, null = visible to all)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS visibility_groups UUID[] DEFAULT NULL;
