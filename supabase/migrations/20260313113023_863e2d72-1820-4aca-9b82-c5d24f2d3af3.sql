
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
