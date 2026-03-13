import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function PrintPackingSlip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const [items, setItems] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    if (!order) return;
    supabase.from("order_items").select("*").eq("order_id", order.id)
      .then(({ data }) => setItems(data || []));
    supabase.from("stores").select("name").eq("id", order.store_id).maybeSingle()
      .then(({ data }) => { if (data) setStoreName(data.name); });
  }, [order]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Packing Slip</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="p-8 print:p-0">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold">PACKING SLIP</h2>
            <p className="text-muted-foreground mt-1">Order {order.order_number}</p>
            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{storeName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {order.shipping_address && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ship To</p>
              <p className="text-sm whitespace-pre-wrap">{order.shipping_address}</p>
            </div>
          )}
          {order.billing_address && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bill To</p>
              <p className="text-sm whitespace-pre-wrap">{order.billing_address}</p>
            </div>
          )}
        </div>

        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 px-2">☐</th>
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Item</th>
              <th className="text-left py-2 px-2">SKU</th>
              <th className="text-right py-2 px-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2.5 px-2">☐</td>
                <td className="py-2.5 px-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 px-2 font-medium">{item.title}</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-xs">{item.sku || "—"}</td>
                <td className="py-2.5 px-2 text-right font-bold">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-sm text-muted-foreground">
          <p>Total items: {items.reduce((s, i) => s + i.quantity, 0)}</p>
        </div>

        {order.notes && (
          <div className="mt-6 p-4 border rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order Notes</p>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
