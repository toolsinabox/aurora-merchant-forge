import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";

export default function PrintCustomerStatement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: c } = await supabase.from("customers").select("*, stores:store_id(name)").eq("id", id).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCustomer(c);
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Customer Statement</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="p-8 print:p-0 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">ACCOUNT STATEMENT</h2>
            {storeName && <p className="text-muted-foreground">{storeName}</p>}
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{customer.name}</p>
            {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
            {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Statement Date: {format(new Date(), "MMMM d, yyyy")}</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
            <p className="text-lg font-bold">${totalInvoiced.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Balance Due</p>
            <p className={`text-lg font-bold ${balance > 0 ? "text-red-600" : ""}`}>${balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Orders */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Order History</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left py-2 text-xs font-medium text-muted-foreground">Order #</th>
                <th className="text-left py-2 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b">
                  <td className="py-1.5">{format(new Date(o.created_at), "MMM d, yyyy")}</td>
                  <td className="py-1.5 font-mono">{o.order_number}</td>
                  <td className="py-1.5 capitalize">{o.payment_status}</td>
                  <td className="py-1.5 text-right">${Number(o.total).toFixed(2)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No orders</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Payment History</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Method</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Reference</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="py-1.5">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                    <td className="py-1.5 capitalize">{p.payment_method}</td>
                    <td className="py-1.5 font-mono text-muted-foreground">{p.reference || "—"}</td>
                    <td className="py-1.5 text-right text-green-600">${Number(p.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-4 border-t">
          This statement was generated on {format(new Date(), "MMMM d, yyyy")}. Please contact us for any discrepancies.
        </p>
      </div>
    </div>
  );
}
