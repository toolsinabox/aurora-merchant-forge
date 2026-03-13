import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Send wishlist reminder emails to customers who have items in their wishlist
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      .select("id, name")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all wishlist items grouped by customer
    const { data: wishlists } = await supabase
      .from("wishlists")
      .select("*, customer:customers(id, name, email), product:products(name, price, slug, images)")
      .eq("store_id", store_id);

    if (!wishlists || wishlists.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, note: "No wishlist items" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by customer email
    const byEmail: Record<string, { name: string; items: any[] }> = {};
    for (const w of wishlists) {
      const email = (w as any).customer?.email;
      if (!email) continue;
      if (!byEmail[email]) {
        byEmail[email] = { name: (w as any).customer?.name || "there", items: [] };
      }
      byEmail[email].items.push((w as any).product);
    }

    let sent = 0;
    for (const [email, { name, items }] of Object.entries(byEmail)) {
      const itemRows = items.filter(Boolean).slice(0, 10).map((p: any) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${p.name || "Product"}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(p.price || 0).toFixed(2)}</td>
        </tr>`
      ).join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#333">Your Wishlist is Waiting! ❤️</h2>
          <p>Hi ${name},</p>
          <p>You have <strong>${items.length}</strong> item${items.length > 1 ? "s" : ""} saved in your wishlist at <strong>${store.name}</strong>. Don't let them get away!</p>
          ${itemRows ? `
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>` : ""}
          <div style="margin:24px 0">
            <a href="#" style="display:inline-block;padding:12px 32px;background:#333;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">View Your Wishlist</a>
          </div>
          <p style="color:#666;font-size:14px">Items in your wishlist may sell out — grab them before they're gone!</p>
          <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
        </div>
      `;

      await supabase.from("email_queue").insert({
        store_id,
        template_key: "wishlist_reminder",
        to_email: email,
        subject: `Your wishlist is waiting — ${store.name}`,
        html_body: html,
        status: "pending",
      });
      sent++;
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
