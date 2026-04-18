
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
CREATE POLICY "Anyone can submit quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (
    customer_email IS NOT NULL
    AND char_length(customer_email) BETWEEN 4 AND 255
    AND store_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Anyone can submit wholesale application" ON public.wholesale_applications;
CREATE POLICY "Anyone can submit wholesale application"
  ON public.wholesale_applications FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 4 AND 255
    AND business_name IS NOT NULL
    AND char_length(business_name) BETWEEN 1 AND 255
    AND store_id IS NOT NULL
  );
