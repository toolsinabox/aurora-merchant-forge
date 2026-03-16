ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_verification TEXT;