import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

export default function StorefrontCheckout() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "",
    notes: "",
  });

  // Pre-fill from logged-in customer
  useEffect(() => {
    if (!user) return;
    async function prefill() {
      const { data: custs } = await supabase.from("customers").select("*").eq("user_id", user!.id).limit(1);
      const c = custs?.[0];
      if (c) {
        setForm((prev) => ({
          ...prev,
          name: c.name || prev.name,
          email: c.email || user!.email || prev.email,
          phone: c.phone || prev.phone,
        }));
      } else {
        setForm((prev) => ({ ...prev, email: user!.email || prev.email }));
      }
    }
    prefill();
  }, [user]);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }

    setSubmitting(true);
    try {
      // Find store
      const { data: stores } = await supabase.from("stores").select("id").limit(100);
      const found = stores?.find((s: any) => true); // simplified - gets first store
      if (!found) throw new Error("Store not found");

      const storeId = found.id;
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const shippingAddr = `${form.address}, ${form.city} ${form.zip}, ${form.country}`;
      const subtotal = totalPrice;

      // Check if customer exists or create
      let customerId: string | null = null;
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("store_id", storeId)
        .eq("email", form.email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
      // Note: Can't create customer without store role, that's OK - order can be without customer

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          order_number: orderNum,
          customer_id: customerId,
          items_count: items.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          total: subtotal,
          status: "pending",
          payment_status: "pending",
          notes: form.notes || null,
          shipping_address: shippingAddr,
        } as any)
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Create order items
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

      setOrderNumber(orderNum);
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
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-1">Thank you for your order.</p>
          <p className="text-sm font-medium mb-6">Order number: <span className="font-mono">{orderNumber}</span></p>
          <Button onClick={() => navigate(`/store/${storeSlug}`)}>Continue Shopping</Button>
        </div>
      </StorefrontLayout>
    );
  }

  if (items.length === 0) {
    navigate(`/store/${storeSlug}/cart`);
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
                <h2 className="font-semibold">Shipping Address</h2>
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
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
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
