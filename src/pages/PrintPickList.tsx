import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export default function PrintPickList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIds = searchParams.get("orders")?.split(",") || [];
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderIds.length) return;
    (async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, shipping_address, customers(name)")
        .in("id", orderIds);

      if (orderData?.length) {
        setOrders(orderData);
        const { data: storeData } = await supabase
          .from("stores")
          .select("name")
          .eq("id", (await supabase.from("orders").select("store_id").eq("id", orderData[0].id).single()).data?.store_id || "")
          .maybeSingle();
        if (storeData) setStoreName(storeData.name);
      }

      const { data: itemData } = await supabase
        .from("order_items")
        .select("id, order_id, title, sku, quantity, product_id")
        .in("order_id", orderIds);
      setItems(itemData || []);
      setLoading(false);
    })();
  }, []);

  // Aggregate items across orders
  const aggregated = items.reduce((acc: Record<string, any>, item) => {
    const key = item.sku || item.title;
    if (!acc[key]) {
      acc[key] = { title: item.title, sku: item.sku, totalQty: 0, orders: [] };
    }
    acc[key].totalQty += item.quantity;
    const order = orders.find(o => o.id === item.order_id);
    acc[key].orders.push({ orderNumber: order?.order_number || "—", qty: item.quantity });
    return acc;
  }, {});

  const pickItems = Object.values(aggregated).sort((a: any, b: any) => a.title.localeCompare(b.title));

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Pick List</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="p-6 print:p-0">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{storeName || "Store"} — Pick List</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? "s" : ""} · Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Aggregated Pick List */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 px-2">☐</th>
              <th className="text-left py-2 px-2">Product</th>
              <th className="text-left py-2 px-2">SKU</th>
              <th className="text-center py-2 px-2">Total Qty</th>
              <th className="text-left py-2 px-2">Orders</th>
            </tr>
          </thead>
          <tbody>
            {pickItems.map((item: any, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-2 px-2">☐</td>
                <td className="py-2 px-2 font-medium">{item.title}</td>
                <td className="py-2 px-2 text-muted-foreground font-mono text-xs">{item.sku || "—"}</td>
                <td className="py-2 px-2 text-center font-bold">{item.totalQty}</td>
                <td className="py-2 px-2 text-xs text-muted-foreground">
                  {item.orders.map((o: any) => `${o.orderNumber} (×${o.qty})`).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Per-Order Breakdown */}
        <h3 className="font-semibold mb-3 text-base">Order Details</h3>
        {orders.map((order: any) => {
          const orderItems = items.filter(i => i.order_id === order.id);
          return (
            <div key={order.id} className="mb-4 border rounded-lg p-3">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{order.order_number}</span>
                <span className="text-sm text-muted-foreground">{(order as any).customers?.name || "Guest"}</span>
              </div>
              {order.shipping_address && (
                <p className="text-xs text-muted-foreground mb-2">{order.shipping_address}</p>
              )}
              <table className="w-full text-xs">
                <tbody>
                  {orderItems.map((item: any) => (
                    <tr key={item.id} className="border-t border-border/50">
                      <td className="py-1">☐</td>
                      <td className="py-1">{item.title}</td>
                      <td className="py-1 text-right font-medium">×{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
