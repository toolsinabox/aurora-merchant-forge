import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { LogOut, Package, User, RotateCcw, Heart, ChevronRight, MapPin, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

const RETURN_REASONS = [
  "Defective / damaged item",
  "Wrong item received",
  "Item not as described",
  "Changed my mind",
  "Other",
];

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function OrderTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-2">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="flex items-center gap-1 py-3 overflow-x-auto">
      {STATUS_STEPS.map((step, idx) => {
        const isComplete = idx <= activeIdx;
        const isCurrent = idx === activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 min-w-[70px] ${isComplete ? "text-primary" : "text-muted-foreground/40"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isCurrent ? "bg-primary text-primary-foreground" : isComplete ? "bg-primary/15" : "bg-muted"}`}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] text-center leading-tight ${isCurrent ? "font-semibold" : ""}`}>{step.label}</span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-6 mx-0.5 ${idx < activeIdx ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StorefrontAccount() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "returns">("orders");

  // Return request dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(`${basePath}/login`);
      return;
    }

    async function load() {
      // Resolve store
      if (storeSlug) {
        const found = await resolveStoreBySlug(storeSlug, supabase);
        if (found) setStoreId(found.id);
      }

      const { data: custs } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      const cust = custs?.[0];
      setCustomer(cust);

      if (cust) {
        const { data: ords } = await supabase
          .from("orders")
          .select("*, order_items(*, products(title, images))")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        setOrders(ords || []);

        const { data: rets } = await supabase
          .from("returns" as any)
          .select("*, orders(order_number)")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        setReturns(rets || []);
      }

      // Load wishlist products
      if (wishlistItems.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, title, price, images, compare_at_price")
          .in("id", wishlistItems);
        setWishlistProducts(prods || []);
      }

      setLoading(false);
    }
    load();
  }, [user, basePath, navigate, storeSlug, wishlistItems.length]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate(basePath || "/");
  };

  // Load shipments when viewing order detail
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);

  const viewOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    setOrderItems(order.order_items || []);
    setShipmentsLoading(true);
    const { data } = await supabase
      .from("order_shipments" as any)
      .select("*, shipment_items(*, order_items:order_item_id(title, sku))")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    setShipments(data || []);
    setShipmentsLoading(false);
  };

  const handleReturnRequest = async () => {
    if (!returnOrderId || !returnReason) {
      toast.error("Please select an order and reason");
      return;
    }
    if (!customer) return;

    const order = orders.find((o) => o.id === returnOrderId);
    if (!order) return;

    setSubmittingReturn(true);
    try {
      const { error } = await supabase.from("returns" as any).insert({
        store_id: order.store_id,
        order_id: order.id,
        customer_id: customer.id,
        reason: returnReason,
        notes: returnNotes || null,
        refund_amount: Number(order.total),
      });
      if (error) throw error;

      toast.success("Return request submitted");
      setReturnDialogOpen(false);
      setReturnOrderId("");
      setReturnReason("");
      setReturnNotes("");

      const { data: rets } = await supabase
        .from("returns" as any)
        .select("*, orders(order_number)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      setReturns(rets || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (!user) return null;

  const returnOrderIds = new Set(returns.map((r: any) => r.order_id));
  const eligibleOrders = orders.filter(
    (o) => ["delivered", "shipped"].includes(o.status) && !returnOrderIds.has(o.id)
  );

  // Order detail view
  if (selectedOrder) {
    return (
      <StorefrontLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            ← Back to orders
          </button>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Order {selectedOrder.order_number}</h1>
            <p className="text-sm text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
          </div>

          {/* Order Tracker */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-1">Order Status</h3>
              <OrderTracker status={selectedOrder.status} />
              {selectedOrder.shipping_address && (
                <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{selectedOrder.shipping_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {orderItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    <div className="h-14 w-14 rounded-lg bg-muted border overflow-hidden shrink-0">
                      {item.products?.images?.[0] ? (
                        <img src={getImageUrl(item.products.images[0])} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="h-4 w-4" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-semibold">${Number(item.total).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(selectedOrder.subtotal).toFixed(2)}</span></div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-primary"><span>Discount</span><span>-${Number(selectedOrder.discount).toFixed(2)}</span></div>
              )}
              {selectedOrder.shipping > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${Number(selectedOrder.shipping).toFixed(2)}</span></div>
              )}
              {selectedOrder.tax > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(selectedOrder.tax).toFixed(2)}</span></div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>${Number(selectedOrder.total).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <StatusBadge status={selectedOrder.payment_status} />
                <StatusBadge status={selectedOrder.fulfillment_status} />
              </div>
            </CardContent>
          </Card>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Account</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {loading ? (
                <><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48" /></>
              ) : (
                <>
                  <p className="font-medium">{customer?.name || user.email}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                  {customer?.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">Total Orders: {customer?.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Spent: ${Number(customer?.total_spent || 0).toFixed(2)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 border-b">
              {([
                { key: "orders", label: "Orders", icon: Package, count: orders.length },
                { key: "wishlist", label: "Wishlist", icon: Heart, count: wishlistProducts.length },
                { key: "returns", label: "Returns", icon: RotateCcw, count: returns.length },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count > 0 && <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                  ) : orders.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground text-sm mb-3">No orders yet.</p>
                      <Link to={`${basePath}/products`}><Button size="sm">Start Shopping</Button></Link>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {orders.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => viewOrderDetail(o)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{o.order_number}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString()} · {o.items_count} item{o.items_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">${Number(o.total).toFixed(2)}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <Card>
                <CardContent className="p-0">
                  {wishlistProducts.length === 0 ? (
                    <div className="p-6 text-center">
                      <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm mb-3">Your wishlist is empty.</p>
                      <Link to={`${basePath}/products`}><Button size="sm">Browse Products</Button></Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                      {wishlistProducts.map((p) => (
                        <Link key={p.id} to={`${basePath}/product/${p.id}`} className="group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted border mb-2">
                            {p.images?.[0] ? (
                              <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                            )}
                          </div>
                          <p className="text-xs font-medium group-hover:text-primary line-clamp-2">{p.title}</p>
                          <p className="text-xs font-bold mt-0.5">${Number(p.price).toFixed(2)}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Returns Tab */}
            {activeTab === "returns" && (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Return Requests</CardTitle>
                  {eligibleOrders.length > 0 && (
                    <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs h-7">Request Return</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle className="text-base">Request a Return</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Order</Label>
                            <Select value={returnOrderId} onValueChange={setReturnOrderId}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select order" /></SelectTrigger>
                              <SelectContent>
                                {eligibleOrders.map((o) => (
                                  <SelectItem key={o.id} value={o.id} className="text-sm">{o.order_number} — ${Number(o.total).toFixed(2)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Reason</Label>
                            <Select value={returnReason} onValueChange={setReturnReason}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select reason" /></SelectTrigger>
                              <SelectContent>
                                {RETURN_REASONS.map((r) => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Additional Notes</Label>
                            <Textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Describe the issue..." className="min-h-[60px] text-sm" />
                          </div>
                          <Button className="w-full" disabled={submittingReturn || !returnOrderId || !returnReason} onClick={handleReturnRequest}>
                            {submittingReturn ? "Submitting..." : "Submit Return Request"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-4 space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                  ) : returns.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-muted-foreground text-sm">No return requests.</p></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Order</TableHead>
                          <TableHead className="text-xs">Reason</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Refund</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returns.map((r: any) => (
                          <TableRow key={r.id} className="text-sm">
                            <TableCell className="font-medium">{r.orders?.order_number || "—"}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
                            <TableCell><StatusBadge status={r.status} /></TableCell>
                            <TableCell className="text-right font-medium">${Number(r.refund_amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
