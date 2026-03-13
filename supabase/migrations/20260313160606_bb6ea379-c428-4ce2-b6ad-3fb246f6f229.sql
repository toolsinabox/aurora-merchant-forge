
-- Add custom_css column to store_templates
ALTER TABLE public.store_templates ADD COLUMN IF NOT EXISTS custom_css text DEFAULT '';

-- Add cubic_divisor to shipping_zones for volumetric weight calculation
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS cubic_divisor numeric DEFAULT 5000;

-- Create shipping_rules table for restrictions
CREATE TABLE IF NOT EXISTS public.shipping_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  shipping_zone_id uuid REFERENCES public.shipping_zones(id) ON DELETE CASCADE NOT NULL,
  rule_type text NOT NULL DEFAULT 'restrict',
  condition_type text NOT NULL DEFAULT 'weight',
  condition_operator text NOT NULL DEFAULT 'greater_than',
  condition_value numeric NOT NULL DEFAULT 0,
  message text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view shipping rules for their stores" ON public.shipping_rules
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));

CREATE POLICY "Users can manage shipping rules for their stores" ON public.shipping_rules
  FOR ALL TO authenticated
  USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
