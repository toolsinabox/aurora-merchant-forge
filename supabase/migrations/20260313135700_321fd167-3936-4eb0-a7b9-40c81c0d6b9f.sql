ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS guest_checkout_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS min_order_amount numeric NOT NULL DEFAULT 0;