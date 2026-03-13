import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function PrintQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: q } = await supabase
        .from("order_quotes" as any)
        .select("*, customers:customer_id(name, email)")
        .eq("id", id)
        .maybeSingle();
      if (!q) { setLoading(false); return; }
      setQuote(q);
      setCustomerName((q as any).customers?.name || "");

      const [itemsRes, storeRes] = await Promise.all([
        supabase.from("order_quote_items" as any).select("*").eq("quote_id", id),
        supabase.from("stores").select("name").eq("id", (q as any).store_id).maybeSingle(),
      ]);
      setItems(itemsRes.data || []);
      if (storeRes.data) setStoreName(storeRes.data.name);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!quote) return <div className="p-8 text-center text-muted-foreground">Quote not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden flex items-center gap-2 p-4 border-b bg-muted/30">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print Quote
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto p-8 print:p-0 print:max-w-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">{storeName || "Store"}</h1>
            <p className="text-sm text-muted-foreground">QUOTE</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-lg">{quote.quote_number}</p>
            <p className="text-muted-foreground">Date: {format(new Date(quote.created_at), "dd MMM yyyy")}</p>
            {quote.valid_until && (
              <p className="text-muted-foreground">Valid Until: {format(new Date(quote.valid_until), "dd MMM yyyy")}</p>
            )}
            <p className="mt-1 capitalize">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                quote.status === "approved" ? "bg-green-100 text-green-800" :
                quote.status === "rejected" ? "bg-red-100 text-red-800" :
                "bg-muted text-muted-foreground"
              }`}>{quote.status}</span>
            </p>
          </div>
        </div>

        {customerName && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Quote For</h3>
            <p className="font-medium">{customerName}</p>
            {(quote as any).customers?.email && (
              <p className="text-sm text-muted-foreground">{(quote as any).customers.email}</p>
            )}
          </div>
        )}

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Item</th>
              <th className="text-left py-2 font-medium">SKU</th>
              <th className="text-right py-2 font-medium">Qty</th>
              <th className="text-right py-2 font-medium">Unit Price</th>
              <th className="text-right py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.title}</td>
                <td className="py-2 text-muted-foreground">{item.sku || "—"}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-2 text-right">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(quote.subtotal).toFixed(2)}</span>
            </div>
            {Number(quote.tax) > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${Number(quote.tax).toFixed(2)}</span>
              </div>
            )}
            {Number(quote.shipping) > 0 && (
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${Number(quote.shipping).toFixed(2)}</span>
              </div>
            )}
            {Number(quote.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${Number(quote.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span>${Number(quote.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-8 border-t pt-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground print:mt-8">
          <p>This is a quote, not an invoice. Prices may be subject to change.</p>
        </div>
      </div>
    </div>
  );
}
