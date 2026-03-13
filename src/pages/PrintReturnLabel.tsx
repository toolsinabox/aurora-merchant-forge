import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PrintReturnLabel() {
  const { returnId } = useParams();
  const { currentStore } = useAuth();
  const [returnData, setReturnData] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!returnId) return;
      const { data: r } = await supabase.from("returns").select("*, orders(order_number, shipping_address, customers(name, email, phone))").eq("id", returnId).single();
      if (r) {
        setReturnData(r);
        setOrder(r.orders);
      }
      setLoading(false);
      setTimeout(() => window.print(), 500);
    }
    load();
  }, [returnId]);

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>;
  if (!returnData) return <div className="p-8 text-center text-sm text-destructive">Return not found</div>;

  const storeName = currentStore?.name || "Store";
  const rmaNumber = returnData.return_number || `RMA-${returnData.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        .return-label { width: 4in; min-height: 6in; border: 2px solid #000; padding: 0.3in; font-family: Arial, sans-serif; margin: 0.5in auto; }
        .rl-section { border-bottom: 1px solid #ccc; padding: 0.15in 0; }
        .rl-section:last-child { border-bottom: none; }
        .rl-from { font-size: 12px; }
        .rl-to { font-size: 10px; color: #666; }
        .rl-rma { font-size: 20px; font-weight: bold; text-align: center; padding: 0.2in 0; letter-spacing: 2px; }
        .rl-barcode { font-family: monospace; font-size: 18px; letter-spacing: 4px; text-align: center; padding: 0.15in 0; }
        .rl-instructions { font-size: 9px; color: #666; border: 1px dashed #ccc; padding: 8px; margin-top: 0.1in; }
        .rl-badge { display: inline-block; background: #000; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; letter-spacing: 1px; }
      `}</style>
      <div className="no-print p-4 text-center">
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
          Print Return Label
        </button>
      </div>
      <div className="return-label">
        {/* Return badge */}
        <div className="rl-section" style={{ textAlign: "center" }}>
          <span className="rl-badge">↩ RETURN</span>
        </div>

        {/* RMA Number */}
        <div className="rl-section">
          <div className="rl-rma">{rmaNumber}</div>
          <div className="rl-barcode">{rmaNumber}</div>
        </div>

        {/* FROM: Customer (sender) */}
        <div className="rl-section rl-from">
          <strong>FROM:</strong><br />
          <strong>{order?.customers?.name || "Customer"}</strong><br />
          {order?.shipping_address || "Address on file"}<br />
          {order?.customers?.phone && <span>Ph: {order.customers.phone}<br /></span>}
        </div>

        {/* TO: Store (destination) */}
        <div className="rl-section rl-to">
          <strong>RETURN TO:</strong><br />
          {storeName}<br />
          {(currentStore as any)?.address || ""}<br />
          {(currentStore as any)?.contact_email || ""}
        </div>

        {/* Return info */}
        <div className="rl-section" style={{ fontSize: "11px" }}>
          <strong>Order:</strong> {order?.order_number || "—"}<br />
          <strong>Reason:</strong> {returnData.reason || "Not specified"}<br />
          <strong>Date:</strong> {new Date(returnData.created_at).toLocaleDateString()}<br />
          <strong>Status:</strong> {returnData.status}
        </div>

        {/* Instructions */}
        <div className="rl-instructions">
          <strong>Instructions:</strong> Please include this label on the outside of your return package.
          Ensure all items are securely packaged. Keep your RMA number for tracking purposes.
          Returns must be received within 30 days of the RMA issue date.
        </div>
      </div>
    </>
  );
}
