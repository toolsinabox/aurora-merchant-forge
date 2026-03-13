import { useQuery } from "@tanstack/react-query";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

function usePlatformAnalytics() {
  return useQuery({
    queryKey: ["platform-analytics"],
    queryFn: async () => {
      const [ordersRes, storesRes, customersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id, total, created_at, status, store_id"),
        supabase.from("stores").select("id, name, subscription_tier, created_at"),
        supabase.from("customers").select("id, created_at, total_spent"),
        supabase.from("products").select("id, store_id"),
      ]);

      const orders = ordersRes.data || [];
      const stores = storesRes.data || [];
      const customers = customersRes.data || [];
      const products = productsRes.data || [];

      // Revenue over last 30 days
      const revenueByDay: Record<string, number> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const day = format(startOfDay(subDays(now, i)), "yyyy-MM-dd");
        revenueByDay[day] = 0;
      }
      orders.forEach((o: any) => {
        const day = format(new Date(o.created_at), "yyyy-MM-dd");
        if (revenueByDay[day] !== undefined) {
          revenueByDay[day] += o.total || 0;
        }
      });
      const revenueTimeline = Object.entries(revenueByDay).map(([date, revenue]) => ({
        date: format(new Date(date), "MMM d"),
        revenue: Math.round(revenue * 100) / 100,
      }));

      // Orders by status
      const statusCounts: Record<string, number> = {};
      orders.forEach((o: any) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      }));

      // Tier distribution
      const tierCounts: Record<string, number> = {};
      stores.forEach((s: any) => {
        const tier = s.subscription_tier || "free";
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      });
      const tierDistribution = Object.entries(tierCounts).map(([tier, count]) => ({
        name: tier,
        value: count,
      }));

      // Top stores by product count
      const productsByStore: Record<string, number> = {};
      products.forEach((p: any) => {
        productsByStore[p.store_id] = (productsByStore[p.store_id] || 0) + 1;
      });
      const topStores = stores
        .map((s: any) => ({ name: s.name, products: productsByStore[s.id] || 0 }))
        .sort((a: any, b: any) => b.products - a.products)
        .slice(0, 10);

      // New signups over last 30 days
      const signupsByDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const day = format(startOfDay(subDays(now, i)), "yyyy-MM-dd");
        signupsByDay[day] = 0;
      }
      stores.forEach((s: any) => {
        const day = format(new Date(s.created_at), "yyyy-MM-dd");
        if (signupsByDay[day] !== undefined) {
          signupsByDay[day] += 1;
        }
      });
      const storeGrowth = Object.entries(signupsByDay).map(([date, count]) => ({
        date: format(new Date(date), "MMM d"),
        stores: count,
      }));

      // Revenue by store (top stores by revenue)
      const revenueByStore: Record<string, number> = {};
      orders.forEach((o: any) => {
        revenueByStore[o.store_id] = (revenueByStore[o.store_id] || 0) + (o.total || 0);
      });
      const topStoresByRevenue = stores
        .map((s: any) => ({ name: s.name, revenue: Math.round((revenueByStore[s.id] || 0) * 100) / 100 }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      // AOV
      const aov = orders.length > 0
        ? Math.round(orders.reduce((s: number, o: any) => s + (o.total || 0), 0) / orders.length * 100) / 100
        : 0;

      // Customer spend distribution
      const spendBuckets = [
        { name: "$0", value: 0 },
        { name: "$1-50", value: 0 },
        { name: "$51-200", value: 0 },
        { name: "$201-500", value: 0 },
        { name: "$500+", value: 0 },
      ];
      customers.forEach((c: any) => {
        const spent = Number(c.total_spent) || 0;
        if (spent === 0) spendBuckets[0].value++;
        else if (spent <= 50) spendBuckets[1].value++;
        else if (spent <= 200) spendBuckets[2].value++;
        else if (spent <= 500) spendBuckets[3].value++;
        else spendBuckets[4].value++;
      });

      return {
        totalRevenue: orders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        totalOrders: orders.length,
        totalStores: stores.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        aov,
        revenueTimeline,
        ordersByStatus,
        tierDistribution,
        topStores,
        topStoresByRevenue,
        storeGrowth,
        spendBuckets,
      };
    },
  });
}

const COLORS = [
  "hsl(217, 91%, 50%)", // primary
  "hsl(142, 71%, 45%)", // success
  "hsl(38, 92%, 50%)",  // warning
  "hsl(280, 68%, 55%)", // purple
  "hsl(0, 72%, 51%)",   // destructive
  "hsl(199, 89%, 48%)", // info
];

export default function PlatformAnalytics() {
  const { data, isLoading } = usePlatformAnalytics();

  return (
    <PlatformLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Platform Analytics</h1>
          <p className="text-xs text-muted-foreground">Global performance across all merchants (last 30 days)</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue", value: data ? `$${data.totalRevenue.toLocaleString()}` : "—" },
            { label: "Total Orders", value: data?.totalOrders ?? "—" },
            { label: "Total Stores", value: data?.totalStores ?? "—" },
            { label: "Total Customers", value: data?.totalCustomers ?? "—" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-xl font-bold">{stat.value}</p>
                )}
                <p className="text-2xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revenue (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data?.revenueTimeline}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Store Growth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">New Stores (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data?.storeGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="stores" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isLoading ? (
                <Skeleton className="h-48 w-48 rounded-full" />
              ) : data?.ordersByStatus && data.ordersByStatus.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={data.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.ordersByStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {data.ordersByStatus.map((entry: any, i: number) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="capitalize text-muted-foreground">{entry.name}</span>
                        <span className="font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8">No orders yet</p>
              )}
            </CardContent>
          </Card>

          {/* Subscription Tiers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Subscription Tiers</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isLoading ? (
                <Skeleton className="h-48 w-48 rounded-full" />
              ) : data?.tierDistribution && data.tierDistribution.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={data.tierDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.tierDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {data.tierDistribution.map((entry: any, i: number) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="capitalize text-muted-foreground">{entry.name}</span>
                        <span className="font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8">No stores yet</p>
              )}
            </CardContent>
          </Card>

          {/* Top Stores by Products */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Stores by Product Count</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : data?.topStores && data.topStores.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.topStores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="products" fill="hsl(280, 68%, 55%)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}
