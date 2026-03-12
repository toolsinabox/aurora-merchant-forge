import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Ticket, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";

interface CouponForm {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  expires_at: string;
  is_active: boolean;
}

const emptyForm: CouponForm = {
  code: "", description: "", discount_type: "percentage",
  discount_value: 10, min_order_amount: 0, max_uses: null, expires_at: "", is_active: true,
};

export default function Coupons() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const { error } = await supabase.from("coupons").insert({
        store_id: currentStore.id,
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        max_uses: form.max_uses,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Coupon created");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Discount Codes</h1>
            <p className="text-xs text-muted-foreground">Create and manage coupon codes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setForm(emptyForm)}>
                <Plus className="h-4 w-4 mr-1" /> Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Coupon</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Code *</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" required className="uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.discount_type} onValueChange={(v: "percentage" | "fixed") => setForm({ ...form, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Value *</Label>
                    <Input type="number" min={0} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: +e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Min Order ($)</Label>
                    <Input type="number" min={0} step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Max Uses</Label>
                    <Input type="number" min={1} value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? +e.target.value : null })} placeholder="Unlimited" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expires</Label>
                    <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Coupon"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : coupons.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No coupons yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c: any) => {
                    const expired = c.expires_at && new Date(c.expires_at) < new Date();
                    const maxed = c.max_uses && c.used_count >= c.max_uses;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono font-semibold bg-muted px-1.5 py-0.5 rounded">{c.code}</code>
                            <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}
                          {c.min_order_amount > 0 && <p className="text-xs text-muted-foreground">Min ${Number(c.min_order_amount).toFixed(2)}</p>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.expires_at ? format(new Date(c.expires_at), "MMM d, yyyy") : "Never"}
                        </TableCell>
                        <TableCell>
                          {expired ? <Badge variant="secondary">Expired</Badge>
                            : maxed ? <Badge variant="secondary">Maxed</Badge>
                            : c.is_active ? <Badge className="bg-emerald-500/15 text-emerald-600 border-0">Active</Badge>
                            : <Badge variant="outline">Inactive</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={c.is_active}
                              onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, active: v })}
                              className="scale-75"
                            />
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
