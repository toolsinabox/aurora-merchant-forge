import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, product_ids } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get eBay config
    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", "ebay").single();

    if (!addon || !addon.is_active) {
      return new Response(JSON.stringify({ error: "eBay integration not active" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { auth_token } = addon.config as any;
    if (!auth_token) {
      return new Response(JSON.stringify({ error: "eBay auth token required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const headers = {
      Authorization: `Bearer ${auth_token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_AU",
    };

    if (action === "list_products") {
      let query = supabase.from("products")
        .select("id, title, description, price, sku, stock, images, weight, brand")
        .eq("store_id", store_id).eq("status", "active");
      if (product_ids?.length) query = query.in("id", product_ids);
      const { data: products } = await query.limit(50);

      if (!products?.length) {
        return new Response(JSON.stringify({ listed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let listed = 0;
      let errors = 0;

      for (const product of products) {
        try {
          // Create eBay inventory item
          const sku = product.sku || product.id.slice(0, 20);
          const res = await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              availability: {
                shipToLocationAvailability: {
                  quantity: product.stock || 0,
                },
              },
              condition: "NEW",
              product: {
                title: product.title,
                description: product.description || product.title,
                brand: product.brand || "Unbranded",
                imageUrls: Array.isArray(product.images) ? product.images.slice(0, 12) : [],
              },
            }),
          });

          if (res.ok || res.status === 204) listed++;
          else errors++;
        } catch { errors++; }
      }

      return new Response(JSON.stringify({ listed, errors, total: products.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_stock") {
      // Sync stock levels to eBay
      let query = supabase.from("products")
        .select("id, sku, stock")
        .eq("store_id", store_id).eq("status", "active").not("sku", "is", null);
      if (product_ids?.length) query = query.in("id", product_ids);
      const { data: products } = await query.limit(200);

      let synced = 0;
      for (const product of products || []) {
        try {
          const sku = product.sku || product.id.slice(0, 20);
          const res = await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              availability: {
                shipToLocationAvailability: { quantity: product.stock || 0 },
              },
            }),
          });
          if (res.ok || res.status === 204) synced++;
        } catch {}
      }

      return new Response(JSON.stringify({ synced, total: (products || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import_orders") {
      // Fetch recent eBay orders
      const res = await fetch("https://api.ebay.com/sell/fulfillment/v1/order?limit=50", { headers });

      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch eBay orders", status: res.status }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      let imported = 0;

      for (const ebayOrder of data.orders || []) {
        // Check if already imported
        const { data: existing } = await supabase.from("orders")
          .select("id").eq("store_id", store_id).eq("order_number", `EBAY-${ebayOrder.orderId}`).single();

        if (existing) continue;

        const buyer = ebayOrder.buyer || {};
        const shipping = ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo || {};
        const lineItems = ebayOrder.lineItems || [];

        // Create customer if needed
        let customerId: string | null = null;
        if (buyer.username) {
          const { data: cust } = await supabase.from("customers")
            .select("id").eq("store_id", store_id).eq("email", buyer.username).single();
          if (cust) {
            customerId = cust.id;
          } else {
            const { data: newCust } = await supabase.from("customers").insert({
              store_id,
              name: `${shipping.fullName || buyer.username}`,
              email: buyer.username,
            }).select("id").single();
            customerId = newCust?.id || null;
          }
        }

        // Create order
        const orderTotal = parseFloat(ebayOrder.pricingSummary?.total?.value || "0");
        const { data: newOrder } = await supabase.from("orders").insert({
          store_id,
          order_number: `EBAY-${ebayOrder.orderId}`,
          customer_id: customerId,
          status: "processing",
          payment_status: ebayOrder.orderPaymentStatus === "PAID" ? "paid" : "pending",
          subtotal: orderTotal,
          total: orderTotal,
          shipping_address: `${shipping.contactAddress?.addressLine1 || ""}, ${shipping.contactAddress?.city || ""}, ${shipping.contactAddress?.stateOrProvince || ""} ${shipping.contactAddress?.postalCode || ""}`,
          order_channel: "ebay",
        }).select("id").single();

        if (newOrder) {
          for (const item of lineItems) {
            await supabase.from("order_items").insert({
              order_id: newOrder.id,
              store_id,
              title: item.title || "eBay Item",
              quantity: item.quantity || 1,
              unit_price: parseFloat(item.lineItemCost?.value || "0"),
              total: parseFloat(item.lineItemCost?.value || "0") * (item.quantity || 1),
              sku: item.sku || null,
            });
          }
          imported++;
        }
      }

      return new Response(JSON.stringify({ imported, total: (data.orders || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: list_products, sync_stock, import_orders" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
