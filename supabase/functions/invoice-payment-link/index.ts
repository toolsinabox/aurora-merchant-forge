import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_id, store_id, payment_url } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order with customer
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, customers(name, email)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerEmail = order.customers?.email;
    const customerName = order.customers?.name || "Customer";

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No customer email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("name")
      .eq("id", store_id)
      .single();

    const storeName = store?.name || "Our Store";
    const orderNumber = order.order_number || order_id.slice(0, 8);
    const total = Number(order.total || 0).toFixed(2);

    // Generate a simple payment token (in production, use a proper payment gateway link)
    const paymentToken = crypto.randomUUID();
    const payLink = payment_url || `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/pay/${paymentToken}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e40af; font-size: 22px;">Payment Required</h1>
        <p>Hi ${customerName},</p>
        <p>You have an outstanding invoice for order <strong>#${orderNumber}</strong>.</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #64748b; margin: 0 0 4px 0; font-size: 14px;">Amount Due</p>
          <p style="color: #1e293b; font-size: 32px; font-weight: 700; margin: 0;">$${total}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${payLink}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Pay Now
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${payLink}" style="color: #2563eb; word-break: break-all;">${payLink}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px;">
          This email was sent by ${storeName}. If you've already paid, please disregard this message.
        </p>
      </div>
    `;

    // Queue the email
    await supabaseAdmin.from("email_queue").insert({
      store_id,
      to_email: customerEmail,
      subject: `Payment required for order #${orderNumber} - ${storeName}`,
      html_body: htmlBody,
      template_key: "invoice_payment_link",
    });

    return new Response(JSON.stringify({ success: true, email: customerEmail, payment_token: paymentToken }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
