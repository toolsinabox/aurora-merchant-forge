import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_id, po_number, location_name, items_received, received_by } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // Build items table rows
    const itemRows = Array.isArray(items_received) ? items_received.map((item: any) => `
      <tr>
        <td style="padding: 6px 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.sku || "—"}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.name || "—"}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">${item.quantity || 0}</td>
      </tr>
    `).join("") : "";

    const totalQty = Array.isArray(items_received) 
      ? items_received.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) 
      : 0;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #16a34a; font-size: 20px; margin-top: 0;">📦 Stock Received at Warehouse</h1>
          <p style="color: #166534; margin-bottom: 0;">A purchase order has been received and stock updated.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">PO Number</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${po_number || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Location</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${location_name || "Main Warehouse"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Total Units</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${totalQty}</td>
          </tr>
          ${received_by ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Received By</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${received_by}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Time</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${new Date().toISOString()}</td>
          </tr>
        </table>

        ${itemRows ? `
        <h3 style="color: #374151; font-size: 16px;">Items Received</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px;">SKU</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px;">Product</th>
            <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 13px;">Qty</th>
          </tr>
          ${itemRows}
        </table>` : ""}

        <p style="color: #6b7280; font-size: 14px;">Stock levels have been updated in your ${storeName} inventory.</p>
      </div>
    `;

    const inserts = adminEmails.map(email => ({
      store_id,
      to_email: email,
      subject: `📦 Stock Received — PO ${po_number || "N/A"} — ${storeName}`,
      html_body: htmlBody,
      template_key: "stock_received_alert",
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
