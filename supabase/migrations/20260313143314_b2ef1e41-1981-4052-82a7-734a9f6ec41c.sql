
-- Add review_photos column to product_reviews table
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_photos text[] DEFAULT '{}';
