-- Delete in dependency order (children first)
DO $$ BEGIN
-- Order-related
DELETE FROM public.order_payments;
DELETE FROM public.order_items;
DELETE FROM public.credit_notes;
DELETE FROM public.refunds;

-- Product-related
DELETE FROM public.product_relations;
DELETE FROM public.product_specifics;
DELETE FROM public.product_pricing_tiers;
DELETE FROM public.product_shipping;
DELETE FROM public.product_variants;
DELETE FROM public.inventory_stock;
DELETE FROM public.inventory_alerts;
DELETE FROM public.inventory_forecasts;
DELETE FROM public.back_in_stock_requests;
DELETE FROM public.backorders;

-- Customer-related
DELETE FROM public.customer_addresses;
DELETE FROM public.customer_communications;
DELETE FROM public.customer_files;
DELETE FROM public.customer_downloads;
DELETE FROM public.abandoned_carts;

-- Core entities
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.customers;
DELETE FROM public.categories;
DELETE FROM public.content_pages;
DELETE FROM public.customer_groups;
DELETE FROM public.gift_vouchers;

END $$;