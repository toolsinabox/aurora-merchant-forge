
-- Theme presets registry (separate from per-store store_themes)
CREATE TABLE IF NOT EXISTS public.theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  theme_config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read theme presets" ON public.theme_presets
  FOR SELECT USING (true);

INSERT INTO public.theme_presets (name, description, is_system, theme_config) VALUES
('Classic', 'Clean and professional classic theme', true, '{"primary_color":"210 100% 50%","secondary_color":"210 10% 96%","accent_color":"210 100% 50%","background_color":"0 0% 100%","text_color":"0 0% 9%","heading_font":"Inter","body_font":"Inter","button_radius":"0.5rem","hero_style":"centered","product_card_style":"shadow","layout_style":"wide","footer_style":"standard"}'),
('Modern Dark', 'Sleek dark mode with bold accents', true, '{"primary_color":"262 83% 58%","secondary_color":"262 10% 15%","accent_color":"262 83% 58%","background_color":"0 0% 7%","text_color":"0 0% 95%","heading_font":"Space Grotesk","body_font":"Inter","button_radius":"0.75rem","hero_style":"split","product_card_style":"bordered","layout_style":"wide","footer_style":"minimal"}'),
('Minimal', 'Ultra-clean minimalist design', true, '{"primary_color":"0 0% 9%","secondary_color":"0 0% 96%","accent_color":"0 0% 40%","background_color":"0 0% 100%","text_color":"0 0% 9%","heading_font":"DM Sans","body_font":"DM Sans","button_radius":"0rem","hero_style":"centered","product_card_style":"flat","layout_style":"boxed","footer_style":"minimal"}'),
('Boutique', 'Warm elegant boutique aesthetic', true, '{"primary_color":"25 95% 53%","secondary_color":"25 30% 96%","accent_color":"25 95% 53%","background_color":"30 20% 99%","text_color":"25 30% 15%","heading_font":"Playfair Display","body_font":"Lora","button_radius":"1rem","hero_style":"full_width","product_card_style":"shadow","layout_style":"wide","footer_style":"standard"}'),
('Tech', 'Bold technology-focused theme', true, '{"primary_color":"199 89% 48%","secondary_color":"199 10% 10%","accent_color":"160 84% 39%","background_color":"200 10% 6%","text_color":"0 0% 95%","heading_font":"JetBrains Mono","body_font":"Inter","button_radius":"0.5rem","hero_style":"split","product_card_style":"bordered","layout_style":"wide","footer_style":"standard"}');
