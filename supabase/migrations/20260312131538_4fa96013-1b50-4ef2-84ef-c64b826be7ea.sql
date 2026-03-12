
-- Add user_id to customers so storefront shoppers can link their auth account
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create a security definer function for customer self-access
CREATE OR REPLACE FUNCTION public.is_customer_owner(_user_id uuid, _customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = _customer_id AND user_id = _user_id
  )
$$;

-- Allow authenticated users to read their own customer record
CREATE POLICY "Customers can view own record"
ON public.customers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to update their own customer record
CREATE POLICY "Customers can update own record"
ON public.customers FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow anonymous users to create customer records (for checkout signup)
CREATE POLICY "Anon can insert customers"
ON public.customers FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to insert customer records
CREATE POLICY "Auth can insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow customers to read their own orders
CREATE POLICY "Customers can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- Allow customers to read own order items
CREATE POLICY "Customers can view own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (order_id IN (SELECT id FROM public.orders WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())));

-- Allow anon/auth to insert orders (for storefront checkout)
CREATE POLICY "Anon can insert orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Auth can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anon/auth to insert order items
CREATE POLICY "Anon can insert order_items"
ON public.order_items FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Auth can insert order_items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (true);
