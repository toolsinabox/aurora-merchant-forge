ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS sales_rep TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tax_exempt_cert_url TEXT;