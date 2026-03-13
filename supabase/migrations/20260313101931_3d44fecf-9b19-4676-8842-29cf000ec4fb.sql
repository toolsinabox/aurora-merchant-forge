
-- Marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text,
  content text DEFAULT '',
  campaign_type text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  audience_segment text DEFAULT 'all',
  audience_tags text[] DEFAULT '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  stats jsonb DEFAULT '{"sent":0,"opened":0,"clicked":0}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select marketing_campaigns" ON public.marketing_campaigns
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert marketing_campaigns" ON public.marketing_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update marketing_campaigns" ON public.marketing_campaigns
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete marketing_campaigns" ON public.marketing_campaigns
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- Abandoned carts table
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id),
  email text,
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  cart_total numeric NOT NULL DEFAULT 0,
  recovery_status text NOT NULL DEFAULT 'abandoned',
  recovery_email_sent_at timestamptz,
  recovered_at timestamptz,
  abandoned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select abandoned_carts" ON public.abandoned_carts
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert abandoned_carts" ON public.abandoned_carts
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update abandoned_carts" ON public.abandoned_carts
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Storefront insert abandoned_carts" ON public.abandoned_carts
  FOR INSERT TO anon, authenticated
  WITH CHECK (store_id IN (SELECT stores.id FROM stores));
