import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { cart_id, store_id } = await req.json();

    if (!cart_id || !store_id) {
      return new Response(JSON.stringify({ error: "Missing cart_id or store_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: cart } = await supabase
      .from("abandoned_carts")
      .select("*, customers(name, email)")
      .eq("id", cart_id)
      .single();

    if (!cart) {
      return new Response(JSON.stringify({ error: "Cart not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = cart.email || (cart as any).customers?.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "No email for this cart" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerName = (cart as any).customers?.name || "there";
    const cartItems = Array.isArray(cart.cart_items) ? cart.cart_items : [];

    const itemRows = cartItems.map((item: any) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.title || item.name || "Item"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity || 1}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(item.price || item.unit_price || 0).toFixed(2)}</td>
      </tr>`
    ).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">You left something behind!</h2>
        <p>Hi ${customerName},</p>
        <p>We noticed you left some items in your cart at <strong>${store.name}</strong>. They're still waiting for you!</p>
        ${itemRows ? `
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>` : ""}
        <p style="font-size:18px;font-weight:bold">Cart Total: $${Number(cart.cart_total).toFixed(2)}</p>
        <div style="margin:24px 0">
          <a href="#" style="display:inline-block;padding:12px 32px;background:#333;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Complete Your Purchase</a>
        </div>
        <p style="color:#666;font-size:14px">If you have any questions, just reply to this email. We're happy to help!</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    // Queue the email
    await supabase.from("email_queue").insert({
      store_id,
      template_key: "abandoned_cart",
      to_email: email,
      subject: `Don't forget your cart — ${store.name}`,
      html_body: html,
      status: "pending",
    });

    // Update cart recovery status
    await supabase
      .from("abandoned_carts")
      .update({
        recovery_status: "email_sent",
        recovery_email_sent_at: new Date().toISOString(),
      })
      .eq("id", cart_id);

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
