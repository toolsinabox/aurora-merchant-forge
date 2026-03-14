import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_id, store_id, pickup_location, pickup_instructions } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order details
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

    const customerEmail = order.customers?.email || order.shipping_address?.email;
    const customerName = order.customers?.name || "Customer";

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No customer email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch store info
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("name")
      .eq("id", store_id)
      .single();

    const storeName = store?.name || "Our Store";
    const orderNumber = order.order_number || order_id.slice(0, 8);

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a; font-size: 24px;">Your Order is Ready for Collection! 🎉</h1>
        <p>Hi ${customerName},</p>
        <p>Great news! Your order <strong>#${orderNumber}</strong> is ready for pickup.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">Pickup Location</h3>
          <p style="margin-bottom: 0;">${pickup_location || "Please check your order confirmation for the pickup address."}</p>
        </div>

        ${pickup_instructions ? `
        <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #854d0e;">Pickup Instructions</h3>
          <p style="margin-bottom: 0;">${pickup_instructions}</p>
        </div>` : ""}

        <p><strong>What to bring:</strong></p>
        <ul>
          <li>A valid photo ID</li>
          <li>Your order number: <strong>#${orderNumber}</strong></li>
        </ul>

        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Thank you for shopping with ${storeName}!</p>
      </div>
    `;

    // Queue the email
    await supabaseAdmin.from("email_queue").insert({
      store_id,
      to_email: customerEmail,
      subject: `Your order #${orderNumber} is ready for collection - ${storeName}`,
      html_body: htmlBody,
      template_key: "collection_ready",
    });

    return new Response(JSON.stringify({ success: true, email: customerEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
