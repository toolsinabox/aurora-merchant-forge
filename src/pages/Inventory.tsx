import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockProducts, mockLocations } from "@/lib/mock-data";
import { Search, Plus, AlertTriangle, Package, Warehouse } from "lucide-react";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "out-of-stock";
    if (stock <= 10) return "low-stock";
    return "in-stock";
  };

  const inventoryItems = mockProducts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(p.stock);
    const matchFilter = stockFilter === "all" || status === stockFilter;
    return matchSearch && matchFilter;
  });

  const totalStock = mockProducts.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = mockProducts.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = mockProducts.filter((p) => p.stock === 0).length;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Inventory</h1>
            <p className="text-xs text-muted-foreground">Track stock across all locations</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Location</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div><p className="text-2xs text-muted-foreground">Total Units</p><p className="text-lg font-bold">{totalStock.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-info" />
            <div><p className="text-2xs text-muted-foreground">Locations</p><p className="text-lg font-bold">{mockLocations.length}</p></div>
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

        {/* Locations */}
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
                {mockLocations.map((loc) => (
                  <TableRow key={loc.id} className="text-xs">
                    <TableCell className="py-2 font-medium">{loc.name}</TableCell>
                    <TableCell className="py-2 capitalize">{loc.type}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{loc.address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stock Table */}
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
                {inventoryItems.map((p) => (
                  <TableRow key={p.id} className="text-xs">
                    <TableCell className="py-2 font-medium">{p.title}</TableCell>
                    <TableCell className="py-2 font-mono text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="py-2 text-right">{p.stock}</TableCell>
                    <TableCell className="py-2"><StatusBadge status={getStockStatus(p.stock)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
