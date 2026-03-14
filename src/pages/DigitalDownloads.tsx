import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Plus, Trash2, FileDown, Link, Eye, Package, Key, Copy, RefreshCw } from "lucide-react";
import { TablePagination } from "@/components/admin/TablePagination";

export default function DigitalDownloads() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [form, setForm] = useState({ file_name: "", file_url: "", download_limit: "", expiry_days: "30" });
  const [licenseKeys, setLicenseKeys] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("license_keys_store") || "{}"); } catch { return {}; }
  });
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [licenseProduct, setLicenseProduct] = useState<any>(null);
  const [newLicenseKey, setNewLicenseKey] = useState("");
  const [licenseCount, setLicenseCount] = useState(5);

  const { data: downloads = [] } = useQuery({
    queryKey: ["product-downloads", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("product_downloads").select("*, products(title)").eq("store_id", storeId!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-downloads", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title").eq("store_id", storeId!).order("title");
      return data || [];
    },
  });

  const { data: customerDownloads = [] } = useQuery({
    queryKey: ["customer-downloads", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("customer_downloads").select("*, product_downloads(file_name, products(title)), orders(order_number)").eq("store_id", storeId!).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !form.file_name || !form.file_url) throw new Error("All fields required");
      await supabase.from("product_downloads").insert({
        product_id: selectedProduct,
        store_id: storeId!,
        file_name: form.file_name,
        file_url: form.file_url,
        download_limit: form.download_limit ? parseInt(form.download_limit) : null,
        expiry_days: parseInt(form.expiry_days) || 30,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-downloads"] });
      setShowAdd(false);
      setForm({ file_name: "", file_url: "", download_limit: "", expiry_days: "30" });
      setSelectedProduct("");
      toast.success("Download file added");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("product_downloads").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-downloads"] });
      toast.success("Download removed");
    },
  });

  const generateLicenseKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const segments = 4;
    const segLen = 5;
    return Array.from({ length: segments }, () =>
      Array.from({ length: segLen }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    ).join("-");
  };

  const addLicenseKeys = (productId: string, count: number) => {
    const existing = licenseKeys[productId] || [];
    const newKeys = Array.from({ length: count }, () => generateLicenseKey());
    const updated = { ...licenseKeys, [productId]: [...existing, ...newKeys] };
    setLicenseKeys(updated);
    localStorage.setItem("license_keys_store", JSON.stringify(updated));
    toast.success(`Generated ${count} license keys`);
  };

  const revokeLicenseKey = (productId: string, key: string) => {
    const existing = licenseKeys[productId] || [];
    const updated = { ...licenseKeys, [productId]: existing.filter(k => k !== key) };
    setLicenseKeys(updated);
    localStorage.setItem("license_keys_store", JSON.stringify(updated));
    toast.success("License key revoked");
  };

  const paged = downloads.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Digital Downloads</h1>
            <p className="text-xs text-muted-foreground">Manage downloadable files attached to products</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> Add Download</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{downloads.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Products with Downloads</p>
              <p className="text-2xl font-bold">{new Set(downloads.map((d: any) => d.product_id)).size}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Total Customer Downloads</p>
              <p className="text-2xl font-bold">{customerDownloads.reduce((s: number, d: any) => s + (d.download_count || 0), 0)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Download Files</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>License Keys</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{(d as any).products?.title || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{d.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{d.download_limit || "∞"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.expiry_days}d</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">{(licenseKeys[d.product_id] || []).length} keys</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Manage License Keys" onClick={() => { setLicenseProduct(d); setShowLicenseDialog(true); }}>
                          <Key className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(d.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No download files yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={pageSize} total={downloads.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </CardContent>
        </Card>

        {customerDownloads.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Customer Downloads</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerDownloads.slice(0, 20).map((cd: any) => (
                    <TableRow key={cd.id}>
                      <TableCell className="text-sm font-medium">{(cd as any).orders?.order_number || "—"}</TableCell>
                      <TableCell className="text-sm">{(cd as any).product_downloads?.file_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {cd.download_count}{cd.max_downloads ? `/${cd.max_downloads}` : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cd.expires_at ? new Date(cd.expires_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[100px]">{cd.download_token?.slice(0, 12)}…</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Download File</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File Name</Label>
              <Input value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} placeholder="e.g. manual-v2.pdf" />
            </div>
            <div>
              <Label>File URL</Label>
              <Input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Download Limit (blank = unlimited)</Label>
                <Input type="number" value={form.download_limit} onChange={e => setForm(f => ({ ...f, download_limit: e.target.value }))} />
              </div>
              <div>
                <Label>Expiry (days after purchase)</Label>
                <Input type="number" value={form.expiry_days} onChange={e => setForm(f => ({ ...f, expiry_days: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()}>Add File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
