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
  Receipt, ShoppingBag, X, Gift, Clock, DollarSign, CheckCircle, WifiOff, Wifi, PauseCircle, Play,
  RotateCcw, KeyRound, Percent,
} from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  product_id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image_url?: string;
  discount?: number; // percentage discount
  discount_type?: "percent" | "fixed";
  discount_value?: number;
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
  const [discountDialogItem, setDiscountDialogItem] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountVal, setDiscountVal] = useState("");

  // Parked orders state
  const [parkedOrders, setParkedOrders] = useState<Array<{ id: string; items: CartItem[]; customer: any; parkedAt: string; note: string }>>(() => {
    try { return JSON.parse(localStorage.getItem("pos_parked_orders") || "[]"); } catch { return []; }
  });
  const [parkNote, setParkNote] = useState("");
  const [showParkDialog, setShowParkDialog] = useState(false);

  const saveParked = (updated: typeof parkedOrders) => {
    setParkedOrders(updated);
    localStorage.setItem("pos_parked_orders", JSON.stringify(updated));
  };

  const parkCurrentOrder = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    const parked = { id: crypto.randomUUID(), items: [...cart], customer: selectedCustomer, parkedAt: new Date().toISOString(), note: parkNote };
    saveParked([...parkedOrders, parked]);
    setCart([]);
    setSelectedCustomer(null);
    setParkNote("");
    setShowParkDialog(false);
    toast.success("Order parked");
  };

  const resumeParkedOrder = (parkedId: string) => {
    const parked = parkedOrders.find(p => p.id === parkedId);
    if (!parked) return;
    if (cart.length > 0) {
      // Merge into existing cart or park current first
      toast.error("Clear or park current cart first");
      return;
    }
    setCart(parked.items);
    setSelectedCustomer(parked.customer);
    saveParked(parkedOrders.filter(p => p.id !== parkedId));
    toast.success("Order resumed");
  };

  // Custom sale state
  const [showCustomSale, setShowCustomSale] = useState(false);
  const [customTitle, setCustomTitle] = useState("Custom Item");
  const [customPrice, setCustomPrice] = useState("");

  const addCustomSale = () => {
    const price = parseFloat(customPrice);
    if (!customTitle.trim() || isNaN(price) || price <= 0) { toast.error("Enter a valid title and price"); return; }
    setCart(prev => [...prev, { product_id: `custom-${Date.now()}`, title: customTitle.trim(), sku: "CUSTOM", price, quantity: 1 }]);
    setShowCustomSale(false);
    setCustomTitle("Custom Item");
    setCustomPrice("");
    toast.success("Custom item added");
  };

  const deleteParkedOrder = (parkedId: string) => {
    saveParked(parkedOrders.filter(p => p.id !== parkedId));
    toast.success("Parked order deleted");
  };

  // POS Returns state
  const [showReturn, setShowReturn] = useState(false);
  const [returnOrderSearch, setReturnOrderSearch] = useState("");
  const [returnOrder, setReturnOrder] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState("defective");
  const [returnProcessing, setReturnProcessing] = useState(false);

  const searchReturnOrder = async () => {
    if (!returnOrderSearch.trim() || !storeId) return;
    const { data } = await supabase.from("orders").select("id, order_number, total, customer_id, items_count, created_at").eq("store_id", storeId).ilike("order_number", `%${returnOrderSearch.trim()}%`).limit(1).maybeSingle();
    if (data) {
      const { data: items } = await supabase.from("order_items").select("id, title, sku, quantity, unit_price").eq("order_id", data.id);
      setReturnOrder({ ...data, items: items || [] });
      setReturnItems({});
    } else {
      toast.error("Order not found");
    }
  };

  const processReturn = async () => {
    if (!returnOrder || !storeId || !user) return;
    const selectedItems = Object.entries(returnItems).filter(([, qty]) => qty > 0);
    if (selectedItems.length === 0) { toast.error("Select items to return"); return; }
    setReturnProcessing(true);
    try {
      const refundTotal = selectedItems.reduce((s, [itemId, qty]) => {
        const item = returnOrder.items.find((i: any) => i.id === itemId);
        return s + (item ? Number(item.unit_price) * qty : 0);
      }, 0);
      await supabase.from("returns" as any).insert({
        store_id: storeId, order_id: returnOrder.id,
        customer_id: returnOrder.customer_id,
        reason: returnReason, status: "approved",
        refund_amount: refundTotal, refund_method: "store_credit",
        items: selectedItems.map(([itemId, qty]) => {
          const item = returnOrder.items.find((i: any) => i.id === itemId);
          return { item_id: itemId, title: item?.title, qty, unit_price: item?.unit_price };
        }),
        processed_by: user.id,
      });
      toast.success(`Return processed — $${refundTotal.toFixed(2)} refunded`);
      setShowReturn(false);
      setReturnOrder(null);
      setReturnOrderSearch("");
      setReturnItems({});
    } catch (err: any) { toast.error(err.message); }
    finally { setReturnProcessing(false); }
  };

  // Staff PIN login
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [staffPin, setStaffPin] = useState("");
  const [currentStaff, setCurrentStaff] = useState<string | null>(null);

  const staffPinLogin = () => {
    // Simple PIN-based staff switch using localStorage registry
    try {
      const pins: Record<string, string> = JSON.parse(localStorage.getItem("pos_staff_pins") || "{}");
      const match = Object.entries(pins).find(([, pin]) => pin === staffPin);
      if (match) {
        setCurrentStaff(match[0]);
        setShowPinLogin(false);
        setStaffPin("");
        toast.success(`Switched to ${match[0]}`);
      } else {
        toast.error("Invalid PIN");
      }
    } catch { toast.error("No staff PINs configured"); }
  };

  // Gift voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: string; code: string; balance: number; amountUsed: number } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Sell gift card state
  const [showSellGiftCard, setShowSellGiftCard] = useState(false);
  const [giftCardValue, setGiftCardValue] = useState("50");
  const [giftCardRecipient, setGiftCardRecipient] = useState("");
  const [giftCardSelling, setGiftCardSelling] = useState(false);

  const sellGiftCard = async () => {
    if (!storeId) return;
    const value = parseFloat(giftCardValue);
    if (isNaN(value) || value <= 0) { toast.error("Enter a valid amount"); return; }
    setGiftCardSelling(true);
    try {
      const code = `GC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      await supabase.from("gift_vouchers").insert({
        store_id: storeId,
        code,
        initial_value: value,
        balance: value,
        is_active: true,
        recipient_name: giftCardRecipient || null,
        recipient_email: null,
        sender_name: currentStaff || "POS",
      });
      // Add as cart item so it goes through normal POS sale flow
      setCart(prev => [...prev, {
        product_id: `giftcard-${Date.now()}`,
        title: `Gift Card (${code})`,
        sku: code,
        price: value,
        quantity: 1,
      }]);
      setShowSellGiftCard(false);
      setGiftCardValue("50");
      setGiftCardRecipient("");
      toast.success(`Gift card ${code} created — $${value.toFixed(2)}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setGiftCardSelling(false); }
  };

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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("pos_offline_queue") || "[]"); } catch { return []; }
  });

  // Offline detection
  useState(() => {
    const goOffline = () => { setIsOffline(true); toast.warning("Offline mode active — sales will be queued"); };
    const goOnline = () => { setIsOffline(false); toast.success("Back online — syncing queued sales..."); };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  });

  // Cash drawer command via print
  const openCashDrawer = () => {
    const win = window.open("", "_blank", "width=1,height=1");
    if (win) {
      // ESC/POS command to open cash drawer (pin 2): 0x1B 0x70 0x00 0x19 0xFA
      win.document.write("<pre style='font-size:0'>\x1Bp\x00\x19\xFA</pre>");
      win.document.close();
      win.print();
      setTimeout(() => win.close(), 500);
      toast.success("Cash drawer opened");
    } else {
      toast.error("Unable to open cash drawer — allow popups");
    }
  };

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

  const applyItemDiscount = (productId: string) => {
    const val = Number(discountVal);
    if (!val || val <= 0) { toast.error("Enter a valid discount"); return; }
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      return { ...i, discount_type: discountType, discount_value: val };
    }));
    setDiscountDialogItem(null);
    setDiscountVal("");
    toast.success("Discount applied");
  };

  const getItemTotal = (item: CartItem) => {
    const base = item.price * item.quantity;
    if (!item.discount_value) return base;
    if (item.discount_type === "percent") return base * (1 - item.discount_value / 100);
    return Math.max(0, base - item.discount_value);
  };

  const subtotal = cart.reduce((s, i) => s + getItemTotal(i), 0);
  const totalDiscount = cart.reduce((s, i) => s + (i.price * i.quantity - getItemTotal(i)), 0);
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
        subtotal, tax, total, discount: voucherDiscount + totalDiscount, shipping: 0,
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
        register_id: selectedRegister || null,
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
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="sale">New Sale</TabsTrigger>
              <TabsTrigger value="parked">Parked ({parkedOrders.length})</TabsTrigger>
              <TabsTrigger value="today">Today's Sales ({todayOrders.length})</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
            </TabsList>
            {registers.length > 0 && (
              <Select value={selectedRegister} onValueChange={setSelectedRegister}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Select register..." />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <WifiOff className="h-3 w-3" /> Offline ({offlineQueue.length} queued)
              </Badge>
            )}
            {!isOffline && offlineQueue.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Wifi className="h-3 w-3" /> Syncing {offlineQueue.length}...
              </Badge>
            )}
            {currentStaff && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" /> {currentStaff}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowPinLogin(true)} className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Staff
            </Button>
            <Button variant="outline" size="sm" onClick={openCashDrawer} className="gap-2">
              <DollarSign className="h-4 w-4" /> Open Drawer
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEOD(true)} className="gap-2">
              <Clock className="h-4 w-4" /> End of Day
            </Button>
          </div>
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
                <Button variant="outline" size="sm" className="h-10 gap-1 text-xs" onClick={() => setShowCustomSale(true)}>
                  <Plus className="h-4 w-4" /> Custom
                </Button>
                <Button variant="outline" size="sm" className="h-10 gap-1 text-xs" onClick={() => setShowSellGiftCard(true)}>
                  <Gift className="h-4 w-4" /> Sell Gift Card
                </Button>
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
                  <div key={item.product_id} className="p-2 bg-muted/50 rounded-md space-y-1">
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs font-bold w-14 text-right">${getItemTotal(item).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.discount_value ? (
                        <Badge variant="secondary" className="text-2xs gap-0.5 cursor-pointer" onClick={() => setCart(prev => prev.map(i => i.product_id === item.product_id ? { ...i, discount_value: undefined, discount_type: undefined } : i))}>
                          {item.discount_type === "percent" ? `${item.discount_value}% off` : `$${item.discount_value} off`}
                          <X className="h-2.5 w-2.5 ml-0.5" />
                        </Badge>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground" onClick={() => { setDiscountDialogItem(item.product_id); setDiscountType("percent"); setDiscountVal(""); }}>
                          + Discount
                        </Button>
                      )}
                    </div>
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
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>${cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-xs text-primary"><span>Discounts</span><span>-${totalDiscount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">GST (10%)</span><span>${tax.toFixed(2)}</span></div>
                {appliedVoucher && <div className="flex justify-between text-xs text-primary"><span>Voucher</span><span>-${voucherDiscount.toFixed(2)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-lg">${total.toFixed(2)}</span></div>
                <div className="grid grid-cols-3 gap-2">
                  <Button className="h-12 text-sm gap-2" disabled={cart.length === 0} onClick={() => setShowPayment(true)}>
                    <CreditCard className="h-4 w-4" /> Pay
                  </Button>
                  <Button variant="outline" className="h-12 text-sm gap-2" disabled={cart.length === 0} onClick={() => setShowParkDialog(true)}>
                    <PauseCircle className="h-4 w-4" /> Park
                  </Button>
                  <Button variant="outline" className="h-12 text-sm gap-2" disabled={cart.length === 0 || !selectedCustomer} onClick={() => setShowLayby(true)}>
                    <Clock className="h-4 w-4" /> Layby
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="parked">
          <Card>
            <CardContent className="pt-4">
              {parkedOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PauseCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No parked orders</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Parked At</TableHead>
                      <TableHead className="text-xs h-8">Customer</TableHead>
                      <TableHead className="text-xs h-8">Items</TableHead>
                      <TableHead className="text-xs h-8">Note</TableHead>
                      <TableHead className="text-xs h-8">Total</TableHead>
                      <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parkedOrders.map(p => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="py-1.5">{new Date(p.parkedAt).toLocaleTimeString()}</TableCell>
                        <TableCell className="py-1.5">{p.customer?.name || "Walk-in"}</TableCell>
                        <TableCell className="py-1.5">{p.items.reduce((s, i) => s + i.quantity, 0)} items</TableCell>
                        <TableCell className="py-1.5 max-w-[150px] truncate text-muted-foreground">{p.note || "—"}</TableCell>
                        <TableCell className="py-1.5 font-medium">${p.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 text-right space-x-1">
                          <Button size="sm" variant="outline" className="text-xs h-6 gap-1" onClick={() => resumeParkedOrder(p.id)}>
                            <Play className="h-3 w-3" /> Resume
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => deleteParkedOrder(p.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
                    <TableHead className="text-xs h-8">Order</TableHead>
                    <TableHead className="text-xs h-8">Time</TableHead>
                    <TableHead className="text-xs h-8">Status</TableHead>
                    <TableHead className="text-xs h-8 text-right">Total</TableHead>
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

        {/* Returns Tab */}
        <TabsContent value="returns">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Search order number..." value={returnOrderSearch} onChange={e => setReturnOrderSearch(e.target.value)} className="h-9 max-w-xs" onKeyDown={e => e.key === "Enter" && searchReturnOrder()} />
                <Button size="sm" onClick={searchReturnOrder}><Search className="h-3.5 w-3.5 mr-1" /> Find Order</Button>
              </div>
              {returnOrder && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-medium">{returnOrder.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(returnOrder.created_at).toLocaleDateString()} — ${Number(returnOrder.total).toFixed(2)}</p>
                    </div>
                    <Select value={returnReason} onValueChange={setReturnReason}>
                      <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defective">Defective</SelectItem>
                        <SelectItem value="wrong_item">Wrong Item</SelectItem>
                        <SelectItem value="not_as_described">Not as Described</SelectItem>
                        <SelectItem value="changed_mind">Changed Mind</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Product</TableHead>
                        <TableHead className="text-xs h-8">SKU</TableHead>
                        <TableHead className="text-xs h-8 text-center">Ordered</TableHead>
                        <TableHead className="text-xs h-8 text-center">Return Qty</TableHead>
                        <TableHead className="text-xs h-8 text-right">Refund</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnOrder.items.map((item: any) => (
                        <TableRow key={item.id} className="text-xs">
                          <TableCell className="py-1.5 font-medium">{item.title}</TableCell>
                          <TableCell className="py-1.5 font-mono text-muted-foreground">{item.sku || "—"}</TableCell>
                          <TableCell className="py-1.5 text-center">{item.quantity}</TableCell>
                          <TableCell className="py-1.5 text-center">
                            <Input type="number" min="0" max={item.quantity} value={returnItems[item.id] || 0} onChange={e => setReturnItems(prev => ({ ...prev, [item.id]: Math.min(item.quantity, Number(e.target.value)) }))} className="h-7 w-16 text-center text-xs mx-auto" />
                          </TableCell>
                          <TableCell className="py-1.5 text-right">${((returnItems[item.id] || 0) * Number(item.unit_price)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm font-medium">
                      Refund Total: ${Object.entries(returnItems).reduce((s, [id, qty]) => {
                        const item = returnOrder.items.find((i: any) => i.id === id);
                        return s + (item ? Number(item.unit_price) * qty : 0);
                      }, 0).toFixed(2)}
                    </p>
                    <Button size="sm" onClick={processReturn} disabled={returnProcessing}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> {returnProcessing ? "Processing..." : "Process Return"}
                    </Button>
                  </div>
                </div>
              )}
              {!returnOrder && <p className="text-sm text-muted-foreground text-center py-8">Search for an order to process a return</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff PIN Dialog */}
      <Dialog open={showPinLogin} onOpenChange={setShowPinLogin}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Staff Login</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="password" placeholder="Enter PIN" value={staffPin} onChange={e => setStaffPin(e.target.value)} className="h-10 text-center text-lg tracking-widest" maxLength={6} onKeyDown={e => e.key === "Enter" && staffPinLogin()} autoFocus />
            <p className="text-[10px] text-muted-foreground text-center">Configure PINs in Settings → Team</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPinLogin(false)}>Cancel</Button>
            <Button size="sm" onClick={staffPinLogin}>Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Sale Dialog */}
      <Dialog open={showCustomSale} onOpenChange={setShowCustomSale}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Custom Sale Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Item Name</Label>
              <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Price ($)</Label>
              <Input type="number" min="0" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} className="h-8 text-sm" placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCustomSale(false)}>Cancel</Button>
            <Button size="sm" onClick={addCustomSale}>Add to Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Park Order Dialog */}
      <Dialog open={showParkDialog} onOpenChange={setShowParkDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Park Current Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{cart.length} item(s) — ${(subtotal + tax).toFixed(2)}</p>
            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Input placeholder="e.g. Customer went to get wallet" value={parkNote} onChange={e => setParkNote(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowParkDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={parkCurrentOrder} className="gap-1"><PauseCircle className="h-3 w-3" /> Park Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Line Item Discount Dialog */}
      <Dialog open={!!discountDialogItem} onOpenChange={(o) => { if (!o) setDiscountDialogItem(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-sm">Apply Discount</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant={discountType === "percent" ? "default" : "outline"} size="sm" className="flex-1 gap-1" onClick={() => setDiscountType("percent")}>
                <Percent className="h-3.5 w-3.5" /> Percentage
              </Button>
              <Button variant={discountType === "fixed" ? "default" : "outline"} size="sm" className="flex-1 gap-1" onClick={() => setDiscountType("fixed")}>
                <DollarSign className="h-3.5 w-3.5" /> Fixed
              </Button>
            </div>
            <Input type="number" min="0" step="0.01" placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 5.00"} value={discountVal} onChange={e => setDiscountVal(e.target.value)} className="h-9" autoFocus />
            <Button className="w-full" onClick={() => discountDialogItem && applyItemDiscount(discountDialogItem)}>Apply Discount</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Sell Gift Card Dialog */}
      <Dialog open={showSellGiftCard} onOpenChange={setShowSellGiftCard}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Gift className="h-4 w-4" /> Sell Gift Card</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Gift Card Value ($)</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {["25", "50", "100", "200"].map(v => (
                  <Button key={v} variant={giftCardValue === v ? "default" : "outline"} size="sm" onClick={() => setGiftCardValue(v)}>${v}</Button>
                ))}
              </div>
              <Input type="number" min="1" step="0.01" value={giftCardValue} onChange={e => setGiftCardValue(e.target.value)} className="h-8 text-sm mt-2" placeholder="Custom amount" />
            </div>
            <div>
              <Label className="text-xs">Recipient Name (optional)</Label>
              <Input value={giftCardRecipient} onChange={e => setGiftCardRecipient(e.target.value)} className="h-8 text-sm" placeholder="e.g. John Smith" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSellGiftCard(false)}>Cancel</Button>
            <Button size="sm" onClick={sellGiftCard} disabled={giftCardSelling} className="gap-1">
              <Gift className="h-3 w-3" /> {giftCardSelling ? "Creating..." : `Add $${parseFloat(giftCardValue || "0").toFixed(2)} Gift Card`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
