import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Search, AlertTriangle, CheckCircle, Clock, Lock, Unlock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const HOLD_REASONS = [
  "Fraud review", "Payment verification", "Address verification",
  "High value order", "New customer review", "Manual hold", "Suspicious activity",
];

export default function OrderHolds() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"active" | "released" | "all">("active");
  const [form, setForm] = useState({ order_id: "", hold_reason: "", notes: "" });

  const { data: holds = [], isLoading } = useQuery({
    queryKey: ["order_holds", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("order_holds" as any).select("*, orders:order_id(order_number, customer_name, total, status)")
        .eq("store_id", storeId!).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders_for_hold", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, order_number, customer_name, total")
        .eq("store_id", storeId!).in("status", ["pending", "processing"]).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const filtered = holds
    .filter((h: any) => filter === "all" || (filter === "active" ? h.is_active : !h.is_active))
    .filter((h: any) => !search ||
      (h.orders as any)?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      h.hold_reason?.toLowerCase().includes(search.toLowerCase())
    );

  const activeCount = holds.filter((h: any) => h.is_active).length;

  const createHold = async () => {
    if (!form.order_id || !form.hold_reason || !storeId) { toast.error("Order and reason required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("order_holds" as any).insert({
      store_id: storeId, order_id: form.order_id, hold_reason: form.hold_reason,
      notes: form.notes || null, held_by: user?.email || null, is_active: true,
    });
    toast.success("Order placed on hold");
    setShowCreate(false); setForm({ order_id: "", hold_reason: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["order_holds"] });
  };

  const releaseHold = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("order_holds" as any).update({
      is_active: false, released_at: new Date().toISOString(), released_by: user?.email || null,
    }).eq("id", id);
    toast.success("Hold released");
    qc.invalidateQueries({ queryKey: ["order_holds"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              Order Holds
              {activeCount > 0 && <Badge variant="destructive" className="text-[10px]">{activeCount} active</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground">Review and manage orders on hold for fraud or verification</p>
          </div>
          <Button size="sm" className="text-xs h-8 gap-1" onClick={() => setShowCreate(true)}>
            <Lock className="h-3.5 w-3.5" /> Place Hold
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Holds</p><p className="text-xl font-bold text-destructive">{activeCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Released Today</p><p className="text-xl font-bold">{holds.filter((h: any) => !h.is_active && h.released_at && new Date(h.released_at).toDateString() === new Date().toDateString()).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-muted-foreground">{holds.length}</p></CardContent></Card>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search order# or reason..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8 text-right">Amount</TableHead>
                  <TableHead className="text-xs h-8">Reason</TableHead>
                  <TableHead className="text-xs h-8">Held By</TableHead>
                  <TableHead className="text-xs h-8">Duration</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    <Shield className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />No holds
                  </TableCell></TableRow>
                ) : filtered.map((h: any) => (
                  <TableRow key={h.id} className={`text-xs ${h.is_active ? "bg-destructive/5" : ""}`}>
                    <TableCell className="py-1.5 font-mono font-medium">{(h.orders as any)?.order_number || "—"}</TableCell>
                    <TableCell className="py-1.5">{(h.orders as any)?.customer_name || "—"}</TableCell>
                    <TableCell className="py-1.5 text-right font-semibold">${Number((h.orders as any)?.total || 0).toFixed(2)}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[10px]">{h.hold_reason}</Badge>
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{h.held_by || "—"}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">
                      {formatDistanceToNow(new Date(h.created_at), { addSuffix: false })}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {h.is_active ? (
                        <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-2.5 w-2.5" /> On Hold</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle className="h-2.5 w-2.5" /> Released</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      {h.is_active && (
                        <Button variant="outline" size="sm" className="text-xs h-6 gap-1" onClick={() => releaseHold(h.id)}>
                          <Unlock className="h-3 w-3" /> Release
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-sm">Place Order on Hold</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Order *</Label>
                <Select value={form.order_id} onValueChange={v => setForm(f => ({ ...f, order_id: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select order..." /></SelectTrigger>
                  <SelectContent>
                    {orders.map((o: any) => (
                      <SelectItem key={o.id} value={o.id} className="text-xs">{o.order_number} — {o.customer_name} (${Number(o.total).toFixed(2)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reason *</Label>
                <Select value={form.hold_reason} onValueChange={v => setForm(f => ({ ...f, hold_reason: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>
                    {HOLD_REASONS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-xs" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" className="text-xs gap-1" onClick={createHold}><Lock className="h-3 w-3" /> Place Hold</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
