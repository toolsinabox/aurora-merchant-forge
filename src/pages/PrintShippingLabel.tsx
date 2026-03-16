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
  const trackingNumber = (shipment as any)?.tracking_number || order.order_number;

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { size: 4in 6in; margin: 0; }
        }
        .label-container {
          width: 4in; min-height: 6in; border: 2px solid #000;
          padding: 0.25in; font-family: Arial, sans-serif; margin: 0.5in auto;
          display: flex; flex-direction: column;
        }
        .label-section { border-bottom: 1.5px solid #999; padding: 0.12in 0; }
        .label-section:last-child { border-bottom: none; }
        .label-from { font-size: 10px; color: #555; }
        .label-to { font-size: 14px; line-height: 1.5; }
        .label-to strong { font-size: 16px; }
        .label-barcode-area {
          text-align: center; padding: 0.2in 0; flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .label-barcode {
          font-family: 'Libre Barcode 128', monospace;
          font-size: 48px; letter-spacing: 2px;
        }
        .label-barcode-fallback {
          font-family: monospace; font-size: 18px; letter-spacing: 4px;
          border: 1px dashed #999; padding: 8px 16px; display: inline-block;
        }
        .label-tracking { font-size: 11px; color: #333; margin-top: 4px; }
        .label-meta { font-size: 9px; color: #666; display: flex; justify-content: space-between; }
        .label-order-badge {
          font-size: 13px; font-weight: bold; text-align: center;
          border: 1.5px solid #000; padding: 4px 8px; margin-top: 4px;
        }
        .label-service {
          font-size: 12px; font-weight: bold; text-transform: uppercase;
          text-align: center; background: #000; color: #fff; padding: 3px 8px;
          letter-spacing: 1px;
        }
      `}</style>
      <div className="no-print p-4 text-center space-x-3">
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
          Print Label
        </button>
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-muted text-foreground rounded text-sm">
          Back
        </button>
      </div>
      <div className="label-container">
        {/* Service type */}
        <div className="label-service">
          {(shipment as any)?.carrier || "Standard"} {(shipment as any)?.service_type || "Shipping"}
        </div>

        {/* From */}
        <div className="label-section label-from">
          <strong>FROM:</strong><br />
          {storeName}<br />
          {(currentStore as any)?.contact_email || ""}
          {(currentStore as any)?.address && <><br />{(currentStore as any).address}</>}
        </div>

        {/* To */}
        <div className="label-section label-to">
          <strong>TO:</strong><br />
          <strong>{order.customers?.name || "Customer"}</strong><br />
          {order.shipping_address ? (
            <span style={{ whiteSpace: "pre-line" }}>{order.shipping_address}</span>
          ) : (
            <span style={{ color: "#999" }}>No shipping address</span>
          )}
          {order.customers?.phone && <><br />Ph: {order.customers.phone}</>}
        </div>

        {/* Barcode / Tracking */}
        <div className="label-barcode-area">
          <div className="label-barcode-fallback">
            {trackingNumber}
          </div>
          <div className="label-tracking">
            Tracking: {trackingNumber}
          </div>
        </div>

        {/* Order badge */}
        <div className="label-order-badge">
          ORDER #{order.order_number}
        </div>

        {/* Meta */}
        <div className="label-section label-meta" style={{ borderBottom: "none" }}>
          <span>Date: {new Date(order.created_at).toLocaleDateString("en-AU")}</span>
          <span>Items: {order.item_count || "—"}</span>
          <span>Weight: {(shipment as any)?.weight || "—"}</span>
        </div>

        {/* Delivery instructions */}
        {(order as any).delivery_instructions && (
          <div style={{ fontSize: "10px", borderTop: "1px dashed #999", paddingTop: "4px", marginTop: "4px" }}>
            <strong>Instructions:</strong> {(order as any).delivery_instructions}
          </div>
        )}
      </div>
    </>
  );
}
