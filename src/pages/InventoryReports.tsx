import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingDown, Package, DollarSign, AlertTriangle } from "lucide-react";

interface ProductStock {
  id: string;
  title: string;
  sku: string;
  cost_price: number;
  price: number;
  stock_quantity: number;
  last_sold_at: string | null;
  total_sold: number;
}

export default function InventoryReports() {
  const { currentStore } = useAuth();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, sku, cost_price, price, stock_quantity")
        .eq("store_id", currentStore.id)
        .eq("status", "active")
        .order("title");

      // Get order items for sales data
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, quantity, created_at")
        .in("product_id", (data || []).map((p: any) => p.id));

      const salesMap: Record<string, { total: number; lastSold: string | null }> = {};
      (orderItems || []).forEach((oi: any) => {
        if (!salesMap[oi.product_id]) salesMap[oi.product_id] = { total: 0, lastSold: null };
        salesMap[oi.product_id].total += oi.quantity;
        if (!salesMap[oi.product_id].lastSold || oi.created_at > salesMap[oi.product_id].lastSold!) {
          salesMap[oi.product_id].lastSold = oi.created_at;
        }
      });

      setProducts(
        (data || []).map((p: any) => ({
          ...p,
          cost_price: Number(p.cost_price || 0),
          price: Number(p.price || 0),
          stock_quantity: Number(p.stock_quantity || 0),
          total_sold: salesMap[p.id]?.total || 0,
          last_sold_at: salesMap[p.id]?.lastSold || null,
        }))
      );
      setLoading(false);
    };
    load();
  }, [currentStore]);

  const totalValuation = products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0);
  const totalRetail = products.reduce((s, p) => s + p.price * p.stock_quantity, 0);

  const deadStockDays = 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - deadStockDays);
  const deadStock = products.filter(
    (p) => p.stock_quantity > 0 && (!p.last_sold_at || new Date(p.last_sold_at) < cutoff)
  );

  const velocitySorted = [...products]
    .filter((p) => p.stock_quantity > 0)
    .sort((a, b) => b.total_sold - a.total_sold);

  // ABC analysis: A = top 80% revenue, B = next 15%, C = bottom 5%
  const withRevenue = products.map((p) => ({ ...p, revenue: p.total_sold * p.price }));
  const totalRevenue = withRevenue.reduce((s, p) => s + p.revenue, 0);
  const sorted = [...withRevenue].sort((a, b) => b.revenue - a.revenue);
  let cumulative = 0;
  const abcProducts = sorted.map((p) => {
    cumulative += p.revenue;
    const pct = totalRevenue > 0 ? cumulative / totalRevenue : 1;
    return { ...p, abc: pct <= 0.8 ? "A" : pct <= 0.95 ? "B" : "C" };
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Inventory Reports
          </h1>
          <p className="text-sm text-muted-foreground">Valuation, dead stock, velocity, and ABC analysis</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Cost Valuation</p>
              <p className="text-lg font-bold">${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Retail Valuation</p>
              <p className="text-lg font-bold">${totalRetail.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total SKUs</p>
              <p className="text-lg font-bold">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Dead Stock</p>
              <p className="text-lg font-bold text-destructive">{deadStock.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="valuation">
          <TabsList>
            <TabsTrigger value="valuation" className="text-xs gap-1"><DollarSign className="h-3 w-3" /> Valuation</TabsTrigger>
            <TabsTrigger value="dead" className="text-xs gap-1"><TrendingDown className="h-3 w-3" /> Dead Stock</TabsTrigger>
            <TabsTrigger value="velocity" className="text-xs gap-1"><Package className="h-3 w-3" /> Velocity</TabsTrigger>
            <TabsTrigger value="abc" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> ABC</TabsTrigger>
          </TabsList>

          <TabsContent value="valuation">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Inventory Valuation (at cost)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Skeleton className="h-40 m-4" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Product</TableHead>
                        <TableHead className="text-xs h-8">SKU</TableHead>
                        <TableHead className="text-xs h-8 text-right">Qty</TableHead>
                        <TableHead className="text-xs h-8 text-right">Cost</TableHead>
                        <TableHead className="text-xs h-8 text-right">Total Value</TableHead>
                        <TableHead className="text-xs h-8 text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.filter(p => p.stock_quantity > 0).sort((a, b) => (b.cost_price * b.stock_quantity) - (a.cost_price * a.stock_quantity)).map((p) => (
                        <TableRow key={p.id} className="text-xs">
                          <TableCell className="py-2 max-w-[200px] truncate">{p.title}</TableCell>
                          <TableCell className="py-2 font-mono text-muted-foreground">{p.sku || "—"}</TableCell>
                          <TableCell className="py-2 text-right">{p.stock_quantity}</TableCell>
                          <TableCell className="py-2 text-right">${p.cost_price.toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-right font-medium">${(p.cost_price * p.stock_quantity).toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-right">
                            {p.cost_price > 0 ? `${(((p.price - p.cost_price) / p.price) * 100).toFixed(0)}%` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dead">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dead Stock (no sales in {deadStockDays} days)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Skeleton className="h-40 m-4" /> : deadStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No dead stock found 🎉</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Product</TableHead>
                        <TableHead className="text-xs h-8">SKU</TableHead>
                        <TableHead className="text-xs h-8 text-right">Qty on Hand</TableHead>
                        <TableHead className="text-xs h-8 text-right">Value (cost)</TableHead>
                        <TableHead className="text-xs h-8">Last Sold</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deadStock.sort((a, b) => (b.cost_price * b.stock_quantity) - (a.cost_price * a.stock_quantity)).map((p) => (
                        <TableRow key={p.id} className="text-xs">
                          <TableCell className="py-2 max-w-[200px] truncate">{p.title}</TableCell>
                          <TableCell className="py-2 font-mono text-muted-foreground">{p.sku || "—"}</TableCell>
                          <TableCell className="py-2 text-right">{p.stock_quantity}</TableCell>
                          <TableCell className="py-2 text-right text-destructive font-medium">${(p.cost_price * p.stock_quantity).toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{p.last_sold_at ? new Date(p.last_sold_at).toLocaleDateString() : "Never"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="velocity">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stock Velocity (units sold, all time)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Skeleton className="h-40 m-4" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">#</TableHead>
                        <TableHead className="text-xs h-8">Product</TableHead>
                        <TableHead className="text-xs h-8 text-right">Units Sold</TableHead>
                        <TableHead className="text-xs h-8 text-right">On Hand</TableHead>
                        <TableHead className="text-xs h-8 text-right">Days of Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {velocitySorted.slice(0, 50).map((p, i) => {
                        const avgDaily = p.total_sold / 365; // rough estimate
                        const daysOfStock = avgDaily > 0 ? Math.round(p.stock_quantity / avgDaily) : Infinity;
                        return (
                          <TableRow key={p.id} className="text-xs">
                            <TableCell className="py-2 text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="py-2 max-w-[200px] truncate">{p.title}</TableCell>
                            <TableCell className="py-2 text-right font-medium">{p.total_sold}</TableCell>
                            <TableCell className="py-2 text-right">{p.stock_quantity}</TableCell>
                            <TableCell className="py-2 text-right">
                              {daysOfStock === Infinity ? "∞" : (
                                <span className={daysOfStock < 14 ? "text-destructive font-medium" : daysOfStock < 30 ? "text-amber-600" : ""}>
                                  {daysOfStock}d
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abc">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ABC Analysis (revenue contribution)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Skeleton className="h-40 m-4" /> : (
                  <>
                    <div className="flex gap-4 px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-primary text-primary-foreground text-[10px]">A</Badge>
                        <span className="text-muted-foreground">Top 80% revenue ({abcProducts.filter(p => p.abc === "A").length} items)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">B</Badge>
                        <span className="text-muted-foreground">Next 15% ({abcProducts.filter(p => p.abc === "B").length} items)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">C</Badge>
                        <span className="text-muted-foreground">Bottom 5% ({abcProducts.filter(p => p.abc === "C").length} items)</span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs h-8 w-12">Class</TableHead>
                          <TableHead className="text-xs h-8">Product</TableHead>
                          <TableHead className="text-xs h-8 text-right">Revenue</TableHead>
                          <TableHead className="text-xs h-8 text-right">Units Sold</TableHead>
                          <TableHead className="text-xs h-8 text-right">On Hand</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {abcProducts.slice(0, 50).map((p) => (
                          <TableRow key={p.id} className="text-xs">
                            <TableCell className="py-2">
                              <Badge variant={p.abc === "A" ? "default" : p.abc === "B" ? "secondary" : "outline"} className="text-[10px]">
                                {p.abc}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 max-w-[200px] truncate">{p.title}</TableCell>
                            <TableCell className="py-2 text-right font-medium">${p.revenue.toFixed(2)}</TableCell>
                            <TableCell className="py-2 text-right">{p.total_sold}</TableCell>
                            <TableCell className="py-2 text-right">{p.stock_quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
