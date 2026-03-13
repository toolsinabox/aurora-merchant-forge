import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Send email notifications for warranty dispute events (raised, updated, resolved)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, dispute_id, event } = await req.json();

    if (!store_id || !dispute_id || !event) {
      return new Response(JSON.stringify({ error: "Missing store_id, dispute_id, or event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, contact_email")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: dispute } = await supabase
      .from("warranty_disputes")
      .select("*, customer:customers(name, email), order:orders(order_number), product:products(name)")
      .eq("id", dispute_id)
      .single();

    if (!dispute) {
      return new Response(JSON.stringify({ error: "Dispute not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerEmail = (dispute as any).customer?.email;
    const customerName = (dispute as any).customer?.name || "there";
    const orderNumber = (dispute as any).order?.order_number || "N/A";
    const productName = (dispute as any).product?.name || "N/A";
    const disputeType = (dispute as any).dispute_type || "dispute";
    const status = (dispute as any).status || "open";

    const statusColors: Record<string, string> = {
      open: "#f59e0b",
      in_review: "#3b82f6",
      resolved: "#16a34a",
      closed: "#6b7280",
    };

    const statusColor = statusColors[status] || "#6b7280";

    const eventTitles: Record<string, string> = {
      raised: "Warranty Dispute Received",
      updated: "Warranty Dispute Updated",
      resolved: "Warranty Dispute Resolved",
    };

    // Customer email
    if (customerEmail) {
      const customerHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#333">${eventTitles[event] || "Dispute Update"}</h2>
          <p>Hi ${customerName},</p>
          ${event === "raised" ? `<p>We've received your warranty ${disputeType} request and our team will review it shortly.</p>` : ""}
          ${event === "updated" ? `<p>Your warranty ${disputeType} has been updated. Here's the latest status:</p>` : ""}
          ${event === "resolved" ? `<p>Your warranty ${disputeType} has been resolved. Thank you for your patience.</p>` : ""}
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px">
            <tr><td style="padding:10px 12px;color:#666">Order</td><td style="padding:10px 12px;font-weight:bold">#${orderNumber}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Product</td><td style="padding:10px 12px">${productName}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Type</td><td style="padding:10px 12px;text-transform:capitalize">${disputeType}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Status</td><td style="padding:10px 12px"><span style="display:inline-block;padding:4px 12px;background:${statusColor};color:#fff;border-radius:12px;font-size:13px;text-transform:capitalize">${status.replace("_", " ")}</span></td></tr>
          </table>
          ${(dispute as any).reason ? `<p style="color:#555"><strong>Reason:</strong> ${(dispute as any).reason}</p>` : ""}
          <p style="color:#666;font-size:14px">If you have any questions, please don't hesitate to contact us.</p>
          <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
        </div>
      `;

      await supabase.from("email_queue").insert({
        store_id,
        template_key: `dispute_${event}`,
        to_email: customerEmail,
        subject: `${eventTitles[event] || "Dispute Update"} — Order #${orderNumber} — ${store.name}`,
        html_body: customerHtml,
        status: "pending",
      });
    }

    // Admin notification for new disputes
    if (event === "raised" && store.contact_email) {
      const adminHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#e11d48">New Warranty Dispute Received ⚠️</h2>
          <p>A customer has submitted a warranty ${disputeType} request:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fef2f2;border-radius:8px">
            <tr><td style="padding:10px 12px;color:#666">Customer</td><td style="padding:10px 12px;font-weight:bold">${customerName}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Email</td><td style="padding:10px 12px">${customerEmail || "N/A"}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Order</td><td style="padding:10px 12px">#${orderNumber}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Product</td><td style="padding:10px 12px">${productName}</td></tr>
            <tr><td style="padding:10px 12px;color:#666">Type</td><td style="padding:10px 12px;text-transform:capitalize">${disputeType}</td></tr>
            ${(dispute as any).reason ? `<tr><td style="padding:10px 12px;color:#666">Reason</td><td style="padding:10px 12px">${(dispute as any).reason}</td></tr>` : ""}
          </table>
          <div style="margin:24px 0">
            <a href="#" style="display:inline-block;padding:12px 32px;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Review Dispute</a>
          </div>
        </div>
      `;

      await supabase.from("email_queue").insert({
        store_id,
        template_key: "dispute_admin_notification",
        to_email: store.contact_email,
        subject: `New Warranty Dispute — ${customerName} — Order #${orderNumber}`,
        html_body: adminHtml,
        status: "pending",
      });
    }

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
