CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  transfer_number TEXT NOT NULL,
  from_location_id UUID NOT NULL REFERENCES public.inventory_locations(id),
  to_location_id UUID NOT NULL REFERENCES public.inventory_locations(id),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage transfers for their store"
ON public.inventory_transfers FOR ALL TO authenticated
USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));