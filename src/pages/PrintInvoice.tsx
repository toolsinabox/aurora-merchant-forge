import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const [items, setItems] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    if (!order) return;
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .then(({ data }) => setItems(data || []));
    supabase
      .from("stores")
      .select("name")
      .eq("id", order.store_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setStoreName(data.name); });
  }, [order]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Non-printable controls */}
      <div className="print:hidden flex items-center gap-2 p-4 border-b bg-muted/30">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print Invoice
        </Button>
      </div>

      {/* Printable invoice */}
      <div className="max-w-[800px] mx-auto p-8 print:p-0 print:max-w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">{storeName || "Store"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Tax Invoice</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Invoice #{order.order_number}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("en-AU", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Status: {order.status} · Payment: {order.payment_status}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Ship To</h3>
            <p className="text-sm whitespace-pre-line">{order.shipping_address || "—"}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bill To</h3>
            <p className="text-sm whitespace-pre-line">{order.billing_address || order.shipping_address || "—"}</p>
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 font-semibold">Item</th>
              <th className="text-left py-2 font-semibold">SKU</th>
              <th className="text-right py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Unit Price</th>
              <th className="text-right py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-foreground/10">
                <td className="py-2">{item.title}</td>
                <td className="py-2 font-mono text-xs">{item.sku || "—"}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-2 text-right">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span>
                <span>-${Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${Number(order.shipping).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-8 pt-4 border-t">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes</h3>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
          Thank you for your business! · {storeName}
        </div>
      </div>
    </div>
  );
}
