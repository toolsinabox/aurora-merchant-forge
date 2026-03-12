
-- Allow anonymous/public read access to active products for storefront
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
TO anon
USING (status = 'active');

-- Allow anonymous read of categories for storefront navigation
CREATE POLICY "Public can view categories"
ON public.categories FOR SELECT
TO anon
USING (true);

-- Allow anonymous read of stores for storefront header
CREATE POLICY "Public can view stores"
ON public.stores FOR SELECT
TO anon
USING (true);

-- Allow anonymous read of product variants for storefront
CREATE POLICY "Public can view product variants"
ON public.product_variants FOR SELECT
TO anon
USING (true);
