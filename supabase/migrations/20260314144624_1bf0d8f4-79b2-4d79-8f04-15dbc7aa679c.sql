
-- Shipping services (e.g. Express, Standard, Economy) per zone
CREATE TABLE IF NOT EXISTS public.shipping_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carrier TEXT DEFAULT '',
  estimated_days_min INT DEFAULT 1,
  estimated_days_max INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weight/price-based rate tiers per service
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.shipping_services(id) ON DELETE CASCADE,
  min_weight NUMERIC DEFAULT 0,
  max_weight NUMERIC DEFAULT 99999,
  min_order_total NUMERIC DEFAULT 0,
  max_order_total NUMERIC DEFAULT 99999,
  rate NUMERIC NOT NULL DEFAULT 0,
  rate_type TEXT NOT NULL DEFAULT 'flat', -- flat, per_kg, percentage
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipping_services
CREATE POLICY "Public read shipping_services" ON public.shipping_services FOR SELECT USING (true);
CREATE POLICY "Tenant insert shipping_services" ON public.shipping_services FOR INSERT WITH CHECK (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update shipping_services" ON public.shipping_services FOR UPDATE USING (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete shipping_services" ON public.shipping_services FOR DELETE USING (has_store_role(auth.uid(), store_id));

-- RLS policies for shipping_rates
CREATE POLICY "Public read shipping_rates" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "Tenant insert shipping_rates" ON public.shipping_rates FOR INSERT WITH CHECK (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update shipping_rates" ON public.shipping_rates FOR UPDATE USING (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete shipping_rates" ON public.shipping_rates FOR DELETE USING (has_store_role(auth.uid(), store_id));

-- Triggers for updated_at
CREATE TRIGGER update_shipping_services_updated_at BEFORE UPDATE ON public.shipping_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
