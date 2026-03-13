
-- Loyalty points balance per customer
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_redeemed integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'bronze',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, customer_id)
);

-- Loyalty transactions log
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL DEFAULT 'earn',
  description text DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Smart category rules
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS auto_rules jsonb DEFAULT null;

-- Scheduled export configs
CREATE TABLE IF NOT EXISTS public.scheduled_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL DEFAULT 'orders',
  frequency text NOT NULL DEFAULT 'daily',
  filters jsonb DEFAULT '{}',
  fields text[] DEFAULT '{}',
  email_to text,
  last_run_at timestamptz,
  next_run_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_points
CREATE POLICY "Users can view loyalty points for their stores" ON public.loyalty_points
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage loyalty points for their stores" ON public.loyalty_points
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view loyalty transactions for their stores" ON public.loyalty_transactions
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage loyalty transactions for their stores" ON public.loyalty_transactions
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- RLS policies for scheduled_exports
CREATE POLICY "Users can view scheduled exports for their stores" ON public.scheduled_exports
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage scheduled exports for their stores" ON public.scheduled_exports
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Loyalty settings on stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS loyalty_config jsonb DEFAULT '{"enabled": false, "points_per_dollar": 1, "redemption_rate": 100, "signup_bonus": 0}';
