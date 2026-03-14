
-- Custom Fields Configuration
CREATE TABLE public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'product', -- product, customer, order
  field_name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, date, select, boolean, textarea, color
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  is_searchable BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  show_on_storefront BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  placeholder TEXT,
  default_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, entity_type, field_key)
);

ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store custom_fields" ON public.custom_fields FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Custom Field Values
CREATE TABLE public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  custom_field_id UUID REFERENCES public.custom_fields(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(custom_field_id, entity_id)
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store custom_field_values" ON public.custom_field_values FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Refunds
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  refund_number TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  reason TEXT,
  refund_method TEXT DEFAULT 'original_payment', -- original_payment, store_credit, manual
  status TEXT DEFAULT 'pending', -- pending, approved, processed, rejected
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  line_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store refunds" ON public.refunds FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Sales Channels
CREATE TABLE public.sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'online', -- online, pos, marketplace, social, wholesale, mobile_app
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  product_count INT DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  icon_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store sales_channels" ON public.sales_channels FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Updated at triggers
CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON public.custom_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_field_values_updated_at BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_channels_updated_at BEFORE UPDATE ON public.sales_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
