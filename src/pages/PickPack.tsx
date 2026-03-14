import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrders } from "@/hooks/use-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, CheckCircle, Truck, Search, ArrowRight, ScanLine, Layers, Copy, MapPin, BoxIcon, Plus, Trash2 } from "lucide-react";
import { BarcodeScanner } from "@/components/admin/BarcodeScanner";

type WorkflowStep = "pick" | "batch" | "pack" | "ship" | "waves" | "zones" | "cartons";

interface PickWave {
  id: string;
  name: string;
  orderIds: string[];
  createdAt: string;
  status: "open" | "in_progress" | "completed";
}

interface WarehouseZone {
  id: string;
  name: string;
  description: string;
  assignedPicker: string;
  binPrefixes: string[];
}

interface CartonType {
  id: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  maxWeightKg: number;
}

export default function PickPack() {
  const { currentStore } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const qc = useQueryClient();
  const [step, setStep] = useState<WorkflowStep>("pick");
  const [search, setSearch] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Wave picking state
  const [waves, setWaves] = useState<PickWave[]>(() => {
    try { return JSON.parse(localStorage.getItem("pick_waves") || "[]"); } catch { return []; }
  });
  const [waveSelectedOrders, setWaveSelectedOrders] = useState<Record<string, boolean>>({});
  const [waveName, setWaveName] = useState("");

  // Zone state
  const [zones, setZones] = useState<WarehouseZone[]>(() => {
    try { return JSON.parse(localStorage.getItem("warehouse_zones") || "[]"); } catch { return []; }
  });
  const [zoneForm, setZoneForm] = useState({ name: "", description: "", assignedPicker: "", binPrefixes: "" });

  const saveZones = (updated: WarehouseZone[]) => { setZones(updated); localStorage.setItem("warehouse_zones", JSON.stringify(updated)); };
  const addZone = () => {
    if (!zoneForm.name.trim()) { toast.error("Zone name required"); return; }
    const zone: WarehouseZone = { id: crypto.randomUUID(), name: zoneForm.name.trim(), description: zoneForm.description, assignedPicker: zoneForm.assignedPicker, binPrefixes: zoneForm.binPrefixes.split(",").map(s => s.trim()).filter(Boolean) };
    saveZones([...zones, zone]);
    setZoneForm({ name: "", description: "", assignedPicker: "", binPrefixes: "" });
    toast.success(`Zone "${zone.name}" created`);
  };
  const deleteZone = (id: string) => { saveZones(zones.filter(z => z.id !== id)); toast.success("Zone deleted"); };

  // Carton state
  const [cartons, setCartons] = useState<CartonType[]>(() => {
    try { return JSON.parse(localStorage.getItem("carton_types") || "[]"); } catch { return []; }
  });
  const [cartonForm, setCartonForm] = useState({ name: "", lengthCm: "", widthCm: "", heightCm: "", maxWeightKg: "" });

  const saveCartons = (updated: CartonType[]) => { setCartons(updated); localStorage.setItem("carton_types", JSON.stringify(updated)); };
  const addCarton = () => {
    if (!cartonForm.name.trim()) { toast.error("Carton name required"); return; }
    const c: CartonType = { id: crypto.randomUUID(), name: cartonForm.name.trim(), lengthCm: Number(cartonForm.lengthCm) || 0, widthCm: Number(cartonForm.widthCm) || 0, heightCm: Number(cartonForm.heightCm) || 0, maxWeightKg: Number(cartonForm.maxWeightKg) || 0 };
    saveCartons([...cartons, c]);
    setCartonForm({ name: "", lengthCm: "", widthCm: "", heightCm: "", maxWeightKg: "" });
    toast.success(`Carton "${c.name}" added`);
  };
  const deleteCarton = (id: string) => { saveCartons(cartons.filter(c => c.id !== id)); toast.success("Carton deleted"); };

  const saveWaves = (updated: PickWave[]) => {
    setWaves(updated);
    localStorage.setItem("pick_waves", JSON.stringify(updated));
  };

  const createWave = () => {
    const selectedIds = Object.entries(waveSelectedOrders).filter(([, v]) => v).map(([k]) => k);
    if (selectedIds.length === 0) { toast.error("Select orders for the wave"); return; }
    const name = waveName.trim() || `Wave ${waves.length + 1}`;
    const wave: PickWave = { id: crypto.randomUUID(), name, orderIds: selectedIds, createdAt: new Date().toISOString(), status: "open" };
    saveWaves([...waves, wave]);
    setWaveSelectedOrders({});
    setWaveName("");
    toast.success(`${name} created with ${selectedIds.length} orders`);
  };

  const updateWaveStatus = (waveId: string, status: PickWave["status"]) => {
    saveWaves(waves.map(w => w.id === waveId ? { ...w, status } : w));
    toast.success(`Wave updated to ${status}`);
  };

  const deleteWave = (waveId: string) => {
    saveWaves(waves.filter(w => w.id !== waveId));
    toast.success("Wave deleted");
  };

  // Get order items for unfulfilled orders
  const pendingOrders = useMemo(() =>
    orders.filter((o: any) =>
      o.fulfillment_status === "unfulfilled" && o.status !== "cancelled"
    ).filter((o: any) =>
      !search || o.order_number?.toLowerCase().includes(search.toLowerCase())
    ), [orders, search]);

  const processingOrders = useMemo(() =>
    orders.filter((o: any) => o.status === "processing")
      .filter((o: any) => !search || o.order_number?.toLowerCase().includes(search.toLowerCase())),
    [orders, search]);

  const { data: orderItems = [] } = useQuery({
    queryKey: ["pick-pack-items", currentStore?.id],
    enabled: !!currentStore,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*, orders:order_id(order_number, fulfillment_status, status)")
        .eq("store_id", currentStore!.id);
      return data || [];
    },
  });

  // Pick path optimization: sort by bin location for optimal warehouse walking route
  const [pickPathOptimized, setPickPathOptimized] = useState(false);

  const pickItems = useMemo(() => {
    const unfulfilledOrderIds = new Set(pendingOrders.map((o: any) => o.id));
    const items = orderItems.filter((item: any) => unfulfilledOrderIds.has(item.order_id));
    if (pickPathOptimized) {
      return [...items].sort((a: any, b: any) => {
        const binA = (a.bin_location || a.sku || "ZZZ").toLowerCase();
        const binB = (b.bin_location || b.sku || "ZZZ").toLowerCase();
        return binA.localeCompare(binB);
      });
    }
    return items;
  }, [orderItems, pendingOrders, pickPathOptimized]);

  // Batch picking: group by SKU across all orders
  const batchPickItems = useMemo(() => {
    const skuMap = new Map<string, { sku: string; title: string; totalQty: number; orderCount: number; orders: string[] }>();
    for (const item of pickItems) {
      const key = (item as any).sku || (item as any).product_id;
      const existing = skuMap.get(key);
      const orderNum = ((item as any).orders as any)?.order_number || "—";
      if (existing) {
        existing.totalQty += (item as any).quantity;
        if (!existing.orders.includes(orderNum)) {
          existing.orders.push(orderNum);
          existing.orderCount++;
        }
      } else {
        skuMap.set(key, { sku: (item as any).sku || "—", title: (item as any).title, totalQty: (item as any).quantity, orderCount: 1, orders: [orderNum] });
      }
    }
    return Array.from(skuMap.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [pickItems]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const markAsPacked = async () => {
    const orderIds = [...new Set(pickItems.filter((item: any) => checkedItems[item.id]).map((item: any) => item.order_id))];
    for (const orderId of orderIds) {
      await supabase.from("orders").update({ status: "processing" } as any).eq("id", orderId);
    }
    toast.success(`${orderIds.length} order(s) moved to packing`);
    setCheckedItems({});
    qc.invalidateQueries({ queryKey: ["orders"] });
    setStep("pack");
  };

  const markAsShipped = async (orderId: string) => {
    await supabase.from("orders").update({ fulfillment_status: "fulfilled", status: "shipped" } as any).eq("id", orderId);
    toast.success("Order marked as shipped");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Pick & Pack</h1>
          <p className="text-xs text-muted-foreground">Guided workflow: Pick → Pack → Ship</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["pick", "batch", "pack", "ship", "waves", "zones", "cartons"] as WorkflowStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              <Button
                variant={step === s ? "default" : "outline"}
                size="sm"
                className="text-xs capitalize"
                onClick={() => setStep(s)}
              >
                {s === "pick" && <Package className="h-3 w-3 mr-1" />}
                {s === "batch" && <Copy className="h-3 w-3 mr-1" />}
                {s === "pack" && <CheckCircle className="h-3 w-3 mr-1" />}
                {s === "ship" && <Truck className="h-3 w-3 mr-1" />}
                {s === "waves" && <Layers className="h-3 w-3 mr-1" />}
                {s === "zones" && <MapPin className="h-3 w-3 mr-1" />}
                {s === "cartons" && <BoxIcon className="h-3 w-3 mr-1" />}
                {s === "batch" ? "Batch Pick" : s === "waves" ? "Waves" : s === "zones" ? "Zones" : s === "cartons" ? "Cartons" : s}
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {s === "pick" ? pendingOrders.length : s === "batch" ? batchPickItems.length : s === "pack" ? processingOrders.length : s === "waves" ? waves.filter(w => w.status !== "completed").length : s === "zones" ? zones.length : s === "cartons" ? cartons.length : 0}
                </Badge>
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by order number..." value={search}
              onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
          <BarcodeScanner
            placeholder="Scan barcode to auto-check item..."
            autoFocus={false}
            onScan={(barcode) => {
              // Find matching item by SKU and auto-check it
              const match = pickItems.find((item: any) => item.sku === barcode);
              if (match) {
                setCheckedItems(prev => ({ ...prev, [match.id]: true }));
                toast.success(`Picked: ${match.title} (${barcode})`);
              } else {
                toast.error(`No matching item for barcode: ${barcode}`);
              }
            }}
          />
        </div>

        {/* Pick Step */}
        {step === "pick" && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Pick Items ({pickItems.length} items from {pendingOrders.length} orders)
                {checkedCount > 0 && (
                  <Button size="sm" className="text-xs" onClick={markAsPacked}>
                    Mark {checkedCount} Picked → Pack
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8 w-8"></TableHead>
                    <TableHead className="text-xs h-8">Order</TableHead>
                    <TableHead className="text-xs h-8">Product</TableHead>
                    <TableHead className="text-xs h-8">SKU</TableHead>
                    <TableHead className="text-xs h-8 text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : pickItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                        No items to pick
                      </TableCell>
                    </TableRow>
                  ) : (
                    pickItems.map((item: any) => (
                      <TableRow key={item.id} className={`text-xs ${checkedItems[item.id] ? "bg-primary/5" : ""}`}>
                        <TableCell className="py-1.5">
                          <Checkbox checked={!!checkedItems[item.id]} onCheckedChange={() => toggleItem(item.id)} />
                        </TableCell>
                        <TableCell className="py-1.5 font-mono">{(item.orders as any)?.order_number || "—"}</TableCell>
                        <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{item.title}</TableCell>
                        <TableCell className="py-1.5 font-mono text-muted-foreground">{item.sku || "—"}</TableCell>
                        <TableCell className="py-1.5 text-right font-semibold">{item.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Batch Pick Step */}
        {step === "batch" && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Batch Pick — {batchPickItems.length} unique SKUs across {pendingOrders.length} orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">SKU</TableHead>
                    <TableHead className="text-xs h-8">Product</TableHead>
                    <TableHead className="text-xs h-8 text-right">Total Qty</TableHead>
                    <TableHead className="text-xs h-8 text-right">Orders</TableHead>
                    <TableHead className="text-xs h-8">Order #s</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchPickItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No items to batch pick</TableCell>
                    </TableRow>
                  ) : batchPickItems.map((item, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="py-1.5 font-mono text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{item.title}</TableCell>
                      <TableCell className="py-1.5 text-right font-bold text-primary">{item.totalQty}</TableCell>
                      <TableCell className="py-1.5 text-right">{item.orderCount}</TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex flex-wrap gap-1">
                          {item.orders.slice(0, 5).map(o => (
                            <Badge key={o} variant="outline" className="text-[10px]">{o}</Badge>
                          ))}
                          {item.orders.length > 5 && <Badge variant="secondary" className="text-[10px]">+{item.orders.length - 5}</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pack Step */}
        {step === "pack" && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Pack Orders ({processingOrders.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Order #</TableHead>
                    <TableHead className="text-xs h-8">Items</TableHead>
                    <TableHead className="text-xs h-8">Total</TableHead>
                    <TableHead className="text-xs h-8 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                        No orders to pack
                      </TableCell>
                    </TableRow>
                  ) : (
                    processingOrders.map((o: any) => (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell className="py-1.5 font-mono">{o.order_number}</TableCell>
                        <TableCell className="py-1.5">{o.items_count} items</TableCell>
                        <TableCell className="py-1.5">${Number(o.total).toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => markAsShipped(o.id)}>
                            <Truck className="h-3 w-3 mr-1" /> Ship
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Ship Step */}
        {step === "ship" && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Manage shipments from individual order detail pages. Use the Pack step to mark orders as shipped.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Waves Step */}
        {step === "waves" && (
          <div className="space-y-3">
            {/* Create wave */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Create Pick Wave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Wave name (optional)" value={waveName} onChange={e => setWaveName(e.target.value)} className="h-8 text-sm max-w-xs" />
                  <Button size="sm" className="text-xs" onClick={createWave} disabled={Object.values(waveSelectedOrders).filter(Boolean).length === 0}>
                    Create Wave ({Object.values(waveSelectedOrders).filter(Boolean).length} orders)
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8 w-8"></TableHead>
                      <TableHead className="text-xs h-8">Order #</TableHead>
                      <TableHead className="text-xs h-8">Items</TableHead>
                      <TableHead className="text-xs h-8 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No unfulfilled orders</TableCell></TableRow>
                    ) : pendingOrders.map((o: any) => (
                      <TableRow key={o.id} className={`text-xs ${waveSelectedOrders[o.id] ? "bg-primary/5" : ""}`}>
                        <TableCell className="py-1.5">
                          <Checkbox checked={!!waveSelectedOrders[o.id]} onCheckedChange={() => setWaveSelectedOrders(prev => ({ ...prev, [o.id]: !prev[o.id] }))} />
                        </TableCell>
                        <TableCell className="py-1.5 font-mono">{o.order_number}</TableCell>
                        <TableCell className="py-1.5">{o.items_count} items</TableCell>
                        <TableCell className="py-1.5 text-right">${Number(o.total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Existing waves */}
            {waves.length > 0 && (
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Pick Waves ({waves.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Wave</TableHead>
                        <TableHead className="text-xs h-8">Orders</TableHead>
                        <TableHead className="text-xs h-8">Created</TableHead>
                        <TableHead className="text-xs h-8">Status</TableHead>
                        <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waves.map(w => (
                        <TableRow key={w.id} className="text-xs">
                          <TableCell className="py-1.5 font-medium">{w.name}</TableCell>
                          <TableCell className="py-1.5">{w.orderIds.length}</TableCell>
                          <TableCell className="py-1.5">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant={w.status === "completed" ? "default" : w.status === "in_progress" ? "secondary" : "outline"} className="text-[10px]">
                              {w.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5 text-right space-x-1">
                            {w.status === "open" && <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => updateWaveStatus(w.id, "in_progress")}>Start</Button>}
                            {w.status === "in_progress" && <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => updateWaveStatus(w.id, "completed")}>Complete</Button>}
                            <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => deleteWave(w.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Zones Step */}
        {step === "zones" && (
          <div className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Define Warehouse Zones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input placeholder="Zone name *" value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Description" value={zoneForm.description} onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Assigned picker" value={zoneForm.assignedPicker} onChange={e => setZoneForm({ ...zoneForm, assignedPicker: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Bin prefixes (A,B,C)" value={zoneForm.binPrefixes} onChange={e => setZoneForm({ ...zoneForm, binPrefixes: e.target.value })} className="h-8 text-sm" />
                </div>
                <Button size="sm" className="text-xs" onClick={addZone}><Plus className="h-3 w-3 mr-1" /> Add Zone</Button>
              </CardContent>
            </Card>
            {zones.length > 0 && (
              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Zones ({zones.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Zone</TableHead>
                        <TableHead className="text-xs h-8">Description</TableHead>
                        <TableHead className="text-xs h-8">Picker</TableHead>
                        <TableHead className="text-xs h-8">Bin Prefixes</TableHead>
                        <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.map(z => (
                        <TableRow key={z.id} className="text-xs">
                          <TableCell className="py-1.5 font-medium">{z.name}</TableCell>
                          <TableCell className="py-1.5 text-muted-foreground">{z.description || "—"}</TableCell>
                          <TableCell className="py-1.5">{z.assignedPicker || "Unassigned"}</TableCell>
                          <TableCell className="py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {z.binPrefixes.length > 0 ? z.binPrefixes.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>) : <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 text-right">
                            <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => deleteZone(z.id)}><Trash2 className="h-3 w-3" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Cartons Step */}
        {step === "cartons" && (
          <div className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><BoxIcon className="h-4 w-4" /> Manage Carton Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Input placeholder="Carton name *" value={cartonForm.name} onChange={e => setCartonForm({ ...cartonForm, name: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Length (cm)" type="number" value={cartonForm.lengthCm} onChange={e => setCartonForm({ ...cartonForm, lengthCm: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Width (cm)" type="number" value={cartonForm.widthCm} onChange={e => setCartonForm({ ...cartonForm, widthCm: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Height (cm)" type="number" value={cartonForm.heightCm} onChange={e => setCartonForm({ ...cartonForm, heightCm: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Max weight (kg)" type="number" value={cartonForm.maxWeightKg} onChange={e => setCartonForm({ ...cartonForm, maxWeightKg: e.target.value })} className="h-8 text-sm" />
                </div>
                <Button size="sm" className="text-xs" onClick={addCarton}><Plus className="h-3 w-3 mr-1" /> Add Carton</Button>
              </CardContent>
            </Card>
            {cartons.length > 0 && (
              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Carton Types ({cartons.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Name</TableHead>
                        <TableHead className="text-xs h-8">L × W × H (cm)</TableHead>
                        <TableHead className="text-xs h-8">Volume (cm³)</TableHead>
                        <TableHead className="text-xs h-8">Max Weight</TableHead>
                        <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartons.map(c => (
                        <TableRow key={c.id} className="text-xs">
                          <TableCell className="py-1.5 font-medium">{c.name}</TableCell>
                          <TableCell className="py-1.5">{c.lengthCm} × {c.widthCm} × {c.heightCm}</TableCell>
                          <TableCell className="py-1.5">{(c.lengthCm * c.widthCm * c.heightCm).toLocaleString()}</TableCell>
                          <TableCell className="py-1.5">{c.maxWeightKg} kg</TableCell>
                          <TableCell className="py-1.5 text-right">
                            <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => deleteCarton(c.id)}><Trash2 className="h-3 w-3" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
