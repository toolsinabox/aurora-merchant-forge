
-- Store Locations for store finder
CREATE TABLE public.store_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'AU',
  phone TEXT,
  email TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  opening_hours JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_pickup_location BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications center
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can manage store_locations" ON public.store_locations FOR ALL TO authenticated USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Store members can manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Public can view active store_locations" ON public.store_locations FOR SELECT TO anon USING (is_active = true);
