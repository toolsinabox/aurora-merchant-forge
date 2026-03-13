import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrintPaymentReceipt() {
  const { id, paymentId } = useParams();
  const { currentStore } = useAuth();

  const { data: order } = useQuery({
    queryKey: ["order-receipt", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: payment } = useQuery({
    queryKey: ["payment-receipt", paymentId],
    queryFn: async () => {
      const { data } = await supabase.from("order_payments").select("*").eq("id", paymentId!).single();
      return data;
    },
    enabled: !!paymentId,
  });

  if (!order || !payment) {
    return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  const p = payment as any;
  const o = order as any;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white text-black print:p-4">
      <style>{`@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }`}</style>

      <div className="no-print mb-4">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
          Print Receipt
        </button>
        <button onClick={() => window.history.back()} className="px-4 py-2 ml-2 border rounded text-sm">
          Back
        </button>
      </div>

      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">{currentStore?.name || "Store"}</h1>
        <p className="text-sm text-gray-500">Payment Receipt</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="font-semibold mb-1">Receipt Details</p>
          <p>Receipt #: REC-{p.id?.slice(0, 8).toUpperCase()}</p>
          <p>Date: {new Date(p.created_at).toLocaleDateString()}</p>
          <p>Method: {p.payment_method}</p>
          {p.reference && <p>Reference: {p.reference}</p>}
        </div>
        <div>
          <p className="font-semibold mb-1">Order Details</p>
          <p>Order #: {o.order_number}</p>
          <p>Order Date: {new Date(o.created_at).toLocaleDateString()}</p>
          <p>Status: {o.payment_status}</p>
        </div>
      </div>

      <div className="border rounded mb-6">
        <div className="bg-gray-100 px-4 py-2 text-xs font-semibold grid grid-cols-4">
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Total</span>
        </div>
        {(o.order_items || []).map((item: any) => (
          <div key={item.id} className="px-4 py-2 text-sm grid grid-cols-4 border-t">
            <span>{item.title}</span>
            <span className="text-right">{item.quantity}</span>
            <span className="text-right">${Number(item.unit_price).toFixed(2)}</span>
            <span className="text-right">${Number(item.total).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="text-right space-y-1 text-sm mb-6">
        <p>Subtotal: ${Number(o.subtotal).toFixed(2)}</p>
        {Number(o.tax) > 0 && <p>Tax: ${Number(o.tax).toFixed(2)}</p>}
        {Number(o.shipping) > 0 && <p>Shipping: ${Number(o.shipping).toFixed(2)}</p>}
        {Number(o.discount) > 0 && <p>Discount: -${Number(o.discount).toFixed(2)}</p>}
        <p className="text-lg font-bold border-t pt-2">Order Total: ${Number(o.total).toFixed(2)}</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-4 text-center mb-6">
        <p className="text-lg font-bold text-green-700">Amount Paid: ${Number(p.amount).toFixed(2)}</p>
        <p className="text-sm text-green-600">via {p.payment_method}{p.reference ? ` (Ref: ${p.reference})` : ""}</p>
      </div>

      {p.notes && (
        <div className="text-sm text-gray-500 mb-4">
          <p className="font-semibold">Notes:</p>
          <p>{p.notes}</p>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 border-t pt-4">
        <p>Thank you for your payment</p>
        <p>{currentStore?.name || "Store"}</p>
      </div>
    </div>
  );
}
