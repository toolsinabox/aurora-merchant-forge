import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { review_id, store_id, product_name, rating, title, author_name } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch store info
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("name")
      .eq("id", store_id)
      .single();

    const storeName = store?.name || "Store";

    // Get admin users for this store
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("store_id", store_id)
      .in("role", ["admin", "owner"]);

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

    const stars = "★".repeat(rating || 0) + "☆".repeat(5 - (rating || 0));

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #1d4ed8; font-size: 20px; margin-top: 0;">⭐ New Product Review Submitted</h1>
          <p style="color: #1e40af; margin-bottom: 0;">A customer has left a review that may need moderation.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Product</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${product_name || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Rating</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #f59e0b; font-size: 18px;">${stars}</td>
          </tr>
          ${title ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Title</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${title}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Reviewer</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${author_name || "Anonymous"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Time</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${new Date().toISOString()}</td>
          </tr>
        </table>

        <p style="color: #6b7280; font-size: 14px;">Please review and approve/reject this review in your ${storeName} admin panel.</p>
      </div>
    `;

    const inserts = adminEmails.map(email => ({
      store_id,
      to_email: email,
      subject: `⭐ New ${rating}-Star Review on "${product_name || "Product"}" - ${storeName}`,
      html_body: htmlBody,
      template_key: "review_submitted_alert",
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
