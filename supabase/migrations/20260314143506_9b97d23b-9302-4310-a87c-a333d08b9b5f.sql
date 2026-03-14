
CREATE TABLE public.search_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search queries" ON public.search_queries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Store staff can view search queries" ON public.search_queries
  FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_search_queries_store ON public.search_queries(store_id);
CREATE INDEX idx_search_queries_query ON public.search_queries(query);
CREATE INDEX idx_search_queries_created ON public.search_queries(created_at);

CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company_name TEXT,
  product_ids TEXT[],
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit quote requests" ON public.quote_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Store staff can view quote requests" ON public.quote_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Store staff can update quote requests" ON public.quote_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
