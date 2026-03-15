-- Allow public (anonymous) read access to theme_packages for storefront rendering
CREATE POLICY "Public can read active themes"
ON public.theme_packages
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow public (anonymous) read access to theme_files for storefront rendering
CREATE POLICY "Public can read theme files"
ON public.theme_files
FOR SELECT
TO anon, authenticated
USING (true);