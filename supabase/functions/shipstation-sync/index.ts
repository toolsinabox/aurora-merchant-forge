import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, order_ids } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", "shipstation").single();

    if (!addon || !addon.is_active) {
      return new Response(JSON.stringify({ error: "ShipStation integration not active" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { api_key, api_secret } = addon.config as any;
    if (!api_key || !api_secret) {
      return new Response(JSON.stringify({ error: "ShipStation credentials incomplete" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = `Basic ${btoa(`${api_key}:${api_secret}`)}`;
    const baseUrl = "https://ssapi.shipstation.com";

    if (action === "export_orders") {
      let query = supabase.from("orders")
        .select("*, order_items(*), customers(name, email, phone)")
        .eq("store_id", store_id)
        .in("status", ["processing", "confirmed"]);
      if (order_ids?.length) query = query.in("id", order_ids);
      const { data: orders } = await query.limit(100);

      if (!orders?.length) {
        return new Response(JSON.stringify({ exported: 0, message: "No orders to export" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let exported = 0;
      let errors = 0;

      for (const order of orders) {
        try {
          const shipTo = parseAddress(order.shipping_address);
          const ssOrder = {
            orderNumber: order.order_number,
            orderDate: order.created_at,
            orderStatus: "awaiting_shipment",
            customerEmail: order.customers?.email || "",
            billTo: {
              name: order.customers?.name || "Customer",
              phone: order.customers?.phone || "",
            },
            shipTo: {
              name: shipTo.name || order.customers?.name || "Customer",
              street1: shipTo.street1 || order.shipping_address || "",
              city: shipTo.city || "",
              state: shipTo.state || "",
              postalCode: shipTo.postalCode || "",
              country: shipTo.country || "AU",
              phone: order.customers?.phone || "",
            },
            items: (order.order_items || []).map((item: any) => ({
              sku: item.sku || "",
              name: item.title,
              quantity: item.quantity,
              unitPrice: item.unit_price,
            })),
            amountPaid: order.total,
            shippingAmount: order.shipping || 0,
            taxAmount: order.tax || 0,
          };

          const res = await fetch(`${baseUrl}/orders/createorder`, {
            method: "POST",
            headers: { Authorization: authHeader, "Content-Type": "application/json" },
            body: JSON.stringify(ssOrder),
          });

          if (res.ok) exported++;
          else errors++;
        } catch { errors++; }
      }

      return new Response(JSON.stringify({ exported, errors, total: orders.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import_tracking") {
      // Fetch recent shipments from ShipStation and update local orders
      const res = await fetch(`${baseUrl}/shipments?pageSize=100&sortBy=ShipDate&sortDir=DESC`, {
        headers: { Authorization: authHeader },
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch ShipStation shipments" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await res.json();
      let updated = 0;

      for (const shipment of data.shipments || []) {
        if (!shipment.orderNumber || !shipment.trackingNumber) continue;

        const { data: order } = await supabase.from("orders")
          .select("id").eq("store_id", store_id).eq("order_number", shipment.orderNumber).single();

        if (order) {
          await supabase.from("order_shipments").upsert({
            order_id: order.id,
            store_id,
            shipment_number: `SS-${shipment.shipmentId}`,
            carrier: shipment.carrierCode || "shipstation",
            tracking_number: shipment.trackingNumber,
            tracking_url: shipment.trackingUrl || null,
            status: "shipped",
            shipped_at: shipment.shipDate,
          }, { onConflict: "shipment_number" });
          updated++;
        }
      }

      return new Response(JSON.stringify({ updated, total: (data.shipments || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_rates") {
      // Get shipping rates from ShipStation
      const { weight_oz, from_postal, to_postal, to_country } = await req.json();
      const res = await fetch(`${baseUrl}/shipments/getrates`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierCode: "",
          fromPostalCode: from_postal || "2000",
          toPostalCode: to_postal || "",
          toCountry: to_country || "AU",
          weight: { value: weight_oz || 16, units: "ounces" },
          confirmation: "none",
          residential: true,
        }),
      });

      const rates = await res.json();
      return new Response(JSON.stringify(rates), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: export_orders, import_tracking, get_rates" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseAddress(addr: string | null): { name?: string; street1?: string; city?: string; state?: string; postalCode?: string; country?: string } {
  if (!addr) return {};
  const parts = addr.split(",").map(s => s.trim());
  if (parts.length >= 4) {
    return { street1: parts[0], city: parts[1], state: parts[2], postalCode: parts[3], country: parts[4] || "AU" };
  }
  return { street1: addr };
}
