import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Ticket, Trash2, Copy, Search, BarChart3, Zap, DollarSign,
  TrendingUp, Users, Calendar, AlertTriangle, Gift, Tag,
} from "lucide-react";
import { format } from "date-fns";

interface CouponForm {
  code: string; description: string; discount_type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
  discount_value: number; min_order_amount: number; max_uses: number | null;
  per_customer_limit: number | null; expires_at: string; starts_at: string;
  is_active: boolean; free_shipping: boolean; applies_to: string;
  stackable: boolean; first_order_only: boolean; min_quantity: number;
  max_discount_amount: number | null;
}

const emptyForm: CouponForm = {
  code: "", description: "", discount_type: "percentage",
  discount_value: 10, min_order_amount: 0, max_uses: null, per_customer_limit: null,
  expires_at: "", starts_at: "", is_active: true, free_shipping: false, applies_to: "all",
  stackable: false, first_order_only: false, min_quantity: 0, max_discount_amount: null,
};

const PRESETS = [
  { label: "10% Off", code: "SAVE10", type: "percentage" as const, value: 10 },
  { label: "20% Off", code: "SAVE20", type: "percentage" as const, value: 20 },
  { label: "$10 Off", code: "TAKE10", type: "fixed" as const, value: 10 },
  { label: "Free Shipping", code: "FREESHIP", type: "free_shipping" as const, value: 0 },
  { label: "First Order 15%", code: "WELCOME15", type: "percentage" as const, value: 15, firstOrder: true },
  { label: "Buy 2 Get 1", code: "B2G1", type: "buy_x_get_y" as const, value: 1 },
];

export default function Coupons() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "inactive">("all");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase.from("coupons").select("*").eq("store_id", currentStore.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const payload: any = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type === "free_shipping" ? "percentage" : form.discount_type === "buy_x_get_y" ? "percentage" : form.discount_type,
        discount_value: form.discount_type === "free_shipping" ? 0 : form.discount_value,
        min_order_amount: form.min_order_amount,
        max_uses: form.max_uses, per_customer_limit: form.per_customer_limit,
        expires_at: form.expires_at || null, starts_at: form.starts_at || null,
        is_active: form.is_active,
        free_shipping: form.free_shipping || form.discount_type === "free_shipping",
        applies_to: form.applies_to,
      };
      if (editId) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert({ ...payload, store_id: currentStore.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setOpen(false); setEditId(null); setForm(emptyForm);
      toast.success(editId ? "Coupon updated" : "Coupon created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active: active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coupons"] }); toast.success("Coupon deleted"); },
  });

  const openEdit = (c: any) => {
    setForm({
      code: c.code, description: c.description || "",
      discount_type: c.free_shipping && c.discount_value === 0 ? "free_shipping" : c.discount_type,
      discount_value: c.discount_value, min_order_amount: c.min_order_amount || 0,
      max_uses: c.max_uses, per_customer_limit: c.per_customer_limit,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
      starts_at: c.starts_at ? c.starts_at.split("T")[0] : "",
      is_active: c.is_active, free_shipping: c.free_shipping || false,
      applies_to: c.applies_to || "all",
      stackable: false, first_order_only: false, min_quantity: 0, max_discount_amount: null,
    });
    setEditId(c.id); setOpen(true);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setForm({
      ...emptyForm,
      code: preset.code,
      discount_type: preset.type,
      discount_value: preset.value,
      free_shipping: preset.type === "free_shipping",
      first_order_only: (preset as any).firstOrder || false,
    });
    setEditId(null); setOpen(true);
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied"); };

  const genCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(f => ({ ...f, code }));
  };

  // Analytics
  const analytics = useMemo(() => {
    const all = coupons as any[];
    const active = all.filter(c => c.is_active);
    const expired = all.filter(c => c.expires_at && new Date(c.expires_at) < new Date());
    const totalUsed = all.reduce((s, c) => s + (c.used_count || 0), 0);
    const totalSaved = all.reduce((s, c) => {
      const uses = c.used_count || 0;
      if (c.discount_type === "percentage") return s + uses * (c.min_order_amount || 50) * (c.discount_value / 100);
      return s + uses * c.discount_value;
    }, 0);
    const topCoupon = all.sort((a, b) => (b.used_count || 0) - (a.used_count || 0))[0];
    const avgUsage = all.length > 0 ? totalUsed / all.length : 0;
    const expiringIn7Days = all.filter(c => {
      if (!c.expires_at || !c.is_active) return false;
      const d = new Date(c.expires_at);
      const now = new Date();
      return d > now && d.getTime() - now.getTime() < 7 * 86400000;
    });
    return { active: active.length, expired: expired.length, totalUsed, totalSaved, topCoupon, avgUsage, expiringIn7Days };
  }, [coupons]);

  const filtered = (coupons as any[]).filter(c => {
    const matchSearch = c.code.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "active") return matchSearch && c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date());
    if (statusFilter === "expired") return matchSearch && c.expires_at && new Date(c.expires_at) < new Date();
    if (statusFilter === "inactive") return matchSearch && !c.is_active;
    return matchSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Discount Codes</h1>
            <p className="text-xs text-muted-foreground">{coupons.length} coupons • {analytics.totalUsed} total uses</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { if (!o) setEditId(null); setOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setForm(emptyForm); setEditId(null); }}><Plus className="h-4 w-4 mr-1" /> Create Coupon</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Code *</Label>
                    <div className="flex gap-1">
                      <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" required className="uppercase h-8 text-xs flex-1" />
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs px-2" onClick={genCode} title="Generate code">
                        <Zap className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage" className="text-xs">Percentage (%)</SelectItem>
                        <SelectItem value="fixed" className="text-xs">Fixed Amount ($)</SelectItem>
                        <SelectItem value="free_shipping" className="text-xs">Free Shipping</SelectItem>
                        <SelectItem value="buy_x_get_y" className="text-xs">Buy X Get Y</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.discount_type !== "free_shipping" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Value *</Label><Input type="number" min={0} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: +e.target.value })} required className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Min Order ($)</Label><Input type="number" min={0} step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Max Discount ($)</Label><Input type="number" min={0} value={form.max_discount_amount ?? ""} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value ? +e.target.value : null })} placeholder="No cap" className="h-8 text-xs" /></div>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Applies To</Label>
                  <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Products</SelectItem>
                      <SelectItem value="specific_products" className="text-xs">Specific Products</SelectItem>
                      <SelectItem value="specific_categories" className="text-xs">Specific Categories</SelectItem>
                      <SelectItem value="specific_collections" className="text-xs">Specific Collections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Max Uses</Label><Input type="number" min={1} value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? +e.target.value : null })} placeholder="∞" className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Per Customer</Label><Input type="number" min={1} value={form.per_customer_limit ?? ""} onChange={(e) => setForm({ ...form, per_customer_limit: e.target.value ? +e.target.value : null })} placeholder="∞" className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Min Qty</Label><Input type="number" min={0} value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: +e.target.value })} className="h-8 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Starts</Label><Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Expires</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="h-8 text-xs" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="h-8 text-xs" /></div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs"><Checkbox checked={form.free_shipping} onCheckedChange={(v) => setForm({ ...form, free_shipping: !!v })} />Free Shipping</label>
                  <label className="flex items-center gap-2 text-xs"><Checkbox checked={form.stackable} onCheckedChange={(v) => setForm({ ...form, stackable: !!v })} />Stackable</label>
                  <label className="flex items-center gap-2 text-xs"><Checkbox checked={form.first_order_only} onCheckedChange={(v) => setForm({ ...form, first_order_only: !!v })} />First Order Only</label>
                  <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label className="text-xs">Active</Label></div>
                </div>
                <Button type="submit" className="w-full text-xs" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Coupon"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Total</p><p className="text-xl font-bold">{coupons.length}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-xl font-bold text-primary">{analytics.active}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Total Uses</p><p className="text-xl font-bold">{analytics.totalUsed}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Est. Savings</p><p className="text-xl font-bold">${analytics.totalSaved.toFixed(0)}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Expired</p><p className="text-xl font-bold text-destructive">{analytics.expired}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="coupons">
          <TabsList className="h-8">
            <TabsTrigger value="coupons" className="text-xs h-7"><Ticket className="h-3 w-3 mr-1" />Coupons</TabsTrigger>
            <TabsTrigger value="presets" className="text-xs h-7"><Zap className="h-3 w-3 mr-1" />Quick Create</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs h-7"><BarChart3 className="h-3 w-3 mr-1" />Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                  <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center">
                    <Ticket className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No coupons found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Code</TableHead>
                        <TableHead className="text-xs">Discount</TableHead>
                        <TableHead className="text-xs">Usage</TableHead>
                        <TableHead className="text-xs">Dates</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c: any) => {
                        const expired = c.expires_at && new Date(c.expires_at) < new Date();
                        const maxed = c.max_uses && c.used_count >= c.max_uses;
                        const usagePct = c.max_uses ? Math.round((c.used_count / c.max_uses) * 100) : null;
                        return (
                          <TableRow key={c.id} className="text-xs cursor-pointer" onClick={() => openEdit(c)}>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1.5">
                                <code className="font-mono font-semibold bg-muted px-1.5 py-0.5 rounded text-[11px]">{c.code}</code>
                                <button onClick={(e) => { e.stopPropagation(); copyCode(c.code); }} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                              {c.description && <p className="text-muted-foreground mt-0.5">{c.description}</p>}
                              <div className="flex gap-1 mt-0.5">
                                {c.free_shipping && <Badge variant="secondary" className="text-[9px]">Free Ship</Badge>}
                                {c.applies_to !== "all" && <Badge variant="outline" className="text-[9px]">{c.applies_to}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium">{c.discount_type === "percentage" ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}</span>
                              {c.min_order_amount > 0 && <p className="text-muted-foreground">Min ${Number(c.min_order_amount).toFixed(0)}</p>}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <span>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</span>
                                {usagePct !== null && <Progress value={usagePct} className="w-12 h-1.5" />}
                              </div>
                              {c.per_customer_limit && <p className="text-muted-foreground">{c.per_customer_limit}/customer</p>}
                            </TableCell>
                            <TableCell className="py-2 text-muted-foreground">
                              {c.starts_at && <p>From {format(new Date(c.starts_at), "MMM d")}</p>}
                              {c.expires_at ? format(new Date(c.expires_at), "MMM d, yyyy") : "No expiry"}
                            </TableCell>
                            <TableCell className="py-2">
                              {expired ? <Badge variant="secondary">Expired</Badge>
                                : maxed ? <Badge variant="secondary">Maxed</Badge>
                                : c.is_active ? <Badge className="bg-primary/15 text-primary border-0">Active</Badge>
                                : <Badge variant="outline">Inactive</Badge>}
                            </TableCell>
                            <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <Switch checked={c.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, active: v })} className="scale-75" />
                                <button onClick={() => deleteMutation.mutate(c.id)} className="text-muted-foreground hover:text-destructive p-1">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Create Presets */}
          <TabsContent value="presets" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRESETS.map((preset, i) => (
                <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => applyPreset(preset)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {preset.type === "free_shipping" ? <Gift className="h-4 w-4 text-primary" /> : 
                         preset.type === "buy_x_get_y" ? <Tag className="h-4 w-4 text-primary" /> :
                         <Ticket className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{preset.label}</p>
                        <code className="text-[10px] text-muted-foreground font-mono">{preset.code}</code>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs h-7">Use This Template</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Uses / Coupon</p>
                <p className="text-2xl font-bold">{analytics.avgUsage.toFixed(1)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Customer Savings</p>
                <p className="text-2xl font-bold">${analytics.totalSaved.toFixed(0)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Most Popular</p>
                <p className="text-lg font-bold font-mono">{analytics.topCoupon?.code || "—"}</p>
                <p className="text-[10px] text-muted-foreground">{analytics.topCoupon?.used_count || 0} uses</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expiring Soon</p>
                <p className="text-2xl font-bold">{analytics.expiringIn7Days.length}</p>
                <p className="text-[10px] text-muted-foreground">Next 7 days</p>
              </CardContent></Card>
            </div>

            {analytics.expiringIn7Days.length > 0 && (
              <Card className="border-amber-500/30">
                <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" /> Expiring Soon</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {analytics.expiringIn7Days.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <code className="font-mono font-medium">{c.code}</code>
                        <span className="text-muted-foreground">Expires {format(new Date(c.expires_at), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top coupons by usage */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Usage Ranking</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...coupons].sort((a: any, b: any) => (b.used_count || 0) - (a.used_count || 0)).slice(0, 10).map((c: any, i) => {
                    const maxUsage = Math.max(...(coupons as any[]).map(x => x.used_count || 0), 1);
                    return (
                      <div key={c.id} className="flex items-center gap-3 text-xs">
                        <span className="w-5 text-right text-muted-foreground font-medium">#{i + 1}</span>
                        <code className="font-mono font-medium w-24">{c.code}</code>
                        <Progress value={((c.used_count || 0) / maxUsage) * 100} className="flex-1 h-2" />
                        <span className="w-12 text-right font-medium">{c.used_count || 0}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
