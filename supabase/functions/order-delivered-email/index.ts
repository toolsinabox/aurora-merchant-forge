import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, order_id, shipment_id } = await req.json();

    if (!store_id || !order_id) {
      return new Response(JSON.stringify({ error: "Missing store_id or order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, customer_id")
      .eq("id", order_id)
      .eq("store_id", store_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerEmail = "";
    let customerName = "there";
    if (order.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("email, name")
        .eq("id", order.customer_id)
        .single();
      if (customer) {
        customerEmail = customer.email || "";
        customerName = customer.name || "there";
      }
    }

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No customer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get shipment details if provided
    let shipmentInfo = "";
    if (shipment_id) {
      const { data: shipment } = await supabase
        .from("order_shipments")
        .select("shipment_number, carrier, tracking_number, delivered_at")
        .eq("id", shipment_id)
        .single();
      if (shipment) {
        shipmentInfo = `
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px">
            <tr><td style="padding:8px 12px;color:#666">Shipment</td><td style="padding:8px 12px;font-weight:bold">${shipment.shipment_number}</td></tr>
            ${shipment.carrier ? `<tr><td style="padding:8px 12px;color:#666">Carrier</td><td style="padding:8px 12px">${shipment.carrier}</td></tr>` : ""}
            ${shipment.tracking_number ? `<tr><td style="padding:8px 12px;color:#666">Tracking</td><td style="padding:8px 12px">${shipment.tracking_number}</td></tr>` : ""}
            <tr><td style="padding:8px 12px;color:#666">Delivered</td><td style="padding:8px 12px">${shipment.delivered_at ? new Date(shipment.delivered_at).toLocaleDateString() : "Today"}</td></tr>
          </table>
        `;
      }
    }

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">Your Order Has Been Delivered! 📦✅</h2>
        <p>Hi ${customerName},</p>
        <p>Great news! Your order <strong>#${order.order_number}</strong> from <strong>${store.name}</strong> has been delivered.</p>
        ${shipmentInfo}
        <p>If everything looks good, we'd love to hear from you! If there's any issue with your delivery, please don't hesitate to reach out.</p>
        <div style="margin:24px 0">
          <a href="#" style="display:inline-block;padding:12px 32px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">View Your Order</a>
        </div>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "order_delivered",
      to_email: customerEmail,
      subject: `Your order #${order.order_number} has been delivered — ${store.name}`,
      html_body: html,
      status: "pending",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
