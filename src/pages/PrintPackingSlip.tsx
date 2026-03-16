import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function PrintPackingSlip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const [items, setItems] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [products, setProducts] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!order) return;
    supabase.from("order_items").select("*").eq("order_id", order.id)
      .then(({ data }) => {
        setItems(data || []);
        // Fetch product details for images & bin locations
        const productIds = (data || []).map((i: any) => i.product_id).filter(Boolean);
        if (productIds.length > 0) {
          supabase.from("products").select("id, title, images, sku, weight, barcode")
            .in("id", productIds).then(({ data: prods }) => {
              const map: Record<string, any> = {};
              (prods || []).forEach((p: any) => { map[p.id] = p; });
              setProducts(map);
            });
        }
      });
    supabase.from("stores").select("name").eq("id", order.store_id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStoreName(data.name);
        }
      });
  }, [order]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found</div>;

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalSkus = items.length;
  const shippingMethod = (order as any).shipping_method || "Standard";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Packing Slip</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
        }
        .barcode-text { font-family: 'Libre Barcode 39', 'IDAutomationHC39M', monospace; font-size: 28px; line-height: 1; }
      `}</style>

      <div className="p-8 print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-foreground">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Packing Slip</h2>
            <div className="mt-2 space-y-0.5">
              <p className="text-sm"><span className="text-muted-foreground">Order:</span> <span className="font-bold">{order.order_number}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Date:</span> {format(new Date(order.created_at), "MMMM d, yyyy")}</p>
              <p className="text-sm"><span className="text-muted-foreground">Shipping:</span> {shippingMethod}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{storeName}</p>
            {storeAddress && <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">{storeAddress}</p>}
            {/* Order barcode */}
            <div className="mt-2">
              <p className="barcode-text">*{order.order_number}*</p>
              <p className="text-[9px] text-muted-foreground font-mono">{order.order_number}</p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {order.shipping_address && (
            <div className="border rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Ship To</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{order.shipping_address}</p>
            </div>
          )}
          {order.billing_address && (
            <div className="border rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Bill To</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{order.billing_address}</p>
            </div>
          )}
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 mb-4 p-2.5 bg-muted/50 rounded-lg text-xs">
          <div><span className="text-muted-foreground">Total SKUs:</span> <span className="font-bold">{totalSkus}</span></div>
          <div><span className="text-muted-foreground">Total Units:</span> <span className="font-bold">{totalItems}</span></div>
          <div><span className="text-muted-foreground">Status:</span> <span className="font-bold capitalize">{order.fulfillment_status || "unfulfilled"}</span></div>
        </div>

        {/* Items table with images and pick info */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-foreground/20 bg-muted/30">
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider w-8">✓</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider w-8">#</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider w-12">Img</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider">Item</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider">SKU</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider">Barcode</th>
              <th className="text-right py-2 px-2 text-[10px] uppercase tracking-wider">Qty</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider">Picked</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i) => {
              const product = products[item.product_id];
              const images = product?.images;
              const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;
              const barcode = item.barcode || product?.barcode || "";

              return (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-2.5 px-2 text-center">
                    <div className="w-4 h-4 border-2 border-foreground/40 rounded-sm" />
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="py-2.5 px-2">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-8 h-8 object-cover rounded border" />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-[8px] text-muted-foreground">N/A</div>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.variant_title && <p className="text-[10px] text-muted-foreground">{item.variant_title}</p>}
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground font-mono text-xs">{item.sku || product?.sku || "—"}</td>
                  <td className="py-2.5 px-2">
                    {barcode ? (
                      <div>
                        <p className="barcode-text text-xl leading-none">*{barcode}*</p>
                        <p className="text-[8px] font-mono text-muted-foreground">{barcode}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="inline-block min-w-[2rem] text-center font-bold text-base bg-foreground text-background rounded px-2 py-0.5">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="w-12 h-5 border-b-2 border-muted-foreground/30" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            {order.notes && (
              <div className="p-3 border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Order Notes</p>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
          <div className="text-right space-y-2">
            <p className="text-xs text-muted-foreground">Packed by: ________________________</p>
            <p className="text-xs text-muted-foreground">Date: ________________________</p>
            <p className="text-xs text-muted-foreground">Verified: ☐</p>
          </div>
        </div>

        {/* Thank you message */}
        <div className="mt-8 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">Thank you for your order!</p>
        </div>
      </div>
    </div>
  );
}
