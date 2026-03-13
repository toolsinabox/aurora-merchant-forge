import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Plus, Minus, Trash2, User, CreditCard, Banknote,
  Receipt, ShoppingBag, X,
} from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  product_id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export default function POS() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["pos_products", storeId, search],
    queryFn: async () => {
      if (!storeId) return [];
      let q = supabase.from("products").select("id, title, sku, price, image_url, stock_quantity, track_inventory").eq("store_id", storeId).eq("status", "active").limit(50);
      if (search) q = q.or(`title.ilike.%${search}%,sku.ilike.%${search}%`);
      const { data } = await q.order("title");
      return data || [];
    },
    enabled: !!storeId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["pos_customers", storeId, customerSearch],
    queryFn: async () => {
      if (!storeId || !customerSearch) return [];
      const { data } = await supabase.from("customers").select("id, name, email, phone").eq("store_id", storeId).or(`name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`).limit(10);
      return data || [];
    },
    enabled: !!storeId && customerSearch.length > 1,
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: product.id, title: product.title, sku: product.sku || "", price: product.price || 0, quantity: 1, image_url: product.image_url }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.1; // GST
  const total = subtotal + tax;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const processPayment = async () => {
    if (!storeId || cart.length === 0) return;
    setProcessing(true);
    try {
      // Create order
      const orderNumber = `POS-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        store_id: storeId,
        order_number: orderNumber,
        customer_id: selectedCustomer?.id || null,
        subtotal, tax, total, discount: 0, shipping: 0,
        items_count: itemCount,
        status: "completed",
        payment_status: "paid",
        fulfillment_status: "fulfilled",
        order_channel: "pos",
      }).select("id, order_number, total").single();

      if (orderErr) throw orderErr;

      // Insert order items
      const items = cart.map(i => ({
        order_id: order.id,
        store_id: storeId,
        product_id: i.product_id,
        title: i.title,
        sku: i.sku,
        quantity: i.quantity,
        unit_price: i.price,
        total: i.price * i.quantity,
      }));
      await supabase.from("order_items").insert(items);

      // Record payment
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("order_payments").insert({
        order_id: order.id,
        store_id: storeId,
        amount: total,
        payment_method: paymentMethod,
        recorded_by: user?.id || "",
      });

      setLastOrder({ ...order, items: cart, paymentMethod, subtotal, tax, customer: selectedCustomer });
      setCart([]);
      setSelectedCustomer(null);
      setShowPayment(false);
      setShowReceipt(true);
      toast.success(`Sale completed: ${orderNumber}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products or scan barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {products.map((p: any) => (
                <Card key={p.id} className="cursor-pointer hover:ring-2 ring-primary transition-all" onClick={() => addToCart(p)}>
                  <CardContent className="p-3">
                    {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-20 object-cover rounded mb-2" />}
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-bold text-primary">${(p.price || 0).toFixed(2)}</span>
                      {p.sku && <span className="text-[10px] text-muted-foreground">{p.sku}</span>}
                    </div>
                    {p.track_inventory && <span className="text-[10px] text-muted-foreground">Stock: {p.stock_quantity}</span>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-80 flex flex-col bg-card border rounded-lg">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Cart ({itemCount})</h3>
              {cart.length > 0 && <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => setCart([])}>Clear</Button>}
            </div>
            {/* Customer Lookup */}
            <div className="relative">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-muted rounded-md px-2 py-1.5">
                  <span className="text-xs font-medium">{selectedCustomer.name}</span>
                  <X className="h-3 w-3 cursor-pointer text-muted-foreground" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} />
                </div>
              ) : (
                <>
                  <Input placeholder="Search customer..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-7 h-8 text-xs" />
                  {customers.length > 0 && customerSearch && (
                    <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md mt-1 max-h-32 overflow-y-auto">
                      {customers.map((c: any) => (
                        <div key={c.id} className="px-3 py-1.5 text-xs hover:bg-accent cursor-pointer" onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}>
                          <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">{c.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Tap a product to add</p>
            ) : cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateQty(item.product_id, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateQty(item.product_id, 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeItem(item.product_id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <span className="text-xs font-bold w-14 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals & Pay */}
          <div className="p-3 border-t space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">GST (10%)</span><span>${tax.toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>Total</span><span className="text-lg">${total.toFixed(2)}</span></div>
            <Button className="w-full h-12 text-lg gap-2" disabled={cart.length === 0} onClick={() => setShowPayment(true)}>
              <CreditCard className="h-5 w-5" /> Pay ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payment — ${total.toFixed(2)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: "card", label: "Card", icon: CreditCard },
                  { value: "cash", label: "Cash", icon: Banknote },
                  { value: "other", label: "Other", icon: Receipt },
                ].map(m => (
                  <Button key={m.value} variant={paymentMethod === m.value ? "default" : "outline"} className="h-16 flex-col gap-1" onClick={() => setPaymentMethod(m.value)}>
                    <m.icon className="h-5 w-5" />
                    <span className="text-xs">{m.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            {selectedCustomer && (
              <div className="text-sm bg-muted rounded-md p-3">
                <span className="text-muted-foreground">Customer: </span>
                <span className="font-medium">{selectedCustomer.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button onClick={processPayment} disabled={processing} className="gap-2">
              {processing ? "Processing..." : `Complete Sale — $${total.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-center">Sale Complete ✓</DialogTitle></DialogHeader>
          {lastOrder && (
            <div className="space-y-3 text-center">
              <p className="text-2xl font-bold text-primary">${lastOrder.total.toFixed(2)}</p>
              <Badge variant="secondary">{lastOrder.order_number}</Badge>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Method: {lastOrder.paymentMethod}</p>
                {lastOrder.customer && <p>Customer: {lastOrder.customer.name}</p>}
                <p>{new Date().toLocaleString()}</p>
              </div>
              <Separator />
              <div className="text-left space-y-1">
                {lastOrder.items.map((i: CartItem) => (
                  <div key={i.product_id} className="flex justify-between text-xs">
                    <span>{i.quantity}× {i.title}</span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-xs"><span>Subtotal</span><span>${lastOrder.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span>GST</span><span>${lastOrder.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-sm"><span>Total</span><span>${lastOrder.total.toFixed(2)}</span></div>
            </div>
          )}
          <DialogFooter className="flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
              <Receipt className="h-4 w-4 mr-2" /> Print Receipt
            </Button>
            <Button className="w-full" onClick={() => setShowReceipt(false)}>New Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
