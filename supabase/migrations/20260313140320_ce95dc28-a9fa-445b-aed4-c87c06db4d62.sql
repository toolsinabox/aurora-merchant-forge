ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS seo_title_global text,
  ADD COLUMN IF NOT EXISTS seo_description_global text,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{"new_order": true, "low_stock": true, "new_customer": true, "return_request": true, "contact_form": true, "review_submitted": true}'::jsonb;