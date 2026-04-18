import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Dashboard-only summary hook.
 *
 * The Dashboard previously loaded EVERY row from products / orders / customers /
 * order_items (capped at the Supabase 1000-row default but still megabytes
 * each). On stores with thousands of rows this blocked first paint for 5–8s.
 *
 * This hook only loads what the dashboard actually displays:
 *   - 30-day order rows (for charts, KPIs, fulfillment pipeline, recent list)
 *   - 30-day customer rows (for growth chart + segment counts)
 *   - product status counts (for KPI tiles + low-stock alert) via head:true counts
 *   - top 5 products by sales over the last 30 days
 *
 * All requests are issued in parallel by react-query so first paint is bound
 * by the slowest small query (~150–300ms) instead of the largest full table.
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface DashboardOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
}

export interface DashboardCustomer {
  id: string;
  segment: string;
  created_at: string;
}

export interface DashboardCounts {
  totalOrders: number;
  totalCustomers: number;
  activeProducts: number;
  lowStockProducts: number;
}

export interface DashboardTopProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  sold: number;
}

function thirtyDaysAgoIso() {
  return new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
}

/** Recent + 30-day window of orders (small slice, not the whole table). */
export function useDashboardOrders() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["dashboard:orders", currentStore?.id],
    enabled: !!currentStore,
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardOrder[]> => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, total, created_at, customers(name)")
        .eq("store_id", currentStore.id)
        .gte("created_at", thirtyDaysAgoIso())
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        payment_status: o.payment_status,
        total: Number(o.total),
        created_at: o.created_at,
        customer_name: o.customers?.name ?? null,
      }));
    },
  });
}

/** 30-day window of customers, just the fields needed for the growth chart. */
export function useDashboardCustomers() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["dashboard:customers", currentStore?.id],
    enabled: !!currentStore,
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardCustomer[]> => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, segment, created_at")
        .eq("store_id", currentStore.id)
        .gte("created_at", thirtyDaysAgoIso())
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as DashboardCustomer[];
    },
  });
}

/** Aggregate counts (HEAD requests, ~1KB each) — replaces full table loads. */
export function useDashboardCounts() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["dashboard:counts", currentStore?.id],
    enabled: !!currentStore,
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardCounts> => {
      if (!currentStore) {
        return { totalOrders: 0, totalCustomers: 0, activeProducts: 0, lowStockProducts: 0 };
      }
      const storeId = currentStore.id;
      // Run all four count queries in parallel.
      const [ordersRes, customersRes, activeRes, lowStockRes] = await Promise.all([
        supabase.from("orders").select("id", { head: true, count: "exact" }).eq("store_id", storeId),
        supabase.from("customers").select("id", { head: true, count: "exact" }).eq("store_id", storeId),
        supabase.from("products").select("id", { head: true, count: "exact" }).eq("store_id", storeId).eq("status", "active"),
        // low-stock = product_variants with stock between 1 and 10 in this store
        supabase
          .from("product_variants")
          .select("id, products!inner(store_id)", { head: true, count: "exact" })
          .gt("stock", 0)
          .lte("stock", 10)
          .eq("products.store_id", storeId),
      ]);

      return {
        totalOrders: ordersRes.count ?? 0,
        totalCustomers: customersRes.count ?? 0,
        activeProducts: activeRes.count ?? 0,
        lowStockProducts: lowStockRes.count ?? 0,
      };
    },
  });
}

/** Top 5 best sellers in the last 30 days. */
export function useDashboardTopProducts() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["dashboard:top-products", currentStore?.id],
    enabled: !!currentStore,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<DashboardTopProduct[]> => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, quantity, products(title, price, images)")
        .eq("store_id", currentStore.id)
        .gte("created_at", thirtyDaysAgoIso())
        .not("product_id", "is", null)
        .limit(2000);
      if (error) throw error;
      const map = new Map<string, DashboardTopProduct>();
      (data || []).forEach((item: any) => {
        if (!item.product_id || !item.products) return;
        const existing = map.get(item.product_id);
        if (existing) {
          existing.sold += item.quantity;
        } else {
          map.set(item.product_id, {
            id: item.product_id,
            title: item.products.title,
            price: Number(item.products.price ?? 0),
            images: item.products.images || [],
            sold: item.quantity,
          });
        }
      });
      return Array.from(map.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);
    },
  });
}

/** Aggregate convenience hook — composes the four queries above. */
export function useDashboardSummary() {
  const orders = useDashboardOrders();
  const customers = useDashboardCustomers();
  const counts = useDashboardCounts();
  const topProducts = useDashboardTopProducts();
  return {
    orders: orders.data ?? [],
    customers: customers.data ?? [],
    counts: counts.data ?? { totalOrders: 0, totalCustomers: 0, activeProducts: 0, lowStockProducts: 0 },
    topProducts: topProducts.data ?? [],
    loadingOrders: orders.isLoading,
    loadingCustomers: customers.isLoading,
    loadingCounts: counts.isLoading,
    loadingProducts: topProducts.isLoading,
  };
}
