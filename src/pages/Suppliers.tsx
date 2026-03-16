import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Building, Trash2, Pencil, Truck, Search, Package, Star, BarChart3, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SupplierForm {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  notes: string;
  lead_time_days: number;
  payment_terms: string;
  is_dropship: boolean;
  is_active: boolean;
}

function SupplierPerformance({ suppliers, storeId }: { suppliers: any[]; storeId?: string }) {
  const { data: poData = [] } = useQuery({
    queryKey: ["supplier-performance", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase
        .from("purchase_orders")
        .select("id, supplier_id, status, total, created_at, expected_date")
        .eq("store_id", storeId);
      return data || [];
    },
    enabled: !!storeId,
  });

  const stats = suppliers.map((s: any) => {
    const pos = poData.filter((p: any) => p.supplier_id === s.id);
    const totalPOs = pos.length;
    const totalSpend = pos.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);
    const received = pos.filter((p: any) => p.status === "received" || p.status === "closed");
    const onTime = received.filter((p: any) => {
      if (!p.expected_date) return true;
      return new Date(p.expected_date) >= new Date(p.created_at);
    });
    const onTimeRate = received.length > 0 ? Math.round((onTime.length / received.length) * 100) : 0;
    return { id: s.id, name: s.name, totalPOs, totalSpend, received: received.length, onTimeRate, isActive: s.is_active };
  }).filter(s => s.totalPOs > 0).sort((a, b) => b.totalSpend - a.totalSpend);

  if (stats.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No purchase order data for performance analysis.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs h-8">Supplier</TableHead>
          <TableHead className="text-xs h-8 text-right">POs</TableHead>
          <TableHead className="text-xs h-8 text-right">Total Spend</TableHead>
          <TableHead className="text-xs h-8 text-right">Received</TableHead>
          <TableHead className="text-xs h-8 text-right">On-Time %</TableHead>
          <TableHead className="text-xs h-8">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stats.map(s => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell className="text-right">{s.totalPOs}</TableCell>
            <TableCell className="text-right">${s.totalSpend.toFixed(2)}</TableCell>
            <TableCell className="text-right">{s.received}</TableCell>
            <TableCell className="text-right">
              <span className={s.onTimeRate >= 80 ? "text-primary" : s.onTimeRate >= 50 ? "text-amber-600" : "text-destructive"}>
                {s.onTimeRate}%
              </span>
            </TableCell>
            <TableCell><Badge variant={s.isActive ? "default" : "outline"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const emptyForm: SupplierForm = {
  name: "", contact_name: "", email: "", phone: "", address: "",
  website: "", notes: "", lead_time_days: 0, payment_terms: "", is_dropship: false, is_active: true,
};

export default function Suppliers() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [search, setSearch] = useState("");

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const payload = { ...form, store_id: currentStore.id };
      if (editId) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(editId ? "Supplier updated" : "Supplier created");
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      name: s.name, contact_name: s.contact_name || "", email: s.email || "",
      phone: s.phone || "", address: s.address || "", website: s.website || "",
      notes: s.notes || "", lead_time_days: s.lead_time_days || 0,
      payment_terms: s.payment_terms || "", is_dropship: s.is_dropship || false, is_active: s.is_active,
    });
    setOpen(true);
  };

  const filtered = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Supplier products
  const [spOpen, setSpOpen] = useState(false);
  const [spSupplierId, setSpSupplierId] = useState<string>("");
  const [spProductSearch, setSpProductSearch] = useState("");
  const [spProducts, setSpProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const { data: supplierProducts = [], refetch: refetchSP } = useQuery({
    queryKey: ["supplier_products", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase
        .from("supplier_products" as any)
        .select("*, suppliers(name), products(title, sku)")
        .eq("store_id", currentStore.id);
      return data || [];
    },
    enabled: !!currentStore,
  });

  const loadProducts = async (q: string) => {
    if (!currentStore) return;
    const query = supabase.from("products").select("id, title, sku").eq("store_id", currentStore.id).eq("status", "active").limit(20);
    if (q) query.ilike("title", `%${q}%`);
    const { data } = await query;
    setAllProducts(data || []);
  };

  const addSupplierProduct = async (productId: string) => {
    if (!currentStore || !spSupplierId) return;
    const { error } = await supabase.from("supplier_products" as any).insert({
      supplier_id: spSupplierId, product_id: productId, store_id: currentStore.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Product assigned to supplier");
    refetchSP();
  };

  const removeSupplierProduct = async (id: string) => {
    await supabase.from("supplier_products" as any).delete().eq("id", id);
    toast.success("Product removed from supplier");
    refetchSP();
  };

  const togglePreferred = async (id: string, current: boolean) => {
    await supabase.from("supplier_products" as any).update({ is_preferred: !current }).eq("id", id);
    refetchSP();
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Suppliers</h1>
            <p className="text-xs text-muted-foreground">{suppliers.length} suppliers</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Supplier</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit" : "New"} Supplier</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Website</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Lead Time (days)</Label><Input type="number" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: Number(e.target.value) })} /></div>
                  <div><Label>Payment Terms</Label><Input placeholder="Net 30" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={form.is_dropship} onCheckedChange={v => setForm({ ...form, is_dropship: v })} /><Label>Dropship Supplier</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Supplier" : "Create Supplier"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list">
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="list" className="text-xs h-7">Suppliers</TabsTrigger>
            <TabsTrigger value="products" className="text-xs h-7">Product Assignments</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs h-7">Performance</TabsTrigger>
            <TabsTrigger value="dropship" className="text-xs h-7">Dropship Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>

        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Supplier</TableHead>
                  <TableHead className="text-xs h-8">Contact</TableHead>
                  <TableHead className="text-xs h-8">Email</TableHead>
                  <TableHead className="text-xs h-8">Lead Time</TableHead>
                  <TableHead className="text-xs h-8">Type</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">No suppliers found</TableCell></TableRow>
                ) : filtered.map((s: any) => (
                  <TableRow key={s.id} className="text-xs">
                    <TableCell className="py-2 font-medium">{s.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{s.contact_name || "—"}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{s.email || "—"}</TableCell>
                    <TableCell className="py-2">{s.lead_time_days ? `${s.lead_time_days} days` : "—"}</TableCell>
                    <TableCell className="py-2">{s.is_dropship ? <Badge variant="secondary" className="text-[10px]"><Truck className="h-2.5 w-2.5 mr-1" />Dropship</Badge> : <Badge variant="outline" className="text-[10px]">Standard</Badge>}</TableCell>
                    <TableCell className="py-2"><Badge variant={s.is_active ? "default" : "outline"} className="text-[10px]">{s.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Assign Products to Suppliers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Select value={spSupplierId} onValueChange={(v) => { setSpSupplierId(v); }}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products to add..."
                      value={spProductSearch}
                      onChange={e => { setSpProductSearch(e.target.value); loadProducts(e.target.value); }}
                      onFocus={() => loadProducts(spProductSearch)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {spSupplierId && allProducts.length > 0 && spProductSearch && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {allProducts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 text-sm">
                        <span>{p.title} {p.sku && <span className="text-muted-foreground">({p.sku})</span>}</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { addSupplierProduct(p.id); setSpProductSearch(""); setAllProducts([]); }}>
                          <Plus className="h-3 w-3 mr-1" /> Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Supplier</TableHead>
                      <TableHead className="text-xs h-8">Product</TableHead>
                      <TableHead className="text-xs h-8">SKU</TableHead>
                      <TableHead className="text-xs h-8">Supplier Cost</TableHead>
                      <TableHead className="text-xs h-8">Preferred</TableHead>
                      <TableHead className="text-xs h-8 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(supplierProducts as any[]).length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No product assignments yet</TableCell></TableRow>
                    ) : (supplierProducts as any[]).filter(sp => !spSupplierId || sp.supplier_id === spSupplierId).map((sp: any) => (
                      <TableRow key={sp.id}>
                        <TableCell className="font-medium">{sp.suppliers?.name || "—"}</TableCell>
                        <TableCell>{sp.products?.title || "—"}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{sp.products?.sku || "—"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 w-24 text-xs"
                            placeholder="—"
                            defaultValue={sp.supplier_cost || ""}
                            onBlur={async (e) => {
                              const val = e.target.value ? parseFloat(e.target.value) : null;
                              await supabase.from("supplier_products" as any).update({ supplier_cost: val }).eq("id", sp.id);
                              refetchSP();
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePreferred(sp.id, sp.is_preferred)}>
                            <Star className={`h-3.5 w-3.5 ${sp.is_preferred ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSupplierProduct(sp.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Supplier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <SupplierPerformance suppliers={suppliers} storeId={currentStore?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dropship" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Dropship Automation</CardTitle>
                <p className="text-xs text-muted-foreground">Configure automatic PO generation and supplier notifications for dropship orders</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {suppliers.filter((s: any) => s.is_dropship).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No dropship suppliers. Mark a supplier as "Dropship" when creating or editing.</p>
                ) : (
                  <div className="space-y-3">
                    {suppliers.filter((s: any) => s.is_dropship).map((s: any) => (
                      <div key={s.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{s.name}</span>
                            <Badge variant="secondary" className="text-[10px]">Dropship</Badge>
                          </div>
                          <Badge variant={s.is_active ? "default" : "outline"} className="text-[10px]">{s.is_active ? "Active" : "Inactive"}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span className="font-medium">{s.email || "Not set"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lead Time: </span>
                            <span className="font-medium">{s.lead_time_days} days</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment Terms: </span>
                            <span className="font-medium">{s.payment_terms || "—"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={localStorage.getItem(`dropship_auto_po_${s.id}`) === "1"}
                              onCheckedChange={(v) => {
                                localStorage.setItem(`dropship_auto_po_${s.id}`, v ? "1" : "0");
                                toast.success(v ? "Auto PO enabled" : "Auto PO disabled");
                              }}
                            />
                            <span className="text-xs">Auto-create PO on order</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={localStorage.getItem(`dropship_notify_${s.id}`) === "1"}
                              onCheckedChange={(v) => {
                                localStorage.setItem(`dropship_notify_${s.id}`, v ? "1" : "0");
                                toast.success(v ? "Email notification enabled" : "Email notification disabled");
                              }}
                            />
                            <span className="text-xs">Email supplier on new order</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
