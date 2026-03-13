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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Plus, Minus, Trash2, User, CreditCard, Banknote,
  Receipt, ShoppingBag, X, Gift, Clock, DollarSign, CheckCircle,
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
  const { currentStore, user } = useAuth();
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
  const [activeTab, setActiveTab] = useState("sale");
  const [selectedRegister, setSelectedRegister] = useState<string>("");

  // Gift voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: string; code: string; balance: number; amountUsed: number } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Layby state
  const [showLayby, setShowLayby] = useState(false);
  const [laybyDeposit, setLaybyDeposit] = useState("20");
  const [laybyInstallments, setLaybyInstallments] = useState("4");
  const [laybyFrequency, setLaybyFrequency] = useState("weekly");
  const [laybyProcessing, setLaybyProcessing] = useState(false);

  // EOD state
  const [showEOD, setShowEOD] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("0");
  const [actualCash, setActualCash] = useState("");
  const [eodNotes, setEodNotes] = useState("");
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Load registers
  const { data: registers = [] } = useQuery({
    queryKey: ["pos_registers", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("pos_registers" as any).select("id, name, location_id, is_active").eq("store_id", storeId).eq("is_active", true).order("name");
      return (data || []) as any[];
    },
    enabled: !!storeId,
  });

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

  // Load today's POS orders for EOD
  const { data: todayOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["pos_today_orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("orders").select("id, order_number, total, created_at, payment_status")
        .eq("store_id", storeId).eq("order_channel", "pos").gte("created_at", today.toISOString()).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!storeId,
  });

  // Load today's payments for EOD breakdown
  const { data: todayPayments = [] } = useQuery({
    queryKey: ["pos_today_payments", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const orderIds = todayOrders.map(o => o.id);
      if (orderIds.length === 0) return [];
      const { data } = await supabase.from("order_payments").select("amount, payment_method").in("order_id", orderIds);
      return data || [];
    },
    enabled: todayOrders.length > 0,
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
  const tax = subtotal * 0.1;
  const voucherDiscount = appliedVoucher?.amountUsed ?? 0;
  const total = Math.max(0, subtotal + tax - voucherDiscount);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Gift voucher redemption
  const applyVoucher = async () => {
    if (!voucherCode.trim() || !storeId) return;
    setVoucherLoading(true);
    try {
      const { data: voucher } = await supabase.from("gift_vouchers").select("id, code, balance, is_active, expires_at")
        .eq("store_id", storeId).eq("code", voucherCode.trim().toUpperCase()).maybeSingle();
      if (!voucher) { toast.error("Voucher not found"); return; }
      if (!voucher.is_active) { toast.error("Voucher is inactive"); return; }
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) { toast.error("Voucher expired"); return; }
      if (Number(voucher.balance) <= 0) { toast.error("No remaining balance"); return; }
      const amountUsed = Math.min(Number(voucher.balance), subtotal + tax);
      setAppliedVoucher({ id: voucher.id, code: voucher.code, balance: Number(voucher.balance), amountUsed });
      toast.success(`Voucher applied: -$${amountUsed.toFixed(2)}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setVoucherLoading(false); }
  };

  const processPayment = async () => {
    if (!storeId || cart.length === 0) return;
    setProcessing(true);
    try {
      const orderNumber = `POS-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        store_id: storeId,
        order_number: orderNumber,
        customer_id: selectedCustomer?.id || null,
        subtotal, tax, total, discount: voucherDiscount, shipping: 0,
        items_count: itemCount,
        status: "completed",
        payment_status: "paid",
        fulfillment_status: "fulfilled",
        order_channel: "pos",
      }).select("id, order_number, total").single();

      if (orderErr) throw orderErr;

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

      const { data: { user: authUser } } = await supabase.auth.getUser();
      await supabase.from("order_payments").insert({
        order_id: order.id,
        store_id: storeId,
        amount: total,
        payment_method: appliedVoucher ? "voucher+" + paymentMethod : paymentMethod,
        recorded_by: authUser?.id || "",
      });

      // Deduct voucher balance
      if (appliedVoucher) {
        const newBalance = Math.max(0, appliedVoucher.balance - appliedVoucher.amountUsed);
        await supabase.from("gift_vouchers").update({ balance: newBalance, redeemed_at: newBalance === 0 ? new Date().toISOString() : null }).eq("id", appliedVoucher.id);
      }

      setLastOrder({ ...order, items: cart, paymentMethod: appliedVoucher ? `Voucher + ${paymentMethod}` : paymentMethod, subtotal, tax, voucherDiscount, customer: selectedCustomer });
      setCart([]);
      setSelectedCustomer(null);
      setAppliedVoucher(null);
      setVoucherCode("");
      setShowPayment(false);
      setShowReceipt(true);
      refetchOrders();
      toast.success(`Sale completed: ${orderNumber}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // EOD calculations
  const eodTotalSales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const eodCardTotal = todayPayments.filter(p => p.payment_method === "card").reduce((s, p) => s + Number(p.amount), 0);
  const eodCashTotal = todayPayments.filter(p => p.payment_method === "cash").reduce((s, p) => s + Number(p.amount), 0);
  const eodOtherTotal = todayPayments.filter(p => !["card", "cash"].includes(p.payment_method)).reduce((s, p) => s + Number(p.amount), 0);
  const expectedCash = Number(openingFloat) + eodCashTotal;
  const cashDiff = actualCash ? Number(actualCash) - expectedCash : 0;

  const closeRegister = async () => {
    if (!storeId || !user) return;
    try {
      await supabase.from("pos_register_sessions" as any).insert({
        store_id: storeId,
        opened_by: user.id,
        opening_float: Number(openingFloat),
        expected_cash: expectedCash,
        actual_cash: Number(actualCash),
        cash_difference: cashDiff,
        total_sales: eodTotalSales,
        total_orders: todayOrders.length,
        card_total: eodCardTotal,
        cash_total: eodCashTotal,
        other_total: eodOtherTotal,
        notes: eodNotes,
        status: "closed",
        closed_at: new Date().toISOString(),
      });
      toast.success("Register closed successfully");
      setShowEOD(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const createLayby = async () => {
    if (!storeId || !user || !selectedCustomer || cart.length === 0) return;
    setLaybyProcessing(true);
    try {
      const orderNumber = `LAY-${Date.now().toString(36).toUpperCase()}`;
      const depositAmount = (Number(laybyDeposit) / 100) * total;
      const remaining = total - depositAmount;
      const installCount = Number(laybyInstallments);
      const installAmount = remaining / installCount;

      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        store_id: storeId, order_number: orderNumber,
        customer_id: selectedCustomer.id,
        subtotal, tax, total, discount: voucherDiscount, shipping: 0,
        items_count: itemCount, status: "pending",
        payment_status: "partially_paid", fulfillment_status: "unfulfilled",
        order_channel: "pos",
      }).select("id, order_number, total").single();
      if (orderErr) throw orderErr;

      await supabase.from("order_items").insert(cart.map(i => ({
        order_id: order.id, store_id: storeId, product_id: i.product_id,
        title: i.title, sku: i.sku, quantity: i.quantity,
        unit_price: i.price, total: i.price * i.quantity,
      })));

      const nextDue = new Date();
      if (laybyFrequency === "weekly") nextDue.setDate(nextDue.getDate() + 7);
      else if (laybyFrequency === "fortnightly") nextDue.setDate(nextDue.getDate() + 14);
      else nextDue.setMonth(nextDue.getMonth() + 1);

      await supabase.from("layby_plans").insert({
        store_id: storeId, order_id: order.id, customer_id: selectedCustomer.id,
        total_amount: total, deposit_amount: depositAmount,
        installments_count: installCount, installment_amount: installAmount,
        installments_paid: 0, amount_paid: depositAmount,
        frequency: laybyFrequency, next_due_date: nextDue.toISOString(),
        status: "active",
      });

      const { data: { user: authUser } } = await supabase.auth.getUser();
      await supabase.from("order_payments").insert({
        order_id: order.id, store_id: storeId,
        amount: depositAmount, payment_method: paymentMethod,
        recorded_by: authUser?.id || "",
      });

      const { data: plan } = await supabase.from("layby_plans")
        .select("id").eq("order_id", order.id).single();
      if (plan) {
        await supabase.from("layby_payments").insert({
          layby_plan_id: plan.id, store_id: storeId,
          amount: depositAmount, payment_method: paymentMethod,
        });
      }

      setCart([]); setSelectedCustomer(null); setAppliedVoucher(null); setVoucherCode("");
      setShowLayby(false);
      refetchOrders();
      toast.success(`Layby created: ${orderNumber} — Deposit $${depositAmount.toFixed(2)}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setLaybyProcessing(false); }
  };

  return (
    <AdminLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="sale">New Sale</TabsTrigger>
            <TabsTrigger value="today">Today's Sales ({todayOrders.length})</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => setShowEOD(true)} className="gap-2">
            <Clock className="h-4 w-4" /> End of Day
          </Button>
        </div>

        <TabsContent value="sale">
          <div className="flex gap-4 h-[calc(100vh-170px)]">
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

              {/* Gift Voucher */}
              <div className="px-3 pb-2">
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-muted rounded-md px-2 py-1.5">
                    <span className="text-xs font-medium text-primary"><Gift className="h-3 w-3 inline mr-1" />{appliedVoucher.code} -${appliedVoucher.amountUsed.toFixed(2)}</span>
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground" onClick={() => setAppliedVoucher(null)} />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Input placeholder="Gift voucher code" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="h-7 text-xs flex-1" />
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={applyVoucher} disabled={voucherLoading}>
                      <Gift className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals & Pay */}
              <div className="p-3 border-t space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">GST (10%)</span><span>${tax.toFixed(2)}</span></div>
                {appliedVoucher && <div className="flex justify-between text-xs text-primary"><span>Voucher</span><span>-${voucherDiscount.toFixed(2)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-lg">${total.toFixed(2)}</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-12 text-sm gap-2" disabled={cart.length === 0} onClick={() => setShowPayment(true)}>
                    <CreditCard className="h-4 w-4" /> Pay ${total.toFixed(2)}
                  </Button>
                  <Button variant="outline" className="h-12 text-sm gap-2" disabled={cart.length === 0 || !selectedCustomer} onClick={() => setShowLayby(true)}>
                    <Clock className="h-4 w-4" /> Layby
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold">${eodTotalSales.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-xl font-bold">{todayOrders.length}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Card</p>
                  <p className="text-xl font-bold">${eodCardTotal.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Cash</p>
                  <p className="text-xl font-bold">${eodCashTotal.toFixed(2)}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                      <TableCell className="text-sm">{new Date(o.created_at).toLocaleTimeString()}</TableCell>
                      <TableCell><Badge variant="secondary">{o.payment_status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">${Number(o.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {todayOrders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No POS sales today</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            {appliedVoucher && (
              <div className="text-sm bg-muted rounded-md p-3">
                <span className="text-muted-foreground">Voucher: </span>
                <span className="font-medium text-primary">{appliedVoucher.code} (-${appliedVoucher.amountUsed.toFixed(2)})</span>
              </div>
            )}
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
              {lastOrder.voucherDiscount > 0 && <div className="flex justify-between text-xs text-primary"><span>Voucher</span><span>-${lastOrder.voucherDiscount.toFixed(2)}</span></div>}
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

      {/* End of Day Dialog */}
      <Dialog open={showEOD} onOpenChange={setShowEOD}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>End of Day Reconciliation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground">Total Sales</p>
                <p className="text-lg font-bold">${eodTotalSales.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground">Orders</p>
                <p className="text-lg font-bold">{todayOrders.length}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground">Avg Order</p>
                <p className="text-lg font-bold">${todayOrders.length ? (eodTotalSales / todayOrders.length).toFixed(2) : "0.00"}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Card:</span><span className="font-medium">${eodCardTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cash:</span><span className="font-medium">${eodCashTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Other:</span><span className="font-medium">${eodOtherTotal.toFixed(2)}</span></div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Opening Float ($)</Label>
                <Input type="number" value={openingFloat} onChange={e => setOpeningFloat(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Actual Cash in Drawer ($)</Label>
                <Input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)} placeholder="Count cash..." />
              </div>
            </div>
            {actualCash && (
              <div className={`text-center p-3 rounded-lg ${cashDiff === 0 ? "bg-primary/10" : cashDiff > 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                <p className="text-xs text-muted-foreground">Expected: ${expectedCash.toFixed(2)}</p>
                <p className={`text-lg font-bold ${cashDiff === 0 ? "text-primary" : cashDiff > 0 ? "text-primary" : "text-destructive"}`}>
                  {cashDiff === 0 ? "✓ Balanced" : cashDiff > 0 ? `+$${cashDiff.toFixed(2)} Over` : `-$${Math.abs(cashDiff).toFixed(2)} Short`}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={eodNotes} onChange={e => setEodNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEOD(false)}>Cancel</Button>
            <Button onClick={closeRegister} disabled={!actualCash} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Close Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Layby Dialog */}
      <Dialog open={showLayby} onOpenChange={setShowLayby}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Layby — ${total.toFixed(2)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium">Customer: {selectedCustomer?.name}</p>
              <p className="text-muted-foreground">{cart.length} item{cart.length !== 1 ? "s" : ""} — ${total.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deposit (%)</Label>
                <Select value={laybyDeposit} onValueChange={setLaybyDeposit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Installments</Label>
                <Select value={laybyInstallments} onValueChange={setLaybyInstallments}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Frequency</Label>
              <Select value={laybyFrequency} onValueChange={setLaybyFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit ({laybyDeposit}%)</span><span className="font-medium">${((Number(laybyDeposit) / 100) * total).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span>${(total - (Number(laybyDeposit) / 100) * total).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Per installment ({laybyInstallments}x {laybyFrequency})</span><span>${((total - (Number(laybyDeposit) / 100) * total) / Number(laybyInstallments)).toFixed(2)}</span></div>
            </div>
            <div>
              <Label className="text-xs">Payment Method (Deposit)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { value: "card", label: "Card", icon: CreditCard },
                  { value: "cash", label: "Cash", icon: Banknote },
                  { value: "other", label: "Other", icon: Receipt },
                ].map(m => (
                  <Button key={m.value} variant={paymentMethod === m.value ? "default" : "outline"} className="h-10 flex-col gap-0.5" onClick={() => setPaymentMethod(m.value)}>
                    <m.icon className="h-4 w-4" />
                    <span className="text-[10px]">{m.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLayby(false)}>Cancel</Button>
            <Button onClick={createLayby} disabled={laybyProcessing} className="gap-2">
              <CheckCircle className="h-4 w-4" /> {laybyProcessing ? "Processing..." : `Take Deposit $${((Number(laybyDeposit) / 100) * total).toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
