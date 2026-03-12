import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Package, CreditCard, Truck, User } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "refunded"];
const FULFILLMENT_STATUSES = ["unfulfilled", "partial", "fulfilled"];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const [notes, setNotes] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground text-sm">Order not found.</div>
      </AdminLayout>
    );
  }

  const currentNotes = notes !== null ? notes : ((order as any).notes || "");

  return (
    <AdminLayout>
      <div className="space-y-4">
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column - Order items + notes */}
          <div className="lg:col-span-2 space-y-4">
            {/* Items */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Items ({order.items_count})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(order as any).order_items?.map((item: any) => (
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
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${Number(order.shipping).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold text-sm"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <Textarea
                  className="text-xs min-h-[80px]"
                  placeholder="Add internal notes about this order..."
                  value={currentNotes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  className="mt-2 text-xs"
                  disabled={updateOrder.isPending}
                  onClick={() => updateOrder.mutate({ id: order.id, notes: currentNotes } as any)}
                >
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Status management */}
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
                  <Select
                    value={order.status}
                    onValueChange={(v) => updateOrder.mutate({ id: order.id, status: v })}
                  >
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
                <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <Select
                  value={order.payment_status}
                  onValueChange={(v) => updateOrder.mutate({ id: order.id, payment_status: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current:</span>
                  <StatusBadge status={order.payment_status} />
                </div>
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
                  onValueChange={(v) => updateOrder.mutate({ id: order.id, fulfillment_status: v } as any)}
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

                {/* Quick fulfillment actions */}
                <Separator />
                <div className="flex flex-col gap-1.5">
                  {order.status === "pending" && (
                    <Button size="sm" className="text-xs w-full" onClick={() => updateOrder.mutate({ id: order.id, status: "processing" })}>
                      Start Processing
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button size="sm" className="text-xs w-full" onClick={() => updateOrder.mutate({ id: order.id, status: "shipped", fulfillment_status: "fulfilled" } as any)}>
                      Mark as Shipped
                    </Button>
                  )}
                  {order.status === "shipped" && (
                    <Button size="sm" className="text-xs w-full" onClick={() => updateOrder.mutate({ id: order.id, status: "delivered" })}>
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
