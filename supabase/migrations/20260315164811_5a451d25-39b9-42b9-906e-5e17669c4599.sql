
-- Theme packages: each theme is a top-level folder (like Maropost themes)
CREATE TABLE public.theme_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  screenshot_url TEXT,
  author TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Theme files: individual files within a theme, organized by folder path
CREATE TABLE public.theme_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID NOT NULL REFERENCES public.theme_packages(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'templates',
  file_type TEXT NOT NULL DEFAULT 'html',
  content TEXT DEFAULT '',
  file_size INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(theme_id, file_path)
);

-- Indexes
CREATE INDEX idx_theme_packages_store ON public.theme_packages(store_id);
CREATE INDEX idx_theme_files_theme ON public.theme_files(theme_id);
CREATE INDEX idx_theme_files_store ON public.theme_files(store_id);
CREATE INDEX idx_theme_files_folder ON public.theme_files(theme_id, folder);

-- RLS
ALTER TABLE public.theme_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their store themes"
  ON public.theme_packages FOR ALL TO authenticated
  USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Users can manage their store theme files"
  ON public.theme_files FOR ALL TO authenticated
  USING (public.has_store_role(auth.uid(), store_id));

-- Updated at triggers
CREATE TRIGGER update_theme_packages_updated_at
  BEFORE UPDATE ON public.theme_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_theme_files_updated_at
  BEFORE UPDATE ON public.theme_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
