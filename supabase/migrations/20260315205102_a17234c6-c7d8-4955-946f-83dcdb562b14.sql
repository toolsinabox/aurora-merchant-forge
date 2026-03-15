
-- Create theme-assets storage bucket for binary theme files (images, fonts, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('theme-assets', 'theme-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp', 'image/x-icon', 'font/woff', 'font/woff2', 'font/ttf', 'application/font-woff', 'application/font-woff2', 'application/x-font-ttf', 'application/vnd.ms-fontobject', 'image/vnd.microsoft.icon'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to theme assets
CREATE POLICY "Public read theme assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'theme-assets');

-- Allow authenticated users to upload theme assets
CREATE POLICY "Authenticated upload theme assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'theme-assets');

-- Allow authenticated users to update/delete their theme assets
CREATE POLICY "Authenticated manage theme assets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'theme-assets');

CREATE POLICY "Authenticated update theme assets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'theme-assets');
