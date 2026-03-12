import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ===================== PRODUCTS =====================

export function useProducts() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["products", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useProduct(id: string | undefined) {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id || !currentStore) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("id", id)
        .eq("store_id", currentStore.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== "new" && !!currentStore,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (product: {
      title: string; description?: string; sku?: string; barcode?: string;
      price: number; compare_at_price?: number | null; cost_price?: number | null;
      status: string; category_id?: string | null; tags?: string[];
      seo_title?: string; seo_description?: string; slug?: string;
      track_inventory?: boolean;
    }) => {
      if (!currentStore) throw new Error("No store selected");
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", vars.id] });
      toast.success("Product updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Products deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== CATEGORIES =====================

export function useCategories() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["categories", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (cat: { name: string; slug: string; parent_id?: string | null; sort_order?: number }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...cat, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== CUSTOMERS =====================

export function useCustomers() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["customers", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useCustomer(id: string | undefined) {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!id || !currentStore) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .eq("store_id", currentStore.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!currentStore,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (cust: { name: string; email?: string; phone?: string; segment?: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...cust, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== ORDERS =====================

export function useOrders() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["orders", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name, email)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useOrder(id: string | undefined) {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id || !currentStore) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name, email, phone), order_items(*, products(title, images))")
        .eq("id", id)
        .eq("store_id", currentStore.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!currentStore,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (order: {
      customer_id?: string | null;
      items: { product_id: string; variant_id?: string | null; title: string; sku?: string; quantity: number; unit_price: number }[];
      notes?: string;
      shipping_address?: string;
    }) => {
      if (!currentStore) throw new Error("No store");
      const subtotal = order.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          store_id: currentStore.id,
          order_number: orderNumber,
          customer_id: order.customer_id || null,
          items_count: order.items.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          total: subtotal,
          status: "pending",
          payment_status: "pending",
          fulfillment_status: "unfulfilled" as any,
          notes: order.notes as any,
          shipping_address: order.shipping_address as any,
        })
        .select()
        .single();
      if (orderErr) throw orderErr;
      const itemRows = order.items.map((i) => ({
        order_id: newOrder.id,
        store_id: currentStore.id,
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        title: i.title,
        sku: i.sku || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
      if (itemsErr) throw itemsErr;
      return newOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; payment_status?: string; fulfillment_status?: string; notes?: string; shipping_address?: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", vars.id] });
      toast.success("Order updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete items first, then order
      await supabase.from("order_items").delete().eq("order_id", id);
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== INVENTORY =====================

export function useInventoryLocations() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["inventory_locations", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("inventory_locations")
        .select("*")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (loc: { name: string; type?: string; address?: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("inventory_locations")
        .insert({ ...loc, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_locations"] });
      toast.success("Location created");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== SETTINGS (Tax, Shipping, Team) =====================

export function useTaxRates() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["tax_rates", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("tax_rates")
        .select("*")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useCreateTaxRate() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (rate: { name: string; region: string; rate: number }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("tax_rates")
        .insert({ ...rate, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_rates"] });
      toast.success("Tax rate created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteTaxRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tax_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_rates"] });
      toast.success("Tax rate deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useShippingZones() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["shipping_zones", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useCreateShippingZone() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (zone: { name: string; regions: string; flat_rate: number; free_above?: number | null }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("shipping_zones")
        .insert({ ...zone, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipping_zones"] });
      toast.success("Shipping zone created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipping_zones"] });
      toast.success("Shipping zone deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useTeamMembers() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["team", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, profiles(display_name, avatar_url)")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

// ===================== PRODUCT VARIANTS =====================

export function useCreateVariant() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (variant: {
      product_id: string; name: string; sku?: string; price: number;
      stock?: number; option1?: string; option2?: string;
    }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("product_variants")
        .insert({ ...variant, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product", vars.product_id] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== RETURNS =====================

export function useReturns() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["returns", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("returns" as any)
        .select("*, orders(order_number, total), customers(name, email)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useUpdateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; admin_notes?: string; refund_amount?: number }) => {
      const { data, error } = await supabase
        .from("returns" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returns"] });
      toast.success("Return updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== STOCK ADJUSTMENTS =====================

export function useStockAdjustments(inventoryStockId?: string) {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["stock_adjustments", currentStore?.id, inventoryStockId],
    queryFn: async () => {
      if (!currentStore) return [];
      let query = supabase
        .from("stock_adjustments")
        .select("*, profiles:adjusted_by(display_name)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (inventoryStockId) {
        query = query.eq("inventory_stock_id", inventoryStockId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

export function useCreateStockAdjustment() {
  const qc = useQueryClient();
  const { currentStore, user } = useAuth();
  return useMutation({
    mutationFn: async (adj: { inventory_stock_id: string; quantity_change: number; reason?: string }) => {
      if (!currentStore || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("stock_adjustments")
        .insert({
          ...adj,
          store_id: currentStore.id,
          adjusted_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      // Update the inventory_stock quantity
      const { data: stock } = await supabase
        .from("inventory_stock")
        .select("quantity")
        .eq("id", adj.inventory_stock_id)
        .single();
      if (stock) {
        await supabase
          .from("inventory_stock")
          .update({ quantity: stock.quantity + adj.quantity_change })
          .eq("id", adj.inventory_stock_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_adjustments"] });
      qc.invalidateQueries({ queryKey: ["inventory_stock"] });
      toast.success("Stock adjusted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useInventoryStock() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["inventory_stock", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("inventory_stock")
        .select("*, products(title), product_variants(name), inventory_locations(name)")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });
}

// ===================== STORE =====================

export function useUpdateStore() {
  const qc = useQueryClient();
  const { currentStore, setCurrentStore } = useAuth();
  return useMutation({
    mutationFn: async (updates: { name?: string; currency?: string; timezone?: string; contact_email?: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("stores")
        .update(updates)
        .eq("id", currentStore.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentStore({ id: data.id, name: data.name, currency: data.currency, timezone: data.timezone });
      toast.success("Store settings saved");
    },
    onError: (e) => toast.error(e.message),
  });
}
