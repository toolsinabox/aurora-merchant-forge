-- Add branding columns to stores table
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2563eb',
  ADD COLUMN IF NOT EXISTS banner_text text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

-- Add wishlist table for authenticated users
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to wishlist"
  ON public.wishlists FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from wishlist"
  ON public.wishlists FOR DELETE TO authenticated
  USING (user_id = auth.uid());