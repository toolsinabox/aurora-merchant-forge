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
import { Plus, Search, Printer, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["issued", "applied", "voided"];

export default function CreditNotes() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ order_id: "", amount: "", reason: "", notes: "" });

  const { data: creditNotes = [], isLoading } = useQuery({
    queryKey: ["credit_notes", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("credit_notes")
        .select("*, orders:order_id(order_number, customer_name)")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders_for_cn", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("id, order_number, customer_name, total")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false })
        .limit(200);
      return (data || []) as any[];
    },
  });

  const filtered = creditNotes
    .filter((cn: any) => statusFilter === "all" || cn.status === statusFilter)
    .filter((cn: any) => !search ||
      cn.credit_number?.toLowerCase().includes(search.toLowerCase()) ||
      (cn.orders as any)?.order_number?.toLowerCase().includes(search.toLowerCase())
    );

  const totalIssued = creditNotes.filter((cn: any) => cn.status === "issued").reduce((s: number, cn: any) => s + Number(cn.amount), 0);
  const totalApplied = creditNotes.filter((cn: any) => cn.status === "applied").reduce((s: number, cn: any) => s + Number(cn.amount), 0);

  const createCreditNote = async () => {
    if (!form.order_id || !form.amount || !storeId) { toast.error("Order and amount required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const creditNumber = `CN-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("credit_notes").insert({
      store_id: storeId, order_id: form.order_id, credit_number: creditNumber,
      amount: Number(form.amount), reason: form.reason || null, notes: form.notes || null,
      status: "issued", issued_by: user?.email || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Credit note ${creditNumber} created`);
    setShowForm(false); setForm({ order_id: "", amount: "", reason: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["credit_notes"] });
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("credit_notes").update({ status } as any).eq("id", id);
    toast.success(`Status updated to ${status}`);
    qc.invalidateQueries({ queryKey: ["credit_notes"] });
  };

  const printCreditNote = (cn: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Credit Note ${cn.credit_number}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}
      .header{border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px}
      h1{font-size:24px;margin:0}h2{font-size:14px;color:#666;margin:4px 0 0}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px}
      .meta-item{font-size:12px}.meta-label{color:#888}.meta-value{font-weight:600}
      .amount{font-size:32px;font-weight:700;text-align:center;padding:24px;background:#f5f5f5;border-radius:8px;margin:24px 0}
      .reason{margin-top:16px;padding:12px;background:#fafafa;border-radius:6px;font-size:13px}
      .footer{margin-top:32px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}</style></head><body>
      <div class="header"><h1>Credit Note</h1><h2>${cn.credit_number}</h2></div>
      <div class="meta">
        <div class="meta-item"><div class="meta-label">Order</div><div class="meta-value">${(cn.orders as any)?.order_number || "—"}</div></div>
        <div class="meta-item"><div class="meta-label">Customer</div><div class="meta-value">${(cn.orders as any)?.customer_name || "—"}</div></div>
        <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${format(new Date(cn.created_at), "dd MMM yyyy")}</div></div>
        <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">${cn.status.toUpperCase()}</div></div>
        <div class="meta-item"><div class="meta-label">Issued By</div><div class="meta-value">${cn.issued_by || "—"}</div></div>
      </div>
      <div class="amount">$${Number(cn.amount).toFixed(2)}</div>
      ${cn.reason ? `<div class="reason"><strong>Reason:</strong> ${cn.reason}</div>` : ""}
      ${cn.notes ? `<div class="reason"><strong>Notes:</strong> ${cn.notes}</div>` : ""}
      <div class="footer">Generated ${new Date().toLocaleString()} | ${currentStore?.name || "Store"}</div>
      <script>window.print();</script></body></html>`);
    w.document.close();
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Credit Notes</h1>
            <p className="text-xs text-muted-foreground">Issue and manage credit notes against orders</p>
          </div>
          <Button size="sm" className="text-xs h-8 gap-1" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Issue Credit Note
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Issued</p><p className="text-xl font-bold">{creditNotes.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-primary">${totalIssued.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Applied</p><p className="text-xl font-bold text-muted-foreground">${totalApplied.toFixed(2)}</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by CN# or order#..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">CN #</TableHead>
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8 text-right">Amount</TableHead>
                  <TableHead className="text-xs h-8">Reason</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />No credit notes
                  </TableCell></TableRow>
                ) : filtered.map((cn: any) => (
                  <TableRow key={cn.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono font-medium">{cn.credit_number}</TableCell>
                    <TableCell className="py-1.5 font-mono">{(cn.orders as any)?.order_number || "—"}</TableCell>
                    <TableCell className="py-1.5">{(cn.orders as any)?.customer_name || "—"}</TableCell>
                    <TableCell className="py-1.5 text-right font-semibold">${Number(cn.amount).toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground max-w-[150px] truncate">{cn.reason || "—"}</TableCell>
                    <TableCell className="py-1.5">
                      <Select value={cn.status} onValueChange={v => updateStatus(cn.id, v)}>
                        <SelectTrigger className="h-6 text-[10px] w-[90px] border-0 p-0">
                          <Badge variant={cn.status === "issued" ? "default" : cn.status === "applied" ? "secondary" : "outline"} className="text-[10px] capitalize">{cn.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{format(new Date(cn.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => printCreditNote(cn)}>
                        <Printer className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-sm">Issue Credit Note</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Order *</Label>
                <Select value={form.order_id} onValueChange={v => setForm(f => ({ ...f, order_id: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select order..." /></SelectTrigger>
                  <SelectContent>
                    {orders.map((o: any) => (
                      <SelectItem key={o.id} value={o.id} className="text-xs">
                        {o.order_number} — {o.customer_name} (${Number(o.total).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-xs" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Reason</Label>
                <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damaged goods">Damaged goods</SelectItem>
                    <SelectItem value="Wrong item shipped">Wrong item shipped</SelectItem>
                    <SelectItem value="Customer overcharged">Customer overcharged</SelectItem>
                    <SelectItem value="Returned goods">Returned goods</SelectItem>
                    <SelectItem value="Goodwill gesture">Goodwill gesture</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-xs" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={createCreditNote}>Issue Credit Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
