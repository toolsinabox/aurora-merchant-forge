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
    mutationFn: async (product: any) => {
      if (!currentStore) throw new Error("No store selected");
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, store_id: currentStore.id } as any)
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
        .update(updates as any)
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

// ===================== PRODUCT SHIPPING =====================

export function useProductShipping(productId: string | undefined) {
  return useQuery({
    queryKey: ["product_shipping", productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from("product_shipping" as any)
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useUpsertProductShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shipping: any) => {
      const { data, error } = await supabase
        .from("product_shipping" as any)
        .upsert(shipping, { onConflict: "product_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product_shipping", vars.product_id] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== PRODUCT SPECIFICS =====================

export function useProductSpecifics(productId: string | undefined) {
  return useQuery({
    queryKey: ["product_specifics", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_specifics" as any)
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useCreateProductSpecific() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (spec: { product_id: string; name: string; value: string; sort_order?: number }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("product_specifics" as any)
        .insert({ ...spec, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product_specifics", vars.product_id] });
      toast.success("Specific added");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteProductSpecific() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase.from("product_specifics" as any).delete().eq("id", id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ["product_specifics", productId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== PRODUCT PRICING TIERS =====================

export function useProductPricingTiers(productId: string | undefined) {
  return useQuery({
    queryKey: ["product_pricing_tiers", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_pricing_tiers" as any)
        .select("*")
        .eq("product_id", productId)
        .order("min_quantity");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useCreatePricingTier() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (tier: { product_id: string; tier_name: string; min_quantity: number; price: number; user_group?: string | null }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("product_pricing_tiers" as any)
        .insert({ ...tier, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product_pricing_tiers", vars.product_id] });
      toast.success("Pricing tier added");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePricingTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase.from("product_pricing_tiers" as any).delete().eq("id", id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ["product_pricing_tiers", productId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== PRODUCT RELATIONS =====================

export function useProductRelations(productId: string | undefined) {
  return useQuery({
    queryKey: ["product_relations", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_relations" as any)
        .select("*, related_product:related_product_id(title)")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useCreateProductRelation() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (rel: { product_id: string; related_product_id: string; relation_type: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("product_relations" as any)
        .insert({ ...rel, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product_relations", vars.product_id] });
      toast.success("Relation added");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteProductRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase.from("product_relations" as any).delete().eq("id", id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ["product_relations", productId] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== IMPORT TEMPLATES =====================

export function useImportTemplates() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["import_templates", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("import_templates" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });
}

export function useCreateImportTemplate() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (tmpl: { name: string; entity_type: string; field_mappings: any; static_values?: any }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("import_templates" as any)
        .insert({ ...tmpl, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import_templates"] });
      toast.success("Template saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteImportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("import_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import_templates"] });
      toast.success("Template deleted");
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
    mutationFn: async (cat: {
      name: string; slug: string; parent_id?: string | null; sort_order?: number;
      description?: string | null; image_url?: string | null; seo_title?: string | null; seo_description?: string | null;
    }) => {
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

// ===================== CUSTOMER GROUPS =====================

export function useCustomerGroups() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["customer_groups", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("customer_groups" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });
}

export function useCreateCustomerGroup() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (group: { name: string; discount_percent?: number; is_tax_exempt?: boolean; description?: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("customer_groups" as any)
        .insert({ ...group, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_groups"] });
      toast.success("Customer group created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteCustomerGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_groups" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_groups"] });
      toast.success("Customer group deleted");
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

// ===================== ORDER PAYMENTS =====================

export function useOrderPayments(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order_payments", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_payments" as any)
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });
}

export function useCreateOrderPayment() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: { order_id: string; amount: number; payment_method: string; reference?: string; notes?: string }) => {
      if (!currentStore || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("order_payments" as any)
        .insert({ ...payment, store_id: currentStore.id, recorded_by: user.id })
        .select()
        .single();
      if (error) throw error;
      // Trigger payment confirmation email
      supabase.functions.invoke("payment-email", {
        body: { order_id: payment.order_id, store_id: currentStore.id, amount: payment.amount, payment_method: payment.payment_method },
      }).catch(() => {});
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["order_payments", vars.order_id] });
      qc.invalidateQueries({ queryKey: ["order", vars.order_id] });
      toast.success("Payment recorded");
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

// ===================== ORDER SHIPMENTS =====================

export function useOrderShipments(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order_shipments", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_shipments" as any)
        .select("*, shipment_items(*, order_items:order_item_id(title, sku, quantity))")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  const { currentStore, user } = useAuth();
  return useMutation({
    mutationFn: async (shipment: {
      order_id: string;
      carrier?: string;
      tracking_number?: string;
      tracking_url?: string;
      notes?: string;
      items: { order_item_id: string; quantity: number }[];
    }) => {
      if (!currentStore) throw new Error("No store");
      const shipmentNumber = `SHP-${Date.now().toString(36).toUpperCase()}`;
      const { data: newShipment, error: shipErr } = await supabase
        .from("order_shipments" as any)
        .insert({
          order_id: shipment.order_id,
          store_id: currentStore.id,
          shipment_number: shipmentNumber,
          carrier: shipment.carrier || null,
          tracking_number: shipment.tracking_number || null,
          tracking_url: shipment.tracking_url || null,
          status: "pending",
          notes: shipment.notes || null,
        })
        .select()
        .single();
      if (shipErr) throw shipErr;
      if (shipment.items.length > 0) {
        const itemRows = shipment.items.map((i) => ({
          shipment_id: (newShipment as any).id,
          order_item_id: i.order_item_id,
          quantity: i.quantity,
          store_id: currentStore.id,
        }));
        const { error: itemsErr } = await supabase.from("shipment_items" as any).insert(itemRows);
        if (itemsErr) throw itemsErr;
      }
      // Add timeline event
      await supabase.from("order_timeline" as any).insert({
        order_id: shipment.order_id,
        store_id: currentStore.id,
        user_id: user?.id || null,
        event_type: "shipment_created",
        title: "Shipment created",
        description: `${shipmentNumber}${shipment.carrier ? ` via ${shipment.carrier}` : ""}${shipment.tracking_number ? ` — ${shipment.tracking_number}` : ""}`,
      });
      // Trigger shipped email to customer
      supabase.functions.invoke("shipment-email", {
        body: { order_id: shipment.order_id, store_id: currentStore.id, shipment_id: (newShipment as any).id },
      }).catch(() => {});
      return newShipment;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["order_shipments", vars.order_id] });
      qc.invalidateQueries({ queryKey: ["order_timeline", vars.order_id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Shipment created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateShipment() {
  const qc = useQueryClient();
  const { currentStore, user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, orderId, ...updates }: { id: string; orderId: string; status?: string; carrier?: string; tracking_number?: string; tracking_url?: string; shipped_at?: string; delivered_at?: string }) => {
      const { data, error } = await supabase
        .from("order_shipments" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      if (updates.status && currentStore) {
        const statusLabels: Record<string, string> = { pending: "Shipment pending", shipped: "Shipment shipped", in_transit: "Shipment in transit", delivered: "Shipment delivered" };
        await supabase.from("order_timeline" as any).insert({
          order_id: orderId,
          store_id: currentStore.id,
          user_id: user?.id || null,
          event_type: "shipment_status",
          title: statusLabels[updates.status] || `Shipment ${updates.status}`,
          description: `Shipment updated to ${updates.status}`,
        });
      }
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["order_shipments", vars.orderId] });
      qc.invalidateQueries({ queryKey: ["order_timeline", vars.orderId] });
      toast.success("Shipment updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== ORDER TIMELINE =====================

export function useOrderTimeline(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order_timeline", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_timeline" as any)
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });
}

export function useCreateTimelineEvent() {
  const qc = useQueryClient();
  const { currentStore, user } = useAuth();
  return useMutation({
    mutationFn: async (event: { order_id: string; event_type?: string; title: string; description?: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("order_timeline" as any)
        .insert({
          ...event,
          store_id: currentStore.id,
          user_id: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["order_timeline", vars.order_id] });
    },
    onError: (e) => toast.error(e.message),
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
      setCurrentStore({ id: data.id, name: data.name, slug: data.slug, currency: data.currency, timezone: data.timezone });
      toast.success("Store settings saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== STORE TEMPLATES (B@SE) =====================

export function useStoreTemplates() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["store_templates", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("store_templates" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });
}

export function useCreateStoreTemplate() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (tmpl: { name: string; slug?: string; template_type?: string; context_type?: string; content: string; is_active?: boolean }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("store_templates" as any)
        .insert({ ...tmpl, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_templates"] });
      toast.success("Template created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateStoreTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; slug?: string; template_type?: string; context_type?: string; content?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from("store_templates" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_templates"] });
      toast.success("Template saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteStoreTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_templates"] });
      toast.success("Template deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== MARKETING CAMPAIGNS =====================

export function useMarketingCampaigns() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["marketing_campaigns", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("marketing_campaigns" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (campaign: { name: string; subject?: string; content?: string; campaign_type?: string; audience_segment?: string; audience_tags?: string[]; scheduled_at?: string }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("marketing_campaigns" as any)
        .insert({ ...campaign, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast.success("Campaign created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("marketing_campaigns" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast.success("Campaign updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_campaigns" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ===================== ABANDONED CARTS =====================

export function useAbandonedCarts() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["abandoned_carts", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("abandoned_carts" as any)
        .select("*, customers(name, email)")
        .eq("store_id", currentStore.id)
        .order("abandoned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });
}

// ===================== CUSTOMER ADDRESSES =====================

export function useCustomerAddresses(customerId: string | undefined) {
  return useQuery({
    queryKey: ["customer_addresses", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from("customer_addresses" as any)
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });
}

export function useCreateCustomerAddress() {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  return useMutation({
    mutationFn: async (addr: {
      customer_id: string;
      label?: string;
      first_name?: string;
      last_name?: string;
      company?: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country?: string;
      phone?: string;
      is_default_billing?: boolean;
      is_default_shipping?: boolean;
    }) => {
      if (!currentStore) throw new Error("No store");
      const { data, error } = await supabase
        .from("customer_addresses" as any)
        .insert({ ...addr, store_id: currentStore.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["customer_addresses", vars.customer_id] });
      toast.success("Address added");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteCustomerAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, customerId }: { id: string; customerId: string }) => {
      const { error } = await supabase.from("customer_addresses" as any).delete().eq("id", id);
      if (error) throw error;
      return customerId;
    },
    onSuccess: (customerId) => {
      qc.invalidateQueries({ queryKey: ["customer_addresses", customerId] });
      toast.success("Address deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}