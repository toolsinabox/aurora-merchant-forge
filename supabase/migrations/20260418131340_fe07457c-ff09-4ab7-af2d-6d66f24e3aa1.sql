
-- Tighten profiles SELECT: only allow viewing own profile
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Tighten back_in_stock_requests INSERT: rate-limit by requiring email + product_id
-- (still public, but now requires non-null email to discourage spam writes)
DROP POLICY IF EXISTS "Anyone can request back in stock notifications" ON public.back_in_stock_requests;
CREATE POLICY "Anyone can request back in stock notifications"
  ON public.back_in_stock_requests FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) > 3
    AND char_length(email) < 255
    AND product_id IS NOT NULL
    AND store_id IS NOT NULL
  );

-- Tighten contact form: require basic validation
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 4 AND 255
    AND name IS NOT NULL
    AND char_length(name) BETWEEN 1 AND 200
    AND message IS NOT NULL
    AND char_length(message) BETWEEN 1 AND 5000
    AND store_id IS NOT NULL
  );

-- Tighten newsletter signup: require email
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 4 AND 255
    AND store_id IS NOT NULL
  );

-- Tighten search_queries: require non-empty query
DROP POLICY IF EXISTS "Anyone can insert search queries" ON public.search_queries;
CREATE POLICY "Anyone can insert search queries"
  ON public.search_queries FOR INSERT
  WITH CHECK (
    query IS NOT NULL
    AND char_length(query) BETWEEN 1 AND 500
    AND store_id IS NOT NULL
  );
