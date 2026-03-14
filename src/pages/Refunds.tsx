import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RefundLineItem {
  title: string;
  quantity: number;
  unit_price: number;
  refund_amount: number;
}

interface Refund {
  id: string;
  refund_number: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  amount: number;
  reason: string;
  refund_method: string;
  status: string;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  refund_type: "full" | "partial";
  line_items?: RefundLineItem[];
}

const mockRefunds: Refund[] = [
  { id: "1", refund_number: "RFD-001", order_id: "o1", order_number: "ORD-1042", customer_name: "Sarah Chen", amount: 89.99, reason: "Item not as described", refund_method: "original_payment", status: "processed", processed_by: "admin@store.com", processed_at: "2026-03-12T10:00:00Z", created_at: "2026-03-10T14:30:00Z", refund_type: "full" },
  { id: "2", refund_number: "RFD-002", order_id: "o2", order_number: "ORD-1038", customer_name: "James Wilson", amount: 249.50, reason: "Damaged in transit", refund_method: "store_credit", status: "approved", processed_by: null, processed_at: null, created_at: "2026-03-11T09:15:00Z", refund_type: "full" },
  { id: "3", refund_number: "RFD-003", order_id: "o3", order_number: "ORD-1051", customer_name: "Maria Lopez", amount: 34.00, reason: "Wrong size", refund_method: "original_payment", status: "pending", processed_by: null, processed_at: null, created_at: "2026-03-13T16:45:00Z", refund_type: "partial", line_items: [{ title: "Blue T-Shirt (M)", quantity: 1, unit_price: 34.00, refund_amount: 34.00 }] },
  { id: "4", refund_number: "RFD-004", order_id: "o4", order_number: "ORD-1029", customer_name: "Tom Baker", amount: 150.00, reason: "Changed mind", refund_method: "manual", status: "rejected", processed_by: "admin@store.com", processed_at: "2026-03-12T11:00:00Z", created_at: "2026-03-09T08:20:00Z", refund_type: "partial", line_items: [{ title: "Wireless Headphones", quantity: 1, unit_price: 199.99, refund_amount: 150.00 }] },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", variant: "secondary", icon: <CheckCircle className="h-3 w-3" /> },
  processed: { label: "Processed", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const methodLabels: Record<string, string> = {
  original_payment: "Original Payment",
  store_credit: "Store Credit",
  manual: "Manual / Bank Transfer",
};

export default function Refunds() {
  const [refunds, setRefunds] = useState(mockRefunds);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ order_number: "", amount: "", reason: "", refund_method: "original_payment", notes: "", refund_type: "full" as "full" | "partial" });
  const [lineItems, setLineItems] = useState<RefundLineItem[]>([{ title: "", quantity: 1, unit_price: 0, refund_amount: 0 }]);

  const addLineItem = () => setLineItems(prev => [...prev, { title: "", quantity: 1, unit_price: 0, refund_amount: 0 }]);
  const removeLineItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: keyof RefundLineItem, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const lineItemTotal = lineItems.reduce((s, i) => s + (Number(i.refund_amount) || 0), 0);

  const filtered = refunds.filter(r => {
    const matchSearch = !search || r.refund_number.toLowerCase().includes(search.toLowerCase()) || r.order_number.toLowerCase().includes(search.toLowerCase()) || r.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    pending: refunds.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0),
    processed: refunds.filter(r => r.status === "processed").reduce((s, r) => s + r.amount, 0),
    total: refunds.reduce((s, r) => s + r.amount, 0),
  };

  const handleCreate = () => {
    if (!form.order_number || !form.amount) { toast.error("Order number and amount required"); return; }
    const newRefund: Refund = {
      id: crypto.randomUUID(), refund_number: `RFD-${String(refunds.length + 1).padStart(3, "0")}`,
      order_id: "new", order_number: form.order_number, customer_name: "Customer",
      amount: parseFloat(form.amount), reason: form.reason, refund_method: form.refund_method,
      status: "pending", processed_by: null, processed_at: null, created_at: new Date().toISOString(),
    };
    setRefunds(prev => [newRefund, ...prev]);
    setDialogOpen(false);
    toast.success("Refund created");
  };

  const updateStatus = (id: string, status: string) => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status, processed_at: status === "processed" ? new Date().toISOString() : r.processed_at, processed_by: status !== "pending" ? "admin@store.com" : null } : r));
    toast.success(`Refund ${status}`);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Refunds</h1>
            <p className="text-sm text-muted-foreground">Track and process customer refunds</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Refund</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Refund</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Order Number</Label><Input value={form.order_number} onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))} placeholder="ORD-1234" /></div>
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
                <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for refund" /></div>
                <div>
                  <Label>Refund Method</Label>
                  <Select value={form.refund_method} onValueChange={v => setForm(f => ({ ...f, refund_method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(methodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Create Refund</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-500" /></div><div><p className="text-2xs text-muted-foreground">Pending</p><p className="text-lg font-semibold">${totals.pending.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div><div><p className="text-2xs text-muted-foreground">Processed</p><p className="text-lg font-semibold">${totals.processed.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div><div><p className="text-2xs text-muted-foreground">Total Refunds</p><p className="text-lg font-semibold">${totals.total.toFixed(2)}</p></div></CardContent></Card>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search refunds…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refund #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const sc = statusConfig[r.status];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.refund_number}</TableCell>
                      <TableCell className="text-primary cursor-pointer">{r.order_number}</TableCell>
                      <TableCell>{r.customer_name}</TableCell>
                      <TableCell className="font-semibold">${r.amount.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{methodLabels[r.refund_method]}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell><Badge variant={sc.variant} className="gap-1">{sc.icon}{sc.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status === "pending" && <><Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "approved")}>Approve</Button><Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "rejected")}>Reject</Button></>}
                          {r.status === "approved" && <Button size="sm" onClick={() => updateStatus(r.id, "processed")}>Process</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No refunds found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
