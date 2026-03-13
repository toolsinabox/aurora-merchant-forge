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

    const { order_id, store_id, shipment_id } = await req.json();

    if (!order_id || !store_id) {
      return new Response(JSON.stringify({ error: "Missing order_id or store_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("*, customer:customers(name, email)")
      .eq("id", order_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerEmail = (order as any).customer?.email;
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No customer email" }), {
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

    // Get shipment details
    let shipment: any = null;
    if (shipment_id) {
      const { data } = await supabase
        .from("order_shipments")
        .select("*")
        .eq("id", shipment_id)
        .single();
      shipment = data;
    }

    const trackingInfo = shipment?.tracking_number
      ? `<p><strong>Tracking Number:</strong> ${shipment.tracking_url ? `<a href="${shipment.tracking_url}" style="color:#2563eb">${shipment.tracking_number}</a>` : shipment.tracking_number}</p>`
      : "";

    const carrierInfo = shipment?.carrier
      ? `<p><strong>Carrier:</strong> ${shipment.carrier}</p>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Your Order Has Shipped! 📦</h2>
        <p>Hi ${(order as any).customer?.name || "there"},</p>
        <p>Great news! Your order <strong>#${order.order_number}</strong> from <strong>${store.name}</strong> is on its way.</p>
        ${carrierInfo}
        ${trackingInfo}
        ${shipment?.tracking_url ? `
        <div style="margin:24px 0">
          <a href="${shipment.tracking_url}" style="display:inline-block;padding:12px 32px;background:#333;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Track Your Package</a>
        </div>` : ""}
        <p style="color:#666;font-size:14px;margin-top:24px">If you have any questions about your delivery, just reply to this email.</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "order_shipped",
      to_email: customerEmail,
      subject: `Your order #${order.order_number} has shipped! — ${store.name}`,
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
