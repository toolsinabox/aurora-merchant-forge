import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useInventoryLocations, useCreateLocation } from "@/hooks/use-data";
import { Search, Plus, AlertTriangle, Package, Warehouse } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: locations = [], isLoading: loadingLocations } = useInventoryLocations();
  const createLocation = useCreateLocation();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [locOpen, setLocOpen] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", type: "warehouse", address: "" });

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

  const handleCreateLocation = () => {
    createLocation.mutate(
      { name: newLoc.name, type: newLoc.type, address: newLoc.address || undefined },
      { onSuccess: () => { setLocOpen(false); setNewLoc({ name: "", type: "warehouse", address: "" }); } }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Inventory</h1>
            <p className="text-xs text-muted-foreground">Track stock across all locations</p>
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
        </div>

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
            <div className="flex items-center gap-2 p-3 border-b">
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
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Product</TableHead>
                  <TableHead className="text-xs h-8">SKU</TableHead>
                  <TableHead className="text-xs h-8 text-right">Stock</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : inventoryItems.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No inventory data</TableCell></TableRow>
                ) : (
                  inventoryItems.map((p) => {
                    const stock = getVariantStock(p);
                    return (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="py-2 font-medium">{p.title}</TableCell>
                        <TableCell className="py-2 font-mono text-muted-foreground">{p.sku || "—"}</TableCell>
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
      </div>
    </AdminLayout>
  );
}
