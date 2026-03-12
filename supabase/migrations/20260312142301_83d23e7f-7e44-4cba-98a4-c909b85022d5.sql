
-- Fix SELECT policy: change from 'public' to 'authenticated' role
DROP POLICY IF EXISTS "Users can view their stores" ON public.stores;
CREATE POLICY "Users can view their stores"
  ON public.stores FOR SELECT TO authenticated
  USING (id IN (SELECT get_user_store_ids(auth.uid())));

-- Fix UPDATE policy: change from 'public' to 'authenticated' role  
DROP POLICY IF EXISTS "Owners can update stores" ON public.stores;
CREATE POLICY "Owners can update stores"
  ON public.stores FOR UPDATE TO authenticated
  USING (has_store_role(auth.uid(), id, 'owner'::app_role));
