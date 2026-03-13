import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Send auto-registration email when a customer account is created during guest checkout
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, email, name, temp_password } = await req.json();

    if (!store_id || !email) {
      return new Response(JSON.stringify({ error: "Missing store_id or email" }), {
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

    const customerName = name || "there";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Your Account Has Been Created 🔑</h2>
        <p>Hi ${customerName},</p>
        <p>An account has been automatically created for you at <strong>${store.name}</strong> based on your recent order.</p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#666;width:120px">Email</td>
              <td style="padding:8px 0;font-weight:bold">${email}</td>
            </tr>
            ${temp_password ? `<tr>
              <td style="padding:8px 0;color:#666">Temp Password</td>
              <td style="padding:8px 0;font-family:monospace;font-size:16px;font-weight:bold;color:#e11d48">${temp_password}</td>
            </tr>` : ""}
          </table>
        </div>
        <p>With your account, you can:</p>
        <ul style="color:#555;line-height:1.8">
          <li>Track your orders and shipments</li>
          <li>View your order history</li>
          <li>Save items to your wishlist</li>
          <li>Faster checkout on future purchases</li>
        </ul>
        ${temp_password ? `<p style="color:#e11d48;font-weight:bold">⚠️ Please change your password after your first login for security.</p>` : ""}
        <div style="margin:24px 0">
          <a href="#" style="display:inline-block;padding:12px 32px;background:#333;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Log In to Your Account</a>
        </div>
        <p style="color:#999;font-size:12px">If you did not make a purchase, please ignore this email.</p>
        <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "auto_registration",
      to_email: email,
      subject: `Your account at ${store.name} is ready`,
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
