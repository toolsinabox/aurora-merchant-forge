import { useQuery } from "@tanstack/react-query";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Package, ShoppingCart, Users, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [stores, orders, products, customers] = await Promise.all([
        supabase.from("stores").select("id, subscription_tier, is_suspended", { count: "exact" }),
        supabase.from("orders").select("id, total, created_at", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("customers").select("id", { count: "exact" }),
      ]);

      const totalRevenue = (orders.data || []).reduce((sum, o) => sum + (o.total || 0), 0);
      const tierCounts: Record<string, number> = {};
      (stores.data || []).forEach((s: any) => {
        tierCounts[s.subscription_tier] = (tierCounts[s.subscription_tier] || 0) + 1;
      });
      const suspendedCount = (stores.data || []).filter((s: any) => s.is_suspended).length;

      return {
        totalStores: stores.count || 0,
        totalOrders: orders.count || 0,
        totalProducts: products.count || 0,
        totalCustomers: customers.count || 0,
        totalRevenue,
        tierCounts,
        suspendedCount,
      };
    },
  });
}

export default function PlatformDashboard() {
  const { data: stats, isLoading } = usePlatformStats();

  const statCards = [
    { label: "Total Stores", value: stats?.totalStores, icon: Store, color: "text-primary" },
    { label: "Total Orders", value: stats?.totalOrders, icon: ShoppingCart, color: "text-chart-2" },
    { label: "Total Products", value: stats?.totalProducts, icon: Package, color: "text-chart-3" },
    { label: "Total Customers", value: stats?.totalCustomers, icon: Users, color: "text-chart-4" },
    { label: "Platform Revenue", value: stats ? `$${stats.totalRevenue.toLocaleString()}` : undefined, icon: DollarSign, color: "text-chart-1" },
    { label: "Suspended", value: stats?.suspendedCount, icon: TrendingUp, color: "text-destructive" },
  ];

  return (
    <PlatformLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Platform Dashboard</h1>
            <p className="text-xs text-muted-foreground">Global overview across all merchants</p>
          </div>
          <Link to="/admin/merchants">
            <Button size="sm" variant="outline" className="text-xs h-8">
              Manage Merchants
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{card.value ?? 0}</p>
                )}
                <p className="text-2xs text-muted-foreground mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats?.tierCounts && Object.keys(stats.tierCounts).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Subscription Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(stats.tierCounts).map(([tier, count]) => (
                  <div key={tier} className="text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-2xs text-muted-foreground capitalize">{tier}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformLayout>
  );
}
