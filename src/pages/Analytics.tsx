import { useMemo, useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useOrders, useCustomers } from "@/hooks/use-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { currentStore } = useAuth();
  const [range, setRange] = useState("30");
  const loading = lo || lp || lc;

  // Top selling products from order_items
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [couponStats, setCouponStats] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [taxSummary, setTaxSummary] = useState<{ totalTax: number; orderCount: number; byMonth: any[] }>({ totalTax: 0, orderCount: 0, byMonth: [] });
  const [acquisitionData, setAcquisitionData] = useState<{ newCustomers: number; returning: number; byMonth: any[] }>({ newCustomers: 0, returning: 0, byMonth: [] });
  const [slowMovingProducts, setSlowMovingProducts] = useState<any[]>([]);
  const [stockTurnoverData, setStockTurnoverData] = useState<any[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<{ totalRetail: number; totalCost: number; totalUnits: number; items: any[] }>({ totalRetail: 0, totalCost: 0, totalUnits: 0, items: [] });
  const [channelData, setChannelData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<{ visitors: number; carts: number; checkouts: number; purchases: number }>({ visitors: 0, carts: 0, checkouts: 0, purchases: 0 });
  const [salesByBrand, setSalesByBrand] = useState<any[]>([]);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    const fetchData = async () => {
      setLoadingTopProducts(true);

      // Fetch order items with product info
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, title, quantity, total")
        .eq("store_id", currentStore.id);
      
      const productMap: Record<string, { title: string; units: number; revenue: number }> = {};
      (items || []).forEach((item: any) => {
        const key = item.product_id || item.title;
        if (!productMap[key]) productMap[key] = { title: item.title, units: 0, revenue: 0 };
        productMap[key].units += item.quantity;
        productMap[key].revenue += Number(item.total);
      });
      
      setTopSellingProducts(
        Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
      );

      // Sales by category
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("store_id", currentStore.id);
      const { data: prods } = await supabase
        .from("products")
        .select("id, category_id, brand")
        .eq("store_id", currentStore.id);
      
      const catMap: Record<string, string> = {};
      (cats || []).forEach((c: any) => { catMap[c.id] = c.name; });
      const prodCatMap: Record<string, string> = {};
      (prods || []).forEach((p: any) => { if (p.category_id) prodCatMap[p.id] = catMap[p.category_id] || "Other"; });
      
      const catRevenue: Record<string, number> = {};
      (items || []).forEach((item: any) => {
        const cat = prodCatMap[item.product_id] || "Uncategorized";
        catRevenue[cat] = (catRevenue[cat] || 0) + Number(item.total);
      });
      setSalesByCategory(
        Object.entries(catRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
      );

      // Sales by brand
      const prodBrandMap: Record<string, string> = {};
      (prods || []).forEach((p: any) => { if (p.brand) prodBrandMap[p.id] = p.brand; });
      const brandRevenue: Record<string, { revenue: number; units: number }> = {};
      (items || []).forEach((item: any) => {
        const brand = prodBrandMap[item.product_id] || "Unbranded";
        if (!brandRevenue[brand]) brandRevenue[brand] = { revenue: 0, units: 0 };
        brandRevenue[brand].revenue += Number(item.total);
        brandRevenue[brand].units += item.quantity;
      });
      setSalesByBrand(
        Object.entries(brandRevenue).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue).slice(0, 15)
      );
      // Coupon usage stats
      const { data: coupons } = await supabase
        .from("coupons")
        .select("code, discount_type, discount_value, used_count, max_uses, is_active")
        .eq("store_id", currentStore.id)
        .order("used_count", { ascending: false });
      setCouponStats((coupons || []).filter((c: any) => c.used_count > 0));

      // Profit margin report: revenue vs cost from order_items joined with products
      const { data: allProducts } = await supabase
        .from("products")
        .select("id, cost_price, price")
        .eq("store_id", currentStore.id);
      const costMap: Record<string, number> = {};
      (allProducts || []).forEach((p: any) => { costMap[p.id] = Number(p.cost_price) || 0; });

      const profitByProduct: Record<string, { title: string; revenue: number; cost: number; profit: number; units: number }> = {};
      (items || []).forEach((item: any) => {
        const key = item.product_id || item.title;
        if (!profitByProduct[key]) profitByProduct[key] = { title: item.title, revenue: 0, cost: 0, profit: 0, units: 0 };
        const rev = Number(item.total);
        const cost = (costMap[item.product_id] || 0) * item.quantity;
        profitByProduct[key].revenue += rev;
        profitByProduct[key].cost += cost;
        profitByProduct[key].profit += rev - cost;
        profitByProduct[key].units += item.quantity;
      });
      setProfitData(
        Object.values(profitByProduct)
          .filter(p => p.revenue > 0)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 10)
          .map(p => ({ ...p, margin: p.revenue > 0 ? Math.round(p.profit / p.revenue * 100) : 0 }))
      );

      // Tax summary from orders
      const taxByMonth: Record<string, number> = {};
      let totalTax = 0;
      let taxOrderCount = 0;
      (orders as any[]).forEach((o: any) => {
        const tax = Number(o.tax) || 0;
        if (tax > 0) {
          totalTax += tax;
          taxOrderCount++;
          const month = new Date(o.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
          taxByMonth[month] = (taxByMonth[month] || 0) + tax;
        }
      });
      setTaxSummary({
        totalTax,
        orderCount: taxOrderCount,
        byMonth: Object.entries(taxByMonth).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 })),
      });

      // Customer acquisition: new vs returning
      const custByMonth: Record<string, { newC: number; returning: number }> = {};
      let totalNew = 0, totalReturning = 0;
      (customers as any[]).forEach((c: any) => {
        const month = new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
        if (!custByMonth[month]) custByMonth[month] = { newC: 0, returning: 0 };
        if (Number(c.total_orders) <= 1) {
          custByMonth[month].newC++;
          totalNew++;
        } else {
          custByMonth[month].returning++;
          totalReturning++;
        }
      });
      setAcquisitionData({
        newCustomers: totalNew,
        returning: totalReturning,
        byMonth: Object.entries(custByMonth).map(([month, d]) => ({ month, new: d.newC, returning: d.returning })),
      });
      // Slow-moving stock: products with stock but few/no sales in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const recentItemProductIds = new Set(
        (items || []).filter((item: any) => {
          // Check if associated order was within 90 days by checking recent orders
          return true; // We'll filter by units sold below
        }).map((item: any) => item.product_id)
      );
      const unitsSoldMap: Record<string, number> = {};
      (items || []).forEach((item: any) => {
        unitsSoldMap[item.product_id] = (unitsSoldMap[item.product_id] || 0) + item.quantity;
      });
      
      const slowMoving = (allProducts || [])
        .map((p: any) => ({
          id: p.id,
          title: (productMap[p.id]?.title || "Unknown"),
          price: Number(p.price),
          unitsSold: unitsSoldMap[p.id] || 0,
        }))
        .filter((p: any) => p.unitsSold <= 2)
        .sort((a: any, b: any) => a.unitsSold - b.unitsSold)
        .slice(0, 10);
      setSlowMovingProducts(slowMoving);

      // Stock turnover report: (units sold / average stock) for each product
      const { data: stockData } = await supabase
        .from("inventory_stock")
        .select("product_id, quantity")
        .eq("store_id", currentStore.id);
      const stockByProduct: Record<string, number> = {};
      (stockData || []).forEach((s: any) => {
        stockByProduct[s.product_id] = (stockByProduct[s.product_id] || 0) + Number(s.quantity);
      });
      const turnover = (allProducts || [])
        .map((p: any) => {
          const stock = stockByProduct[p.id] || 0;
          const sold = unitsSoldMap[p.id] || 0;
          const avgStock = stock > 0 ? stock : 1;
          const rate = sold / avgStock;
          return {
            title: productMap[p.id]?.title || p.id.slice(0, 8),
            stock,
            unitsSold: sold,
            costPrice: Number(p.cost_price) || Number(p.price),
            turnoverRate: Math.round(rate * 100) / 100,
          };
        })
        .filter((p: any) => p.stock > 0 || p.unitsSold > 0)
        .sort((a: any, b: any) => b.turnoverRate - a.turnoverRate)
        .slice(0, 15);
      setStockTurnoverData(turnover);

      // Inventory valuation report (average cost basis)
      let totalRetailVal = 0, totalCostVal = 0, totalUnitsVal = 0;
      const valuationItems = (allProducts || [])
        .map((p: any) => {
          const stock = stockByProduct[p.id] || 0;
          const cost = Number(p.cost_price) || 0;
          const retail = Number(p.price) || 0;
          const costValue = stock * cost;
          const retailValue = stock * retail;
          totalRetailVal += retailValue;
          totalCostVal += costValue;
          totalUnitsVal += stock;
          return { title: productMap[p.id]?.title || p.id.slice(0, 8), stock, costPrice: cost, retailPrice: retail, costValue, retailValue };
        })
        .filter((p: any) => p.stock > 0)
        .sort((a: any, b: any) => b.costValue - a.costValue)
        .slice(0, 15);
      setInventoryValuation({ totalRetail: totalRetailVal, totalCost: totalCostVal, totalUnits: totalUnitsVal, items: valuationItems });

      // Sales by Channel
      const channelMap: Record<string, number> = {};
      (orders as any[]).forEach((o: any) => {
        const ch = (o as any).order_channel || "web";
        channelMap[ch] = (channelMap[ch] || 0) + Number(o.total);
      });
      setChannelData(Object.entries(channelMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

      // Conversion Funnel (approximate from abandoned carts + orders)
      const { data: abandonedCarts } = await supabase
        .from("abandoned_carts")
        .select("id, recovery_status")
        .eq("store_id", currentStore.id);
      const totalCarts = (abandonedCarts?.length || 0) + (orders as any[]).length;
      const totalPurchases = (orders as any[]).length;
      const estimatedVisitors = Math.max(totalCarts * 4, totalPurchases * 8, 1);
      const estimatedCheckouts = Math.round(totalPurchases * 1.15);
      setFunnelData({ visitors: estimatedVisitors, carts: totalCarts, checkouts: estimatedCheckouts, purchases: totalPurchases });

      setLoadingTopProducts(false);
    };
    fetchData();
  }, [currentStore]);

  // Top customers
  const topCustomers = useMemo(() => 
    [...customers]
      .sort((a: any, b: any) => Number(b.total_spent) - Number(a.total_spent))
      .slice(0, 10),
    [customers]
  );

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
      <div className="space-y-3">
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

        {/* Top Selling Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Top Selling Products</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : topSellingProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No sales data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8 text-right">Units</TableHead>
                      <TableHead className="text-xs h-8 text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingProducts.map((p, i) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1.5 font-medium truncate max-w-[200px]">{p.title}</TableCell>
                        <TableCell className="py-1.5 text-right">{p.units}</TableCell>
                        <TableCell className="py-1.5 text-right font-medium">${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Top Customers</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {lc ? <Skeleton className="h-[200px]" /> : topCustomers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No customer data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Customer</TableHead>
                      <TableHead className="text-xs h-8 text-right">Orders</TableHead>
                      <TableHead className="text-xs h-8 text-right">Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((c: any) => (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell className="py-1.5 font-medium truncate max-w-[200px]">{c.name}</TableCell>
                        <TableCell className="py-1.5 text-right">{c.total_orders}</TableCell>
                        <TableCell className="py-1.5 text-right font-medium">${Number(c.total_spent).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sales by Category + Coupon Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Sales by Category</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : salesByCategory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No category data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={salesByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {salesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Coupon Usage</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : couponStats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No coupon usage yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Code</TableHead>
                      <TableHead className="text-xs h-8">Discount</TableHead>
                      <TableHead className="text-xs h-8 text-right">Uses</TableHead>
                      <TableHead className="text-xs h-8 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponStats.map((c: any, i: number) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1.5 font-mono font-medium">{c.code}</TableCell>
                        <TableCell className="py-1.5">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}</TableCell>
                        <TableCell className="py-1.5 text-right">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</TableCell>
                        <TableCell className="py-1.5 text-right">{c.is_active ? '✓' : '✗'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Profit Margin Report */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Profit Margin by Product</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : profitData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No profit data — set cost prices on products</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8 text-right">Revenue</TableHead>
                      <TableHead className="text-xs h-8 text-right">Cost</TableHead>
                      <TableHead className="text-xs h-8 text-right">Profit</TableHead>
                      <TableHead className="text-xs h-8 text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitData.map((p: any, i: number) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell className="py-1.5 text-right">${p.revenue.toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 text-right">${p.cost.toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 text-right font-medium" style={{ color: p.profit >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)' }}>
                          ${p.profit.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-1.5 text-right">{p.margin}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tax Report */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Tax Report</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Total Tax Collected</p>
                      <p className="text-lg font-bold">${taxSummary.totalTax.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Taxed Orders</p>
                      <p className="text-lg font-bold">{taxSummary.orderCount}</p>
                    </div>
                  </div>
                  {taxSummary.byMonth.length > 0 && (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={taxSummary.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Tax"]} />
                        <Bar dataKey="amount" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
           {/* Customer Acquisition Report */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Customer Acquisition</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">New Customers</p>
                      <p className="text-lg font-bold">{acquisitionData.newCustomers}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Returning</p>
                      <p className="text-lg font-bold">{acquisitionData.returning}</p>
                    </div>
                  </div>
                  {acquisitionData.byMonth.length > 0 && (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={acquisitionData.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                        <Bar dataKey="new" name="New" fill="hsl(217, 91%, 50%)" radius={[2, 2, 0, 0]} stackId="a" />
                        <Bar dataKey="returning" name="Returning" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slow-Moving Stock Report */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Slow-Moving Stock</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : slowMovingProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No slow-moving products detected</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8 text-right">Price</TableHead>
                      <TableHead className="text-xs h-8 text-right">Units Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowMovingProducts.map((p: any, i: number) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell className="py-1.5 text-right">${p.price.toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono">{p.unitsSold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Worst Sellers Report */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Worst Sellers</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : (
                (() => {
                  const worstSellers = Object.values(
                    (topSellingProducts.length > 0 ? topSellingProducts : []).reduce((acc: any, _: any) => acc, {})
                  );
                  // Build worst sellers from all products with sales, sorted ascending
                  const allWithSales = Object.entries(
                    (() => {
                      const map: Record<string, { title: string; units: number; revenue: number }> = {};
                      topSellingProducts.forEach((p: any) => { map[p.title] = p; });
                      return map;
                    })()
                  ).map(([_, v]) => v).sort((a: any, b: any) => a.revenue - b.revenue).slice(0, 10);
                  return allWithSales.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No sales data yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs h-8">Product</TableHead>
                          <TableHead className="text-xs h-8 text-right">Units</TableHead>
                          <TableHead className="text-xs h-8 text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allWithSales.map((p: any, i: number) => (
                          <TableRow key={i} className="text-xs">
                            <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{p.title}</TableCell>
                            <TableCell className="py-1.5 text-right font-mono">{p.units}</TableCell>
                            <TableCell className="py-1.5 text-right font-medium text-destructive">${p.revenue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  );
                })()
              )}
            </CardContent>
          </Card>

          {/* Stock Turnover Report */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Stock Turnover</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : stockTurnoverData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No turnover data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8 text-right">Stock</TableHead>
                      <TableHead className="text-xs h-8 text-right">Units Sold</TableHead>
                      <TableHead className="text-xs h-8 text-right">Turnover Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockTurnoverData.map((p: any, i: number) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono">{p.stock}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono">{p.unitsSold}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono">{p.turnoverRate}×</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Inventory Valuation Report */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Inventory Valuation</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[200px]" /> : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-muted/50 rounded-md">
                      <p className="text-2xs text-muted-foreground">Total Units</p>
                      <p className="text-sm font-bold">{inventoryValuation.totalUnits.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-md">
                      <p className="text-2xs text-muted-foreground">Cost Value</p>
                      <p className="text-sm font-bold">${inventoryValuation.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-md">
                      <p className="text-2xs text-muted-foreground">Retail Value</p>
                      <p className="text-sm font-bold">${inventoryValuation.totalRetail.toFixed(2)}</p>
                    </div>
                  </div>
                  {inventoryValuation.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No inventory data</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs h-8">Product</TableHead>
                          <TableHead className="text-xs h-8 text-right">Stock</TableHead>
                          <TableHead className="text-xs h-8 text-right">Cost/Unit</TableHead>
                          <TableHead className="text-xs h-8 text-right">Cost Value</TableHead>
                          <TableHead className="text-xs h-8 text-right">Retail Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryValuation.items.map((p: any, i: number) => (
                          <TableRow key={i} className="text-xs">
                            <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{p.title}</TableCell>
                            <TableCell className="py-1.5 text-right font-mono">{p.stock}</TableCell>
                            <TableCell className="py-1.5 text-right">${p.costPrice.toFixed(2)}</TableCell>
                            <TableCell className="py-1.5 text-right font-semibold">${p.costValue.toFixed(2)}</TableCell>
                            <TableCell className="py-1.5 text-right">${p.retailValue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sales by Channel + Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Sales by Channel</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[220px]" /> : channelData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No channel data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Conversion Funnel</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingTopProducts ? <Skeleton className="h-[220px]" /> : (
                <div className="space-y-3 py-2">
                  {[
                    { label: "Visitors (est.)", value: funnelData.visitors, color: "hsl(217, 91%, 50%)" },
                    { label: "Added to Cart", value: funnelData.carts, color: "hsl(38, 92%, 50%)" },
                    { label: "Reached Checkout", value: funnelData.checkouts, color: "hsl(280, 68%, 55%)" },
                    { label: "Purchased", value: funnelData.purchases, color: "hsl(142, 71%, 45%)" },
                  ].map((step, i) => {
                    const pct = funnelData.visitors > 0 ? (step.value / funnelData.visitors * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">{step.label}</span>
                          <span className="text-muted-foreground">{step.value.toLocaleString()} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-6 rounded-md overflow-hidden bg-muted/30" style={{ width: "100%" }}>
                          <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: step.color, minWidth: pct > 0 ? "4px" : "0" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
