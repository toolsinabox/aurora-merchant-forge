
-- Store credit wallet (table store_credit_transactions already exists)
CREATE TABLE IF NOT EXISTS public.store_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  lifetime_credited NUMERIC NOT NULL DEFAULT 0,
  lifetime_debited NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, store_id)
);

ALTER TABLE public.store_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage store credits" ON public.store_credits
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Email automation workflows
CREATE TABLE IF NOT EXISTS public.email_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'welcome',
  delay_hours INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage email automations" ON public.email_automations
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
