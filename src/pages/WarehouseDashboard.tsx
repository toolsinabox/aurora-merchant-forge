import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/use-data";
import { Package, Truck, CheckCircle, Clock, AlertTriangle, Box, Plus, Trash2, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

interface WarehouseStats {
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  itemsToPick: number;
  recentShipments: any[];
  lowStockProducts: any[];
}

export default function WarehouseDashboard() {
  const { currentStore } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const [stats, setStats] = useState<WarehouseStats>({
    pendingOrders: 0, processingOrders: 0, shippedOrders: 0,
    itemsToPick: 0, recentShipments: [], lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    const fetchStats = async () => {
      setLoading(true);

      // Recent shipments
      const { data: shipments } = await supabase
        .from("order_shipments")
        .select("*, orders:order_id(order_number)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Low stock products
      const { data: products } = await supabase
        .from("products")
        .select("id, title, sku, images")
        .eq("store_id", currentStore.id)
        .eq("track_inventory", true)
        .eq("status", "active");

      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id, stock")
        .eq("store_id", currentStore.id);

      const stockByProduct: Record<string, number> = {};
      (variants || []).forEach((v: any) => {
        stockByProduct[v.product_id] = (stockByProduct[v.product_id] || 0) + (v.stock || 0);
      });

      const lowStock = (products || [])
        .map((p: any) => ({ ...p, totalStock: stockByProduct[p.id] || 0 }))
        .filter((p: any) => p.totalStock <= 5)
        .sort((a: any, b: any) => a.totalStock - b.totalStock)
        .slice(0, 10);

      setStats(prev => ({
        ...prev,
        recentShipments: shipments || [],
        lowStockProducts: lowStock,
      }));
      setLoading(false);
    };
    fetchStats();
  }, [currentStore]);

  // Compute order stats from orders data
  const orderStats = useMemo(() => {
    const pending = orders.filter((o: any) => o.fulfillment_status === "unfulfilled" && o.status !== "cancelled");
    const processing = orders.filter((o: any) => o.status === "processing");
    const shipped = orders.filter((o: any) => o.fulfillment_status === "fulfilled");
    const itemsToPick = pending.reduce((s: number, o: any) => s + (o.items_count || 0), 0);

    // SLA: average hours from order creation to first shipment (for fulfilled orders)
    const fulfilledWithDates = orders.filter((o: any) => o.fulfillment_status === "fulfilled" && o.created_at && o.shipped_at);
    const slaHours = fulfilledWithDates.map((o: any) => {
      const created = new Date(o.created_at).getTime();
      const shipped = new Date(o.shipped_at).getTime();
      return (shipped - created) / 3600000;
    });
    const avgSlaHours = slaHours.length > 0 ? slaHours.reduce((s, h) => s + h, 0) / slaHours.length : 0;
    const slaTarget = 48; // 48-hour target
    const withinSla = slaHours.filter(h => h <= slaTarget).length;
    const slaPercent = slaHours.length > 0 ? (withinSla / slaHours.length) * 100 : 0;

    return {
      pendingOrders: pending.length,
      processingOrders: processing.length,
      shippedOrders: shipped.length,
      itemsToPick,
      avgSlaHours,
      slaPercent,
      slaTarget,
    };
  }, [orders]);

  const isFullLoading = isLoading || loading;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Warehouse Dashboard</h1>
          <p className="text-xs text-muted-foreground">Overview of pending picks, packs, and dispatches</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Awaiting Pick</p>
                {isFullLoading ? <Skeleton className="h-5 w-10 mt-0.5" /> : <p className="text-lg font-bold">{orderStats.pendingOrders}</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Items to Pick</p>
                {isFullLoading ? <Skeleton className="h-5 w-10 mt-0.5" /> : <p className="text-lg font-bold">{orderStats.itemsToPick}</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processing</p>
                {isFullLoading ? <Skeleton className="h-5 w-10 mt-0.5" /> : <p className="text-lg font-bold">{orderStats.processingOrders}</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shipped</p>
                {isFullLoading ? <Skeleton className="h-5 w-10 mt-0.5" /> : <p className="text-lg font-bold">{orderStats.shippedOrders}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fulfillment SLA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Fulfillment Time</p>
              {isFullLoading ? <Skeleton className="h-5 w-20" /> : (
                <p className="text-lg font-bold">{orderStats.avgSlaHours > 0 ? `${orderStats.avgSlaHours.toFixed(1)}h` : "—"}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">SLA Target</p>
              <p className="text-lg font-bold">{orderStats.slaTarget}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Within SLA</p>
              {isFullLoading ? <Skeleton className="h-5 w-20" /> : (
                <p className={`text-lg font-bold ${orderStats.slaPercent >= 90 ? "text-green-600" : orderStats.slaPercent >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {orderStats.slaPercent > 0 ? `${orderStats.slaPercent.toFixed(0)}%` : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Shipments */}
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Recent Shipments</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Order</TableHead>
                    <TableHead className="text-xs h-8">Tracking</TableHead>
                    <TableHead className="text-xs h-8">Status</TableHead>
                    <TableHead className="text-xs h-8">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFullLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : stats.recentShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                        <Truck className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
                        No shipments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.recentShipments.map((s: any) => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell className="py-1.5 font-mono">{(s.orders as any)?.order_number || "—"}</TableCell>
                        <TableCell className="py-1.5 font-mono text-muted-foreground">{s.tracking_number || "—"}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant={s.status === "delivered" ? "default" : "secondary"} className="text-[10px]">
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-muted-foreground">
                          {format(new Date(s.created_at), "MMM d")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Product</TableHead>
                    <TableHead className="text-xs h-8">SKU</TableHead>
                    <TableHead className="text-xs h-8 text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFullLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : stats.lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6">
                        <Box className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
                        No low stock items
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.lowStockProducts.map((p: any) => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="py-1.5 font-medium max-w-[180px] truncate">{p.title}</TableCell>
                        <TableCell className="py-1.5 font-mono text-muted-foreground">{p.sku || "—"}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Badge variant={p.totalStock === 0 ? "destructive" : "secondary"} className="text-[10px]">
                            {p.totalStock}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
