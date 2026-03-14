ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count integer NOT NULL DEFAULT 0;