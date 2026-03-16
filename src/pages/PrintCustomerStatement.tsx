import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function PrintCustomerStatement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: c } = await supabase.from("customers").select("*, stores:store_id(*)").eq("id", id).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCustomer(c);
      setStoreInfo((c as any).stores || null);
      setStoreName((c as any).stores?.name || "");

      const { data: o } = await supabase.from("orders").select("*")
        .eq("customer_id", id).order("created_at", { ascending: false });
      setOrders(o || []);

      const orderIds = (o || []).map((ord: any) => ord.id);
      if (orderIds.length > 0) {
        const { data: p } = await supabase.from("order_payments").select("*")
          .in("order_id", orderIds).order("created_at", { ascending: false });
        setPayments(p || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;

  const totalInvoiced = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const balance = totalInvoiced - totalPaid;

  // Aging buckets
  const now = new Date();
  const unpaidOrders = orders.filter(o => o.payment_status !== "paid");
  const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  unpaidOrders.forEach(o => {
    const days = differenceInDays(now, new Date(o.created_at));
    const amt = Number(o.total || 0);
    if (days <= 30) aging.current += amt;
    else if (days <= 60) aging.days30 += amt;
    else if (days <= 90) aging.days60 += amt;
    else aging.over90 += amt;
  });

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      <div className="no-print flex items-center gap-3 p-4 border-b bg-muted/30">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Customer Statement</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="max-w-[800px] mx-auto p-8 print:p-0 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start pb-5 border-b-2 border-foreground/10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{storeName || "Store"}</h2>
            {storeInfo?.address && <p className="text-sm text-muted-foreground">{storeInfo.address}</p>}
            {storeInfo?.contact_email && <p className="text-sm text-muted-foreground">{storeInfo.contact_email}</p>}
            {storeInfo?.phone && <p className="text-sm text-muted-foreground">{storeInfo.phone}</p>}
            {storeInfo?.abn && <p className="text-xs text-muted-foreground mt-1">ABN: {storeInfo.abn}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Statement</p>
            <p className="font-semibold text-lg mt-1">{customer.name}</p>
            {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
            {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
            <p className="text-xs text-muted-foreground mt-2">Statement Date: {format(now, "MMMM d, yyyy")}</p>
          </div>
        </div>

        {/* Summary boxes */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Invoiced</p>
            <p className="text-xl font-bold mt-1">${totalInvoiced.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Paid</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">${totalPaid.toFixed(2)}</p>
          </div>
          <div className={`border rounded-lg p-4 text-center ${balance > 0 ? "border-destructive/30 bg-destructive/5" : ""}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Balance Due</p>
            <p className={`text-xl font-bold mt-1 ${balance > 0 ? "text-destructive" : ""}`}>${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Aging Summary */}
        {balance > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Aging Summary</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/30 print:bg-gray-50">
                  <th className="text-center py-2 px-3 text-xs font-semibold border-r">Current</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold border-r">31-60 Days</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold border-r">61-90 Days</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold border-r">90+ Days</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center py-2 px-3 border-r font-medium">${aging.current.toFixed(2)}</td>
                  <td className={`text-center py-2 px-3 border-r font-medium ${aging.days30 > 0 ? "text-amber-600" : ""}`}>${aging.days30.toFixed(2)}</td>
                  <td className={`text-center py-2 px-3 border-r font-medium ${aging.days60 > 0 ? "text-orange-600" : ""}`}>${aging.days60.toFixed(2)}</td>
                  <td className={`text-center py-2 px-3 border-r font-medium ${aging.over90 > 0 ? "text-destructive" : ""}`}>${aging.over90.toFixed(2)}</td>
                  <td className="text-center py-2 px-3 font-bold">${balance.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Order History */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Invoice History</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-foreground/15">
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Date</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Invoice #</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Payment</th>
                <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide">Total</th>
                <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide">Balance</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const orderPayments = payments.filter(p => p.order_id === o.id);
                const paidAmount = orderPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
                const orderBalance = Number(o.total || 0) - paidAmount;
                return (
                  <tr key={o.id} className="border-b border-foreground/5">
                    <td className="py-2">{format(new Date(o.created_at), "MMM d, yyyy")}</td>
                    <td className="py-2 font-mono text-xs">{o.order_number}</td>
                    <td className="py-2 capitalize text-xs">{o.status}</td>
                    <td className="py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                        o.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" :
                        o.payment_status === "partial" ? "bg-amber-100 text-amber-800" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-2 text-right">${Number(o.total).toFixed(2)}</td>
                    <td className={`py-2 text-right font-medium ${orderBalance > 0 ? "text-destructive" : ""}`}>
                      ${orderBalance.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">No orders on record</td></tr>
              )}
            </tbody>
            {orders.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-foreground/15 font-bold">
                  <td colSpan={4} className="py-2 text-right">Totals:</td>
                  <td className="py-2 text-right">${totalInvoiced.toFixed(2)}</td>
                  <td className="py-2 text-right">${balance.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment History</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-foreground/15">
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Date</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Method</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Reference</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide">Invoice #</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const relatedOrder = orders.find(o => o.id === p.order_id);
                  return (
                    <tr key={p.id} className="border-b border-foreground/5">
                      <td className="py-2">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                      <td className="py-2 capitalize">{p.payment_method}</td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">{p.reference || "—"}</td>
                      <td className="py-2 font-mono text-xs">{relatedOrder?.order_number || "—"}</td>
                      <td className="py-2 text-right font-medium text-emerald-600">${Number(p.amount).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/15 font-bold">
                  <td colSpan={4} className="py-2 text-right">Total Payments:</td>
                  <td className="py-2 text-right text-emerald-600">${totalPaid.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Payment terms */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p>Payment terms: {customer.payment_terms || "Due on receipt"}</p>
          <p>Please quote your customer number <strong>{customer.id?.slice(0, 8)}</strong> on all remittances.</p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Statement generated on {format(now, "MMMM d, yyyy")} — please contact us for any discrepancies.</p>
          <p className="mt-1">{storeName}{storeInfo?.abn ? ` · ABN ${storeInfo.abn}` : ""}</p>
        </div>
      </div>
    </div>
  );
}
