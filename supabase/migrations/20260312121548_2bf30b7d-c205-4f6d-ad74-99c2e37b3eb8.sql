
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. STORES (Tenants)
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  contact_email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. USER ROLES
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'staff');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_store_role(_user_id UUID, _store_id UUID, _role app_role DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND store_id = _store_id AND (_role IS NULL OR role = _role)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_store_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT store_id FROM public.user_roles WHERE user_id = _user_id
$$;

-- 3. PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. CATEGORIES
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. PRODUCTS
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  slug TEXT,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_status ON public.products(store_id, status);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. PRODUCT VARIANTS
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. INVENTORY LOCATIONS
CREATE TABLE public.inventory_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'store', 'dropship')),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_inventory_locations_updated_at BEFORE UPDATE ON public.inventory_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. INVENTORY STOCK
CREATE TABLE public.inventory_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_id, location_id)
);
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_inventory_stock_updated_at BEFORE UPDATE ON public.inventory_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. STOCK ADJUSTMENTS
CREATE TABLE public.stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_stock_id UUID NOT NULL REFERENCES public.inventory_stock(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES auth.users(id),
  quantity_change INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- 10. CUSTOMERS
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  segment TEXT NOT NULL DEFAULT 'new' CHECK (segment IN ('new', 'returning', 'vip')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_customers_store ON public.customers(store_id);
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. ORDERS
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  items_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 13. TAX RATES
CREATE TABLE public.tax_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  rate NUMERIC(5,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- 14. SHIPPING ZONES
CREATE TABLE public.shipping_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  regions TEXT NOT NULL,
  flat_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_above NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Stores
CREATE POLICY "Users can view their stores" ON public.stores
  FOR SELECT USING (id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Users can create stores" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update stores" ON public.stores
  FOR UPDATE USING (public.has_store_role(auth.uid(), id, 'owner'));

-- User Roles
CREATE POLICY "Users can view roles for their stores" ON public.user_roles
  FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Owners can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id, 'owner'));
CREATE POLICY "Owners can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_store_role(auth.uid(), store_id, 'owner'));
CREATE POLICY "Owners can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_store_role(auth.uid(), store_id, 'owner'));

-- Profiles
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tenant tables (categories, products, variants, locations, stock, adjustments, customers, orders, order_items, tax_rates, shipping_zones)
CREATE POLICY "Tenant select categories" ON public.categories FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update categories" ON public.categories FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete categories" ON public.categories FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select products" ON public.products FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert products" ON public.products FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update products" ON public.products FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete products" ON public.products FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select variants" ON public.product_variants FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert variants" ON public.product_variants FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update variants" ON public.product_variants FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete variants" ON public.product_variants FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select locations" ON public.inventory_locations FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert locations" ON public.inventory_locations FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update locations" ON public.inventory_locations FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete locations" ON public.inventory_locations FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select stock" ON public.inventory_stock FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert stock" ON public.inventory_stock FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update stock" ON public.inventory_stock FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete stock" ON public.inventory_stock FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select adjustments" ON public.stock_adjustments FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert adjustments" ON public.stock_adjustments FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select customers" ON public.customers FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert customers" ON public.customers FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update customers" ON public.customers FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete customers" ON public.customers FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select orders" ON public.orders FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert orders" ON public.orders FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update orders" ON public.orders FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select order_items" ON public.order_items FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert order_items" ON public.order_items FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select tax_rates" ON public.tax_rates FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert tax_rates" ON public.tax_rates FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update tax_rates" ON public.tax_rates FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete tax_rates" ON public.tax_rates FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

CREATE POLICY "Tenant select shipping_zones" ON public.shipping_zones FOR SELECT USING (store_id IN (SELECT public.get_user_store_ids(auth.uid())));
CREATE POLICY "Tenant insert shipping_zones" ON public.shipping_zones FOR INSERT WITH CHECK (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant update shipping_zones" ON public.shipping_zones FOR UPDATE USING (public.has_store_role(auth.uid(), store_id));
CREATE POLICY "Tenant delete shipping_zones" ON public.shipping_zones FOR DELETE USING (public.has_store_role(auth.uid(), store_id));

-- Auto-create owner role when store is created
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, store_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_store_created
  AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();
