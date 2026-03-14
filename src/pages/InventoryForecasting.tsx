import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, AlertTriangle, Package, Calendar, Search, ArrowUpDown } from "lucide-react";
import { TablePagination } from "@/components/admin/TablePagination";

export default function InventoryForecasting() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<"days_of_stock" | "avg_daily_sales">("days_of_stock");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: products = [] } = useQuery({
    queryKey: ["products-forecast", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, sku, stock_on_hand").eq("store_id", storeId!).eq("track_inventory", true).order("title");
      return data || [];
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items-forecast", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("order_items").select("product_id, quantity, orders!inner(created_at, store_id)").eq("orders.store_id", storeId!).gte("orders.created_at", thirtyDaysAgo);
      return data || [];
    },
  });

  const forecasts = useMemo(() => {
    const salesByProduct: Record<string, number> = {};
    orderItems.forEach((item: any) => {
      salesByProduct[item.product_id] = (salesByProduct[item.product_id] || 0) + item.quantity;
    });

    return products.map((p: any) => {
      const totalSold30d = salesByProduct[p.id] || 0;
      const avgDaily = totalSold30d / 30;
      const stock = p.stock_on_hand || 0;
      const daysOfStock = avgDaily > 0 ? Math.round(stock / avgDaily) : stock > 0 ? 999 : 0;
      const suggestedReorder = Math.max(0, Math.ceil(avgDaily * 30) - stock);
      const reorderDate = avgDaily > 0 ? new Date(Date.now() + (Math.max(0, daysOfStock - 7)) * 86400000) : null;

      return {
        ...p,
        totalSold30d,
        avgDaily: Math.round(avgDaily * 100) / 100,
        daysOfStock,
        suggestedReorder,
        reorderDate,
        risk: daysOfStock === 0 ? "out" : daysOfStock <= 7 ? "critical" : daysOfStock <= 14 ? "low" : daysOfStock <= 30 ? "medium" : "healthy",
      };
    });
  }, [products, orderItems]);

  const filtered = forecasts.filter(f => !search || f.title?.toLowerCase().includes(search.toLowerCase()) || f.sku?.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    const av = sortField === "days_of_stock" ? a.daysOfStock : a.avgDaily;
    const bv = sortField === "days_of_stock" ? b.daysOfStock : b.avgDaily;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const outOfStock = forecasts.filter(f => f.risk === "out").length;
  const critical = forecasts.filter(f => f.risk === "critical").length;
  const low = forecasts.filter(f => f.risk === "low").length;

  const riskBadge = (risk: string) => {
    switch (risk) {
      case "out": return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
      case "critical": return <Badge className="bg-red-500/10 text-red-600 border-red-200 text-xs">Critical ≤7d</Badge>;
      case "low": return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 text-xs">Low ≤14d</Badge>;
      case "medium": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 text-xs">Medium ≤30d</Badge>;
      default: return <Badge variant="secondary" className="text-xs">Healthy</Badge>;
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory Forecasting</h1>
          <p className="text-sm text-muted-foreground">Demand prediction & reorder suggestions based on 30-day sales velocity</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-xl font-bold text-destructive">{outOfStock}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Critical (≤7 days)</p>
              <p className="text-xl font-bold text-red-500">{critical}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">Low (≤14 days)</p>
              <p className="text-xl font-bold text-orange-500">{low}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Tracked Products</p>
              <p className="text-xl font-bold">{forecasts.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Demand Forecast</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("avg_daily_sales")}>
                    <div className="flex items-center gap-1">Avg/Day <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>30d Sold</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("days_of_stock")}>
                    <div className="flex items-center gap-1">Days Left <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Suggested Reorder</TableHead>
                  <TableHead>Reorder By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{f.title}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{f.sku || "—"}</TableCell>
                    <TableCell className="font-medium">{f.stock_on_hand || 0}</TableCell>
                    <TableCell className="text-sm">{f.avgDaily}</TableCell>
                    <TableCell className="text-sm">{f.totalSold30d}</TableCell>
                    <TableCell className="font-medium">{f.daysOfStock >= 999 ? "∞" : f.daysOfStock}</TableCell>
                    <TableCell>{riskBadge(f.risk)}</TableCell>
                    <TableCell>
                      {f.suggestedReorder > 0 ? (
                        <span className="text-sm font-medium text-primary">{f.suggestedReorder} units</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {f.reorderDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {f.reorderDate.toLocaleDateString()}
                        </div>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No inventory-tracked products</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
