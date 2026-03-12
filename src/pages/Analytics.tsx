import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useOrders, useCustomers } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, TrendingUp, Users, Package } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(280, 68%, 55%)", "hsl(0, 72%, 51%)"];

function buildTimeSeries(orders: any[], days: number) {
  const now = new Date();
  const result: { date: string; revenue: number; orders: number; avgOrderValue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = days <= 30
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : d.toLocaleDateString("en-US", { month: "short" });
    const dayOrders = orders.filter((o: any) => o.created_at?.startsWith(dateStr));
    const revenue = dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    result.push({
      date: label,
      revenue,
      orders: dayOrders.length,
      avgOrderValue: dayOrders.length > 0 ? revenue / dayOrders.length : 0,
    });
  }
  return result;
}

function getOrderStatusBreakdown(orders: any[]) {
  const map: Record<string, number> = {};
  orders.forEach((o: any) => { map[o.status] = (map[o.status] || 0) + 1; });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function getPaymentBreakdown(orders: any[]) {
  const map: Record<string, number> = {};
  orders.forEach((o: any) => { map[o.payment_status] = (map[o.payment_status] || 0) + 1; });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function getTopProducts(orders: any[], products: any[]) {
  // Use products with highest prices as proxy since we don't have item-level data in this query
  return products
    .filter((p) => p.status === "active")
    .sort((a, b) => b.price - a.price)
    .slice(0, 5)
    .map((p) => ({ name: p.title.slice(0, 25), price: p.price }));
}

function getCustomerSegments(customers: any[]) {
  const map: Record<string, number> = {};
  customers.forEach((c: any) => { map[c.segment] = (map[c.segment] || 0) + 1; });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function MetricCard({ title, value, icon: Icon, loading }: { title: string; value: string; icon: any; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="h-5 w-16 mt-0.5" /> : <p className="text-lg font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: products = [], isLoading: lp } = useProducts();
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: customers = [], isLoading: lc } = useCustomers();
  const [range, setRange] = useState("30");
  const loading = lo || lp || lc;

  const days = parseInt(range);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
  const filteredOrders = useMemo(() => orders.filter((o: any) => new Date(o.created_at) >= cutoff), [orders, days]);

  const timeSeries = useMemo(() => buildTimeSeries(filteredOrders, days), [filteredOrders, days]);
  const totalRevenue = filteredOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const statusData = useMemo(() => getOrderStatusBreakdown(filteredOrders), [filteredOrders]);
  const paymentData = useMemo(() => getPaymentBreakdown(filteredOrders), [filteredOrders]);
  const topProds = useMemo(() => getTopProducts(filteredOrders, products), [filteredOrders, products]);
  const segments = useMemo(() => getCustomerSegments(customers), [customers]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <p className="text-xs text-muted-foreground">Sales performance and insights</p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7" className="text-xs">Last 7 days</SelectItem>
              <SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
              <SelectItem value="90" className="text-xs">Last 90 days</SelectItem>
              <SelectItem value="365" className="text-xs">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard title="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} loading={loading} />
          <MetricCard title="Orders" value={filteredOrders.length.toString()} icon={ShoppingCart} loading={loading} />
          <MetricCard title="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} icon={TrendingUp} loading={loading} />
          <MetricCard title="Customers" value={customers.length.toString()} icon={Users} loading={loading} />
          <MetricCard title="Active Products" value={products.filter((p) => p.status === "active").length.toString()} icon={Package} loading={loading} />
        </div>

        {/* Revenue + Orders Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? <Skeleton className="h-[220px]" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 50%)" fill="url(#aRevGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Orders Per Day</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? <Skeleton className="h-[220px]" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                    <Bar dataKey="orders" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pie charts + top products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Order Status</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? <Skeleton className="h-[200px]" /> : statusData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Payment Status</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? <Skeleton className="h-[200px]" /> : paymentData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {paymentData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Customer Segments</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? <Skeleton className="h-[200px]" /> : segments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={segments} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {segments.map((_, i) => <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Avg order value trend */}
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Average Order Value Trend</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? <Skeleton className="h-[200px]" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "AOV"]} />
                  <Line type="monotone" dataKey="avgOrderValue" stroke="hsl(280, 68%, 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        {topProds.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Top Products by Price</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProds} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" width={120} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]} />
                  <Bar dataKey="price" fill="hsl(217, 91%, 50%)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
