import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Ticket, Trash2, Copy, Search } from "lucide-react";
import { format } from "date-fns";

interface CouponForm {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  per_customer_limit: number | null;
  expires_at: string;
  starts_at: string;
  is_active: boolean;
  free_shipping: boolean;
  applies_to: string;
}

const emptyForm: CouponForm = {
  code: "", description: "", discount_type: "percentage",
  discount_value: 10, min_order_amount: 0, max_uses: null, per_customer_limit: null,
  expires_at: "", starts_at: "", is_active: true, free_shipping: false, applies_to: "all",
};

export default function Coupons() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [search, setSearch] = useState("");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
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
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        max_uses: form.max_uses,
        per_customer_limit: form.per_customer_limit,
        expires_at: form.expires_at || null,
        starts_at: form.starts_at || null,
        is_active: form.is_active,
        free_shipping: form.free_shipping,
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
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
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
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount || 0,
      max_uses: c.max_uses,
      per_customer_limit: c.per_customer_limit,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
      starts_at: c.starts_at ? c.starts_at.split("T")[0] : "",
      is_active: c.is_active,
      free_shipping: c.free_shipping || false,
      applies_to: c.applies_to || "all",
    });
    setEditId(c.id);
    setOpen(true);
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied"); };

  const filtered = (coupons as any[]).filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = (coupons as any[]).filter(c => c.is_active).length;
  const expiredCount = (coupons as any[]).filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;
  const totalUsed = (coupons as any[]).reduce((s, c) => s + (c.used_count || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Discount Codes</h1>
            <p className="text-xs text-muted-foreground">{coupons.length} coupons</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { if (!o) { setEditId(null); } setOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setForm(emptyForm); setEditId(null); }}>
                <Plus className="h-4 w-4 mr-1" /> Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" required className="uppercase h-8 text-xs" /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.discount_type} onValueChange={(v: "percentage" | "fixed") => setForm({ ...form, discount_type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage" className="text-xs">Percentage (%)</SelectItem>
                        <SelectItem value="fixed" className="text-xs">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Value *</Label><Input type="number" min={0} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: +e.target.value })} required className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Min Order ($)</Label><Input type="number" min={0} step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} className="h-8 text-xs" /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Applies To</Label>
                    <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Products</SelectItem>
                        <SelectItem value="specific_products" className="text-xs">Specific Products</SelectItem>
                        <SelectItem value="specific_categories" className="text-xs">Specific Categories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Max Uses</Label><Input type="number" min={1} value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? +e.target.value : null })} placeholder="Unlimited" className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Per Customer Limit</Label><Input type="number" min={1} value={form.per_customer_limit ?? ""} onChange={(e) => setForm({ ...form, per_customer_limit: e.target.value ? +e.target.value : null })} placeholder="Unlimited" className="h-8 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Starts</Label><Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Expires</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="h-8 text-xs" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="h-8 text-xs" /></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.free_shipping} onCheckedChange={(v) => setForm({ ...form, free_shipping: !!v })} id="free-ship" />
                    <Label htmlFor="free-ship" className="text-xs">Free Shipping</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                    <Label className="text-xs">Active</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full text-xs" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Coupon"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{coupons.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xs text-muted-foreground">Active</p>
                <p className="text-lg font-bold">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xs text-muted-foreground">Expired</p>
                <p className="text-lg font-bold">{expiredCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-info/10 flex items-center justify-center">
                <Copy className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-2xs text-muted-foreground">Total Uses</p>
                <p className="text-lg font-bold">{totalUsed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
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
                          {c.free_shipping && <Badge variant="secondary" className="text-[9px] mt-0.5">Free Shipping</Badge>}
                        </TableCell>
                        <TableCell className="py-2">
                          {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}
                          {c.min_order_amount > 0 && <p className="text-muted-foreground">Min ${Number(c.min_order_amount).toFixed(2)}</p>}
                        </TableCell>
                        <TableCell className="py-2">
                          {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
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
      </div>
    </AdminLayout>
  );
}