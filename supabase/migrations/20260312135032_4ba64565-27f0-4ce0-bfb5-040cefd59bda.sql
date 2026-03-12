
-- Add slug column to stores for subdomain routing
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

-- Backfill existing stores: generate slug from name
UPDATE public.stores SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;
