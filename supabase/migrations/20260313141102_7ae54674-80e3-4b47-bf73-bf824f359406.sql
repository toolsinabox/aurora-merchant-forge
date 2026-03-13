CREATE TABLE IF NOT EXISTS public.wholesale_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  abn_tax_id text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit wholesale application" ON public.wholesale_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Store owners can view their wholesale applications" ON public.wholesale_applications
  FOR SELECT TO authenticated USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Store owners can update wholesale applications" ON public.wholesale_applications
  FOR UPDATE TO authenticated USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );