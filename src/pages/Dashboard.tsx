import { useMemo, useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useProducts, useOrders, useCustomers } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown,
  Users, Plus, ExternalLink, ArrowRight, Settings2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function KPICard({ title, value, change, icon: Icon, prefix = "", suffix = "", loading }: {
  title: string; value: string | number; change?: number; icon: React.ComponentType<{ className?: string }>; prefix?: string; suffix?: string; loading?: boolean;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className="card-hover transition-all duration-300 border-border/60 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            {loading ? <Skeleton className="h-6 w-20" /> : (
              <p className="text-xl font-bold tracking-tight">{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</p>
            )}
            {change !== undefined && !loading && (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{isPositive ? "+" : ""}{change.toFixed(1)}% vs last period</span>
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildDailyData(orders: any[], days: number) {
  const now = new Date();
  const result: { date: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayOrders = orders.filter((o: any) => o.created_at?.startsWith(dateStr));
    result.push({
      date: label,
      revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
      orders: dayOrders.length,
    });
  }
  return result;
}

function calcChange(orders: any[], days: number) {
  const now = new Date();
  const mid = new Date(now); mid.setDate(mid.getDate() - days);
  const start = new Date(mid); start.setDate(start.getDate() - days);
  const current = orders.filter((o: any) => new Date(o.created_at) >= mid).reduce((s: number, o: any) => s + Number(o.total), 0);
  const previous = orders.filter((o: any) => { const d = new Date(o.created_at); return d >= start && d < mid; }).reduce((s: number, o: any) => s + Number(o.total), 0);
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function EmptyDashboard({ navigate }: { navigate: (path: string) => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Get started with your store</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Add your first products and start taking orders. Your dashboard will populate with real-time data as activity flows in.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button onClick={() => navigate("/products/new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add First Product
          </Button>
          <Button variant="outline" onClick={() => navigate("/categories")} className="gap-2">
            Set Up Categories
          </Button>
          <Button variant="outline" onClick={() => navigate("/settings")} className="gap-2">
            Configure Store
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: orders = [], isLoading: loadingOrders } = useOrders();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const navigate = useNavigate();
  const { currentStore } = useAuth();

  // Widget visibility
  const WIDGET_KEYS = ["kpis", "revenue", "dailyOrders", "recentOrders", "topProducts", "customerGrowth", "orderStatus", "customersSummary", "inventoryAlerts"] as const;
  const WIDGET_LABELS: Record<string, string> = {
    kpis: "KPI Cards", revenue: "Revenue Chart", dailyOrders: "Daily Orders", recentOrders: "Recent Orders",
    topProducts: "Top Products", customerGrowth: "Customer Growth", orderStatus: "Order Status",
    customersSummary: "Customers Summary", inventoryAlerts: "Inventory Alerts",
  };
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dashboard_widgets");
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(WIDGET_KEYS.map(k => [k, true]));
  });
  const toggleWidget = (key: string) => {
    setVisibleWidgets(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("dashboard_widgets", JSON.stringify(next));
      return next;
    });
  };
  const w = (key: string) => visibleWidgets[key] !== false;

  const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const activeProducts = products.filter((p) => p.status === "active").length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const lowStockProducts = products.filter((p) => {
    const stock = (p.product_variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0);
    return stock > 0 && stock <= 10;
  }).length;

  const revenueChange = useMemo(() => calcChange(orders, 30), [orders]);
  const dailyData = useMemo(() => buildDailyData(orders, 30), [orders]);
  const recentOrders = orders.slice(0, 8);

  const isEmptyStore = !loadingProducts && !loadingOrders && products.length === 0 && orders.length === 0;

  // Top selling products by order item count
  const [orderItems, setOrderItems] = useState<any[]>([]);
  useEffect(() => {
    if (!currentStore) return;
    supabase
      .from("order_items")
      .select("product_id, quantity, products(title, price, images)")
      .eq("store_id", currentStore.id)
      .then(({ data }) => { if (data) setOrderItems(data); });
  }, [currentStore]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; price: number; images: string[]; sold: number }>();
    orderItems.forEach((item: any) => {
      if (!item.product_id || !item.products) return;
      const existing = map.get(item.product_id);
      if (existing) {
        existing.sold += item.quantity;
      } else {
        map.set(item.product_id, {
          title: item.products.title,
          price: item.products.price,
          images: item.products.images || [],
          sold: item.quantity,
        });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].sold - a[1].sold)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));
  }, [orderItems]);

  // Customer growth data
  const customerGrowthData = useMemo(() => {
    const now = new Date();
    const result: { date: string; customers: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const count = customers.filter((c: any) => c.created_at?.startsWith(dateStr)).length;
      result.push({ date: label, customers: count });
    }
    return result;
  }, [customers]);

  // Order status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o: any) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="page-header">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {currentStore ? `${currentStore.name} overview` : "Welcome back. Here's your store overview."}
            </p>
          </div>
          <div className="page-header-actions">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Settings2 className="h-3.5 w-3.5" /> <span className="btn-label">Widgets</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2" align="end">
                <p className="text-xs font-medium mb-2 px-1">Show/Hide Widgets</p>
                {WIDGET_KEYS.map(key => (
                  <label key={key} className="flex items-center gap-2 px-1 py-1 text-xs cursor-pointer hover:bg-muted rounded">
                    <Checkbox checked={w(key)} onCheckedChange={() => toggleWidget(key)} />
                    {WIDGET_LABELS[key]}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/products/new")}>
              <Plus className="h-3.5 w-3.5" /> <span className="btn-label">Product</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/orders")}>
              <ShoppingCart className="h-3.5 w-3.5" /> <span className="btn-label">Orders</span>
            </Button>
            {(currentStore as any)?.slug && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => window.open(`/store/${(currentStore as any).slug}`, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" /> <span className="btn-label">View Store</span>
              </Button>
            )}
          </div>
        </div>

        {isEmptyStore ? (
          <EmptyDashboard navigate={navigate} />
        ) : (
          <>
            {w("kpis") && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard title="Total Revenue" value={totalRevenue.toFixed(2)} icon={DollarSign} prefix="$" loading={loadingOrders} change={revenueChange} />
              <KPICard title="Total Orders" value={orders.length} icon={ShoppingCart} loading={loadingOrders} />
              <KPICard title="Avg Order Value" value={avgOrderValue.toFixed(2)} icon={TrendingUp} prefix="$" loading={loadingOrders} />
              <KPICard title="Active Products" value={activeProducts} icon={Package} loading={loadingProducts} suffix={lowStockProducts > 0 ? ` (${lowStockProducts} low stock)` : ""} />
            </div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Card className="lg:col-span-2">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {loadingOrders ? <Skeleton className="h-[240px] w-full" /> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v > 0 ? `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}` : "$0"} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Orders (30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {loadingOrders ? <Skeleton className="h-[240px] w-full" /> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                        <Bar dataKey="orders" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Recent Orders */}
              <Card className="lg:col-span-2">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/orders")}>
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="table-scroll">
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
                          <TableRow key={order.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/orders/${order.id}`)}>
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
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Top Products</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/products")}>
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {loadingProducts ? (
                    <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : topProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">No active products yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {topProducts.map((p: any, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/products/${p.id}`)}
                        >
                          <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}</span>
                          <div className="h-8 w-8 rounded bg-muted border overflow-hidden flex-shrink-0">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0].startsWith("http") ? p.images[0] : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${p.images[0]}`}
                                alt="" className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{p.title}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold">{p.sold} sold</span>
                            <p className="text-2xs text-muted-foreground">${Number(p.price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Customer Growth + Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Card className="lg:col-span-2">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Customer Growth (30 Days)</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/customers")}>
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {loadingCustomers ? <Skeleton className="h-[200px] w-full" /> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={customerGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                        <Line type="monotone" dataKey="customers" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Order Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-center justify-center">
                  {loadingOrders ? <Skeleton className="h-[200px] w-full" /> : statusBreakdown.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6">No orders yet</p>
                  ) : (
                    <div className="w-full">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                            {statusBreakdown.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                        {statusBreakdown.map((s, idx) => (
                          <div key={s.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            <span className="capitalize text-muted-foreground">{s.name}</span>
                            <span className="font-medium">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Inventory Alerts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> Customers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {loadingCustomers ? <Skeleton className="h-16 w-full" /> : (
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-lg font-bold">{customers.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{customers.filter((c: any) => c.segment === "new").length}</p>
                        <p className="text-xs text-muted-foreground">New</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{customers.filter((c: any) => c.segment === "returning").length}</p>
                        <p className="text-xs text-muted-foreground">Returning</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {lowStockProducts > 0 && <AlertTriangle className="h-4 w-4 text-warning" />}
                    Inventory Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {loadingProducts ? <Skeleton className="h-16 w-full" /> : lowStockProducts > 0 ? (
                    <div>
                      <p className="text-lg font-bold text-warning">{lowStockProducts}</p>
                      <p className="text-xs text-muted-foreground mb-2">Products with low stock (≤10 units)</p>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate("/inventory")}>
                        Manage Inventory
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">All products are sufficiently stocked.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
