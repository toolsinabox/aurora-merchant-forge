
-- Multi-language translations table
CREATE TABLE public.store_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'en',
  entity_type TEXT NOT NULL DEFAULT 'ui',
  entity_id TEXT,
  field_name TEXT NOT NULL,
  translated_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, locale, entity_type, entity_id, field_name)
);

-- Store languages config
CREATE TABLE public.store_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, locale)
);

ALTER TABLE public.store_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read translations" ON public.store_translations FOR SELECT USING (true);
CREATE POLICY "Auth manage translations" ON public.store_translations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read languages" ON public.store_languages FOR SELECT USING (true);
CREATE POLICY "Auth manage languages" ON public.store_languages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customer logo URL for dropship branding
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- POS registers table
CREATE TABLE public.pos_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_id UUID REFERENCES public.inventory_locations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage registers" ON public.pos_registers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add register_id to pos_register_sessions
ALTER TABLE public.pos_register_sessions ADD COLUMN IF NOT EXISTS register_id UUID REFERENCES public.pos_registers(id);

-- Warehouse routing preferences table
CREATE TABLE public.warehouse_routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  region TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouse_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage routing" ON public.warehouse_routing_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
