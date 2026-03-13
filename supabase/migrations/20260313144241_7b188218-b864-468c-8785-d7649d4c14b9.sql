
-- Add banner scheduling fields to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_start timestamptz DEFAULT NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_end timestamptz DEFAULT NULL;

-- Add currency display format fields
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS currency_symbol_position text DEFAULT 'before';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS currency_decimal_places integer DEFAULT 2;
