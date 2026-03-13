
-- ═══════ 1. SUPPLIERS TABLE ═══════
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  lead_time_days INTEGER DEFAULT 0,
  payment_terms TEXT,
  is_dropship BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store suppliers" ON public.suppliers
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════ 2. GIFT VOUCHERS TABLE ═══════
CREATE TABLE public.gift_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_value NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  recipient_email TEXT,
  recipient_name TEXT,
  sender_name TEXT,
  message TEXT,
  purchased_by UUID,
  order_id UUID REFERENCES public.orders(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

ALTER TABLE public.gift_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store gift vouchers" ON public.gift_vouchers
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE TRIGGER update_gift_vouchers_updated_at BEFORE UPDATE ON public.gift_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════ 3. CONTENT PAGES (CMS) TABLE ═══════
CREATE TABLE public.content_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '',
  page_type TEXT NOT NULL DEFAULT 'page',
  status TEXT NOT NULL DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  featured_image TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store content pages" ON public.content_pages
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Public can read published content pages" ON public.content_pages
  FOR SELECT TO anon
  USING (is_published = true);

CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON public.content_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════ 4. ENHANCE CATEGORIES (description, image, SEO) ═══════
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- ═══════ 5. PURCHASE ORDERS TABLE ═══════
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  po_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  shipping NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, po_number)
);

CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  sku TEXT,
  title TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store purchase orders" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users manage own store PO items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())))
  WITH CHECK (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════ 6. ENHANCE COUPONS (free shipping, restrictions) ═══════
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS per_customer_limit INTEGER,
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
