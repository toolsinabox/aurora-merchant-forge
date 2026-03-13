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

    const { store_id, customer_name, customer_email } = await req.json();

    if (!store_id || !customer_email) {
      return new Response(JSON.stringify({ error: "Missing store_id or customer_email" }), {
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

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Welcome to ${store.name}! 🎉</h2>
        <p>Hi ${customer_name || "there"},</p>
        <p>Thank you for creating an account with <strong>${store.name}</strong>. We're excited to have you!</p>
        <p>With your account you can:</p>
        <ul style="color:#555;line-height:1.8">
          <li>Track your orders and shipments</li>
          <li>Save items to your wishlist</li>
          <li>Manage your shipping addresses</li>
          <li>Get faster checkout</li>
          <li>View your order history</li>
        </ul>
        <div style="margin:24px 0">
          <a href="#" style="display:inline-block;padding:12px 32px;background:#333;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Start Shopping</a>
        </div>
        <p style="color:#666;font-size:14px">If you have any questions, just reply to this email or visit our contact page.</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "customer_registration",
      to_email: customer_email,
      subject: `Welcome to ${store.name}!`,
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
