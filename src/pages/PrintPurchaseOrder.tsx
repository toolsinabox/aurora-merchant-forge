import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";

export default function PrintPurchaseOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [supplier, setSupplier] = useState<any>(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: poData } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setPo(poData);

      if (poData) {
        const [itemsRes, storeRes, supplierRes] = await Promise.all([
          supabase.from("purchase_order_items").select("*").eq("purchase_order_id", id),
          supabase.from("stores").select("name, contact_email").eq("id", poData.store_id).maybeSingle(),
          poData.supplier_id
            ? supabase.from("suppliers").select("*").eq("id", poData.supplier_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        setItems(itemsRes.data || []);
        if (storeRes.data) setStoreName(storeRes.data.name);
        if (supplierRes.data) setSupplier(supplierRes.data);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!po) return <div className="p-8 text-center text-muted-foreground">Purchase order not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Purchase Order</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="p-8 print:p-0">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold">PURCHASE ORDER</h2>
            <p className="text-lg font-mono mt-1">{po.po_number}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-lg">{storeName}</p>
            <p className="text-muted-foreground">Date: {format(new Date(po.created_at), "MMM d, yyyy")}</p>
            {po.expected_date && (
              <p className="text-muted-foreground">Expected: {format(new Date(po.expected_date), "MMM d, yyyy")}</p>
            )}
            <p className="mt-1 capitalize">Status: {po.status}</p>
          </div>
        </div>

        {supplier && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Supplier</p>
            <p className="font-semibold">{supplier.name}</p>
            {supplier.contact_name && <p className="text-sm">{supplier.contact_name}</p>}
            {supplier.email && <p className="text-sm text-muted-foreground">{supplier.email}</p>}
            {supplier.phone && <p className="text-sm text-muted-foreground">{supplier.phone}</p>}
          </div>
        )}

        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Item</th>
              <th className="text-left py-2 px-2">SKU</th>
              <th className="text-right py-2 px-2">Qty Ordered</th>
              <th className="text-right py-2 px-2">Qty Received</th>
              <th className="text-right py-2 px-2">Unit Cost</th>
              <th className="text-right py-2 px-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2 px-2">{i + 1}</td>
                <td className="py-2 px-2 font-medium">{item.title}</td>
                <td className="py-2 px-2 text-muted-foreground font-mono text-xs">{item.sku || "—"}</td>
                <td className="py-2 px-2 text-right">{item.quantity_ordered}</td>
                <td className="py-2 px-2 text-right">{item.quantity_received}</td>
                <td className="py-2 px-2 text-right">${Number(item.unit_cost).toFixed(2)}</td>
                <td className="py-2 px-2 text-right font-medium">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${Number(po.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${Number(po.tax).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${Number(po.shipping).toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-1 font-bold text-base">
              <span>Total</span><span>${Number(po.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {po.notes && (
          <div className="mt-6 p-4 border rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
