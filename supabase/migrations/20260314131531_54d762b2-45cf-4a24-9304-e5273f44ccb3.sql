-- Add B2B fields to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit numeric;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthday date;