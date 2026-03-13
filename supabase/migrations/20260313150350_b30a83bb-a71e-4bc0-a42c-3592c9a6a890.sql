
-- Serial Numbers table for tracking individual product units
CREATE TABLE public.serial_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.inventory_locations(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique serial per store
ALTER TABLE public.serial_numbers ADD CONSTRAINT serial_numbers_unique UNIQUE (store_id, serial_number);

-- RLS
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select serial_numbers" ON public.serial_numbers
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));

CREATE POLICY "Tenant insert serial_numbers" ON public.serial_numbers
  FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update serial_numbers" ON public.serial_numbers
  FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete serial_numbers" ON public.serial_numbers
  FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- Add tax_mode to stores (standard, gst, vat)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS tax_mode TEXT NOT NULL DEFAULT 'standard';
