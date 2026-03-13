import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Send account statement email to customer with order/payment history
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, customer_id } = await req.json();

    if (!store_id || !customer_id) {
      return new Response(JSON.stringify({ error: "Missing store_id or customer_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, currency")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, name, email, total_orders, total_spent")
      .eq("id", customer_id)
      .eq("store_id", store_id)
      .single();

    if (!customer || !customer.email) {
      return new Response(JSON.stringify({ error: "Customer not found or no email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select("order_number, created_at, total, payment_status, status")
      .eq("store_id", store_id)
      .eq("customer_id", customer_id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get recent payments
    const { data: payments } = await supabase
      .from("order_payments")
      .select("amount, payment_method, created_at, order_id")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const curr = (store as any).currency || "USD";
    const sym = curr === "AUD" ? "A$" : curr === "EUR" ? "€" : curr === "GBP" ? "£" : "$";

    const orderRows = (orders || []).map((o: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">#${o.order_number}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${new Date(o.created_at).toLocaleDateString()}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${sym}${Number(o.total).toFixed(2)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-transform:capitalize">${o.payment_status}</td>
      </tr>
    `).join("");

    const totalOwed = (orders || [])
      .filter((o: any) => o.payment_status === "unpaid" || o.payment_status === "partial")
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Account Statement 📋</h2>
        <p>Hi ${customer.name || "there"},</p>
        <p>Here is your account statement from <strong>${store.name}</strong>.</p>

        <div style="display:flex;gap:16px;margin:16px 0">
          <div style="flex:1;background:#f0fdf4;padding:12px;border-radius:8px;text-align:center">
            <div style="color:#666;font-size:12px">Total Spent</div>
            <div style="font-size:20px;font-weight:bold;color:#16a34a">${sym}${Number(customer.total_spent || 0).toFixed(2)}</div>
          </div>
          <div style="flex:1;background:#fef2f2;padding:12px;border-radius:8px;text-align:center">
            <div style="color:#666;font-size:12px">Outstanding</div>
            <div style="font-size:20px;font-weight:bold;color:#e11d48">${sym}${totalOwed.toFixed(2)}</div>
          </div>
          <div style="flex:1;background:#f9fafb;padding:12px;border-radius:8px;text-align:center">
            <div style="color:#666;font-size:12px">Orders</div>
            <div style="font-size:20px;font-weight:bold">${customer.total_orders || 0}</div>
          </div>
        </div>

        ${orderRows ? `
        <h3 style="margin-top:24px;color:#333">Recent Orders</h3>
        <table style="width:100%;border-collapse:collapse;margin:8px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:6px 8px;text-align:left">Order</th>
              <th style="padding:6px 8px;text-align:left">Date</th>
              <th style="padding:6px 8px;text-align:right">Total</th>
              <th style="padding:6px 8px;text-align:left">Payment</th>
            </tr>
          </thead>
          <tbody>${orderRows}</tbody>
        </table>` : "<p>No orders found.</p>"}

        ${totalOwed > 0 ? `
        <div style="margin:24px 0">
          <a href="#" style="display:inline-block;padding:12px 32px;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Pay Outstanding Balance</a>
        </div>` : ""}

        <p style="color:#666;font-size:14px">Statement generated on ${new Date().toLocaleDateString()}</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "customer_statement",
      to_email: customer.email,
      subject: `Your Account Statement — ${store.name}`,
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
