
-- Drop overly permissive policies and replace with store-scoped ones
DROP POLICY IF EXISTS "Anon can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Auth can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Anon can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Auth can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Auth can insert order_items" ON public.order_items;

-- Customers: require store_id references a real store
CREATE POLICY "Storefront insert customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (store_id IN (SELECT id FROM public.stores));

-- Orders: require store_id references a real store
CREATE POLICY "Storefront insert orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (store_id IN (SELECT id FROM public.stores));

-- Order items: require store_id references a real store
CREATE POLICY "Storefront insert order_items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (store_id IN (SELECT id FROM public.stores));
