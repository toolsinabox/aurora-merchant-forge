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

    const { voucher_id, store_id } = await req.json();

    if (!voucher_id || !store_id) {
      return new Response(JSON.stringify({ error: "Missing voucher_id or store_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: voucher } = await supabase
      .from("gift_vouchers")
      .select("*")
      .eq("id", voucher_id)
      .single();

    if (!voucher) {
      return new Response(JSON.stringify({ error: "Voucher not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!voucher.recipient_email) {
      return new Response(JSON.stringify({ error: "No recipient email on voucher" }), {
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

    const expiryText = voucher.expires_at
      ? `<p style="color:#666;font-size:14px">Valid until: ${new Date(voucher.expires_at).toLocaleDateString()}</p>`
      : "";

    const messageText = voucher.message
      ? `<div style="background:#f9f9f9;border-left:4px solid #333;padding:16px;margin:16px 0;font-style:italic">${voucher.message}</div>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">🎁 You've received a Gift Voucher!</h2>
        <p>Hi ${voucher.recipient_name || "there"},</p>
        <p>${voucher.sender_name ? `<strong>${voucher.sender_name}</strong> has` : "Someone has"} sent you a gift voucher from <strong>${store.name}</strong>!</p>
        ${messageText}
        <div style="background:#333;color:#fff;padding:24px;border-radius:8px;text-align:center;margin:24px 0">
          <p style="font-size:14px;margin:0 0 8px;opacity:0.8">Your Gift Voucher Code</p>
          <p style="font-size:28px;font-weight:bold;margin:0;letter-spacing:2px">${voucher.code}</p>
          <p style="font-size:24px;margin:12px 0 0;color:#4ade80">$${Number(voucher.initial_value).toFixed(2)}</p>
        </div>
        ${expiryText}
        <p style="color:#666;font-size:14px">Use this code at checkout to redeem your gift voucher.</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "gift_voucher",
      to_email: voucher.recipient_email,
      subject: `You've received a $${Number(voucher.initial_value).toFixed(2)} Gift Voucher from ${store.name}!`,
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
