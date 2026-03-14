
-- Add pickup location tracking to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES public.inventory_locations(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_collected_at TIMESTAMPTZ;

-- Add rural/remote surcharge support to shipping zones
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS surcharge_postcodes TEXT DEFAULT '';
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS surcharge_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS surcharge_label TEXT DEFAULT 'Remote area surcharge';
