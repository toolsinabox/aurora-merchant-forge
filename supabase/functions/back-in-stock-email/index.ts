import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Notify customers who signed up for back-in-stock alerts when a product is restocked
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, product_id } = await req.json();

    if (!store_id || !product_id) {
      return new Response(JSON.stringify({ error: "Missing store_id or product_id" }), {
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

    const { data: product } = await supabase
      .from("products")
      .select("id, name, price, slug, images")
      .eq("id", product_id)
      .eq("store_id", store_id)
      .single();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get un-notified back-in-stock requests
    const { data: requests } = await supabase
      .from("back_in_stock_requests")
      .select("id, email")
      .eq("store_id", store_id)
      .eq("product_id", product_id)
      .is("notified_at", null);

    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, note: "No pending requests" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productImage = Array.isArray(product.images) && product.images.length > 0
      ? `<img src="${product.images[0]}" alt="${product.name}" style="max-width:200px;border-radius:8px;margin:16px 0" /><br/>`
      : "";

    let sent = 0;
    const notifiedIds: string[] = [];

    for (const request of requests) {
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#333">It's Back in Stock! 🎉</h2>
          <p>Great news! The item you've been waiting for is back in stock at <strong>${store.name}</strong>.</p>
          ${productImage}
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
            <h3 style="margin:0 0 8px">${product.name}</h3>
            <p style="margin:0;font-size:18px;font-weight:bold;color:#16a34a">$${Number(product.price || 0).toFixed(2)}</p>
          </div>
          <p>Don't wait — popular items sell out fast!</p>
          <div style="margin:24px 0">
            <a href="#" style="display:inline-block;padding:12px 32px;background:#333;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Shop Now</a>
          </div>
          <p style="color:#999;font-size:12px">You received this email because you requested a notification when this item was restocked.</p>
          <p style="color:#999;font-size:12px">— The ${store.name} Team</p>
        </div>
      `;

      await supabase.from("email_queue").insert({
        store_id,
        template_key: "back_in_stock",
        to_email: request.email,
        subject: `${product.name} is back in stock! — ${store.name}`,
        html_body: html,
        status: "pending",
      });

      notifiedIds.push(request.id);
      sent++;
    }

    // Mark requests as notified
    if (notifiedIds.length > 0) {
      await supabase
        .from("back_in_stock_requests")
        .update({ notified_at: new Date().toISOString() })
        .in("id", notifiedIds);
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
