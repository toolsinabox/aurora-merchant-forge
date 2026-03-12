
-- =============================================
-- MAROPOST-ALIGNED PRODUCT SCHEMA EXPANSION
-- =============================================

-- 1. Expand products table with Maropost core fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS features text,
  ADD COLUMN IF NOT EXISTS specifications text,
  ADD COLUMN IF NOT EXISTS terms_conditions text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model_number text,
  ADD COLUMN IF NOT EXISTS custom_label text,
  ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS product_subtype text,
  ADD COLUMN IF NOT EXISTS warranty text,
  ADD COLUMN IF NOT EXISTS availability_description text,
  ADD COLUMN IF NOT EXISTS search_keywords text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_bought boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_inventoried boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS tax_free boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_inclusive boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_price numeric,
  ADD COLUMN IF NOT EXISTS promo_start timestamptz,
  ADD COLUMN IF NOT EXISTS promo_end timestamptz,
  ADD COLUMN IF NOT EXISTS promo_tag text,
  ADD COLUMN IF NOT EXISTS is_kit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS editable_bundle boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS virtual_product boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_url_update boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS supplier_item_code text,
  ADD COLUMN IF NOT EXISTS reorder_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS restock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preorder_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS misc1 text,
  ADD COLUMN IF NOT EXISTS misc2 text,
  ADD COLUMN IF NOT EXISTS misc3 text,
  ADD COLUMN IF NOT EXISTS misc4 text,
  ADD COLUMN IF NOT EXISTS misc5 text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- 2. Product shipping details (separate entity)
CREATE TABLE IF NOT EXISTS public.product_shipping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  shipping_weight numeric DEFAULT 0,
  shipping_cubic numeric DEFAULT 0,
  shipping_length numeric DEFAULT 0,
  shipping_width numeric DEFAULT 0,
  shipping_height numeric DEFAULT 0,
  actual_length numeric DEFAULT 0,
  actual_width numeric DEFAULT 0,
  actual_height numeric DEFAULT 0,
  requires_packaging boolean DEFAULT false,
  shipping_category text,
  flat_rate_charge numeric,
  selling_unit text,
  base_unit text,
  base_unit_qty numeric DEFAULT 1,
  cartons integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

ALTER TABLE public.product_shipping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select product_shipping" ON public.product_shipping
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert product_shipping" ON public.product_shipping
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update product_shipping" ON public.product_shipping
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete product_shipping" ON public.product_shipping
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public view product_shipping" ON public.product_shipping
  FOR SELECT TO anon
  USING (true);

-- 3. Multi-level pricing / user-group pricing tiers
CREATE TABLE IF NOT EXISTS public.product_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tier_name text NOT NULL DEFAULT 'default',
  min_quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  user_group text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select pricing_tiers" ON public.product_pricing_tiers
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert pricing_tiers" ON public.product_pricing_tiers
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update pricing_tiers" ON public.product_pricing_tiers
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete pricing_tiers" ON public.product_pricing_tiers
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public view pricing_tiers" ON public.product_pricing_tiers
  FOR SELECT TO anon
  USING (true);

-- 4. Product specifics / attributes (for filters)
CREATE TABLE IF NOT EXISTS public.product_specifics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_specifics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select product_specifics" ON public.product_specifics
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert product_specifics" ON public.product_specifics
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update product_specifics" ON public.product_specifics
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete product_specifics" ON public.product_specifics
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public view product_specifics" ON public.product_specifics
  FOR SELECT TO anon
  USING (true);

-- 5. Product relationships (cross-sell, upsell, free gifts)
CREATE TABLE IF NOT EXISTS public.product_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'cross_sell',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, related_product_id, relation_type)
);

ALTER TABLE public.product_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select product_relations" ON public.product_relations
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert product_relations" ON public.product_relations
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete product_relations" ON public.product_relations
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Public view product_relations" ON public.product_relations
  FOR SELECT TO anon
  USING (true);

-- 6. Import templates for CSV import wizard
CREATE TABLE IF NOT EXISTS public.import_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL DEFAULT 'products',
  field_mappings jsonb NOT NULL DEFAULT '{}',
  static_values jsonb DEFAULT '{}',
  transformations jsonb DEFAULT '{}',
  delimiter text DEFAULT ',',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select import_templates" ON public.import_templates
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert import_templates" ON public.import_templates
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update import_templates" ON public.import_templates
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete import_templates" ON public.import_templates
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- 7. Import history log
CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.import_templates(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'products',
  file_name text,
  total_rows integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select import_logs" ON public.import_logs
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert import_logs" ON public.import_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));
