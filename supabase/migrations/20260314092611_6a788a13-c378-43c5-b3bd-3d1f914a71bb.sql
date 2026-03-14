
-- Multimarket: store markets (regions/channels with different pricing, currency, language)
CREATE TABLE public.store_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  language TEXT NOT NULL DEFAULT 'en',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  price_adjustment_type TEXT NOT NULL DEFAULT 'none',
  price_adjustment_value NUMERIC NOT NULL DEFAULT 0,
  tax_inclusive BOOLEAN NOT NULL DEFAULT true,
  custom_domain TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

ALTER TABLE public.store_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view markets of their stores"
  ON public.store_markets FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage markets of their stores"
  ON public.store_markets FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Marketplace connections (eBay, Amazon, Catch, etc.)
CREATE TABLE public.marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  marketplace TEXT NOT NULL,
  account_name TEXT,
  credentials JSONB DEFAULT '{}'::jsonb,
  sync_settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'disconnected',
  error_message TEXT,
  total_listings INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, marketplace)
);

ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketplace connections of their stores"
  ON public.marketplace_connections FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage marketplace connections of their stores"
  ON public.marketplace_connections FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Marketplace listings (product sync status per marketplace)
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES public.marketplace_connections(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  external_listing_id TEXT,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  price_override NUMERIC,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(connection_id, product_id)
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketplace listings of their stores"
  ON public.marketplace_listings FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage marketplace listings of their stores"
  ON public.marketplace_listings FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
