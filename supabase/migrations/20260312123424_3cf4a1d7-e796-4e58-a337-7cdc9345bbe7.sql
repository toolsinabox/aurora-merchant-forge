
-- Add missing RLS policies for orders (DELETE) and order_items (UPDATE, DELETE)
CREATE POLICY "Tenant delete orders" ON public.orders FOR DELETE USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant update order_items" ON public.order_items FOR UPDATE USING (has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant delete order_items" ON public.order_items FOR DELETE USING (has_store_role(auth.uid(), store_id));

-- Add notes/shipping_address columns to orders for richer order management
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled';

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
