
-- POS register sessions for end-of-day reconciliation
CREATE TABLE IF NOT EXISTS public.pos_register_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  opened_by uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_float numeric NOT NULL DEFAULT 0,
  expected_cash numeric,
  actual_cash numeric,
  cash_difference numeric,
  total_sales numeric DEFAULT 0,
  total_orders integer DEFAULT 0,
  card_total numeric DEFAULT 0,
  cash_total numeric DEFAULT 0,
  other_total numeric DEFAULT 0,
  voucher_total numeric DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_register_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage POS sessions for their stores" ON public.pos_register_sessions
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Add region column to tax_rates for address-based tax
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
