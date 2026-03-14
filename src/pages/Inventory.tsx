import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts, useInventoryLocations, useCreateLocation, useStockAdjustments, useInventoryStock } from "@/hooks/use-data";
import { Search, Plus, AlertTriangle, Package, Warehouse, History, ArrowUpDown, ArrowLeftRight, Hash, Trash2, Zap, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Inventory() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: locations = [], isLoading: loadingLocations } = useInventoryLocations();
  const { data: adjustments = [] } = useStockAdjustments();
  const { data: inventoryStockData = [] } = useInventoryStock();
  const createLocation = useCreateLocation();
  const { currentStore, user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [locOpen, setLocOpen] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", type: "warehouse", address: "" });
  const [showHistory, setShowHistory] = useState(false);

  // Bulk adjustment state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [bulkAdjustQty, setBulkAdjustQty] = useState(0);
  const [bulkAdjustReason, setBulkAdjustReason] = useState("");
  const [bulkAdjustType, setBulkAdjustType] = useState<"set" | "add" | "subtract">("add");
  const [bulkAdjusting, setBulkAdjusting] = useState(false);

  const toggleProductSelect = (id: string) => {
    setSelectedProducts(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAllProducts = () => {
    if (selectedProducts.size === inventoryItems.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(inventoryItems.map(p => p.id)));
  };

  const handleBulkAdjust = async () => {
    if (selectedProducts.size === 0 || !currentStore || !user) return;
    setBulkAdjusting(true);
    try {
      let updated = 0;
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;
        // Update all variants for this product
        const variants = product.product_variants || [];
        if (variants.length > 0) {
          for (const v of variants) {
            const currentStock = v.stock || 0;
            const newStock = bulkAdjustType === "set" ? bulkAdjustQty : bulkAdjustType === "add" ? currentStock + bulkAdjustQty : Math.max(0, currentStock - bulkAdjustQty);
            await supabase.from("product_variants").update({ stock: newStock }).eq("id", v.id);
          }
        }
        updated++;
      }
      toast.success(`Adjusted stock for ${updated} products`);
      setBulkAdjustOpen(false);
      setSelectedProducts(new Set());
      setBulkAdjustQty(0);
      setBulkAdjustReason("");
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBulkAdjusting(false);
    }
  };

  // Transfer dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromLocationId: "", toLocationId: "", productId: "", quantity: 1, reason: "",
  });
  const [transferring, setTransferring] = useState(false);

  // Serial Numbers
  const [serialOpen, setSerialOpen] = useState(false);
  const [newSerial, setNewSerial] = useState({ productId: "", serialNumber: "", locationId: "", notes: "" });
  const { data: serialNumbers = [], isLoading: loadingSerials } = useQuery({
    queryKey: ["serial_numbers", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("serial_numbers" as any)
        .select("*, product:product_id(title, sku), location:location_id(name)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  const addSerial = useMutation({
    mutationFn: async () => {
      if (!currentStore || !newSerial.productId || !newSerial.serialNumber) throw new Error("Product and serial number required");
      const { error } = await supabase.from("serial_numbers" as any).insert({
        store_id: currentStore.id,
        product_id: newSerial.productId,
        serial_number: newSerial.serialNumber.trim(),
        location_id: newSerial.locationId || null,
        notes: newSerial.notes || null,
        status: "available",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serial_numbers"] });
      setSerialOpen(false);
      setNewSerial({ productId: "", serialNumber: "", locationId: "", notes: "" });
      toast.success("Serial number added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSerial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("serial_numbers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serial_numbers"] });
      toast.success("Serial number deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getVariantStock = (p: any) => {
    if (p.product_variants && p.product_variants.length > 0) {
      return p.product_variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    }
    return 0;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "out-of-stock";
    if (stock <= 10) return "low-stock";
    return "in-stock";
  };

  const inventoryItems = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const stock = getVariantStock(p);
    const status = getStockStatus(stock);
    const matchFilter = stockFilter === "all" || status === stockFilter;
    return matchSearch && matchFilter;
  });

  const totalStock = products.reduce((sum, p) => sum + getVariantStock(p), 0);
  const lowStock = products.filter((p) => { const s = getVariantStock(p); return s > 0 && s <= 10; }).length;
  const outOfStock = products.filter((p) => getVariantStock(p) === 0).length;

  // Inventory value calculation
  const inventoryValue = useMemo(() => {
    let totalRetail = 0;
    let totalCost = 0;
    products.forEach((p: any) => {
      const stock = getVariantStock(p);
      totalRetail += stock * Number(p.price || 0);
      totalCost += stock * Number(p.cost_price || 0);
    });
    return { totalRetail, totalCost, totalProfit: totalRetail - totalCost };
  }, [products]);

  const handleCreateLocation = () => {
    createLocation.mutate(
      { name: newLoc.name, type: newLoc.type, address: newLoc.address || undefined },
      { onSuccess: () => { setLocOpen(false); setNewLoc({ name: "", type: "warehouse", address: "" }); } }
    );
  };

  // Find stock record for transfer source
  const sourceStock = (inventoryStockData as any[]).find(
    (s: any) => s.location_id === transferForm.fromLocationId && s.product_id === transferForm.productId
  );

  const handleTransfer = async () => {
    if (!currentStore || !user) return;
    const { fromLocationId, toLocationId, productId, quantity, reason } = transferForm;
    if (!fromLocationId || !toLocationId || !productId || quantity <= 0) {
      toast.error("All fields required"); return;
    }
    if (fromLocationId === toLocationId) {
      toast.error("Source and destination must differ"); return;
    }

    setTransferring(true);
    try {
      // Find or create source and dest stock records
      const { data: fromStock } = await supabase
        .from("inventory_stock")
        .select("id, quantity")
        .eq("store_id", currentStore.id)
        .eq("location_id", fromLocationId)
        .eq("product_id", productId)
        .maybeSingle();

      if (!fromStock || fromStock.quantity < quantity) {
        toast.error("Insufficient stock at source location");
        setTransferring(false);
        return;
      }

      // Decrease source
      await supabase.from("inventory_stock").update({ quantity: fromStock.quantity - quantity }).eq("id", fromStock.id);

      // Increase or create dest
      const { data: toStock } = await supabase
        .from("inventory_stock")
        .select("id, quantity")
        .eq("store_id", currentStore.id)
        .eq("location_id", toLocationId)
        .eq("product_id", productId)
        .maybeSingle();

      if (toStock) {
        await supabase.from("inventory_stock").update({ quantity: toStock.quantity + quantity }).eq("id", toStock.id);
      } else {
        await supabase.from("inventory_stock").insert({
          store_id: currentStore.id,
          location_id: toLocationId,
          product_id: productId,
          quantity,
          low_stock_threshold: 5,
        });
      }

      // Log adjustments
      await supabase.from("stock_adjustments").insert([
        { store_id: currentStore.id, inventory_stock_id: fromStock.id, quantity_change: -quantity, adjusted_by: user.id, reason: reason || `Transfer to ${locations.find((l) => l.id === toLocationId)?.name}` },
      ]);

      qc.invalidateQueries({ queryKey: ["inventory_stock"] });
      qc.invalidateQueries({ queryKey: ["stock_adjustments"] });
      toast.success(`Transferred ${quantity} units`);
      setTransferOpen(false);
      setTransferForm({ fromLocationId: "", toLocationId: "", productId: "", quantity: 1, reason: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Inventory</h1>
            <p className="text-xs text-muted-foreground">Track stock across all locations</p>
          </div>
        </div>

        <Tabs defaultValue="stock">
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="stock" className="text-xs h-7">Stock</TabsTrigger>
            <TabsTrigger value="fefo" className="text-xs h-7">FEFO Picking</TabsTrigger>
            <TabsTrigger value="batches" className="text-xs h-7">Batch Traceability</TabsTrigger>
            <TabsTrigger value="serials" className="text-xs h-7">Serial Numbers</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={async () => {
                if (!currentStore) return;
                // Find low-stock items and auto-create POs
                const lowStockProducts = products.filter((p: any) => {
                  const stock = getVariantStock(p);
                  return stock > 0 && stock <= 10;
                });
                if (lowStockProducts.length === 0) {
                  toast.info("No low-stock products to reorder");
                  return;
                }
                let created = 0;
                for (const p of lowStockProducts) {
                  // Check if supplier exists
                  const supplierId = (p as any).supplier_id;
                  const poNum = `PO-AUTO-${Date.now().toString(36).toUpperCase()}-${created}`;
                  const { error } = await supabase.from("purchase_orders").insert({
                    store_id: currentStore.id,
                    po_number: poNum,
                    supplier_id: supplierId || null,
                    status: "draft",
                    notes: `Auto-generated for low stock: ${p.title} (${getVariantStock(p)} remaining)`,
                    total: Number((p as any).cost_price || 0) * 20,
                  } as any);
                  if (!error) created++;
                }
                toast.success(`Created ${created} draft PO(s) for ${lowStockProducts.length} low-stock products`);
                qc.invalidateQueries({ queryKey: ["purchase_orders"] });
              }}
            >
              <Zap className="h-3.5 w-3.5" /> Auto-Generate POs
            </Button>
            <Button
              size="sm"
              variant={showHistory ? "default" : "outline"}
              className="h-8 text-xs gap-1"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-3.5 w-3.5" /> Adjustments
            </Button>
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"><ArrowLeftRight className="h-3.5 w-3.5" /> Transfer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="text-sm">Stock Transfer</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Select value={transferForm.productId} onValueChange={(v) => setTransferForm({ ...transferForm, productId: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">From Location</Label>
                      <Select value={transferForm.fromLocationId} onValueChange={(v) => setTransferForm({ ...transferForm, fromLocationId: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To Location</Label>
                      <Select value={transferForm.toLocationId} onValueChange={(v) => setTransferForm({ ...transferForm, toLocationId: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Destination" /></SelectTrigger>
                        <SelectContent>
                          {locations.filter((l) => l.id !== transferForm.fromLocationId).map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" min={1} className="h-8 text-xs" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: +e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reason</Label>
                      <Input className="h-8 text-xs" value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder="Optional" />
                    </div>
                  </div>
                  {sourceStock && (
                    <p className="text-xs text-muted-foreground">Available at source: {(sourceStock as any).quantity} units</p>
                  )}
                  <Button size="sm" className="w-full text-xs" onClick={handleTransfer} disabled={transferring}>
                    {transferring ? "Transferring..." : "Transfer Stock"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={locOpen} onOpenChange={setLocOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Location</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="text-sm">New Location</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input className="h-8 text-xs" value={newLoc.name} onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })} placeholder="Main Warehouse" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={newLoc.type} onValueChange={(v) => setNewLoc({ ...newLoc, type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse" className="text-xs">Warehouse</SelectItem>
                        <SelectItem value="store" className="text-xs">Store</SelectItem>
                        <SelectItem value="dropship" className="text-xs">Dropship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address</Label>
                    <Input className="h-8 text-xs" value={newLoc.address} onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })} placeholder="123 Main St" />
                  </div>
                  <Button size="sm" className="h-8 text-xs w-full" onClick={handleCreateLocation} disabled={createLocation.isPending}>
                    {createLocation.isPending ? "Creating..." : "Create Location"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div><p className="text-2xs text-muted-foreground">Total Units</p><p className="text-lg font-bold">{totalStock.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-info" />
            <div><p className="text-2xs text-muted-foreground">Locations</p><p className="text-lg font-bold">{locations.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div><p className="text-2xs text-muted-foreground">Low Stock</p><p className="text-lg font-bold">{lowStock}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div><p className="text-2xs text-muted-foreground">Out of Stock</p><p className="text-lg font-bold">{outOfStock}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <p className="text-2xs text-muted-foreground">Retail Value</p>
            <p className="text-sm font-bold">${inventoryValue.totalRetail.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <p className="text-2xs text-muted-foreground">Cost Value</p>
            <p className="text-sm font-bold">${inventoryValue.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <p className="text-2xs text-muted-foreground">Potential Profit</p>
            <p className="text-sm font-bold text-primary">${inventoryValue.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </CardContent></Card>
        </div>

        {showHistory && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" /> Stock Adjustment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Product</TableHead>
                    <TableHead className="text-xs h-8">Location</TableHead>
                    <TableHead className="text-xs h-8 text-right">Change</TableHead>
                    <TableHead className="text-xs h-8">Reason</TableHead>
                    <TableHead className="text-xs h-8">By</TableHead>
                    <TableHead className="text-xs h-8">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                        No stock adjustments recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjustments.map((adj: any) => {
                      const stockRecord = inventoryStockData.find((s: any) => s.id === adj.inventory_stock_id);
                      return (
                        <TableRow key={adj.id} className="text-xs">
                          <TableCell className="py-2 font-medium">
                            {(stockRecord as any)?.products?.title || "—"}
                            {(stockRecord as any)?.product_variants?.name && (
                              <span className="text-muted-foreground ml-1">({(stockRecord as any).product_variants.name})</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2">{(stockRecord as any)?.inventory_locations?.name || "—"}</TableCell>
                          <TableCell className={`py-2 text-right font-mono font-medium ${adj.quantity_change > 0 ? "text-success" : "text-destructive"}`}>
                            {adj.quantity_change > 0 ? "+" : ""}{adj.quantity_change}
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">{adj.reason || "—"}</TableCell>
                          <TableCell className="py-2">{(adj.profiles as any)?.display_name || "—"}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{format(new Date(adj.created_at), "MMM d, HH:mm")}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {locations.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Warehouse Locations</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Location</TableHead>
                    <TableHead className="text-xs h-8">Type</TableHead>
                    <TableHead className="text-xs h-8">Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{loc.name}</TableCell>
                      <TableCell className="py-2 capitalize">{loc.type}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{loc.address || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Stock</SelectItem>
                  <SelectItem value="in-stock" className="text-xs">In Stock</SelectItem>
                  <SelectItem value="low-stock" className="text-xs">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock" className="text-xs">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              {selectedProducts.size > 0 && (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setBulkAdjustOpen(true)}>
                  <CheckSquare className="h-3.5 w-3.5" /> Bulk Adjust ({selectedProducts.size})
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-8">
                    <Checkbox checked={selectedProducts.size === inventoryItems.length && inventoryItems.length > 0} onCheckedChange={toggleAllProducts} />
                  </TableHead>
                  <TableHead className="text-xs h-8">Product</TableHead>
                  <TableHead className="text-xs h-8">SKU</TableHead>
                  <TableHead className="text-xs h-8">Bin Location</TableHead>
                  <TableHead className="text-xs h-8">Batch/Lot</TableHead>
                  <TableHead className="text-xs h-8">Expiry</TableHead>
                  <TableHead className="text-xs h-8 text-right">Stock</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : inventoryItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-6">No inventory data</TableCell></TableRow>
                ) : (
                  inventoryItems.map((p) => {
                    const stock = getVariantStock(p);
                    const stockRecord = (inventoryStockData as any[]).find((s: any) => s.product_id === p.id);
                    const expDate = stockRecord?.expiry_date;
                    const isExpired = expDate && new Date(expDate) < new Date();
                    const isExpiringSoon = expDate && !isExpired && new Date(expDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    return (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                          <Checkbox checked={selectedProducts.has(p.id)} onCheckedChange={() => toggleProductSelect(p.id)} />
                        </TableCell>
                        <TableCell className="py-2 font-medium">{p.title}</TableCell>
                        <TableCell className="py-2 font-mono text-muted-foreground">{p.sku || "—"}</TableCell>
                        <TableCell className="py-2 font-mono text-muted-foreground">
                          {stockRecord?.bin_location || "—"}
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {stockRecord?.batch_number || stockRecord?.lot_number
                            ? `${stockRecord?.batch_number || ""}${stockRecord?.batch_number && stockRecord?.lot_number ? " / " : ""}${stockRecord?.lot_number || ""}`
                            : "—"}
                        </TableCell>
                        <TableCell className={`py-2 ${isExpired ? "text-destructive font-medium" : isExpiringSoon ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                          {expDate ? format(new Date(expDate), "dd MMM yyyy") : "—"}
                          {isExpired && " ⚠️"}
                        </TableCell>
                        <TableCell className="py-2 text-right">{stock}</TableCell>
                        <TableCell className="py-2"><StatusBadge status={getStockStatus(stock)} /></TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Serial Numbers Tab */}
          <TabsContent value="serials" className="space-y-3">
            <div className="flex items-center justify-end">
              <Dialog open={serialOpen} onOpenChange={setSerialOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Serial</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="text-sm">Add Serial Number</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Select value={newSerial.productId} onValueChange={(v) => setNewSerial({ ...newSerial, productId: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Serial Number</Label>
                      <Input className="h-8 text-xs font-mono" value={newSerial.serialNumber} onChange={(e) => setNewSerial({ ...newSerial, serialNumber: e.target.value })} placeholder="SN-001234" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Location (optional)</Label>
                      <Select value={newSerial.locationId} onValueChange={(v) => setNewSerial({ ...newSerial, locationId: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Input className="h-8 text-xs" value={newSerial.notes} onChange={(e) => setNewSerial({ ...newSerial, notes: e.target.value })} placeholder="Optional notes" />
                    </div>
                    <Button size="sm" className="w-full text-xs" onClick={() => addSerial.mutate()} disabled={addSerial.isPending}>
                      {addSerial.isPending ? "Adding..." : "Add Serial Number"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Serial Number</TableHead>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8">Location</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8">Notes</TableHead>
                      <TableHead className="text-xs h-8">Added</TableHead>
                      <TableHead className="text-xs h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSerials ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                    ) : (serialNumbers as any[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                          <Hash className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          No serial numbers tracked yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (serialNumbers as any[]).map((sn: any) => (
                        <TableRow key={sn.id} className="text-xs">
                          <TableCell className="py-2 font-mono font-medium">{sn.serial_number}</TableCell>
                          <TableCell className="py-2">{sn.product?.title || "—"}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{sn.location?.name || "—"}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant={sn.status === "available" ? "default" : sn.status === "sold" ? "secondary" : "destructive"} className="text-[10px] capitalize">{sn.status}</Badge>
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">{sn.notes || "—"}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{format(new Date(sn.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="py-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSerial.mutate(sn.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEFO Picking Tab */}
          <TabsContent value="fefo" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">First-Expiry-First-Out (FEFO) Pick List</CardTitle>
                <p className="text-xs text-muted-foreground">Items sorted by expiry date — pick earliest first to minimize waste.</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8">SKU</TableHead>
                      <TableHead className="text-xs h-8">Batch</TableHead>
                      <TableHead className="text-xs h-8">Lot</TableHead>
                      <TableHead className="text-xs h-8">Location</TableHead>
                      <TableHead className="text-xs h-8">Expiry</TableHead>
                      <TableHead className="text-xs h-8 text-right">Qty</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const fefoItems = (inventoryStockData as any[])
                        .filter((s: any) => s.expiry_date)
                        .sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                        .slice(0, 50);
                      if (fefoItems.length === 0) return (
                        <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No items with expiry dates tracked.</TableCell></TableRow>
                      );
                      return fefoItems.map((item: any) => {
                        const product = products.find(p => p.id === item.product_id);
                        const location = locations.find(l => l.id === item.location_id);
                        const expDate = new Date(item.expiry_date);
                        const now = new Date();
                        const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysUntil < 0;
                        const isExpiringSoon = !isExpired && daysUntil <= 30;
                        return (
                          <TableRow key={item.id} className={`text-xs ${isExpired ? "bg-destructive/5" : isExpiringSoon ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                            <TableCell className="py-2 font-medium">{product?.title || "—"}</TableCell>
                            <TableCell className="py-2 font-mono text-muted-foreground">{product?.sku || "—"}</TableCell>
                            <TableCell className="py-2 text-muted-foreground">{item.batch_number || "—"}</TableCell>
                            <TableCell className="py-2 text-muted-foreground">{item.lot_number || "—"}</TableCell>
                            <TableCell className="py-2 text-muted-foreground">{location?.name || "—"}</TableCell>
                            <TableCell className="py-2">
                              <span className={isExpired ? "text-destructive font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : ""}>{format(expDate, "MMM d, yyyy")}</span>
                              <span className="ml-1 text-muted-foreground text-[10px]">({isExpired ? `${Math.abs(daysUntil)}d ago` : `${daysUntil}d`})</span>
                            </TableCell>
                            <TableCell className="py-2 text-right font-medium">{item.quantity}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant={isExpired ? "destructive" : isExpiringSoon ? "secondary" : "default"} className="text-[10px]">
                                {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "OK"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Traceability Tab */}
          <TabsContent value="batches" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Batch & Lot Traceability</CardTitle>
                <p className="text-xs text-muted-foreground">Track batches and lots from receipt through to customer orders.</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Batch #</TableHead>
                      <TableHead className="text-xs h-8">Lot #</TableHead>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8">SKU</TableHead>
                      <TableHead className="text-xs h-8">Location</TableHead>
                      <TableHead className="text-xs h-8">Bin</TableHead>
                      <TableHead className="text-xs h-8">Expiry</TableHead>
                      <TableHead className="text-xs h-8 text-right">On Hand</TableHead>
                      <TableHead className="text-xs h-8 text-right">Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const batchItems = (inventoryStockData as any[])
                        .filter((s: any) => s.batch_number || s.lot_number)
                        .sort((a: any, b: any) => (a.batch_number || "").localeCompare(b.batch_number || ""));
                      if (batchItems.length === 0) return (
                        <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">No batch or lot numbers tracked. Add batch/lot data when receiving stock.</TableCell></TableRow>
                      );
                      return batchItems.map((item: any) => {
                        const product = products.find(p => p.id === item.product_id);
                        const location = locations.find(l => l.id === item.location_id);
                        return (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="py-2 font-mono font-medium">{item.batch_number || "—"}</TableCell>
                            <TableCell className="py-2 font-mono">{item.lot_number || "—"}</TableCell>
                            <TableCell className="py-2">{product?.title || "—"}</TableCell>
                            <TableCell className="py-2 font-mono text-muted-foreground">{product?.sku || "—"}</TableCell>
                            <TableCell className="py-2 text-muted-foreground">{location?.name || "—"}</TableCell>
                            <TableCell className="py-2 text-muted-foreground">{item.bin_location || "—"}</TableCell>
                            <TableCell className="py-2">{item.expiry_date ? format(new Date(item.expiry_date), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell className="py-2 text-right font-medium">{item.quantity}</TableCell>
                            <TableCell className="py-2 text-right text-muted-foreground">{item.low_stock_threshold}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bulk Adjust Dialog */}
        <Dialog open={bulkAdjustOpen} onOpenChange={setBulkAdjustOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-sm">Bulk Stock Adjustment</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">Adjust stock for {selectedProducts.size} selected products.</p>
            <div className="space-y-3 my-2">
              <div className="space-y-1">
                <Label className="text-xs">Adjustment Type</Label>
                <Select value={bulkAdjustType} onValueChange={(v) => setBulkAdjustType(v as any)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add" className="text-xs">Add to stock</SelectItem>
                    <SelectItem value="subtract" className="text-xs">Subtract from stock</SelectItem>
                    <SelectItem value="set" className="text-xs">Set stock to</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" min={0} className="h-8 text-xs" value={bulkAdjustQty} onChange={(e) => setBulkAdjustQty(+e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reason (optional)</Label>
                <Input className="h-8 text-xs" value={bulkAdjustReason} onChange={(e) => setBulkAdjustReason(e.target.value)} placeholder="e.g. Stocktake correction" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setBulkAdjustOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleBulkAdjust} disabled={bulkAdjusting}>
                {bulkAdjusting ? "Adjusting..." : `Adjust ${selectedProducts.size} Products`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}