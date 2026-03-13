import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PrintShippingLabel() {
  const { id: orderId, shipmentId } = useParams();
  const { currentStore } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderId) return;
      const { data: o } = await supabase.from("orders").select("*, customers(name, email, phone)").eq("id", orderId).single();
      setOrder(o);

      if (shipmentId) {
        const { data: s } = await supabase.from("order_shipments" as any).select("*").eq("id", shipmentId).single();
        setShipment(s);
      }
      setLoading(false);
      setTimeout(() => window.print(), 500);
    }
    load();
  }, [orderId, shipmentId]);

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-center text-sm text-destructive">Order not found</div>;

  const storeName = currentStore?.name || "Store";

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        .label-container { width: 4in; min-height: 6in; border: 2px solid #000; padding: 0.3in; font-family: Arial, sans-serif; margin: 0.5in auto; }
        .label-section { border-bottom: 1px solid #ccc; padding: 0.15in 0; }
        .label-section:last-child { border-bottom: none; }
        .label-from { font-size: 10px; color: #666; }
        .label-to { font-size: 14px; }
        .label-barcode { font-family: monospace; font-size: 18px; letter-spacing: 4px; text-align: center; padding: 0.2in 0; }
        .label-tracking { font-size: 11px; text-align: center; color: #333; }
      `}</style>
      <div className="no-print p-4 text-center">
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
          Print Label
        </button>
      </div>
      <div className="label-container">
        {/* From */}
        <div className="label-section label-from">
          <strong>FROM:</strong><br />
          {storeName}<br />
          {currentStore?.contact_email || ""}
        </div>

        {/* To */}
        <div className="label-section label-to">
          <strong>TO:</strong><br />
          <strong style={{ fontSize: "16px" }}>{order.customers?.name || "Customer"}</strong><br />
          {order.shipping_address || "No address provided"}<br />
          {order.customers?.phone && <span>Ph: {order.customers.phone}<br /></span>}
        </div>

        {/* Order info */}
        <div className="label-section" style={{ fontSize: "11px" }}>
          <strong>Order:</strong> {order.order_number}<br />
          <strong>Items:</strong> {order.items_count}<br />
          <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
        </div>

        {/* Tracking / Shipment */}
        {shipment && (
          <div className="label-section">
            {shipment.carrier && <div style={{ fontSize: "12px" }}><strong>Carrier:</strong> {shipment.carrier}</div>}
            {shipment.tracking_number && (
              <>
                <div className="label-barcode">{shipment.tracking_number}</div>
                <div className="label-tracking">Tracking: {shipment.tracking_number}</div>
              </>
            )}
            <div style={{ fontSize: "11px", textAlign: "center", marginTop: "4px" }}>
              Shipment: {shipment.shipment_number}
            </div>
          </div>
        )}

        {/* Barcode placeholder using order number */}
        {!shipment && (
          <div className="label-section">
            <div className="label-barcode">{order.order_number}</div>
          </div>
        )}
      </div>
    </>
  );
}
