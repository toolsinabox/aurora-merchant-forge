CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  address_type text NOT NULL DEFAULT 'shipping',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  company text,
  address_1 text DEFAULT '',
  address_2 text,
  city text DEFAULT '',
  state text DEFAULT '',
  postcode text DEFAULT '',
  country text DEFAULT 'AU',
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view addresses for their store" ON public.customer_addresses
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage addresses for their store" ON public.customer_addresses
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
