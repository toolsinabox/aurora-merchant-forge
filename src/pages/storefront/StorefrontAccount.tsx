import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { LogOut, Package, User, RotateCcw, Heart, ChevronRight, MapPin, Truck, CheckCircle2, Clock, XCircle, ExternalLink, Plus, Trash2, Pencil, Gift, FileQuestion, CreditCard, ShieldAlert, FileText, Download, ShoppingCart, Bell, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  const { addItem: addToCart } = useCart();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "returns" | "addresses" | "vouchers" | "quotes" | "disputes" | "files" | "preferences" | "account">("orders");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [customerFiles, setCustomerFiles] = useState<any[]>([]);

  // Communication preferences
  const [commPrefs, setCommPrefs] = useState({
    order_updates: true,
    shipping_notifications: true,
    promotional_emails: false,
    newsletter: false,
    sms_notifications: false,
    review_requests: true,
    back_in_stock: true,
    price_drop_alerts: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Account deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Dispute form state
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ order_id: "", product_id: "", dispute_type: "refund", reason: "", description: "" });
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeProducts, setDisputeProducts] = useState<any[]>([]);

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Return request dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Address dialog
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home", first_name: "", last_name: "", company: "",
    address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "AU", phone: "",
  });

  useEffect(() => {
    if (!user) {
      navigate(`${basePath}/login`);
      return;
    }

    async function load() {
      let resolvedStoreId = "";
      if (storeSlug) {
        const found = await resolveStoreBySlug(storeSlug, supabase);
        if (found) { setStoreId(found.id); resolvedStoreId = found.id; }
      }

      const { data: custs } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      const cust = custs?.[0];
      setCustomer(cust);

      if (cust) {
        const [ordsRes, retsRes, addrsRes, vouchersRes, quotesRes] = await Promise.all([
          supabase
            .from("orders")
            .select("*, order_items(*, products(title, images))")
            .eq("customer_id", cust.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("returns" as any)
            .select("*, orders(order_number)")
            .eq("customer_id", cust.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("customer_addresses" as any)
            .select("*")
            .eq("customer_id", cust.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("gift_vouchers")
            .select("*")
            .or(`purchased_by.eq.${user!.id},recipient_email.eq.${cust.email || ""}`)
            .order("created_at", { ascending: false }),
          supabase
            .from("order_quotes" as any)
            .select("*, order_quote_items(*)")
            .eq("customer_id", cust.id)
            .order("created_at", { ascending: false }),
        ]);
        setOrders(ordsRes.data || []);
        setReturns(retsRes.data || []);
        setAddresses(addrsRes.data || []);
        setVouchers(vouchersRes.data || []);
        setQuotes(quotesRes.data || []);

        // Load disputes
        const { data: disputesData } = await supabase
          .from("warranty_disputes" as any)
          .select("*, orders(order_number), products(title)")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        setDisputes(disputesData || []);

        // Load customer files
        const { data: filesData } = await supabase
          .from("customer_files")
          .select("*")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        setCustomerFiles(filesData || []);
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

  const handleAddAddress = async () => {
    if (!addrForm.address_line1.trim()) { toast.error("Address line 1 required"); return; }
    if (!customer) return;
    try {
      const { error } = await supabase.from("customer_addresses" as any).insert({
        customer_id: customer.id,
        store_id: storeId || customer.store_id,
        ...addrForm,
      });
      if (error) throw error;
      toast.success("Address saved");
      setAddrOpen(false);
      setAddrForm({ label: "Home", first_name: "", last_name: "", company: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "AU", phone: "" });
      // Refresh addresses
      const { data } = await supabase.from("customer_addresses" as any).select("*").eq("customer_id", customer.id).order("created_at", { ascending: false });
      setAddresses(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    const { error } = await supabase.from("customer_addresses" as any).delete().eq("id", addrId);
    if (error) { toast.error(error.message); return; }
    setAddresses((prev) => prev.filter((a) => a.id !== addrId));
    toast.success("Address removed");
  };

  const handleReorder = (order: any) => {
    const items = order.order_items || orderItems;
    if (!items.length) { toast.error("No items to reorder"); return; }
    let added = 0;
    for (const item of items) {
      addToCart({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        title: item.title || item.products?.title || "Product",
        price: Number(item.unit_price),
        quantity: item.quantity,
        image: item.products?.images?.[0] || undefined,
        sku: item.sku || undefined,
      });
      added++;
    }
    toast.success(`${added} item${added !== 1 ? "s" : ""} added to cart`);
  };

  const handleSavePreferences = async () => {
    if (!customer) return;
    setSavingPrefs(true);
    try {
      // Store preferences as customer notes/tags (using existing fields)
      const { error } = await supabase.from("customers").update({
        notes: JSON.stringify({ communication_preferences: commPrefs }),
      }).eq("id", customer.id);
      if (error) throw error;
      toast.success("Preferences saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") { toast.error("Please type DELETE to confirm"); return; }
    if (!customer || !user) return;
    setDeletingAccount(true);
    try {
      // Mark customer as inactive (soft delete for data retention compliance)
      const { error } = await supabase.from("customers").update({
        notes: JSON.stringify({ deletion_requested: true, deletion_requested_at: new Date().toISOString() }),
        tags: [...(customer.tags || []), "deletion-requested"],
      }).eq("id", customer.id);
      if (error) throw error;

      toast.success("Account deletion request submitted. You will receive a confirmation email.");
      setDeleteDialogOpen(false);
      // Sign out
      await supabase.auth.signOut();
      navigate(basePath || "/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingAccount(false);
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

          {shipmentsLoading ? (
            <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ) : shipments.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Shipments ({shipments.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {shipments.map((s: any) => (
                  <div key={s.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{s.shipment_number}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      {s.shipped_at && <span className="text-xs text-muted-foreground">Shipped {new Date(s.shipped_at).toLocaleDateString()}</span>}
                    </div>
                    {(s.carrier || s.tracking_number) && (
                      <div className="flex items-center gap-3 text-sm">
                        {s.carrier && <span className="text-muted-foreground">{s.carrier}</span>}
                        {s.tracking_number && (
                          <span className="flex items-center gap-1 font-mono text-xs">
                            {s.tracking_number}
                            {s.tracking_url && (
                              <a href={s.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                                Track <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    {s.delivered_at && <p className="text-xs text-muted-foreground">Delivered {new Date(s.delivered_at).toLocaleDateString()}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(selectedOrder.subtotal).toFixed(2)}</span></div>
              {selectedOrder.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-${Number(selectedOrder.discount).toFixed(2)}</span></div>}
              {selectedOrder.shipping > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${Number(selectedOrder.shipping).toFixed(2)}</span></div>}
              {selectedOrder.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(selectedOrder.tax).toFixed(2)}</span></div>}
              <Separator />
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span>${Number(selectedOrder.total).toFixed(2)}</span></div>
              <div className="flex gap-2 pt-1">
                <StatusBadge status={selectedOrder.payment_status} />
                <StatusBadge status={selectedOrder.fulfillment_status} />
              </div>
              {selectedOrder.payment_status === "pending" && (
                <Button
                  size="sm"
                  className="w-full mt-2 gap-2"
                  onClick={async () => {
                    try {
                      // Record payment and update status
                      await supabase.from("order_payments").insert({
                        order_id: selectedOrder.id,
                        store_id: selectedOrder.store_id,
                        amount: Number(selectedOrder.total),
                        payment_method: "account",
                        recorded_by: user!.id,
                        notes: "Paid from customer account",
                      });
                      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", selectedOrder.id);
                      // Trigger payment confirmation email
                      supabase.functions.invoke("payment-email", {
                        body: { order_id: selectedOrder.id, store_id: selectedOrder.store_id, amount: Number(selectedOrder.total), payment_method: "account" },
                      }).catch(() => {});
                      setSelectedOrder({ ...selectedOrder, payment_status: "paid" });
                      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, payment_status: "paid" } : o));
                      toast.success("Payment recorded successfully!");
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }}
                >
                  <CreditCard className="h-4 w-4" /> Pay ${Number(selectedOrder.total).toFixed(2)}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={() => handleReorder(selectedOrder)}
              >
                <ShoppingCart className="h-4 w-4" /> Reorder All Items
              </Button>
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
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
              {!loading && customer && !editingProfile && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setProfileForm({ name: customer.name || "", phone: customer.phone || "" }); setEditingProfile(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {loading ? (
                <><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48" /></>
              ) : editingProfile ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input className="h-9" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input className="h-9" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email} (cannot be changed)</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8" disabled={savingProfile} onClick={async () => {
                      if (!profileForm.name.trim()) { toast.error("Name is required"); return; }
                      setSavingProfile(true);
                      try {
                        const { error } = await supabase.from("customers").update({ name: profileForm.name.trim(), phone: profileForm.phone.trim() || null }).eq("id", customer.id);
                        if (error) throw error;
                        setCustomer({ ...customer, name: profileForm.name.trim(), phone: profileForm.phone.trim() || null });
                        setEditingProfile(false);
                        toast.success("Profile updated");
                      } catch (err: any) { toast.error(err.message); }
                      finally { setSavingProfile(false); }
                    }}>
                      {savingProfile ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingProfile(false)}>Cancel</Button>
                  </div>
                </div>
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

          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1 border-b overflow-x-auto">
              {([
                { key: "orders", label: "Orders", icon: Package, count: orders.length },
                { key: "addresses", label: "Addresses", icon: MapPin, count: addresses.length },
                { key: "wishlist", label: "Wishlist", icon: Heart, count: wishlistProducts.length },
                { key: "returns", label: "Returns", icon: RotateCcw, count: returns.length },
                { key: "vouchers", label: "Vouchers", icon: Gift, count: vouchers.length },
                { key: "quotes", label: "Quotes", icon: FileQuestion, count: quotes.length },
                { key: "disputes", label: "Disputes", icon: ShieldAlert, count: disputes.length },
                { key: "files", label: "Files", icon: FileText, count: customerFiles.length },
                { key: "preferences", label: "Preferences", icon: Bell, count: 0 },
                { key: "account", label: "Account", icon: UserX, count: 0 },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
                        <div key={o.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <button
                            onClick={() => viewOrderDetail(o)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{o.order_number}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString()} · {o.items_count} item{o.items_count !== 1 ? "s" : ""}
                            </p>
                          </button>
                          <div className="flex items-center gap-2">
                            {["delivered", "shipped"].includes(o.status) && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); handleReorder(o); }}>
                                <RotateCcw className="h-3 w-3" /> Reorder
                              </Button>
                            )}
                            <span className="text-sm font-bold">${Number(o.total).toFixed(2)}</span>
                            <button onClick={() => viewOrderDetail(o)}>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">My Addresses</CardTitle>
                  <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1"><Plus className="h-3 w-3" /> Add</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle className="text-base">Add Address</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Label</Label><Input className="h-9" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} /></div>
                          <div><Label className="text-xs">Company</Label><Input className="h-9" value={addrForm.company} onChange={(e) => setAddrForm({ ...addrForm, company: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">First Name</Label><Input className="h-9" value={addrForm.first_name} onChange={(e) => setAddrForm({ ...addrForm, first_name: e.target.value })} /></div>
                          <div><Label className="text-xs">Last Name</Label><Input className="h-9" value={addrForm.last_name} onChange={(e) => setAddrForm({ ...addrForm, last_name: e.target.value })} /></div>
                        </div>
                        <div><Label className="text-xs">Address Line 1 *</Label><Input className="h-9" value={addrForm.address_line1} onChange={(e) => setAddrForm({ ...addrForm, address_line1: e.target.value })} /></div>
                        <div><Label className="text-xs">Address Line 2</Label><Input className="h-9" value={addrForm.address_line2} onChange={(e) => setAddrForm({ ...addrForm, address_line2: e.target.value })} /></div>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className="text-xs">City</Label><Input className="h-9" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
                          <div><Label className="text-xs">State</Label><Input className="h-9" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
                          <div><Label className="text-xs">Postal Code</Label><Input className="h-9" value={addrForm.postal_code} onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Country</Label><Input className="h-9" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} /></div>
                          <div><Label className="text-xs">Phone</Label><Input className="h-9" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} /></div>
                        </div>
                        <Button className="w-full" onClick={handleAddAddress}>Save Address</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No saved addresses.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr: any) => (
                        <div key={addr.id} className="border rounded-lg p-3 text-sm relative group">
                          <Badge variant="outline" className="text-[10px] mb-1">{addr.label}</Badge>
                          <p className="font-medium">{[addr.first_name, addr.last_name].filter(Boolean).join(" ") || "—"}</p>
                          {addr.company && <p className="text-muted-foreground text-xs">{addr.company}</p>}
                          <p className="text-xs">{addr.address_line1}</p>
                          {addr.address_line2 && <p className="text-xs">{addr.address_line2}</p>}
                          <p className="text-xs">{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}</p>
                          <p className="text-xs text-muted-foreground">{addr.country}</p>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
                          <TableHead className="text-xs">Tracking</TableHead>
                          <TableHead className="text-xs text-right">Refund</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returns.map((r: any) => {
                          const statusSteps = ["requested", "approved", "processing", "refunded"];
                          const currentStep = statusSteps.indexOf(r.status);
                          return (
                            <TableRow key={r.id} className="text-sm">
                              <TableCell className="font-medium">{r.orders?.order_number || "—"}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
                              <TableCell><StatusBadge status={r.status} /></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-0.5">
                                  {statusSteps.map((step, idx) => (
                                    <div key={step} className={`h-1.5 w-5 rounded-full ${idx <= currentStep ? "bg-primary" : "bg-muted"}`} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground capitalize">{r.status}</span>
                              </TableCell>
                              <TableCell className="text-right font-medium">${Number(r.refund_amount || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Vouchers Tab */}
            {activeTab === "vouchers" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">My Gift Vouchers</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {vouchers.length === 0 ? (
                    <div className="p-6 text-center">
                      <Gift className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No gift vouchers.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Code</TableHead>
                          <TableHead className="text-xs">Value</TableHead>
                          <TableHead className="text-xs">Balance</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Expires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vouchers.map((v: any) => (
                          <TableRow key={v.id} className="text-sm">
                            <TableCell className="font-mono text-xs">{v.code}</TableCell>
                            <TableCell>${Number(v.initial_value).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">${Number(v.balance).toFixed(2)}</TableCell>
                            <TableCell><StatusBadge status={v.is_active ? "active" : "inactive"} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{v.expires_at ? new Date(v.expires_at).toLocaleDateString() : "Never"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quotes Tab */}
            {activeTab === "quotes" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">My Quotes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {quotes.length === 0 ? (
                    <div className="p-6 text-center">
                      <FileQuestion className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No quotes yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Quote #</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                          <TableHead className="text-xs">Valid Until</TableHead>
                          <TableHead className="text-xs">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotes.map((q: any) => (
                          <TableRow key={q.id} className="text-sm">
                            <TableCell className="font-mono text-xs">{q.quote_number}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</TableCell>
                            <TableCell><StatusBadge status={q.status} /></TableCell>
                            <TableCell className="text-right font-medium">${Number(q.total).toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {q.status === "sent" && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={async () => {
                                      await supabase.from("order_quotes" as any).update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", q.id);
                                      toast.success("Quote approved");
                                      setQuotes(quotes.map((x: any) => x.id === q.id ? { ...x, status: "approved" } : x));
                                    }}>Approve</Button>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={async () => {
                                      await supabase.from("order_quotes" as any).update({ status: "rejected" }).eq("id", q.id);
                                      toast.success("Quote rejected");
                                      setQuotes(quotes.map((x: any) => x.id === q.id ? { ...x, status: "rejected" } : x));
                                    }}>Reject</Button>
                                  </>
                                )}
                                {q.status === "converted" && <span className="text-[10px] text-muted-foreground">Converted</span>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Disputes Tab */}
            {activeTab === "disputes" && (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Warranty Disputes</CardTitle>
                  <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setDisputeOpen(true)}>
                      <Plus className="h-3 w-3" /> New Dispute
                    </Button>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>Submit Warranty Dispute</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Order</Label>
                          <Select value={disputeForm.order_id} onValueChange={async (v) => {
                            setDisputeForm({ ...disputeForm, order_id: v, product_id: "" });
                            const { data } = await supabase.from("order_items").select("product_id, title").eq("order_id", v);
                            setDisputeProducts(data || []);
                          }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select order" /></SelectTrigger>
                            <SelectContent>
                              {orders.map((o: any) => <SelectItem key={o.id} value={o.id} className="text-xs">#{o.order_number}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {disputeProducts.length > 0 && (
                          <div>
                            <Label className="text-xs">Product</Label>
                            <Select value={disputeForm.product_id} onValueChange={(v) => setDisputeForm({ ...disputeForm, product_id: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                              <SelectContent>
                                {disputeProducts.filter((p: any) => p.product_id).map((p: any) => <SelectItem key={p.product_id} value={p.product_id} className="text-xs">{p.title}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">Dispute Type</Label>
                          <Select value={disputeForm.dispute_type} onValueChange={(v) => setDisputeForm({ ...disputeForm, dispute_type: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="refund" className="text-xs">Refund</SelectItem>
                              <SelectItem value="repair" className="text-xs">Repair</SelectItem>
                              <SelectItem value="replace" className="text-xs">Replace</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Reason</Label>
                          <Select value={disputeForm.reason} onValueChange={(v) => setDisputeForm({ ...disputeForm, reason: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select reason" /></SelectTrigger>
                            <SelectContent>
                              {["Product defective on arrival", "Product broke within warranty period", "Product not as described", "Missing parts or accessories", "Performance issues", "Safety concern", "Other"].map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea value={disputeForm.description} onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })} placeholder="Describe the issue in detail..." className="min-h-[60px] text-xs" />
                        </div>
                        <Button size="sm" className="w-full text-xs" disabled={submittingDispute || !disputeForm.reason || !disputeForm.order_id} onClick={async () => {
                          if (!storeId || !customer) return;
                          setSubmittingDispute(true);
                          try {
                            const { error } = await supabase.from("warranty_disputes" as any).insert({
                              store_id: storeId,
                              order_id: disputeForm.order_id,
                              customer_id: customer.id,
                              product_id: disputeForm.product_id || null,
                              dispute_type: disputeForm.dispute_type,
                              reason: disputeForm.reason,
                              description: disputeForm.description || null,
                            });
                            if (error) throw error;
                            toast.success("Warranty dispute submitted");
                            setDisputeOpen(false);
                            setDisputeForm({ order_id: "", product_id: "", dispute_type: "refund", reason: "", description: "" });
                            // Reload disputes
                            const { data } = await supabase.from("warranty_disputes" as any).select("*, orders(order_number), products(title)").eq("customer_id", customer.id).order("created_at", { ascending: false });
                            setDisputes(data || []);
                          } catch (err: any) {
                            toast.error(err.message);
                          } finally {
                            setSubmittingDispute(false);
                          }
                        }}>
                          {submittingDispute ? "Submitting..." : "Submit Dispute"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  {disputes.length === 0 ? (
                    <div className="p-6 text-center">
                      <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No warranty disputes</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Order</TableHead>
                          <TableHead className="text-xs">Product</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputes.map((d: any) => (
                          <TableRow key={d.id} className="text-sm">
                            <TableCell className="font-mono text-xs">#{d.orders?.order_number || "—"}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{d.products?.title || "—"}</TableCell>
                            <TableCell className="text-xs capitalize">{d.dispute_type}</TableCell>
                            <TableCell><Badge variant={d.status === "resolved" ? "default" : d.status === "closed" ? "destructive" : "secondary"} className="text-[10px] capitalize">{d.status.replace("_", " ")}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">My Files & Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {customerFiles.length === 0 ? (
                    <div className="p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No files available</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">File Name</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs">Size</TableHead>
                          <TableHead className="text-xs">Uploaded</TableHead>
                          <TableHead className="text-xs w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerFiles.map((f: any) => (
                          <TableRow key={f.id} className="text-sm">
                            <TableCell className="font-medium">{f.file_name}</TableCell>
                            <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{f.description || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <a href={f.file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Communication Preferences Tab */}
            {activeTab === "preferences" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Communication Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Control which notifications and emails you receive from us.</p>
                  {([
                    { key: "order_updates", label: "Order Updates", desc: "Confirmation, status changes, and delivery notifications" },
                    { key: "shipping_notifications", label: "Shipping Notifications", desc: "Tracking updates and delivery alerts" },
                    { key: "review_requests", label: "Review Requests", desc: "Invitations to review purchased products" },
                    { key: "back_in_stock", label: "Back in Stock Alerts", desc: "Notifications when wishlisted items are restocked" },
                    { key: "promotional_emails", label: "Promotional Emails", desc: "Sales, special offers, and seasonal promotions" },
                    { key: "newsletter", label: "Newsletter", desc: "Weekly/monthly newsletter with new products and updates" },
                    { key: "price_drop_alerts", label: "Price Drop Alerts", desc: "Notifications when items in your wishlist go on sale" },
                    { key: "sms_notifications", label: "SMS Notifications", desc: "Text message alerts for orders and shipping" },
                  ] as const).map(pref => (
                    <div key={pref.key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{pref.label}</p>
                        <p className="text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                      <Switch
                        checked={commPrefs[pref.key]}
                        onCheckedChange={(checked) => setCommPrefs(prev => ({ ...prev, [pref.key]: checked }))}
                      />
                    </div>
                  ))}
                  <Button size="sm" className="mt-2" disabled={savingPrefs} onClick={handleSavePreferences}>
                    {savingPrefs ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Account Management Tab */}
            {activeTab === "account" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive"><UserX className="h-4 w-4" /> Account Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-destructive">Delete Account</h3>
                    <p className="text-xs text-muted-foreground">
                      Requesting account deletion will submit a GDPR-compliant deletion request. Your account will be marked for deletion and processed within 30 days. You will be signed out immediately.
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Your personal data will be anonymized or deleted</li>
                      <li>• Order history will be retained for legal/tax requirements</li>
                      <li>• Active subscriptions will be cancelled</li>
                      <li>• Gift voucher balances will be forfeited</li>
                    </ul>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <UserX className="h-4 w-4" /> Request Account Deletion
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-destructive">Delete Your Account</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. Type <strong>DELETE</strong> below to confirm.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Type DELETE to confirm</Label>
                            <Input
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="DELETE"
                              className="font-mono"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                          <Button
                            variant="destructive"
                            disabled={deletingAccount || deleteConfirmText !== "DELETE"}
                            onClick={handleDeleteAccount}
                          >
                            {deletingAccount ? "Processing..." : "Delete My Account"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}