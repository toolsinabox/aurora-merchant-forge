
-- Add weight-based shipping to shipping_zones
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS per_kg_rate numeric DEFAULT 0;
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS rate_type text NOT NULL DEFAULT 'flat';

-- Add supplier-specific cost to supplier_products
ALTER TABLE public.supplier_products ADD COLUMN IF NOT EXISTS supplier_cost numeric DEFAULT NULL;
