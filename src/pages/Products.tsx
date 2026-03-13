import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useDeleteProducts, useUpdateProduct, useCategories } from "@/hooks/use-data";
import { Plus, Search, Download, Upload, MoreHorizontal, Trash2, Eye, Loader2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BulkEditDialog } from "@/components/products/BulkEditDialog";

function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += char; }
    }
    values.push(current.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

export default function Products() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const deleteProducts = useDeleteProducts();
  const updateProduct = useUpdateProduct();
  const { currentStore } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id));
  };

  const getStockStatus = (variants: any[]) => {
    const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    if (totalStock === 0) return "out-of-stock";
    if (totalStock <= 10) return "low-stock";
    return "in-stock";
  };

  const getTotalStock = (variants: any[]) => variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

  const handleBulkDelete = () => {
    if (selected.length > 0) {
      deleteProducts.mutate(selected, { onSuccess: () => setSelected([]) });
    }
  };

  const handleBulkStatusChange = (status: string) => {
    Promise.all(selected.map((id) => updateProduct.mutateAsync({ id, status }))).then(() => {
      setSelected([]);
      toast.success(`${selected.length} products updated to ${status}`);
    });
  };

  const handleExport = () => {
    const data = (selected.length > 0 ? products.filter((p) => selected.includes(p.id)) : products).map((p) => ({
      title: p.title,
      description: p.description || "",
      sku: p.sku || "",
      price: p.price,
      compare_at_price: p.compare_at_price || "",
      cost_price: p.cost_price || "",
      status: p.status,
      tags: (p.tags || []).join("; "),
      barcode: p.barcode || "",
    }));
    downloadCSV(data, `products-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success(`Exported ${data.length} products`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStore) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error("No data found in CSV"); return; }

      const products = rows.map((r) => ({
        title: r.title || "Untitled",
        description: r.description || null,
        sku: r.sku || null,
        price: parseFloat(r.price) || 0,
        compare_at_price: r.compare_at_price ? parseFloat(r.compare_at_price) : null,
        cost_price: r.cost_price ? parseFloat(r.cost_price) : null,
        status: r.status || "draft",
        tags: r.tags ? r.tags.split(";").map((t: string) => t.trim()) : [],
        barcode: r.barcode || null,
        store_id: currentStore.id,
      }));

      const { error } = await supabase.from("products").insert(products as any);
      if (error) throw error;
      toast.success(`Imported ${products.length} products`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Products</h1>
            <p className="text-xs text-muted-foreground">{products.length} products in catalog</p>
          </div>
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} accept=".csv" onChange={handleImport} className="hidden" />
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Import
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => navigate("/products/export")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => navigate("/products/import")}>
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => navigate("/products/new")}>
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">Bulk Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-xs">Set Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem className="text-xs" onClick={() => handleBulkStatusChange("active")}>Active</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs" onClick={() => handleBulkStatusChange("draft")}>Draft</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs" onClick={() => handleBulkStatusChange("archived")}>Archived</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem className="text-xs" onClick={handleExport}>Export Selected</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-1" onClick={() => setBulkEditOpen(true)}>
                        <Pencil className="h-3 w-3" /> Bulk Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-destructive" onClick={handleBulkDelete}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 h-9"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead className="text-xs h-9">Product</TableHead>
                  <TableHead className="text-xs h-9">SKU</TableHead>
                  <TableHead className="text-xs h-9">Status</TableHead>
                  <TableHead className="text-xs h-9">Stock</TableHead>
                  <TableHead className="text-xs h-9 text-right">Price</TableHead>
                  <TableHead className="text-xs h-9 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7} className="py-3"><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    {products.length === 0 ? "No products yet. Add your first product." : "No products match your filters."}
                  </TableCell></TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/products/${product.id}`)}>
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground"><Eye className="h-3.5 w-3.5" /></div>
                          <div>
                            <p className="font-medium">{product.title}</p>
                            {product.product_variants && product.product_variants.length > 0 && (
                              <p className="text-2xs text-muted-foreground">{product.product_variants.length} variants</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 font-mono text-muted-foreground">{product.sku || "—"}</TableCell>
                      <TableCell className="py-2"><StatusBadge status={product.status} /></TableCell>
                      <TableCell className="py-2">
                        {product.product_variants && product.product_variants.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span>{getTotalStock(product.product_variants)}</span>
                            <StatusBadge status={getStockStatus(product.product_variants)} />
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">
                        ${Number(product.price).toFixed(2)}
                        {product.compare_at_price && (
                          <span className="ml-1 text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs" onClick={() => navigate(`/products/${product.id}`)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteProducts.mutate([product.id])}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <BulkEditDialog
          open={bulkEditOpen}
          onOpenChange={setBulkEditOpen}
          selectedIds={selected}
          products={products}
          onComplete={() => setSelected([])}
        />
      </div>
    </AdminLayout>
  );
}
