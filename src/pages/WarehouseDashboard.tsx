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
import { Package, Truck, CheckCircle, Clock, AlertTriangle, Box, Plus, Trash2, MapPin, ChevronRight } from "lucide-react";
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

        {/* Cross-Docking Queue */}
        <CrossDockingCard />

        {/* Putaway Rules */}
        <PutawayRulesCard />
      </div>
    </AdminLayout>
  );
}

function CrossDockingCard() {
  const { currentStore } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; po_number: string; product: string; sku: string; qty: number; destination_order: string; status: string; created_at: string }>>([]);
  const [form, setForm] = useState({ po_number: "", product: "", sku: "", qty: "1", destination_order: "" });

  useEffect(() => {
    if (!currentStore) return;
    try { setItems(JSON.parse(localStorage.getItem(`crossdock_${currentStore.id}`) || "[]")); } catch {}
  }, [currentStore]);

  const save = (updated: typeof items) => {
    setItems(updated);
    if (currentStore) localStorage.setItem(`crossdock_${currentStore.id}`, JSON.stringify(updated));
  };

  const addItem = () => {
    if (!form.product.trim() || !form.destination_order.trim()) { toast.error("Product and destination order required"); return; }
    save([...items, {
      id: crypto.randomUUID(),
      po_number: form.po_number,
      product: form.product,
      sku: form.sku,
      qty: Number(form.qty) || 1,
      destination_order: form.destination_order,
      status: "pending",
      created_at: new Date().toISOString(),
    }]);
    setForm({ po_number: "", product: "", sku: "", qty: "1", destination_order: "" });
    toast.success("Cross-dock item queued");
  };

  const markDispatched = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, status: "dispatched" } : i));
    toast.success("Item marked as dispatched");
  };

  const pending = items.filter(i => i.status === "pending");
  const dispatched = items.filter(i => i.status === "dispatched");

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ChevronRight className="h-4 w-4" /> Cross-Docking Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Route incoming goods directly to outbound orders without shelving. Items bypass putaway and go straight to dispatch.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Input placeholder="PO Number" value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} className="h-8 text-xs" />
          <Input placeholder="Product name *" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="h-8 text-xs" />
          <Input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="h-8 text-xs" />
          <Input type="number" min="1" placeholder="Qty" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} className="h-8 text-xs" />
          <Input placeholder="Dest. Order # *" value={form.destination_order} onChange={e => setForm({ ...form, destination_order: e.target.value })} className="h-8 text-xs" />
        </div>
        <Button size="sm" className="text-xs h-7" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Queue Cross-Dock</Button>

        {pending.length > 0 && (
          <>
            <p className="text-xs font-medium mt-2">Pending ({pending.length})</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">PO</TableHead>
                  <TableHead className="text-xs h-8">Product</TableHead>
                  <TableHead className="text-xs h-8">SKU</TableHead>
                  <TableHead className="text-xs h-8">Qty</TableHead>
                  <TableHead className="text-xs h-8">Dest. Order</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(i => (
                  <TableRow key={i.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{i.po_number || "—"}</TableCell>
                    <TableCell className="py-1.5 font-medium">{i.product}</TableCell>
                    <TableCell className="py-1.5 font-mono text-muted-foreground">{i.sku || "—"}</TableCell>
                    <TableCell className="py-1.5">{i.qty}</TableCell>
                    <TableCell className="py-1.5 font-mono">{i.destination_order}</TableCell>
                    <TableCell className="py-1.5 text-right space-x-1">
                      <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => markDispatched(i.id)}>
                        <Truck className="h-3 w-3 mr-1" /> Dispatch
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => save(items.filter(x => x.id !== i.id))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {dispatched.length > 0 && (
          <>
            <p className="text-xs font-medium mt-2 text-muted-foreground">Recently Dispatched ({dispatched.length})</p>
            <div className="space-y-1">
              {dispatched.slice(0, 5).map(i => (
                <div key={i.id} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                  <span>{i.product} × {i.qty} → Order {i.destination_order}</span>
                  <Badge variant="outline" className="text-[10px]">dispatched</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface PutawayRule {
  id: string;
  category: string;
  zone: string;
  aisle: string;
  shelf: string;
  priority: number;
  is_active: boolean;
}

function PutawayRulesCard() {
  const { currentStore } = useAuth();
  const [rules, setRules] = useState<PutawayRule[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", zone: "A", aisle: "1", shelf: "01" });

  useEffect(() => {
    if (!currentStore) return;
    try {
      setRules(JSON.parse(localStorage.getItem(`putaway_rules_${currentStore.id}`) || "[]"));
    } catch {}
  }, [currentStore]);

  const save = (updated: PutawayRule[]) => {
    setRules(updated);
    if (currentStore) localStorage.setItem(`putaway_rules_${currentStore.id}`, JSON.stringify(updated));
  };

  const addRule = () => {
    if (!form.category.trim()) { toast.error("Category/keyword required"); return; }
    const binSuggestion = `${form.zone}-${form.aisle}-${form.shelf}`;
    save([...rules, {
      id: crypto.randomUUID(),
      category: form.category,
      zone: form.zone,
      aisle: form.aisle,
      shelf: form.shelf,
      priority: rules.length + 1,
      is_active: true,
    }]);
    setForm({ category: "", zone: "A", aisle: "1", shelf: "01" });
    toast.success(`Putaway rule added → Bin ${binSuggestion}`);
    setOpen(false);
  };

  const toggleActive = (id: string) => {
    save(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  };

  const deleteRule = (id: string) => {
    save(rules.filter(r => r.id !== id));
    toast.success("Rule removed");
  };

  const suggestBin = (productCategory: string): string => {
    const match = rules.find(r => r.is_active && productCategory.toLowerCase().includes(r.category.toLowerCase()));
    return match ? `${match.zone}-${match.aisle}-${match.shelf}` : "Unassigned";
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Putaway Rules
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" /> Add Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-sm">New Putaway Rule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Product Category / Keyword</Label>
                <Input placeholder="e.g. Electronics, Fragile, Heavy" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="h-8 text-sm" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Matches product category or tags containing this keyword</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Zone</Label>
                  <Select value={form.zone} onValueChange={v => setForm({ ...form, zone: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E", "F"].map(z => <SelectItem key={z} value={z} className="text-xs">Zone {z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Aisle</Label>
                  <Select value={form.aisle} onValueChange={v => setForm({ ...form, aisle: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4", "5", "6", "7", "8"].map(a => <SelectItem key={a} value={a} className="text-xs">Aisle {a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Shelf</Label>
                  <Input placeholder="01" value={form.shelf} onChange={e => setForm({ ...form, shelf: e.target.value })} className="h-8 text-xs" />
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-xs">
                <span className="text-muted-foreground">Suggested Bin: </span>
                <span className="font-mono font-medium">{form.zone}-{form.aisle}-{form.shelf}</span>
              </div>
              <Button size="sm" className="w-full text-xs" onClick={addRule}>Add Putaway Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {rules.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-6">
            <MapPin className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
            No putaway rules configured. Add rules to auto-suggest bin locations for incoming inventory.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">Category/Keyword</TableHead>
                <TableHead className="text-xs h-8">Suggested Bin</TableHead>
                <TableHead className="text-xs h-8">Active</TableHead>
                <TableHead className="text-xs h-8 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(r => (
                <TableRow key={r.id} className="text-xs">
                  <TableCell className="py-1.5 font-medium">{r.category}</TableCell>
                  <TableCell className="py-1.5 font-mono">{r.zone}-{r.aisle}-{r.shelf}</TableCell>
                  <TableCell className="py-1.5">
                    <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r.id)} className="scale-75" />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRule(r.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
