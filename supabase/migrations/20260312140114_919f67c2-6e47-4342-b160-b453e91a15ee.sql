
-- Auto-promote first user (or any store owner) as platform admin if no platform admins exist yet
CREATE OR REPLACE FUNCTION public.auto_promote_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no platform admins exist, make this user one
  IF NOT EXISTS (SELECT 1 FROM public.platform_roles WHERE role = 'platform_admin') THEN
    INSERT INTO public.platform_roles (user_id, role) VALUES (NEW.id, 'platform_admin')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_platform_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_first_admin();
