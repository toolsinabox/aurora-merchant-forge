
-- Add POA (Price on Application) flag to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS poa boolean DEFAULT false;
