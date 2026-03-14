import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, FileText, ArrowRight, Printer, Copy, BookTemplate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function Quotes() {
  const { currentStore, user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState<string | null>(null);
  const [counterItems, setCounterItems] = useState<any[]>([]);
  const [counterNote, setCounterNote] = useState("");
  const [counterSaving, setCounterSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({
    customer_id: "",
    notes: "",
    valid_days: "30",
    items: [{ title: "", quantity: 1, unit_price: 0 }],
  });
  const [creating, setCreating] = useState(false);
  const [templates, setTemplates] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("quote_templates") || "[]"); } catch { return []; }
  });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const fetchQuotes = async () => {
    if (!currentStore) return;
    const { data } = await supabase
      .from("order_quotes" as any)
      .select("*, customers:customer_id(name, email)")
      .eq("store_id", currentStore.id)
      .order("created_at", { ascending: false });
    setQuotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
    if (currentStore) {
      supabase.from("customers").select("id, name, email").eq("store_id", currentStore.id).order("name").then(({ data }) => setCustomers(data || []));
    }
  }, [currentStore]);

  const addItem = () => setForm({ ...form, items: [...form.items, { title: "", quantity: 1, unit_price: 0 }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: any) => {
    const items = [...form.items];
    (items[i] as any)[field] = value;
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    if (!currentStore || !user) return;
    const validItems = form.items.filter(i => i.title.trim());
    if (validItems.length === 0) { toast.error("Add at least one item"); return; }
    setCreating(true);

    const subtotal = validItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const total = subtotal;
    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(form.valid_days || "30"));

    const { data: quote, error } = await supabase.from("order_quotes" as any).insert({
      store_id: currentStore.id,
      quote_number: quoteNumber,
      customer_id: form.customer_id || null,
      subtotal, total,
      notes: form.notes || null,
      valid_until: validUntil.toISOString(),
      created_by: user.id,
    }).select().single();

    if (error || !quote) { toast.error("Failed to create quote"); setCreating(false); return; }

    await supabase.from("order_quote_items" as any).insert(
      validItems.map(i => ({
        quote_id: (quote as any).id,
        store_id: currentStore.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      }))
    );

    toast.success(`Quote ${quoteNumber} created`);
    setCreateOpen(false);
    setForm({ customer_id: "", notes: "", valid_days: "30", items: [{ title: "", quantity: 1, unit_price: 0 }] });
    setCreating(false);
    fetchQuotes();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("order_quotes" as any).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success(`Quote ${status}`);
    fetchQuotes();
  };

  const openCounterOffer = async (quoteId: string) => {
    const { data: items } = await supabase.from("order_quote_items" as any).select("*").eq("quote_id", quoteId);
    setCounterItems((items || []).map((i: any) => ({ ...i, new_price: i.unit_price, new_qty: i.quantity })));
    setCounterNote("");
    setCounterOpen(quoteId);
  };

  const submitCounterOffer = async () => {
    if (!counterOpen || !currentStore) return;
    setCounterSaving(true);
    try {
      for (const item of counterItems) {
        await supabase.from("order_quote_items" as any).update({
          unit_price: item.new_price,
          quantity: item.new_qty,
          total: item.new_price * item.new_qty,
        }).eq("id", item.id);
      }
      const newTotal = counterItems.reduce((s: number, i: any) => s + i.new_price * i.new_qty, 0);
      await supabase.from("order_quotes" as any).update({
        subtotal: newTotal, total: newTotal,
        status: "sent",
        notes: counterNote ? `[Counter-offer] ${counterNote}` : undefined,
        updated_at: new Date().toISOString(),
      }).eq("id", counterOpen);
      toast.success("Counter-offer sent to customer");
      setCounterOpen(null);
      fetchQuotes();
    } catch (err: any) { toast.error(err.message); }
    finally { setCounterSaving(false); }
  };

  const convertToOrder = async (quote: any) => {
    if (!currentStore || !user) return;
    const { data: items } = await supabase.from("order_quote_items" as any).select("*").eq("quote_id", quote.id);
    if (!items || items.length === 0) { toast.error("No items in quote"); return; }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const { data: order, error } = await supabase.from("orders").insert({
      store_id: currentStore.id,
      order_number: orderNumber,
      customer_id: quote.customer_id || null,
      subtotal: quote.subtotal,
      total: quote.total,
      items_count: (items as any[]).length,
      notes: `Converted from quote ${quote.quote_number}`,
    }).select().single();

    if (error || !order) { toast.error("Failed to create order"); return; }

    await supabase.from("order_items").insert(
      (items as any[]).map((i: any) => ({
        order_id: order.id,
        store_id: currentStore.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      }))
    );

    await supabase.from("order_quotes" as any).update({
      status: "converted",
      converted_order_id: order.id,
      updated_at: new Date().toISOString(),
    }).eq("id", quote.id);

    toast.success(`Order ${orderNumber} created from quote`);
    fetchQuotes();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "draft": return "secondary";
      case "sent": return "default";
      case "approved": return "default";
      case "rejected": return "destructive";
      case "converted": return "default";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Quotes</h1>
            <p className="text-xs text-muted-foreground">Create and manage customer quotes</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Copy className="h-3.5 w-3.5" /> Templates</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Quote Templates</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name..." className="h-8 text-xs flex-1" />
                    <Button size="sm" className="text-xs" disabled={!templateName.trim() || form.items.every(i => !i.title)} onClick={() => {
                      const tpl = { id: crypto.randomUUID(), name: templateName, items: form.items.filter(i => i.title), notes: form.notes, valid_days: form.valid_days, createdAt: new Date().toISOString() };
                      const updated = [...templates, tpl];
                      setTemplates(updated);
                      localStorage.setItem("quote_templates", JSON.stringify(updated));
                      setTemplateName("");
                      toast.success(`Template "${tpl.name}" saved`);
                    }}>Save Current</Button>
                  </div>
                  {templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No templates yet. Fill in quote items above, then save as template.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {templates.map(tpl => (
                        <div key={tpl.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <p className="text-xs font-medium">{tpl.name}</p>
                            <p className="text-[10px] text-muted-foreground">{tpl.items.length} item(s) · {tpl.valid_days} days valid</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-xs h-6 px-2" onClick={() => {
                              setForm({ ...form, items: tpl.items.map((i: any) => ({ ...i })), notes: tpl.notes || form.notes, valid_days: tpl.valid_days || form.valid_days });
                              setTemplateOpen(false);
                              toast.success(`Template "${tpl.name}" loaded`);
                            }}>Use</Button>
                            <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-destructive" onClick={() => {
                              const updated = templates.filter(t => t.id !== tpl.id);
                              setTemplates(updated);
                              localStorage.setItem("quote_templates", JSON.stringify(updated));
                              toast.success("Template deleted");
                            }}>✕</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Quote</Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Quote</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Customer</Label>
                    <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">{c.name} ({c.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valid for (days)</Label>
                    <Input className="h-8 text-xs" type="number" value={form.valid_days} onChange={(e) => setForm({ ...form, valid_days: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Line Items</Label>
                    <Button variant="outline" size="sm" className="text-xs h-6" onClick={addItem}>+ Item</Button>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_60px_80px_24px] gap-2 items-end">
                      <Input className="h-8 text-xs" placeholder="Item description" value={item.title} onChange={(e) => updateItem(i, "title", e.target.value)} />
                      <Input className="h-8 text-xs" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
                      <Input className="h-8 text-xs" type="number" step="0.01" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
                      {form.items.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-6 text-destructive" onClick={() => removeItem(i)}>×</Button>}
                    </div>
                  ))}
                  <p className="text-xs text-right font-medium">Total: ${form.items.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2)}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea className="text-xs" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create Quote"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4"><Skeleton className="h-32 w-full" /></div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No quotes yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Quote #</TableHead>
                    <TableHead className="text-xs h-8">Customer</TableHead>
                    <TableHead className="text-xs h-8">Status</TableHead>
                    <TableHead className="text-xs h-8 text-right">Total</TableHead>
                    <TableHead className="text-xs h-8">Valid Until</TableHead>
                    <TableHead className="text-xs h-8">Date</TableHead>
                    <TableHead className="text-xs h-8 w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((q: any) => (
                    <TableRow key={q.id} className="text-xs">
                      <TableCell className="py-2 font-mono font-medium">{q.quote_number}</TableCell>
                      <TableCell className="py-2">{(q.customers as any)?.name || "—"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={statusColor(q.status) as any} className="text-[10px] capitalize">{q.status}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(q.total).toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{q.valid_until ? format(new Date(q.valid_until), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{format(new Date(q.created_at), "MMM d")}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-1">
                          {q.status === "draft" && (
                            <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateStatus(q.id, "sent")}>Send</Button>
                          )}
                          {q.status === "sent" && (
                            <>
                              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateStatus(q.id, "approved")}>Approve</Button>
                              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateStatus(q.id, "rejected")}>Reject</Button>
                            </>
                          )}
                          {q.status === "approved" && !q.converted_order_id && (
                            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => convertToOrder(q)}>
                              <ArrowRight className="h-3 w-3" /> Convert
                            </Button>
                          )}
                          {q.converted_order_id && (
                            <span className="text-[10px] text-muted-foreground">Converted</span>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(`quotes/${q.id}/print`)}>
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
