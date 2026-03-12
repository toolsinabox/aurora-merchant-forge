
-- Drop the existing INSERT policy that targets 'public' role
DROP POLICY IF EXISTS "Users can create stores" ON public.stores;

-- Recreate it targeting 'authenticated' role
CREATE POLICY "Users can create stores"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
