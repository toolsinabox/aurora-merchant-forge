
-- Add subscription tier and status to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS suspended_reason text;

-- Allow platform admins to read all stores
CREATE POLICY "Platform admin select all stores"
ON public.stores
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to update any store
CREATE POLICY "Platform admin update all stores"
ON public.stores
FOR UPDATE
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to read all orders (for global analytics)
CREATE POLICY "Platform admin select all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to read all products
CREATE POLICY "Platform admin select all products"
ON public.products
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to read all customers
CREATE POLICY "Platform admin select all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));
