
-- Shipping methods table
CREATE TABLE public.shipping_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carrier TEXT,
  method_type TEXT NOT NULL DEFAULT 'flat_rate',
  base_rate NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shipping_methods" ON public.shipping_methods FOR SELECT USING (true);
CREATE POLICY "Auth manage shipping_methods" ON public.shipping_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Store add-ons / plugins registry
CREATE TABLE public.store_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  addon_type TEXT NOT NULL DEFAULT 'custom_panel',
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT,
  icon_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_installed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  installed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, addon_key)
);

ALTER TABLE public.store_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage addons" ON public.store_addons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add-on marketplace (system-level catalog)
CREATE TABLE public.addon_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addon_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  addon_type TEXT NOT NULL DEFAULT 'custom_panel',
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT,
  icon_url TEXT,
  category TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC DEFAULT 0,
  install_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read catalog" ON public.addon_catalog FOR SELECT USING (true);
CREATE POLICY "Auth manage catalog" ON public.addon_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed some add-ons into catalog
INSERT INTO public.addon_catalog (addon_key, name, description, addon_type, category, author) VALUES
  ('google-shopping', 'Google Shopping Feed', 'Automatically generate product feeds for Google Merchant Center', 'data_feed', 'Marketing', 'Platform'),
  ('mailchimp-sync', 'Mailchimp Integration', 'Sync customers and orders to Mailchimp for email marketing', 'integration', 'Marketing', 'Platform'),
  ('live-chat', 'Live Chat Widget', 'Add live chat support to your storefront', 'custom_panel', 'Support', 'Platform'),
  ('seo-analyzer', 'SEO Analyzer', 'Audit product and page SEO with recommendations', 'custom_panel', 'SEO', 'Platform'),
  ('bulk-pricing', 'Advanced Bulk Pricing', 'Complex tier pricing rules with customer group conditions', 'pricing', 'Sales', 'Platform'),
  ('shipstation', 'ShipStation', 'Automated shipping label generation and tracking via ShipStation', 'shipping', 'Shipping', 'Platform'),
  ('xero-accounting', 'Xero Accounting', 'Auto-sync invoices and payments to Xero', 'accounting', 'Accounting', 'Platform'),
  ('klaviyo-sync', 'Klaviyo Integration', 'Advanced email marketing and customer analytics', 'integration', 'Marketing', 'Platform'),
  ('product-bundles-pro', 'Product Bundles Pro', 'Advanced bundle builder with dynamic pricing and discounts', 'pricing', 'Sales', 'Platform'),
  ('returns-portal', 'Customer Returns Portal', 'Self-service returns portal with prepaid shipping labels', 'custom_panel', 'Support', 'Platform');
