import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useProducts, useOrders, useCustomers } from "@/hooks/use-data";
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { mockSalesData } from "@/lib/mock-data";

function KPICard({ title, value, change, icon: Icon, prefix = "", loading }: {
  title: string; value: string | number; change?: number; icon: React.ComponentType<{ className?: string }>; prefix?: string; loading?: boolean;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="h-6 w-20" /> : (
              <p className="text-xl font-bold">{prefix}{typeof value === "number" ? value.toLocaleString() : value}</p>
            )}
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-2xs ${isPositive ? "text-success" : "text-destructive"}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{isPositive ? "+" : ""}{change}% vs last period</span>
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: orders = [], isLoading: loadingOrders } = useOrders();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();

  const totalRevenue = orders.reduce((s, o: any) => s + Number(o.total), 0);
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStockProducts = products.filter((p) => {
    const stock = (p.product_variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0);
    return stock > 0 && stock <= 10;
  }).length;

  const recentOrders = orders.slice(0, 8);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Welcome back. Here's your store overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard title="Total Revenue" value={totalRevenue.toFixed(2)} icon={DollarSign} prefix="$" loading={loadingOrders} />
          <KPICard title="Total Orders" value={orders.length} icon={ShoppingCart} loading={loadingOrders} />
          <KPICard title="Active Products" value={activeProducts} icon={Package} loading={loadingProducts} />
          <KPICard title="Low Stock Alerts" value={lowStockProducts} icon={AlertTriangle} loading={loadingProducts} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Overview (Sample Data)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={mockSalesData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 50%)" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Orders by Month (Sample)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mockSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="orders" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-9">Order</TableHead>
                  <TableHead className="text-xs h-9">Customer</TableHead>
                  <TableHead className="text-xs h-9">Status</TableHead>
                  <TableHead className="text-xs h-9">Payment</TableHead>
                  <TableHead className="text-xs h-9 text-right">Total</TableHead>
                  <TableHead className="text-xs h-9">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : recentOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No orders yet. They'll appear here once customers start ordering.</TableCell></TableRow>
                ) : (
                  recentOrders.map((order: any) => (
                    <TableRow key={order.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{order.order_number}</TableCell>
                      <TableCell className="py-2">{order.customers?.name || "—"}</TableCell>
                      <TableCell className="py-2"><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="py-2"><StatusBadge status={order.payment_status} /></TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(order.total).toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
