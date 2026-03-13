import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, marketplace, action, product_ids } = await req.json();

    if (!store_id || !marketplace || !action) {
      return new Response(JSON.stringify({ error: "store_id, marketplace, and action required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get marketplace config from store_addons
    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", marketplace).single();

    if (!addon?.is_active) {
      return new Response(JSON.stringify({ error: `${marketplace} integration not active` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = addon.config as Record<string, any>;

    // Fetch products to sync
    let products: any[] = [];
    if (action === "list_products" || action === "sync_stock") {
      let query = supabase.from("products").select("id, title, description, price, compare_at_price, sku, barcode, brand, images, stock, status, weight")
        .eq("store_id", store_id).eq("status", "active");
      if (product_ids?.length) query = query.in("id", product_ids);
      const { data } = await query.limit(200);
      products = data || [];
    }

    // ─── AMAZON SP-API ───
    if (marketplace === "amazon") {
      const { refresh_token, client_id, client_secret, marketplace_id } = config;
      if (!refresh_token || !client_id) throw new Error("Amazon SP-API credentials not configured");

      // Get LWA access token
      const tokenRes = await fetch("https://api.amazon.com/auth/o2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token,
          client_id,
          client_secret,
        }).toString(),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const spHeaders = {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      };
      const baseUrl = "https://sellingpartnerapi-na.amazon.com";

      if (action === "list_products") {
        let listed = 0;
        for (const product of products) {
          try {
            // Create catalog item via Listings API
            const res = await fetch(`${baseUrl}/listings/2021-08-01/items/${config.seller_id}/${product.sku}?marketplaceIds=${marketplace_id || "ATVPDKIKX0DER"}`, {
              method: "PUT",
              headers: spHeaders,
              body: JSON.stringify({
                productType: "PRODUCT",
                patches: [
                  { op: "replace", path: "/attributes/item_name", value: [{ value: product.title, marketplace_id: marketplace_id }] },
                  { op: "replace", path: "/attributes/list_price", value: [{ value: product.price, currency: "AUD" }] },
                  { op: "replace", path: "/attributes/fulfillment_availability", value: [{ fulfillment_channel_code: "DEFAULT", quantity: product.stock || 0 }] },
                ],
              }),
            });
            if (res.ok) listed++;
          } catch {}
        }

        return new Response(JSON.stringify({ listed, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "import_orders") {
        const res = await fetch(`${baseUrl}/orders/v0/orders?MarketplaceIds=${marketplace_id || "ATVPDKIKX0DER"}&CreatedAfter=${new Date(Date.now() - 7 * 86400000).toISOString()}`, {
          headers: spHeaders,
        });

        if (!res.ok) throw new Error(`Amazon Orders API error: ${res.status}`);
        const data = await res.json();
        const orders = data?.payload?.Orders || [];
        let imported = 0;

        for (const amzOrder of orders) {
          try {
            const { error } = await supabase.from("orders").insert({
              store_id,
              order_number: `AMZ-${amzOrder.AmazonOrderId}`,
              status: "processing",
              payment_status: amzOrder.OrderStatus === "Shipped" ? "paid" : "pending",
              total: parseFloat(amzOrder.OrderTotal?.Amount || 0),
              currency: amzOrder.OrderTotal?.CurrencyCode || "AUD",
              shipping_name: amzOrder.ShippingAddress?.Name || "Amazon Customer",
              shipping_address: `${amzOrder.ShippingAddress?.AddressLine1 || ""}, ${amzOrder.ShippingAddress?.City || ""}`,
              shipping_city: amzOrder.ShippingAddress?.City || "",
              shipping_zip: amzOrder.ShippingAddress?.PostalCode || "",
              shipping_country: amzOrder.ShippingAddress?.CountryCode || "AU",
              order_channel: "amazon",
            });
            if (!error) imported++;
          } catch {}
        }

        return new Response(JSON.stringify({ imported, total: orders.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "sync_stock") {
        let synced = 0;
        for (const product of products) {
          if (!product.sku) continue;
          try {
            await fetch(`${baseUrl}/listings/2021-08-01/items/${config.seller_id}/${product.sku}?marketplaceIds=${marketplace_id}`, {
              method: "PATCH",
              headers: spHeaders,
              body: JSON.stringify({
                productType: "PRODUCT",
                patches: [{ op: "replace", path: "/attributes/fulfillment_availability", value: [{ fulfillment_channel_code: "DEFAULT", quantity: product.stock || 0 }] }],
              }),
            });
            synced++;
          } catch {}
        }

        return new Response(JSON.stringify({ synced, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── FACEBOOK / INSTAGRAM SHOP (Meta Commerce API) ───
    if (marketplace === "facebook_shop") {
      const { access_token, catalog_id } = config;
      if (!access_token || !catalog_id) throw new Error("Facebook Commerce credentials not configured");

      const graphUrl = "https://graph.facebook.com/v18.0";

      if (action === "list_products") {
        let synced = 0;
        // Batch products into catalog
        const batch = products.map(p => ({
          method: "POST",
          relative_url: `${catalog_id}/products`,
          body: new URLSearchParams({
            retailer_id: p.sku || p.id,
            name: p.title,
            description: p.description || p.title,
            availability: (p.stock || 0) > 0 ? "in stock" : "out of stock",
            price: `${Math.round(p.price * 100)} AUD`,
            image_url: p.images?.[0] || "",
            url: `https://store.example.com/products/${p.id}`,
            brand: p.brand || "",
          }).toString(),
        }));

        // Facebook Graph API batch (max 50 per request)
        for (let i = 0; i < batch.length; i += 50) {
          const chunk = batch.slice(i, i + 50);
          const res = await fetch(`${graphUrl}/?access_token=${access_token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batch: chunk }),
          });
          if (res.ok) synced += chunk.length;
        }

        return new Response(JSON.stringify({ synced, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── CATCH.COM.AU ───
    if (marketplace === "catch") {
      const { api_key, seller_id } = config;
      if (!api_key) throw new Error("Catch.com.au API key not configured");

      const catchHeaders = { Authorization: `Bearer ${api_key}`, "Content-Type": "application/json" };
      const baseUrl = "https://seller-api.catch.com.au/v2";

      if (action === "list_products") {
        let listed = 0;
        for (const product of products) {
          try {
            const res = await fetch(`${baseUrl}/products`, {
              method: "POST", headers: catchHeaders,
              body: JSON.stringify({
                title: product.title,
                description: product.description || product.title,
                sku: product.sku,
                price: product.price,
                stock: product.stock || 0,
                brand: product.brand || "",
                images: product.images || [],
                weight: product.weight || 0.5,
              }),
            });
            if (res.ok) listed++;
          } catch {}
        }

        return new Response(JSON.stringify({ listed, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "import_orders") {
        const res = await fetch(`${baseUrl}/orders?status=paid&limit=50`, { headers: catchHeaders });
        if (!res.ok) throw new Error(`Catch API error: ${res.status}`);
        const data = await res.json();
        let imported = 0;

        for (const order of data.orders || []) {
          try {
            await supabase.from("orders").insert({
              store_id, order_number: `CATCH-${order.order_id}`,
              status: "processing", payment_status: "paid",
              total: order.total || 0, order_channel: "catch",
              shipping_name: order.shipping?.name || "Catch Customer",
              shipping_address: order.shipping?.address || "",
              shipping_city: order.shipping?.city || "",
              shipping_zip: order.shipping?.postcode || "",
              shipping_country: "AU",
            });
            imported++;
          } catch {}
        }

        return new Response(JSON.stringify({ imported, total: data.orders?.length || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── KOGAN ───
    if (marketplace === "kogan") {
      const { api_key, seller_id: koganSellerId } = config;
      if (!api_key) throw new Error("Kogan API key not configured");

      const koganHeaders = { "Seller-Token": api_key, "Seller-Id": koganSellerId || "", "Content-Type": "application/json" };

      if (action === "list_products") {
        let listed = 0;
        const items = products.map(p => ({
          sku: p.sku || p.id,
          title: p.title,
          description: p.description || "",
          brand: p.brand || "",
          price: p.price,
          stock: p.stock || 0,
          images: p.images || [],
          weight: p.weight || 0.5,
        }));

        const res = await fetch("https://api.kogan.com/v1/products/", {
          method: "POST", headers: koganHeaders, body: JSON.stringify({ products: items }),
        });
        if (res.ok) listed = items.length;

        return new Response(JSON.stringify({ listed, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "import_orders") {
        const res = await fetch("https://api.kogan.com/v1/orders/?status=Paid&limit=50", { headers: koganHeaders });
        const data = res.ok ? await res.json() : { results: [] };
        let imported = 0;

        for (const order of data.results || []) {
          try {
            await supabase.from("orders").insert({
              store_id, order_number: `KOGAN-${order.id}`,
              status: "processing", payment_status: "paid",
              total: order.total || 0, order_channel: "kogan",
              shipping_name: order.shipping_address?.name || "Kogan Customer",
            });
            imported++;
          } catch {}
        }

        return new Response(JSON.stringify({ imported }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── TRADEME ───
    if (marketplace === "trademe") {
      const { oauth_token, oauth_secret, consumer_key, consumer_secret } = config;
      if (!oauth_token || !consumer_key) throw new Error("TradeMe credentials not configured");

      const baseUrl = "https://api.trademe.co.nz/v1";

      if (action === "list_products") {
        let listed = 0;
        for (const product of products) {
          try {
            const res = await fetch(`${baseUrl}/Selling.json`, {
              method: "POST",
              headers: {
                Authorization: `OAuth oauth_token="${oauth_token}", oauth_consumer_key="${consumer_key}"`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                Title: product.title.substring(0, 80),
                Description: [product.description || product.title],
                StartPrice: product.price,
                BuyNowPrice: product.price,
                Duration: "Seven",
                Quantity: product.stock || 1,
                ShippingOptions: [{ Type: 1, Price: 0 }],
              }),
            });
            if (res.ok) listed++;
          } catch {}
        }

        return new Response(JSON.stringify({ listed, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "import_orders") {
        const res = await fetch(`${baseUrl}/MyTradeMe/SoldItems/All.json`, {
          headers: { Authorization: `OAuth oauth_token="${oauth_token}", oauth_consumer_key="${consumer_key}"` },
        });
        const data = res.ok ? await res.json() : { List: [] };
        let imported = 0;

        for (const item of data.List || []) {
          try {
            await supabase.from("orders").insert({
              store_id, order_number: `TM-${item.ListingId}`,
              status: "processing", payment_status: "paid",
              total: item.SelectedBuyNowPrice || item.BuyNowPrice || 0,
              order_channel: "trademe",
              shipping_name: item.Buyer?.Nickname || "TradeMe Customer",
            });
            imported++;
          } catch {}
        }

        return new Response(JSON.stringify({ imported }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── MYDEAL ───
    if (marketplace === "mydeal") {
      const { api_key: myDealKey } = config;
      if (!myDealKey) throw new Error("MyDeal API key not configured");

      const mdHeaders = { Authorization: `Bearer ${myDealKey}`, "Content-Type": "application/json" };

      if (action === "list_products") {
        let listed = 0;
        const payload = products.map(p => ({
          sku: p.sku || p.id,
          title: p.title,
          description: p.description || "",
          price: p.price,
          stock_quantity: p.stock || 0,
          brand: p.brand || "",
          images: (p.images || []).map((url: string) => ({ url })),
        }));

        const res = await fetch("https://seller-api.mydeal.com.au/v1/products", {
          method: "POST", headers: mdHeaders, body: JSON.stringify({ products: payload }),
        });
        if (res.ok) listed = payload.length;

        return new Response(JSON.stringify({ listed, total: products.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "import_orders") {
        const res = await fetch("https://seller-api.mydeal.com.au/v1/orders?status=paid&limit=50", { headers: mdHeaders });
        const data = res.ok ? await res.json() : { orders: [] };
        let imported = 0;

        for (const order of data.orders || []) {
          try {
            await supabase.from("orders").insert({
              store_id, order_number: `MD-${order.id}`,
              status: "processing", payment_status: "paid",
              total: order.total || 0, order_channel: "mydeal",
              shipping_name: order.customer_name || "MyDeal Customer",
            });
            imported++;
          } catch {}
        }

        return new Response(JSON.stringify({ imported }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── eBay Category Mapping ───
    if (marketplace === "ebay" && action === "get_categories") {
      const { access_token } = config;
      if (!access_token) throw new Error("eBay credentials not configured");

      const res = await fetch("https://api.ebay.com/commerce/taxonomy/v1/category_tree/15", {
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        const categories = (data.rootCategoryNode?.childCategoryTreeNodes || []).map((n: any) => ({
          id: n.category?.categoryId,
          name: n.category?.categoryName,
          children: (n.childCategoryTreeNodes || []).slice(0, 10).map((c: any) => ({
            id: c.category?.categoryId,
            name: c.category?.categoryName,
          })),
        }));

        return new Response(JSON.stringify({ categories: categories.slice(0, 50) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`eBay Taxonomy API error: ${res.status}`);
    }

    return new Response(JSON.stringify({ error: `Unknown marketplace '${marketplace}' or action '${action}'` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
