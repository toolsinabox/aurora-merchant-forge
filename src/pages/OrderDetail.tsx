import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useOrder, useUpdateOrder, useDeleteOrder,
  useOrderShipments, useCreateShipment, useUpdateShipment,
  useOrderTimeline, useCreateTimelineEvent,
  useOrderPayments, useCreateOrderPayment,
} from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Trash2, Package, CreditCard, Truck, User,
  Clock, Plus, ExternalLink, MessageSquare, Send, Tag, X, DollarSign, Printer,
  Scissors, Merge, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "refunded"];
const FULFILLMENT_STATUSES = ["unfulfilled", "partial", "fulfilled"];
const SHIPMENT_STATUSES = ["pending", "shipped", "in_transit", "delivered"];

function TimelineIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "shipment_created": return <Truck className={cls + " text-blue-500"} />;
    case "shipment_status": return <Package className={cls + " text-green-500"} />;
    case "status_change": return <Clock className={cls + " text-amber-500"} />;
    case "payment": return <CreditCard className={cls + " text-emerald-500"} />;
    default: return <MessageSquare className={cls + " text-muted-foreground"} />;
  }
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const { data: shipments = [] } = useOrderShipments(id);
  const { data: timeline = [] } = useOrderTimeline(id);
  const createShipment = useCreateShipment();
  const updateShipment = useUpdateShipment();
  const createTimelineEvent = useCreateTimelineEvent();

  const [notes, setNotes] = useState<string | null>(null);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newTag, setNewTag] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "manual", reference: "", notes: "" });
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: "", reason: "", notes: "" });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: "", reason: "" });
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitItems, setSplitItems] = useState<Record<string, number>>({});
  const [splitting, setSplitting] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeOrderNumber, setMergeOrderNumber] = useState("");
  const [mergeTarget, setMergeTarget] = useState<any>(null);
  const [merging, setMerging] = useState(false);
  const { user, currentStore } = useAuth();
  const queryClient = useQueryClient();

  const { data: payments = [] } = useOrderPayments(id);
  const createPayment = useCreateOrderPayment();

  // Credit notes
  const { data: creditNotes = [] } = useQuery({
    queryKey: ["credit-notes", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("credit_notes" as any)
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  // Shipment form state
  const [shipForm, setShipForm] = useState({
    carrier: "", tracking_number: "", tracking_url: "", notes: "",
    selectedItems: {} as Record<string, number>,
  });

  if (isLoading) {
    return <AdminLayout><div className="space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }
  if (!order) {
    return <AdminLayout><div className="text-center py-12 text-muted-foreground text-sm">Order not found.</div></AdminLayout>;
  }

  const currentNotes = notes !== null ? notes : ((order as any).notes || "");
  const orderItems = (order as any).order_items || [];
  const orderTags: string[] = (order as any).tags || [];

  const handleStatusChange = async (field: string, value: string) => {
    await updateOrder.mutateAsync({ id: order.id, [field]: value } as any);
    await createTimelineEvent.mutateAsync({
      order_id: order.id,
      event_type: "status_change",
      title: `${field.replace("_", " ")} changed`,
      description: `Changed to "${value}"`,
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim() || orderTags.includes(newTag.trim())) return;
    updateOrder.mutate({ id: order.id, tags: [...orderTags, newTag.trim()] } as any);
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    updateOrder.mutate({ id: order.id, tags: orderTags.filter(t => t !== tag) } as any);
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) return;
    await createPayment.mutateAsync({
      order_id: order.id,
      amount,
      payment_method: paymentForm.method,
      reference: paymentForm.reference || undefined,
      notes: paymentForm.notes || undefined,
    });
    await createTimelineEvent.mutateAsync({
      order_id: order.id,
      event_type: "payment",
      title: "Payment recorded",
      description: `$${amount.toFixed(2)} via ${paymentForm.method}${paymentForm.reference ? ` (${paymentForm.reference})` : ""}`,
    });
    setPaymentDialogOpen(false);
    setPaymentForm({ amount: "", method: "manual", reference: "", notes: "" });
  };

  const handleCreateShipment = async () => {
    const items = Object.entries(shipForm.selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([order_item_id, quantity]) => ({ order_item_id, quantity }));
    if (items.length === 0) return;
    await createShipment.mutateAsync({
      order_id: order.id,
      carrier: shipForm.carrier || undefined,
      tracking_number: shipForm.tracking_number || undefined,
      tracking_url: shipForm.tracking_url || undefined,
      notes: shipForm.notes || undefined,
      items,
    });
    setShipDialogOpen(false);
    setShipForm({ carrier: "", tracking_number: "", tracking_url: "", notes: "", selectedItems: {} });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await createTimelineEvent.mutateAsync({
      order_id: order.id,
      event_type: "note",
      title: "Comment added",
      description: newComment,
    });
    setNewComment("");
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{order.order_number}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate(`/orders/${order.id}/print`)}>
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </Button>
            {/* Split Order */}
            <Dialog open={splitOpen} onOpenChange={(o) => { setSplitOpen(o); if (o) setSplitItems({}); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1"><Scissors className="h-3.5 w-3.5" /> Split</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-base">Split Order</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground">Select items to move to a new order:</p>
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={!!splitItems[item.id]} onCheckedChange={(c) => {
                          setSplitItems(prev => c ? { ...prev, [item.id]: item.quantity } : (() => { const { [item.id]: _, ...rest } = prev; return rest; })());
                        }} />
                        <span>{item.title} × {item.quantity}</span>
                      </div>
                      {splitItems[item.id] && (
                        <Input type="number" className="h-6 w-16 text-xs" min={1} max={item.quantity}
                          value={splitItems[item.id]} onChange={(e) => setSplitItems(prev => ({ ...prev, [item.id]: Math.min(parseInt(e.target.value) || 1, item.quantity) }))} />
                      )}
                    </div>
                  ))}
                </div>
                <Button size="sm" disabled={Object.keys(splitItems).length === 0 || splitting} onClick={async () => {
                  setSplitting(true);
                  const newOrderNumber = `${order.order_number}-S${Date.now().toString(36).slice(-3).toUpperCase()}`;
                  const selectedItems = orderItems.filter((i: any) => splitItems[i.id]);
                  const newSubtotal = selectedItems.reduce((s: number, i: any) => s + i.unit_price * (splitItems[i.id] || 0), 0);
                  
                  const { data: newOrder, error } = await supabase.from("orders").insert({
                    store_id: order.store_id,
                    order_number: newOrderNumber,
                    customer_id: (order as any).customer_id,
                    subtotal: newSubtotal,
                    total: newSubtotal,
                    items_count: Object.keys(splitItems).length,
                    notes: `Split from ${order.order_number}`,
                  }).select().single();
                  
                  if (error || !newOrder) { toast.error("Failed to split order"); setSplitting(false); return; }
                  
                  await supabase.from("order_items").insert(
                    selectedItems.map((i: any) => ({
                      order_id: newOrder.id, store_id: order.store_id,
                      product_id: i.product_id, variant_id: i.variant_id,
                      title: i.title, sku: i.sku,
                      quantity: splitItems[i.id], unit_price: i.unit_price,
                      total: i.unit_price * splitItems[i.id],
                    }))
                  );
                  
                  // Update or remove items from original order
                  for (const item of selectedItems) {
                    const remaining = item.quantity - splitItems[item.id];
                    if (remaining <= 0) {
                      await supabase.from("order_items").delete().eq("id", item.id);
                    } else {
                      await supabase.from("order_items").update({ quantity: remaining, total: item.unit_price * remaining }).eq("id", item.id);
                    }
                  }
                  
                  // Update original order totals
                  const remainingItems = orderItems.filter((i: any) => !splitItems[i.id] || i.quantity > splitItems[i.id]);
                  const newOrigSubtotal = Number(order.subtotal) - newSubtotal;
                  await supabase.from("orders").update({
                    subtotal: newOrigSubtotal, total: newOrigSubtotal,
                    items_count: remainingItems.length,
                  }).eq("id", order.id);
                  
                  toast.success(`Order split. New order: ${newOrderNumber}`);
                  queryClient.invalidateQueries({ queryKey: ["order", id] });
                  queryClient.invalidateQueries({ queryKey: ["orders"] });
                  setSplitOpen(false);
                  setSplitting(false);
                }}>{splitting ? "Splitting..." : "Split Selected Items"}</Button>
              </DialogContent>
            </Dialog>
            {/* Merge Order */}
            <Dialog open={mergeOpen} onOpenChange={(o) => { setMergeOpen(o); setMergeTarget(null); setMergeOrderNumber(""); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1"><Merge className="h-3.5 w-3.5" /> Merge</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle className="text-base">Merge Order</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground">Find another order to merge into this one. All items from the other order will be moved here.</p>
                <div className="flex gap-2">
                  <Input className="h-8 text-xs" placeholder="Order number..." value={mergeOrderNumber} onChange={(e) => { setMergeOrderNumber(e.target.value); setMergeTarget(null); }} />
                  <Button size="sm" className="text-xs shrink-0" onClick={async () => {
                    if (!mergeOrderNumber) return;
                    const { data } = await supabase.from("orders").select("id, order_number, total, items_count, status").eq("order_number", mergeOrderNumber).neq("id", order.id).limit(1).maybeSingle();
                    if (data) setMergeTarget(data);
                    else toast.error("Order not found");
                  }}>Find</Button>
                </div>
                {mergeTarget && (
                  <Card>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-sm font-medium">{mergeTarget.order_number}</p>
                      <p className="text-xs">{mergeTarget.items_count} items · ${Number(mergeTarget.total).toFixed(2)}</p>
                      <StatusBadge status={mergeTarget.status} />
                      <Button size="sm" variant="destructive" className="w-full text-xs mt-2" disabled={merging} onClick={async () => {
                        setMerging(true);
                        // Move items
                        await supabase.from("order_items").update({ order_id: order.id }).eq("order_id", mergeTarget.id);
                        // Update totals
                        await supabase.from("orders").update({
                          subtotal: Number(order.subtotal) + Number(mergeTarget.total),
                          total: Number(order.total) + Number(mergeTarget.total),
                          items_count: (order.items_count || 0) + (mergeTarget.items_count || 0),
                          notes: `${(order as any).notes || ""}\nMerged from ${mergeTarget.order_number}`.trim(),
                        }).eq("id", order.id);
                        // Delete merged order
                        await supabase.from("orders").delete().eq("id", mergeTarget.id);
                        toast.success(`Merged ${mergeTarget.order_number} into ${order.order_number}`);
                        queryClient.invalidateQueries({ queryKey: ["order", id] });
                        queryClient.invalidateQueries({ queryKey: ["orders"] });
                        setMergeOpen(false);
                        setMerging(false);
                      }}>{merging ? "Merging..." : "Merge & Delete Other Order"}</Button>
                    </CardContent>
                  </Card>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs gap-1"><Truck className="h-3.5 w-3.5" /> Create Shipment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-base">Create Shipment</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Select items to ship</Label>
                    <div className="border rounded-md divide-y">
                      {orderItems.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                          <Checkbox
                            checked={(shipForm.selectedItems[item.id] || 0) > 0}
                            onCheckedChange={(checked) => {
                              setShipForm((prev) => ({
                                ...prev,
                                selectedItems: { ...prev.selectedItems, [item.id]: checked ? item.quantity : 0 },
                              }));
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            {item.sku && <p className="text-muted-foreground">SKU: {item.sku}</p>}
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={shipForm.selectedItems[item.id] || 0}
                            onChange={(e) => setShipForm((prev) => ({
                              ...prev,
                              selectedItems: { ...prev.selectedItems, [item.id]: Math.min(parseInt(e.target.value) || 0, item.quantity) },
                            }))}
                            className="w-16 h-7 text-xs text-center"
                          />
                          <span className="text-muted-foreground">/ {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Carrier</Label>
                      <Input className="h-8 text-xs" placeholder="e.g. Australia Post" value={shipForm.carrier} onChange={(e) => setShipForm((p) => ({ ...p, carrier: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tracking Number</Label>
                      <Input className="h-8 text-xs" placeholder="e.g. AP123456789" value={shipForm.tracking_number} onChange={(e) => setShipForm((p) => ({ ...p, tracking_number: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tracking URL</Label>
                    <Input className="h-8 text-xs" placeholder="https://..." value={shipForm.tracking_url} onChange={(e) => setShipForm((p) => ({ ...p, tracking_url: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Textarea className="text-xs min-h-[60px]" value={shipForm.notes} onChange={(e) => setShipForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <Button className="w-full text-xs" disabled={createShipment.isPending || Object.values(shipForm.selectedItems).every((q) => q === 0)} onClick={handleCreateShipment}>
                    {createShipment.isPending ? "Creating..." : "Create Shipment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete order?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete {order.order_number} and all its items.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { deleteOrder.mutate(order.id); navigate("/orders"); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Items */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Items ({order.items_count})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 text-xs">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.sku && <p className="text-muted-foreground">SKU: {item.sku}</p>}
                      </div>
                      <div className="text-right">
                        <p>{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                        <p className="font-medium">${Number(item.total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="px-4 py-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
                  {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-green-600">-${Number(order.discount).toFixed(2)}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${Number(order.shipping).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold text-sm"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Shipments */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Shipments ({(shipments as any[]).length})</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {(shipments as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No shipments yet. Create one to start fulfillment.</p>
                ) : (
                  <div className="space-y-3">
                    {(shipments as any[]).map((s: any) => (
                      <div key={s.id} className="border rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{s.shipment_number}</span>
                            <StatusBadge status={s.status} />
                          </div>
                          <Select
                            value={s.status}
                            onValueChange={(v) => updateShipment.mutate({
                              id: s.id,
                              orderId: order.id,
                              status: v,
                              ...(v === "shipped" ? { shipped_at: new Date().toISOString() } : {}),
                              ...(v === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
                            })}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SHIPMENT_STATUSES.map((st) => <SelectItem key={st} value={st} className="text-xs capitalize">{st}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {(s.carrier || s.tracking_number) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {s.carrier && <span>{s.carrier}</span>}
                            {s.tracking_number && (
                              <span className="flex items-center gap-1">
                                {s.tracking_number}
                                {s.tracking_url && (
                                  <a href={s.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                        {s.shipment_items && s.shipment_items.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {s.shipment_items.map((si: any) => (
                              <span key={si.id} className="block">{si.order_items?.title || "Item"} × {si.quantity}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {/* Add comment */}
                <div className="flex gap-2 mb-4">
                  <Input
                    className="h-8 text-xs flex-1"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button size="sm" className="h-8 text-xs px-3" disabled={!newComment.trim()} onClick={handleAddComment}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {(timeline as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events yet.</p>
                ) : (
                  <div className="space-y-0">
                    {(timeline as any[]).map((event: any, idx: number) => (
                      <div key={event.id} className="flex gap-3 pb-3 relative">
                        {idx < (timeline as any[]).length - 1 && (
                          <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                        )}
                        <div className="mt-0.5 shrink-0">
                          <TimelineIcon type={event.event_type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{event.title}</p>
                          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(event.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <Textarea className="text-xs min-h-[80px]" placeholder="Add internal notes..." value={currentNotes} onChange={(e) => setNotes(e.target.value)} />
                <Button size="sm" className="mt-2 text-xs" disabled={updateOrder.isPending} onClick={() => updateOrder.mutate({ id: order.id, notes: currentNotes } as any)}>
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Customer */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Customer</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 text-xs">
                {order.customers ? (
                  <div className="space-y-1">
                    <p className="font-medium">{(order.customers as any).name}</p>
                    {(order.customers as any).email && <p className="text-muted-foreground">{(order.customers as any).email}</p>}
                    {(order.customers as any).phone && <p className="text-muted-foreground">{(order.customers as any).phone}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No customer linked</p>
                )}
                {(order as any).shipping_address && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-muted-foreground mb-1">Shipping Address</p>
                      <p className="whitespace-pre-line">{(order as any).shipping_address}</p>
                    </div>
                  </>
                )}
                {(order as any).billing_address && (order as any).billing_address !== (order as any).shipping_address && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-muted-foreground mb-1">Billing Address</p>
                      <p className="whitespace-pre-line">{(order as any).billing_address}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Fraud Risk Assessment */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Fraud Risk</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 text-xs space-y-2">
                {(() => {
                  const flags: { label: string; level: "low" | "medium" | "high" }[] = [];
                  // High value order
                  if (Number(order.total) > 500) flags.push({ label: "High value order (>$500)", level: Number(order.total) > 2000 ? "high" : "medium" });
                  // Mismatched addresses
                  if ((order as any).billing_address && (order as any).shipping_address && (order as any).billing_address !== (order as any).shipping_address) {
                    flags.push({ label: "Billing ≠ Shipping address", level: "medium" });
                  }
                  // No customer linked
                  if (!order.customer_id) flags.push({ label: "No customer account linked", level: "medium" });
                  // Multiple items of same product
                  const maxQty = orderItems.reduce((m: number, i: any) => Math.max(m, i.quantity), 0);
                  if (maxQty >= 5) flags.push({ label: `High quantity (${maxQty} of one item)`, level: "medium" });
                  // First order from customer
                  if (order.customers && Number((order.customers as any).total_orders) <= 1) {
                    flags.push({ label: "First order from customer", level: "low" });
                  }

                  const riskScore = flags.reduce((s, f) => s + (f.level === "high" ? 3 : f.level === "medium" ? 2 : 1), 0);
                  const overallRisk = riskScore >= 6 ? "high" : riskScore >= 3 ? "medium" : "low";
                  const riskColors = { low: "text-primary", medium: "text-amber-600", high: "text-destructive" };
                  const riskBg = { low: "bg-primary/10", medium: "bg-amber-100", high: "bg-destructive/10" };

                  return (
                    <>
                      <div className={`flex items-center justify-between p-2 rounded-md ${riskBg[overallRisk]}`}>
                        <span className="font-medium">Risk Level</span>
                        <Badge variant={overallRisk === "high" ? "destructive" : overallRisk === "medium" ? "secondary" : "outline"} className="capitalize text-[10px]">
                          {overallRisk === "low" ? "Low" : overallRisk === "medium" ? "Medium" : "High"}
                        </Badge>
                      </div>
                      {flags.length === 0 ? (
                        <p className="text-muted-foreground">No fraud indicators detected.</p>
                      ) : (
                        <div className="space-y-1">
                          {flags.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <AlertTriangle className={`h-3 w-3 shrink-0 ${riskColors[f.level]}`} />
                              <span>{f.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Order Status */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Order Status</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={order.status} onValueChange={(v) => handleStatusChange("status", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current:</span>
                  <StatusBadge status={order.status} />
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</CardTitle>
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1"><Plus className="h-3 w-3" /> Record</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader><DialogTitle className="text-sm">Record Payment</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Amount</Label>
                          <Input type="number" step="0.01" className="h-8 text-xs" placeholder="0.00" value={paymentForm.amount} onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Method</Label>
                          <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm(p => ({ ...p, method: v }))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual" className="text-xs">Manual / Cash</SelectItem>
                              <SelectItem value="bank_transfer" className="text-xs">Bank Transfer</SelectItem>
                              <SelectItem value="check" className="text-xs">Check</SelectItem>
                              <SelectItem value="credit_card" className="text-xs">Credit Card</SelectItem>
                              <SelectItem value="other" className="text-xs">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Reference</Label>
                          <Input className="h-8 text-xs" placeholder="Transaction ID, check #, etc." value={paymentForm.reference} onChange={(e) => setPaymentForm(p => ({ ...p, reference: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Notes</Label>
                          <Textarea className="text-xs min-h-[50px]" value={paymentForm.notes} onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
                        </div>
                        <Button className="w-full text-xs" disabled={!paymentForm.amount || createPayment.isPending} onClick={handleRecordPayment}>
                          {createPayment.isPending ? "Recording..." : "Record Payment"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <Select value={order.payment_status} onValueChange={(v) => handleStatusChange("payment_status", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current:</span>
                  <StatusBadge status={order.payment_status} />
                </div>
                {(payments as any[]).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Payment History</p>
                      {(payments as any[]).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium">${Number(p.amount).toFixed(2)}</span>
                            <span className="text-muted-foreground ml-1.5 capitalize">{p.payment_method.replace("_", " ")}</span>
                            {p.reference && <span className="text-muted-foreground ml-1">({p.reference})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                            <button
                              onClick={() => window.open(`${window.location.pathname}/receipt/${p.id}`, "_blank")}
                              className="text-primary hover:underline"
                              title="Print Receipt"
                            >
                              <Printer className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium pt-1 border-t">
                        <span>Total Paid</span>
                        <span>${(payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Fulfillment */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Fulfillment</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <Select
                  value={(order as any).fulfillment_status || "unfulfilled"}
                  onValueChange={(v) => handleStatusChange("fulfillment_status", v)}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FULFILLMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current:</span>
                  <StatusBadge status={(order as any).fulfillment_status || "unfulfilled"} />
                </div>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  {order.status === "pending" && (
                    <Button size="sm" className="text-xs w-full" onClick={() => handleStatusChange("status", "processing")}>
                      Start Processing
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button size="sm" className="text-xs w-full" onClick={async () => {
                      await updateOrder.mutateAsync({ id: order.id, status: "shipped", fulfillment_status: "fulfilled" } as any);
                      await createTimelineEvent.mutateAsync({ order_id: order.id, event_type: "status_change", title: "Order shipped", description: "Order marked as shipped and fulfilled" });
                    }}>
                      Mark as Shipped
                    </Button>
                  )}
                  {order.status === "shipped" && (
                    <Button size="sm" className="text-xs w-full" onClick={() => handleStatusChange("status", "delivered")}>
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {/* Credit Notes */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Credit Notes & Refunds
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setRefundOpen(true)}>
                      Refund
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setCreditNoteOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Credit Note
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {(creditNotes as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No credit notes</p>
                ) : (
                  (creditNotes as any[]).map((cn: any) => (
                    <div key={cn.id} className="flex items-center justify-between text-xs border-b pb-1.5">
                      <div>
                        <span className="font-mono font-medium">{cn.credit_number}</span>
                        {cn.reason && <span className="text-muted-foreground ml-2">— {cn.reason}</span>}
                      </div>
                      <span className="font-medium text-destructive">-${Number(cn.amount).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4" /> Tags</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {orderTags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {orderTags.length === 0 && <p className="text-xs text-muted-foreground">No tags</p>}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    className="h-7 text-xs flex-1"
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={handleAddTag} disabled={!newTag.trim()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Credit Note Dialog */}
      <Dialog open={creditNoteOpen} onOpenChange={setCreditNoteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Issue Credit Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" min="0" value={creditForm.amount}
                onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Input value={creditForm.reason}
                onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })} className="h-9" placeholder="e.g. Damaged goods" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={creditForm.notes}
                onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })} className="min-h-[50px] text-sm" />
            </div>
            <Button className="w-full" size="sm" disabled={!creditForm.amount || Number(creditForm.amount) <= 0}
              onClick={async () => {
                if (!order) return;
                const creditNumber = `CN-${Date.now().toString(36).toUpperCase()}`;
                await supabase.from("credit_notes" as any).insert({
                  store_id: order.store_id,
                  order_id: order.id,
                  credit_number: creditNumber,
                  amount: Number(creditForm.amount),
                  reason: creditForm.reason || null,
                  notes: creditForm.notes || null,
                  issued_by: user?.email || "admin",
                });
                queryClient.invalidateQueries({ queryKey: ["credit-notes", id] });
                toast.success(`Credit note ${creditNumber} issued`);
                setCreditNoteOpen(false);
                setCreditForm({ amount: "", reason: "", notes: "" });
              }}
            >Issue Credit Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Refund Amount</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })} />
              <p className="text-xs text-muted-foreground">Order total: ${Number(order.total).toFixed(2)}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} className="min-h-[50px] text-sm" placeholder="Reason for refund..." />
            </div>
            <Button className="w-full" size="sm" disabled={!refundForm.amount || Number(refundForm.amount) <= 0}
              onClick={async () => {
                if (!order) return;
                const amount = Number(refundForm.amount);
                await supabase.from("order_refunds" as any).insert({
                  store_id: order.store_id,
                  order_id: order.id,
                  amount,
                  reason: refundForm.reason || null,
                  refunded_by: user?.id || null,
                  status: "completed",
                });
                await createTimelineEvent.mutateAsync({
                  order_id: order.id,
                  event_type: "payment",
                  title: "Refund processed",
                  description: `$${amount.toFixed(2)} refunded${refundForm.reason ? ` — ${refundForm.reason}` : ""}`,
                });
                await updateOrder.mutateAsync({ id: order.id, payment_status: "refunded" } as any);
                toast.success(`Refund of $${amount.toFixed(2)} processed`);
                setRefundOpen(false);
                setRefundForm({ amount: "", reason: "" });
              }}
            >Process Refund</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
