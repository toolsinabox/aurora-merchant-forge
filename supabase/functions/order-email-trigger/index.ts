import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Called after an order is created to send confirmation + admin notification
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { order_id, store_id, trigger_type } = await req.json();

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

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, contact_email, smtp_config")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("title, quantity, unit_price, total")
      .eq("order_id", order_id);

    const baseUrl = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", "");
    const sendEmail = async (to: string, subject: string, html: string, templateKey: string) => {
      await supabase.from("email_queue").insert({
        store_id,
        template_key: templateKey,
        to_email: to,
        subject,
        html_body: html,
        status: "pending",
      });
    };

    const itemRows = (items || []).map((i: any) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.title}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(i.total).toFixed(2)}</td></tr>`
    ).join("");

    const orderHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Order Confirmation</h2>
        <p>Hi ${(order as any).customer?.name || "Customer"},</p>
        <p>Thank you for your order <strong>#${order.order_number}</strong> from <strong>${store.name}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <table style="width:100%;margin-top:8px">
          <tr><td style="padding:4px">Subtotal:</td><td style="text-align:right;padding:4px">$${Number(order.subtotal).toFixed(2)}</td></tr>
          ${Number(order.shipping) > 0 ? `<tr><td style="padding:4px">Shipping:</td><td style="text-align:right;padding:4px">$${Number(order.shipping).toFixed(2)}</td></tr>` : ""}
          ${Number(order.tax) > 0 ? `<tr><td style="padding:4px">Tax:</td><td style="text-align:right;padding:4px">$${Number(order.tax).toFixed(2)}</td></tr>` : ""}
          ${Number(order.discount) > 0 ? `<tr><td style="padding:4px">Discount:</td><td style="text-align:right;padding:4px">-$${Number(order.discount).toFixed(2)}</td></tr>` : ""}
          <tr style="font-weight:bold;font-size:16px"><td style="padding:8px 4px;border-top:2px solid #333">Total:</td><td style="text-align:right;padding:8px 4px;border-top:2px solid #333">$${Number(order.total).toFixed(2)}</td></tr>
        </table>
        <p style="color:#666;font-size:14px;margin-top:24px">Thank you for shopping with ${store.name}!</p>
      </div>
    `;

    const results: string[] = [];

    // 1. Order Confirmation to Customer
    if (trigger_type === "order_created" || !trigger_type) {
      const customerEmail = (order as any).customer?.email;
      if (customerEmail) {
        await sendEmail(
          customerEmail,
          `Order Confirmation #${order.order_number} — ${store.name}`,
          orderHtml,
          "order_confirmation"
        );
        results.push("order_confirmation_queued");
      }

      // 2. New Order Admin Notification
      if (store.contact_email) {
        const adminHtml = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#333">New Order Received</h2>
            <p>A new order has been placed on <strong>${store.name}</strong>.</p>
            <p><strong>Order:</strong> #${order.order_number}</p>
            <p><strong>Customer:</strong> ${(order as any).customer?.name || "Guest"} (${(order as any).customer?.email || "N/A"})</p>
            <p><strong>Total:</strong> $${Number(order.total).toFixed(2)}</p>
            <p><strong>Items:</strong> ${order.items_count}</p>
            <p style="color:#666;font-size:14px;margin-top:16px">Log in to your admin panel to process this order.</p>
          </div>
        `;
        await sendEmail(
          store.contact_email,
          `[New Order] #${order.order_number} — $${Number(order.total).toFixed(2)}`,
          adminHtml,
          "new_order_admin"
        );
        results.push("admin_notification_queued");
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
