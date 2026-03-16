-- Fix admin-managed tables: replace USING(true)/WITH CHECK(true) with auth checks

-- addon_catalog: only authenticated users
DROP POLICY IF EXISTS "Auth manage catalog" ON public.addon_catalog;
CREATE POLICY "Authenticated manage catalog" ON public.addon_catalog FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- pos_registers: only authenticated users
DROP POLICY IF EXISTS "Auth manage registers" ON public.pos_registers;
CREATE POLICY "Authenticated manage registers" ON public.pos_registers FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- shipping_methods: only authenticated users
DROP POLICY IF EXISTS "Auth manage shipping_methods" ON public.shipping_methods;
CREATE POLICY "Authenticated manage shipping_methods" ON public.shipping_methods FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- store_addons: only authenticated users
DROP POLICY IF EXISTS "Auth manage addons" ON public.store_addons;
CREATE POLICY "Authenticated manage addons" ON public.store_addons FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- store_languages: only authenticated users
DROP POLICY IF EXISTS "Auth manage languages" ON public.store_languages;
CREATE POLICY "Authenticated manage languages" ON public.store_languages FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- store_translations: only authenticated users
DROP POLICY IF EXISTS "Auth manage translations" ON public.store_translations;
CREATE POLICY "Authenticated manage translations" ON public.store_translations FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- warehouse_routing_rules: only authenticated users
DROP POLICY IF EXISTS "Auth manage routing" ON public.warehouse_routing_rules;
CREATE POLICY "Authenticated manage routing" ON public.warehouse_routing_rules FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- email_queue: restrict to authenticated
DROP POLICY IF EXISTS "Service insert email_queue" ON public.email_queue;
CREATE POLICY "Authenticated insert email_queue" ON public.email_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service update email_queue" ON public.email_queue;
CREATE POLICY "Authenticated update email_queue" ON public.email_queue FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- quote_requests UPDATE: only authenticated users
DROP POLICY IF EXISTS "Store staff can update quote requests" ON public.quote_requests;
CREATE POLICY "Authenticated update quote requests" ON public.quote_requests FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);