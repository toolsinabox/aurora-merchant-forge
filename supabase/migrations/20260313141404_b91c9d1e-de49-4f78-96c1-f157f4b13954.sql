CREATE TABLE IF NOT EXISTS public.order_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  quote_number text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  valid_until timestamptz,
  approved_at timestamptz,
  converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.order_quotes(id) ON DELETE CASCADE NOT NULL,
  store_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title text NOT NULL,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.order_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners manage quotes" ON public.order_quotes
  FOR ALL TO authenticated USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Store owners manage quote items" ON public.order_quote_items
  FOR ALL TO authenticated USING (
    store_id IN (SELECT store_id FROM public.order_quotes WHERE id = order_quote_items.quote_id AND store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  );