import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_id, report_type } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: store } = await supabase
      .from("stores")
      .select("name, contact_email, currency, timezone")
      .eq("id", store_id)
      .single();

    if (!store?.contact_email) {
      return new Response(JSON.stringify({ error: "No store contact email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const currency = store.currency || "USD";
    const currencySymbol = currency === "AUD" ? "A$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

    // Gather report data
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      supabase.from("orders").select("id, total, status, created_at").eq("store_id", store_id).gte("created_at", thirtyDaysAgo),
      supabase.from("customers").select("id").eq("store_id", store_id).gte("created_at", thirtyDaysAgo),
      supabase.from("products").select("id, title, stock_quantity").eq("store_id", store_id).lt("stock_quantity", 5).eq("track_inventory", true),
    ]);

    const orders = ordersRes.data || [];
    const newCustomers = customersRes.data || [];
    const lowStockProducts = productsRes.data || [];

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
    const completedOrders = orders.filter(o => o.status === "completed").length;

    const lowStockRows = lowStockProducts.slice(0, 10).map(p =>
      `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-size:13px;">${p.title}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;font-size:13px;text-align:center;">${p.stock_quantity}</td></tr>`
    ).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
        <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#1e293b;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">📊 ${report_type === "weekly" ? "Weekly" : "Monthly"} Report</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">${store.name} — ${now.toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div style="padding:24px;">
            <h2 style="font-size:16px;margin:0 0 16px;color:#1e293b;">Performance Summary (Last 30 Days)</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:12px;background:#f0fdf4;border-radius:6px;text-align:center;width:25%;">
                  <div style="font-size:20px;font-weight:700;color:#166534;">${currencySymbol}${totalRevenue.toFixed(2)}</div>
                  <div style="font-size:11px;color:#4ade80;margin-top:4px;">Revenue</div>
                </td>
                <td style="width:8px;"></td>
                <td style="padding:12px;background:#eff6ff;border-radius:6px;text-align:center;width:25%;">
                  <div style="font-size:20px;font-weight:700;color:#1e40af;">${orders.length}</div>
                  <div style="font-size:11px;color:#60a5fa;margin-top:4px;">Orders</div>
                </td>
                <td style="width:8px;"></td>
                <td style="padding:12px;background:#fdf4ff;border-radius:6px;text-align:center;width:25%;">
                  <div style="font-size:20px;font-weight:700;color:#7e22ce;">${currencySymbol}${avgOrderValue.toFixed(2)}</div>
                  <div style="font-size:11px;color:#c084fc;margin-top:4px;">Avg Order</div>
                </td>
                <td style="width:8px;"></td>
                <td style="padding:12px;background:#fefce8;border-radius:6px;text-align:center;width:25%;">
                  <div style="font-size:20px;font-weight:700;color:#a16207;">${newCustomers.length}</div>
                  <div style="font-size:11px;color:#fbbf24;margin-top:4px;">New Customers</div>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#6b7280;">Completed orders: <strong>${completedOrders}</strong> of ${orders.length}</p>

            ${lowStockProducts.length > 0 ? `
            <h2 style="font-size:16px;margin:24px 0 12px;color:#1e293b;">⚠️ Low Stock Alert</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-size:12px;text-align:left;">Product</th>
                <th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-size:12px;text-align:center;">Stock</th>
              </tr>
              ${lowStockRows}
            </table>
            ` : ""}

            <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;">This report was automatically generated for ${store.name}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      to_email: store.contact_email,
      subject: `${report_type === "weekly" ? "Weekly" : "Monthly"} Report — ${store.name}`,
      html_body: html,
      template_key: "scheduled_report",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
