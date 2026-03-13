import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2, Tag, X, MapPin, Truck } from "lucide-react";
import { useStoreSlug } from "@/lib/subdomain";

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  discountAmount: number;
}

export default function StorefrontCheckout() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "",
    notes: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    async function loadData() {
      // Load shipping zones (public)
      const { data: zones } = await supabase.from("shipping_zones").select("*").order("name");
      if (zones && zones.length > 0) setShippingZones(zones);

      if (!user) return;
      const { data: custs } = await supabase.from("customers").select("*").eq("user_id", user!.id).limit(1);
      const c = custs?.[0];
      if (c) {
        setForm((prev) => ({
          ...prev,
          name: c.name || prev.name,
          email: c.email || user!.email || prev.email,
          phone: c.phone || prev.phone,
        }));
        const { data: addrs } = await supabase
          .from("customer_addresses" as any)
          .select("*")
          .eq("customer_id", c.id)
          .order("is_default_shipping", { ascending: false });
        if (addrs && addrs.length > 0) {
          setSavedAddresses(addrs);
          const def = addrs.find((a: any) => a.is_default_shipping) || addrs[0];
          applyAddress(def);
        }
      } else {
        setForm((prev) => ({ ...prev, email: user!.email || prev.email }));
      }
    }
    loadData();
  }, [user]);

  const applyAddress = (addr: any) => {
    setForm((prev) => ({
      ...prev,
      address: [addr.address_line1, addr.address_line2].filter(Boolean).join(", "),
      city: addr.city || "",
      zip: addr.postal_code || "",
      country: addr.country || "",
      phone: addr.phone || prev.phone,
    }));
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const subtotalAfterDiscount = Math.max(0, totalPrice - discountAmount);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    const zone = shippingZones.find((z) => z.id === zoneId);
    if (zone) {
      const isFree = zone.free_above && subtotalAfterDiscount >= Number(zone.free_above);
      setShippingCost(isFree ? 0 : Number(zone.flat_rate));
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error("Invalid coupon code"); return; }

      const coupon = data as any;
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("This coupon has expired"); return;
      }
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error("This coupon has reached its usage limit"); return;
      }
      if (coupon.min_order_amount && totalPrice < Number(coupon.min_order_amount)) {
        toast.error(`Minimum order amount is $${Number(coupon.min_order_amount).toFixed(2)}`); return;
      }

      const amt = coupon.discount_type === "percentage"
        ? totalPrice * (Number(coupon.discount_value) / 100)
        : Math.min(Number(coupon.discount_value), totalPrice);

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discountAmount: Math.round(amt * 100) / 100,
      });
      toast.success("Coupon applied!");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }

    setSubmitting(true);
    try {
      const { data: stores } = await supabase.from("stores").select("id").limit(100);
      const found = stores?.find((s: any) => true);
      if (!found) throw new Error("Store not found");

      const storeId = found.id;
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const shippingAddr = `${form.address}, ${form.city} ${form.zip}, ${form.country}`;

      let customerId: string | null = null;
      if (user) {
        const { data: userCust } = await supabase
          .from("customers").select("id").eq("user_id", user.id).eq("store_id", storeId).maybeSingle();
        if (userCust) customerId = userCust.id;
      }
      if (!customerId) {
        const { data: emailCust } = await supabase
          .from("customers").select("id").eq("store_id", storeId).eq("email", form.email).maybeSingle();
        if (emailCust) customerId = emailCust.id;
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          order_number: orderNum,
          customer_id: customerId,
          items_count: items.reduce((s, i) => s + i.quantity, 0),
          subtotal: totalPrice,
          discount: discountAmount,
          shipping: shippingCost,
          total: finalTotal,
          status: "pending",
          payment_status: "pending",
          notes: form.notes || null,
          shipping_address: shippingAddr,
          coupon_id: appliedCoupon?.id || null,
        } as any)
        .select()
        .single();

      if (orderErr) throw orderErr;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        store_id: storeId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        title: item.title,
        sku: item.sku || null,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // Increment coupon used_count
      if (appliedCoupon) {
        const { data: couponData } = await supabase.from("coupons").select("used_count").eq("id", appliedCoupon.id).single();
        if (couponData) {
          await supabase.from("coupons").update({ used_count: (couponData as any).used_count + 1 } as any).eq("id", appliedCoupon.id);
        }
      }

      setOrderNumber(orderNum);
      setOrderTotal(finalTotal);
      setCompleted(true);
      clearCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <StorefrontLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-muted-foreground mb-1">Your order has been placed successfully.</p>
          <p className="text-sm font-medium mb-2">
            Order number: <span className="font-mono bg-muted px-2 py-0.5 rounded">{orderNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-1">Total: <span className="font-semibold text-foreground">${orderTotal.toFixed(2)}</span></p>
          {form.email && (
            <p className="text-xs text-muted-foreground mb-6">A confirmation will be sent to <span className="font-medium">{form.email}</span></p>
          )}
          <div className="flex gap-3 justify-center">
            {user && <Button variant="outline" onClick={() => navigate(`${basePath}/account`)}>View Orders</Button>}
            <Button onClick={() => navigate(basePath || "/")}>Continue Shopping</Button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (items.length === 0) {
    navigate(`${basePath}/cart`);
    return null;
  }

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <div className="border rounded-lg p-5 space-y-4">
                <h2 className="font-semibold">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full Name *</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className="h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-10" />
                </div>
              </div>

              {/* Shipping */}
              <div className="border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Shipping Address</h2>
                  {savedAddresses.length > 0 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select onValueChange={(id) => {
                        const addr = savedAddresses.find((a: any) => a.id === id);
                        if (addr) applyAddress(addr);
                      }}>
                        <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Use saved address" /></SelectTrigger>
                        <SelectContent>
                          {savedAddresses.map((a: any) => (
                            <SelectItem key={a.id} value={a.id} className="text-xs">
                              {a.label || `${a.address_line1}, ${a.city}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-10" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ZIP Code</Label>
                    <Input value={form.zip} onChange={(e) => update("zip", e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input value={form.country} onChange={(e) => update("country", e.target.value)} className="h-10" />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              {shippingZones.length > 0 && (
                <div className="border rounded-lg p-5 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Shipping Method</h2>
                  <div className="space-y-2">
                    {shippingZones.map((zone) => {
                      const isFree = zone.free_above && subtotalAfterDiscount >= Number(zone.free_above);
                      return (
                        <label
                          key={zone.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedZone === zone.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping_zone"
                              value={zone.id}
                              checked={selectedZone === zone.id}
                              onChange={() => handleZoneChange(zone.id)}
                              className="accent-primary"
                            />
                            <div>
                              <p className="text-sm font-medium">{zone.name}</p>
                              <p className="text-xs text-muted-foreground">{zone.regions}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isFree ? (
                              <div>
                                <span className="text-sm font-medium text-primary">Free</span>
                                <p className="text-2xs text-muted-foreground line-through">${Number(zone.flat_rate).toFixed(2)}</p>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">${Number(zone.flat_rate).toFixed(2)}</span>
                            )}
                            {zone.free_above && !isFree && (
                              <p className="text-2xs text-muted-foreground">Free over ${Number(zone.free_above).toFixed(0)}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="border rounded-lg p-5 space-y-4">
                <h2 className="font-semibold">Order Notes</h2>
                <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Special instructions..." className="min-h-[80px]" />
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="border rounded-lg p-5 space-y-4 sticky top-20">
                <h2 className="font-semibold">Order Summary</h2>
                <div className="space-y-3 divide-y">
                  {items.map((item) => (
                    <div key={`${item.product_id}-${item.variant_id}`} className="flex justify-between text-sm pt-2 first:pt-0">
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium ml-3">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono font-medium text-xs">{appliedCoupon.code}</span>
                      <span className="text-muted-foreground">
                        (-{appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value.toFixed(2)}`})
                      </span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-9 uppercase text-xs font-mono"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading} className="h-9 px-3 shrink-0">
                      {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : selectedZone ? "Free" : "Select method"}</span>
                  </div>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full h-11" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Placing Order...</> : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  );
}
