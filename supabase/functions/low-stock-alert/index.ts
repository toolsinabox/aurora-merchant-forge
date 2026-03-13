import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Check all products at a store for low stock and send alert emails
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "Missing store_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, contact_email")
      .eq("id", store_id)
      .single();

    if (!store || !store.contact_email) {
      return new Response(JSON.stringify({ error: "Store not found or no contact email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find inventory items below threshold
    const { data: lowStock } = await supabase
      .from("inventory_stock")
      .select("*, products(name, sku)")
      .eq("store_id", store_id)
      .filter("quantity", "lte", "low_stock_threshold");

    // Also filter in JS since Supabase can't easily compare two columns
    const alerts = (lowStock || []).filter((item: any) => item.quantity <= item.low_stock_threshold);

    if (alerts.length === 0) {
      return new Response(JSON.stringify({ success: true, alerts: 0, note: "No low stock items" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = alerts.map((item: any) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${(item as any).products?.name || "Unknown"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace">${(item as any).products?.sku || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;font-weight:bold">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.low_stock_threshold}</td>
      </tr>`
    ).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">⚠️ Low Stock Alert</h2>
        <p>The following <strong>${alerts.length}</strong> product(s) at <strong>${store.name}</strong> have fallen below their stock threshold:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#fef2f2"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px;text-align:left">SKU</th><th style="padding:8px;text-align:center">Current</th><th style="padding:8px;text-align:center">Threshold</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#666;font-size:14px">Log in to your admin panel to reorder or adjust stock levels.</p>
        <p style="color:#999;font-size:12px">— ${store.name} Inventory System</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "low_stock_alert",
      to_email: store.contact_email,
      subject: `[Low Stock Alert] ${alerts.length} product(s) need attention — ${store.name}`,
      html_body: html,
      status: "pending",
    });

    return new Response(JSON.stringify({ success: true, alerts: alerts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
