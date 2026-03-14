
-- Add compound tax and tax-inclusive fields to tax_rates
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS is_compound BOOLEAN DEFAULT false;
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS is_inclusive BOOLEAN DEFAULT false;
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all'; -- all, shipping, products
ALTER TABLE public.tax_rates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
