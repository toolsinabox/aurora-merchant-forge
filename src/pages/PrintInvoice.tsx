import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const [items, setItems] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  useEffect(() => {
    if (!order) return;
    supabase.from("order_items").select("*").eq("order_id", order.id)
      .then(({ data }) => setItems(data || []));
    supabase.from("stores").select("*").eq("id", order.store_id).maybeSingle()
      .then(({ data }) => { if (data) setStoreInfo(data); });
  }, [order]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found</div>;

  const storeName = storeInfo?.name || "Store";
  const storeEmail = (storeInfo as any)?.contact_email || "";
  const storePhone = (storeInfo as any)?.contact_phone || "";
  const storeABN = (storeInfo as any)?.abn || "";
  const storeAddress = (storeInfo as any)?.address || "";

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      {/* Non-printable controls */}
      <div className="no-print flex items-center gap-2 p-4 border-b bg-muted/30">
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
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-foreground/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{storeName}</h1>
            {storeAddress && <p className="text-sm text-muted-foreground mt-1">{storeAddress}</p>}
            {storeEmail && <p className="text-sm text-muted-foreground">{storeEmail}</p>}
            {storePhone && <p className="text-sm text-muted-foreground">{storePhone}</p>}
            {storeABN && <p className="text-xs text-muted-foreground mt-1">ABN: {storeABN}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax Invoice</p>
            <p className="text-xl font-bold mt-1">#{order.order_number}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString("en-AU", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
            <div className="mt-2 flex items-center gap-2 justify-end">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                order.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" :
                order.payment_status === "refunded" ? "bg-amber-100 text-amber-800" :
                "bg-muted text-muted-foreground"
              }`}>
                {order.payment_status}
              </span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                order.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                order.status === "processing" ? "bg-blue-100 text-blue-800" :
                "bg-muted text-muted-foreground"
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ship To</h3>
            <p className="text-sm whitespace-pre-line leading-relaxed">{order.shipping_address || "—"}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bill To</h3>
            <p className="text-sm whitespace-pre-line leading-relaxed">{order.billing_address || order.shipping_address || "—"}</p>
          </div>
        </div>

        {/* Order meta */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-3 bg-muted/30 rounded-md text-xs print:bg-gray-50">
          <div>
            <span className="text-muted-foreground">Order Date</span>
            <p className="font-medium">{new Date(order.created_at).toLocaleDateString("en-AU")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Method</span>
            <p className="font-medium capitalize">{(order as any).payment_method || "Card"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Shipping Method</span>
            <p className="font-medium">{(order as any).shipping_method || "Standard"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Currency</span>
            <p className="font-medium">{(order as any).currency || "AUD"}</p>
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2.5 font-semibold text-xs uppercase tracking-wide">#</th>
              <th className="text-left py-2.5 font-semibold text-xs uppercase tracking-wide">Item</th>
              <th className="text-left py-2.5 font-semibold text-xs uppercase tracking-wide">SKU</th>
              <th className="text-right py-2.5 font-semibold text-xs uppercase tracking-wide">Qty</th>
              <th className="text-right py-2.5 font-semibold text-xs uppercase tracking-wide">Unit Price</th>
              <th className="text-right py-2.5 font-semibold text-xs uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-foreground/5">
                <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 font-medium">{item.title}</td>
                <td className="py-2.5 font-mono text-xs text-muted-foreground">{item.sku || "—"}</td>
                <td className="py-2.5 text-right">{item.quantity}</td>
                <td className="py-2.5 text-right">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-2.5 text-right font-medium">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span>
                <span>-${Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>${Number(order.shipping).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST / Tax</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t-2 pt-3 mt-3">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)} {order.currency || "AUD"}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-8 pt-4 border-t">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Order Notes</h3>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Payment terms */}
        <div className="mt-8 pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p>Payment terms: Due on receipt unless otherwise agreed.</p>
          <p>Please quote invoice number <strong>#{order.order_number}</strong> on all correspondence.</p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">{storeName}{storeABN ? ` · ABN ${storeABN}` : ""}</p>
        </div>
      </div>
    </div>
  );
}
