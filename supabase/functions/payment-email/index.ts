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

    const { order_id, store_id, amount, payment_method } = await req.json();

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

    const paidAmount = amount || order.total;
    const method = payment_method || "online";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Payment Received ✓</h2>
        <p>Hi ${(order as any).customer?.name || "there"},</p>
        <p>We've received your payment for order <strong>#${order.order_number}</strong>.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
          <p style="color:#166534;font-size:14px;margin:0 0 4px">Amount Paid</p>
          <p style="color:#166534;font-size:28px;font-weight:bold;margin:0">$${Number(paidAmount).toFixed(2)}</p>
          <p style="color:#15803d;font-size:13px;margin:8px 0 0;text-transform:capitalize">via ${method}</p>
        </div>
        <table style="width:100%;margin:16px 0">
          <tr><td style="padding:6px 0;color:#666">Order Number:</td><td style="padding:6px 0;text-align:right;font-weight:bold">#${order.order_number}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Order Total:</td><td style="padding:6px 0;text-align:right">$${Number(order.total).toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Date:</td><td style="padding:6px 0;text-align:right">${new Date().toLocaleDateString()}</td></tr>
        </table>
        <p style="color:#666;font-size:14px;margin-top:24px">Thank you for your payment!</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "payment_confirmation",
      to_email: customerEmail,
      subject: `Payment Received — Order #${order.order_number} — ${store.name}`,
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
