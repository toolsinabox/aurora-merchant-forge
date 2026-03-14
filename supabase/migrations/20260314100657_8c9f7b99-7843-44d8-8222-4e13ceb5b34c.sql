
-- Digital product downloads
CREATE TABLE public.product_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  download_limit INTEGER DEFAULT NULL,
  expiry_days INTEGER DEFAULT 30,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage product downloads" ON public.product_downloads
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Customer download links (generated after purchase)
CREATE TABLE public.customer_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_download_id UUID REFERENCES public.product_downloads(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  download_token TEXT NOT NULL UNIQUE,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage customer downloads" ON public.customer_downloads
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Saved carts
CREATE TABLE public.saved_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Cart',
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage saved carts" ON public.saved_carts
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Inventory forecasting snapshots
CREATE TABLE public.inventory_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  avg_daily_sales NUMERIC DEFAULT 0,
  days_of_stock NUMERIC DEFAULT 0,
  reorder_date DATE DEFAULT NULL,
  suggested_reorder_qty INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  safety_stock INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can manage forecasts" ON public.inventory_forecasts
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
