
-- API rate limiting table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (api_key_id, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rate limits for their stores" ON public.api_rate_limits
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Add rate_limit field to api_keys
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS rate_limit integer DEFAULT 1000;

-- Stockist listings table
CREATE TABLE IF NOT EXISTS public.stockist_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  address text,
  city text,
  state text,
  postcode text,
  country text DEFAULT 'AU',
  phone text,
  website text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stockist_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stockist listings for their stores" ON public.stockist_listings
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage stockist listings for their stores" ON public.stockist_listings
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Allow customers to manage their own listing
CREATE POLICY "Customers can manage own stockist listing" ON public.stockist_listings
  FOR ALL TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));
