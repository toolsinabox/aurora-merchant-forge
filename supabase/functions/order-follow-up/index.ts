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

    const { store_id, order_id } = await req.json();

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
      .select("id, order_number, customer_id, total")
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
      return new Response(JSON.stringify({ error: "No customer email for this order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order items for context
    const { data: items } = await supabase
      .from("order_items")
      .select("title, quantity")
      .eq("order_id", order_id);

    const itemList = (items || []).slice(0, 5).map((i: any) =>
      `<li style="padding:4px 0">${i.title} × ${i.quantity}</li>`
    ).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">How was your order? ⭐</h2>
        <p>Hi ${customerName},</p>
        <p>We hope you're enjoying your recent purchase from <strong>${store.name}</strong>!</p>
        <p>Your order <strong>#${order.order_number}</strong> included:</p>
        ${itemList ? `<ul style="margin:12px 0;padding-left:20px">${itemList}</ul>` : ""}
        <p>We'd love to hear your thoughts! Your feedback helps other shoppers and helps us improve.</p>
        <div style="margin:24px 0">
          <a href="#" style="display:inline-block;padding:12px 32px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Leave a Review</a>
        </div>
        <p style="color:#666;font-size:14px">Thank you for shopping with us — we truly appreciate your business!</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "order_follow_up",
      to_email: customerEmail,
      subject: `How was your order? #${order.order_number} — ${store.name}`,
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
