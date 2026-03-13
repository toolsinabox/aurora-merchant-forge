-- Contact form submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (storefront visitors)
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only store owners can read
CREATE POLICY "Store owners can read contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Add bin_location to inventory_stock
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS bin_location TEXT;

-- Add ga_tracking_id and favicon_url to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS ga_tracking_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS favicon_url TEXT;
