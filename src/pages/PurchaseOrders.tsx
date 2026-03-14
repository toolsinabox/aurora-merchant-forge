import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Search, ClipboardList, Printer, PackageCheck, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface POForm {
  po_number: string;
  supplier_id: string;
  status: string;
  notes: string;
  expected_date: string;
  subtotal: number;
  tax: number;
  shipping: number;
}

const genPO = () => `PO-${Date.now().toString(36).toUpperCase()}`;

const emptyForm: POForm = {
  po_number: genPO(), supplier_id: "", status: "draft", notes: "",
  expected_date: "", subtotal: 0, tax: 0, shipping: 0,
};

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline", pending_approval: "secondary", sent: "secondary", partial: "secondary", received: "default", closed: "default", cancelled: "destructive",
};

export default function PurchaseOrders() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<POForm>({ ...emptyForm });
  const [search, setSearch] = useState("");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receivePO, setReceivePO] = useState<any>(null);
  const [poItems, setPOItems] = useState<any[]>([]);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [loadingItems, setLoadingItems] = useState(false);

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchase_orders", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers_list", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("store_id", currentStore.id)
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    enabled: !!currentStore,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const total = form.subtotal + form.tax + form.shipping;
      const { error } = await supabase.from("purchase_orders").insert({
        store_id: currentStore.id,
        po_number: form.po_number,
        supplier_id: form.supplier_id || null,
        status: form.status,
        notes: form.notes || null,
        expected_date: form.expected_date || null,
        subtotal: form.subtotal,
        tax: form.tax,
        shipping: form.shipping,
        total,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Purchase order created");
      setOpen(false);
      setForm({ ...emptyForm, po_number: genPO() });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "received") update.received_date = new Date().toISOString();
      const { error } = await supabase.from("purchase_orders").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("PO deleted");
    },
  });

  const openReceiveDialog = async (po: any) => {
    setReceivePO(po);
    setReceiveOpen(true);
    setLoadingItems(true);
    const { data } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("purchase_order_id", po.id)
      .order("title");
    const items = data || [];
    setPOItems(items);
    const qtys: Record<string, number> = {};
    items.forEach((item: any) => {
      qtys[item.id] = 0;
    });
    setReceiveQtys(qtys);
    setLoadingItems(false);
  };

  const handleReceiveItems = async () => {
    if (!receivePO || !currentStore) return;
    let anyReceived = false;
    for (const item of poItems) {
      const qty = receiveQtys[item.id] || 0;
      if (qty <= 0) continue;
      anyReceived = true;
      const newReceived = Math.min(item.quantity_received + qty, item.quantity_ordered);
      await supabase
        .from("purchase_order_items")
        .update({ quantity_received: newReceived })
        .eq("id", item.id);
      
      // Update inventory stock if product is tracked
      if (item.product_id) {
        const { data: stockRows } = await supabase
          .from("inventory_stock")
          .select("id, quantity")
          .eq("product_id", item.product_id)
          .eq("store_id", currentStore.id)
          .limit(1);
        if (stockRows && stockRows.length > 0) {
          await supabase
            .from("inventory_stock")
            .update({ quantity: stockRows[0].quantity + qty })
            .eq("id", stockRows[0].id);
        }
      }
    }
    if (!anyReceived) {
      toast.error("Enter quantities to receive");
      return;
    }
    // Check if all items fully received
    const { data: updatedItems } = await supabase
      .from("purchase_order_items")
      .select("quantity_ordered, quantity_received")
      .eq("purchase_order_id", receivePO.id);
    const allReceived = (updatedItems || []).every((i: any) => i.quantity_received >= i.quantity_ordered);
    const someReceived = (updatedItems || []).some((i: any) => i.quantity_received > 0);
    const newStatus = allReceived ? "received" : someReceived ? "partial" : receivePO.status;
    const update: any = { status: newStatus };
    if (allReceived) update.received_date = new Date().toISOString();
    await supabase.from("purchase_orders").update(update).eq("id", receivePO.id);
    
    queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    toast.success(allReceived ? "All items received — PO marked as received" : "Items received — PO partially fulfilled");
    setReceiveOpen(false);
  };

  const filtered = pos.filter((p: any) =>
    p.po_number.toLowerCase().includes(search.toLowerCase()) ||
    (p.suppliers?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Purchase Orders</h1>
            <p className="text-xs text-muted-foreground">{pos.length} purchase orders</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm({ ...emptyForm, po_number: genPO() }); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New PO</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Purchase Order</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div><Label>PO Number</Label><Input value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} className="font-mono" /></div>
                <div>
                  <Label>Supplier</Label>
                  <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Expected Delivery</Label><Input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Subtotal</Label><Input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: Number(e.target.value) })} /></div>
                  <div><Label>Tax</Label><Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} /></div>
                  <div><Label>Shipping</Label><Input type="number" value={form.shipping} onChange={e => setForm({ ...form, shipping: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={() => createMutation.mutate()} disabled={!form.po_number || createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create PO"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">PO Number</TableHead>
                  <TableHead className="text-xs h-8">Supplier</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Expected</TableHead>
                  <TableHead className="text-xs h-8">Total</TableHead>
                  <TableHead className="text-xs h-8">Created</TableHead>
                  <TableHead className="text-xs h-8 w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    No purchase orders found
                  </TableCell></TableRow>
                ) : filtered.map((p: any) => (
                  <TableRow key={p.id} className="text-xs">
                    <TableCell className="py-2 font-mono font-medium">{p.po_number}</TableCell>
                    <TableCell className="py-2">{p.suppliers?.name || "—"}</TableCell>
                    <TableCell className="py-2">
                      <Select value={p.status} onValueChange={status => updateStatus.mutate({ id: p.id, status })}>
                        <SelectTrigger className="h-6 w-28 text-[10px]">
                          <Badge variant={statusColors[p.status] || "outline"} className="text-[10px]">{p.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["draft", "pending_approval", "sent", "partial", "received", "closed", "cancelled"].map(s => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">{p.expected_date ? format(new Date(p.expected_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell className="py-2 font-medium">${Number(p.total).toFixed(2)}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        {p.status === "pending_approval" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" title="Approve" onClick={() => updateStatus.mutate({ id: p.id, status: "sent" })}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" title="Reject" onClick={() => updateStatus.mutate({ id: p.id, status: "cancelled" })}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {p.status === "draft" && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Submit for Approval" onClick={() => updateStatus.mutate({ id: p.id, status: "pending_approval" })}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {["sent", "partial"].includes(p.status) && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Receive Items" onClick={() => openReceiveDialog(p)}>
                            <PackageCheck className="h-3 w-3" />
                          </Button>
                        )}
                        <Link to={`/purchase-orders/${p.id}/print`}>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Print PO"><Printer className="h-3 w-3" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Receive Items Dialog */}
        <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Receive Items — {receivePO?.po_number}</DialogTitle>
            </DialogHeader>
            {loadingItems ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading items...</p>
            ) : poItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No line items on this PO. Add items first.</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs w-20">Ordered</TableHead>
                      <TableHead className="text-xs w-20">Received</TableHead>
                      <TableHead className="text-xs w-24">Receive Now</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poItems.map((item: any) => {
                      const remaining = item.quantity_ordered - item.quantity_received;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">
                            <div>{item.title}</div>
                            {item.sku && <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>}
                          </TableCell>
                          <TableCell className="text-sm">{item.quantity_ordered}</TableCell>
                          <TableCell className="text-sm">{item.quantity_received}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              className="h-7 w-20 text-xs"
                              value={receiveQtys[item.id] || 0}
                              onChange={(e) => setReceiveQtys(prev => ({ ...prev, [item.id]: Math.min(Number(e.target.value), remaining) }))}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                    const all: Record<string, number> = {};
                    poItems.forEach((item: any) => { all[item.id] = item.quantity_ordered - item.quantity_received; });
                    setReceiveQtys(all);
                  }}>Receive All</Button>
                  <Button size="sm" className="text-xs" onClick={handleReceiveItems}>Confirm Receipt</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
