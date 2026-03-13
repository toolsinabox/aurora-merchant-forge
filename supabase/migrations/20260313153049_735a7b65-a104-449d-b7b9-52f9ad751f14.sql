
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_ads_id text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_ads_conversion_label text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS smtp_config jsonb DEFAULT '{}';
