
-- Migration Jobs table
CREATE TABLE public.migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  source_platform TEXT NOT NULL DEFAULT 'maropost',
  source_domain TEXT NOT NULL,
  api_key_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, connecting, importing, completed, failed, cancelled
  progress JSONB DEFAULT '{}',
  entities_to_import TEXT[] DEFAULT '{}',
  total_records INT DEFAULT 0,
  imported_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.migration_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store migration_jobs" ON public.migration_jobs FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Migration Entity Logs
CREATE TABLE public.migration_entity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_job_id UUID REFERENCES public.migration_jobs(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL, -- products, categories, customers, orders, content_pages, templates, etc.
  source_id TEXT,
  target_id UUID,
  status TEXT DEFAULT 'pending', -- pending, importing, success, failed, skipped
  error_message TEXT,
  source_data JSONB,
  mapped_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.migration_entity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store migration_entity_logs" ON public.migration_entity_logs FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

-- Theme Migration Records
CREATE TABLE public.theme_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_job_id UUID REFERENCES public.migration_jobs(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  template_name TEXT NOT NULL,
  source_content TEXT,
  converted_content TEXT,
  conversion_status TEXT DEFAULT 'pending', -- pending, converted, manual_review, failed
  base_tags_found TEXT[] DEFAULT '{}',
  base_tags_converted TEXT[] DEFAULT '{}',
  base_tags_unsupported TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.theme_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own store theme_migrations" ON public.theme_migrations FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE TRIGGER update_migration_jobs_updated_at BEFORE UPDATE ON public.migration_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_migrations_updated_at BEFORE UPDATE ON public.theme_migrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
