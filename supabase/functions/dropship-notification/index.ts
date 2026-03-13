import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Notify dropship suppliers when they have new order items to fulfill
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, order_id, supplier_id } = await req.json();

    if (!store_id || !order_id || !supplier_id) {
      return new Response(JSON.stringify({ error: "Missing store_id, order_id, or supplier_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, contact_email")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id, name, email")
      .eq("id", supplier_id)
      .single();

    if (!supplier || !supplier.email) {
      return new Response(JSON.stringify({ error: "Supplier not found or no email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("order_number, shipping_address")
      .eq("id", order_id)
      .eq("store_id", store_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order items that match supplier products
    const { data: supplierProducts } = await supabase
      .from("supplier_products")
      .select("product_id")
      .eq("supplier_id", supplier_id);

    const supplierProductIds = (supplierProducts || []).map((sp: any) => sp.product_id);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("title, sku, quantity, unit_price, total")
      .eq("order_id", order_id)
      .in("product_id", supplierProductIds);

    if (!orderItems || orderItems.length === 0) {
      return new Response(JSON.stringify({ success: true, note: "No supplier items in this order" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemRows = orderItems.map((item: any) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.sku || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      </tr>`
    ).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">New Dropship Order 📦</h2>
        <p>Hi ${supplier.name},</p>
        <p>You have a new order to fulfill from <strong>${store.name}</strong>.</p>
        <div style="background:#f9fafb;border-radius:8px;padding:12px;margin:12px 0">
          <strong>Order #${order.order_number}</strong>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Product</th>
              <th style="padding:8px;text-align:left">SKU</th>
              <th style="padding:8px;text-align:center">Qty</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${order.shipping_address ? `
        <div style="background:#f0fdf4;border-radius:8px;padding:12px;margin:16px 0">
          <strong>Ship To:</strong><br/>
          <span style="white-space:pre-line">${order.shipping_address}</span>
        </div>` : ""}
        <p style="color:#666;font-size:14px">Please fulfill this order promptly and provide tracking information when available.</p>
        <p style="color:#999;font-size:12px">— ${store.name}</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "dropship_notification",
      to_email: supplier.email,
      subject: `New Dropship Order #${order.order_number} — ${store.name}`,
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
