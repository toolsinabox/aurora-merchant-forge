import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProducts, useCustomers } from "@/hooks/use-data";
import { toast } from "sonner";
import { Plus, PackageX, Check, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  ordered: "secondary",
  fulfilled: "default",
  cancelled: "destructive",
};

export default function Backorders() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ product_id: "", customer_id: "", quantity: "1", expected_date: "", notes: "" });

  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();

  const { data: backorders = [], isLoading } = useQuery({
    queryKey: ["backorders", currentStore?.id, filter],
    queryFn: async () => {
      if (!currentStore) return [];
      let q = supabase
        .from("backorders" as any)
        .select("*, product:product_id(title, sku), customer:customer_id(name, email)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!currentStore || !form.product_id) throw new Error("Product required");
      const { error } = await supabase.from("backorders" as any).insert({
        store_id: currentStore.id,
        product_id: form.product_id,
        customer_id: form.customer_id || null,
        quantity: parseInt(form.quantity) || 1,
        expected_date: form.expected_date || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backorders"] });
      setOpen(false);
      setForm({ product_id: "", customer_id: "", quantity: "1", expected_date: "", notes: "" });
      toast.success("Backorder created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (status === "fulfilled") update.fulfilled_at = new Date().toISOString();
      const { error } = await supabase.from("backorders" as any).update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backorders"] });
      toast.success("Status updated");
    },
  });

  const pending = (backorders as any[]).filter((b: any) => b.status === "pending").length;
  const totalQty = (backorders as any[]).filter((b: any) => b.status === "pending").reduce((s: number, b: any) => s + (b.quantity || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Backorders</h1>
            <p className="text-xs text-muted-foreground">Track and manage items on backorder</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> New Backorder</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="text-sm">Create Backorder</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Product *</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Customer (optional)</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input className="h-8 text-xs" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Expected Date</Label>
                    <Input className="h-8 text-xs" type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input className="h-8 text-xs" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>
                <Button size="sm" className="w-full text-xs" onClick={() => create.mutate()} disabled={create.isPending}>
                  {create.isPending ? "Creating..." : "Create Backorder"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-lg font-bold">{pending}</p><p className="text-[10px] text-muted-foreground">Pending</p></div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><PackageX className="h-4 w-4 text-muted-foreground" /><div><p className="text-lg font-bold">{totalQty}</p><p className="text-[10px] text-muted-foreground">Units on Backorder</p></div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" /><div><p className="text-lg font-bold">{(backorders as any[]).filter((b: any) => b.expected_date && new Date(b.expected_date) < new Date() && b.status === "pending").length}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div></div>
          </CardContent></Card>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="ordered" className="text-xs">Ordered</SelectItem>
              <SelectItem value="fulfilled" className="text-xs">Fulfilled</SelectItem>
              <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Product</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8">Qty</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Expected</TableHead>
                  <TableHead className="text-xs h-8">Notes</TableHead>
                  <TableHead className="text-xs h-8">Created</TableHead>
                  <TableHead className="text-xs h-8 w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : (backorders as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      <PackageX className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No backorders. Items will appear here when stock is unavailable.
                    </TableCell>
                  </TableRow>
                ) : (
                  (backorders as any[]).map((bo: any) => (
                    <TableRow key={bo.id} className="text-xs">
                      <TableCell className="py-2">
                        <span className="font-medium">{bo.product?.title || "—"}</span>
                        {bo.product?.sku && <span className="text-muted-foreground ml-1 text-[10px]">({bo.product.sku})</span>}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">{bo.customer?.name || "—"}</TableCell>
                      <TableCell className="py-2 font-medium">{bo.quantity}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={statusColors[bo.status] || "outline"} className="text-[10px] capitalize">{bo.status}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">
                        {bo.expected_date ? (
                          <span className={new Date(bo.expected_date) < new Date() && bo.status === "pending" ? "text-destructive font-medium" : ""}>
                            {format(new Date(bo.expected_date), "MMM d, yyyy")}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">{bo.notes || "—"}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{format(new Date(bo.created_at), "MMM d")}</TableCell>
                      <TableCell className="py-2">
                        {bo.status === "pending" && (
                          <div className="flex gap-0.5">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateStatus.mutate({ id: bo.id, status: "ordered" })}>Ordered</Button>
                            <Button variant="default" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateStatus.mutate({ id: bo.id, status: "fulfilled" })}>
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {bo.status === "ordered" && (
                          <Button variant="default" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateStatus.mutate({ id: bo.id, status: "fulfilled" })}>Fulfill</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
