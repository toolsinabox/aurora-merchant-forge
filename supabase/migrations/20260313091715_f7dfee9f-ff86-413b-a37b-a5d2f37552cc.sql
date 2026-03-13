
-- Shipments table: tracks individual shipments (split shipments per order)
CREATE TABLE IF NOT EXISTS public.order_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  shipment_number text NOT NULL DEFAULT '',
  carrier text,
  tracking_number text,
  tracking_url text,
  status text NOT NULL DEFAULT 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Shipment items: which order_items are in each shipment
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.order_shipments(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Order timeline: audit trail of all order events
CREATE TABLE IF NOT EXISTS public.order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for order_shipments
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select order_shipments" ON public.order_shipments FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert order_shipments" ON public.order_shipments FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update order_shipments" ON public.order_shipments FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete order_shipments" ON public.order_shipments FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- RLS for shipment_items
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select shipment_items" ON public.shipment_items FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert shipment_items" ON public.shipment_items FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete shipment_items" ON public.shipment_items FOR DELETE TO authenticated
  USING (has_store_role(auth.uid(), store_id));

-- RLS for order_timeline
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select order_timeline" ON public.order_timeline FOR SELECT TO authenticated
  USING (store_id IN (SELECT get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert order_timeline" ON public.order_timeline FOR INSERT TO authenticated
  WITH CHECK (has_store_role(auth.uid(), store_id));
