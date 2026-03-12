
-- Create platform_roles table for super-admin access
CREATE TABLE public.platform_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'platform_admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view platform_roles (using security definer function below)
-- For bootstrap: we'll allow authenticated users to read their own row
CREATE POLICY "Users can view own platform role"
  ON public.platform_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Security definer function to check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
$$;

-- Allow platform admins to see ALL stores
CREATE POLICY "Platform admins can view all stores"
  ON public.stores FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));
