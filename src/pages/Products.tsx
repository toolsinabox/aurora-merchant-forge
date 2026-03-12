import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockProducts, type Product, type ProductStatus } from "@/lib/mock-data";
import { Plus, Search, Download, Upload, MoreHorizontal, Trash2, Archive, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id));
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "out-of-stock";
    if (stock <= 10) return "low-stock";
    return "in-stock";
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Products</h1>
            <p className="text-xs text-muted-foreground">{mockProducts.length} products in catalog</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => navigate("/products/new")}>
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Status</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                  <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                </SelectContent>
              </Select>
              {selected.length > 0 && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Archive className="h-3 w-3" /> Archive
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive">
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 h-9">
                    <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="text-xs h-9">Product</TableHead>
                  <TableHead className="text-xs h-9">SKU</TableHead>
                  <TableHead className="text-xs h-9">Status</TableHead>
                  <TableHead className="text-xs h-9">Stock</TableHead>
                  <TableHead className="text-xs h-9 text-right">Price</TableHead>
                  <TableHead className="text-xs h-9">Category</TableHead>
                  <TableHead className="text-xs h-9 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow
                    key={product.id}
                    className="text-xs cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-medium">{product.title}</p>
                          {product.variants.length > 0 && (
                            <p className="text-2xs text-muted-foreground">{product.variants.length} variants</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 font-mono text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="py-2"><StatusBadge status={product.status} /></TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">
                        <span>{product.stock}</span>
                        <StatusBadge status={getStockStatus(product.stock)} />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right font-medium">
                      ${product.price.toFixed(2)}
                      {product.compareAtPrice && (
                        <span className="ml-1 text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">{product.category}</TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs" onClick={() => navigate(`/products/${product.id}`)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">Archive</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
