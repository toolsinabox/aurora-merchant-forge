import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_id, store_id, payment_method, error_message, customer_email } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch store info and team members to notify
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("name")
      .eq("id", store_id)
      .single();

    const storeName = store?.name || "Store";

    // Get admin users for this store
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, profiles(display_name)")
      .eq("store_id", store_id)
      .in("role", ["admin", "owner"]);

    // Fetch admin emails from auth
    const adminEmails: string[] = [];
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
        if (userData?.user?.email) adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ error: "No admin emails found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderRef = order_id ? order_id.slice(0, 8) : "N/A";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #dc2626; font-size: 20px; margin-top: 0;">⚠️ Failed Payment Alert</h1>
          <p style="color: #991b1b; margin-bottom: 0;">A payment has failed and may require attention.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Order</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">#${orderRef}</td>
          </tr>
          ${customer_email ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Customer</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${customer_email}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Payment Method</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${payment_method || "Unknown"}</td>
          </tr>
          ${error_message ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Error</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #ef4444;">${error_message}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Time</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${new Date().toISOString()}</td>
          </tr>
        </table>

        <p style="color: #6b7280; font-size: 14px;">Please review this payment in your ${storeName} admin panel.</p>
      </div>
    `;

    // Queue email to each admin
    const inserts = adminEmails.map(email => ({
      store_id,
      to_email: email,
      subject: `⚠️ Failed Payment Alert - Order #${orderRef} - ${storeName}`,
      html_body: htmlBody,
      template_key: "failed_payment_alert",
    }));

    await supabaseAdmin.from("email_queue").insert(inserts);

    return new Response(JSON.stringify({ success: true, notified: adminEmails.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
