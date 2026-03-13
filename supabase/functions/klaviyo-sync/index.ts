import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, event_data } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get Klaviyo config
    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", "klaviyo").single();

    if (!addon || !addon.is_active) {
      return new Response(JSON.stringify({ error: "Klaviyo integration not active" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { private_api_key } = addon.config as any;
    if (!private_api_key) {
      return new Response(JSON.stringify({ error: "Klaviyo private API key required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const headers = {
      Authorization: `Klaviyo-API-Key ${private_api_key}`,
      "Content-Type": "application/json",
      revision: "2024-02-15",
    };

    if (action === "track_event") {
      // Track a custom event (e.g., Placed Order, Viewed Product)
      const { event_name, customer_email, properties } = event_data || {};
      if (!event_name || !customer_email) {
        return new Response(JSON.stringify({ error: "event_name and customer_email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const res = await fetch("https://a.klaviyo.com/api/events/", {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            type: "event",
            attributes: {
              metric: { data: { type: "metric", attributes: { name: event_name } } },
              profile: { data: { type: "profile", attributes: { email: customer_email } } },
              properties: properties || {},
              time: new Date().toISOString(),
            },
          },
        }),
      });

      return new Response(JSON.stringify({ success: res.ok, status: res.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_profiles") {
      // Sync customer profiles to Klaviyo
      const { data: customers } = await supabase.from("customers")
        .select("name, email, phone, segment, total_spent, total_orders, tags")
        .eq("store_id", store_id).not("email", "is", null).limit(500);

      if (!customers?.length) {
        return new Response(JSON.stringify({ synced: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let synced = 0;
      for (const c of customers) {
        try {
          const res = await fetch("https://a.klaviyo.com/api/profiles/", {
            method: "POST",
            headers,
            body: JSON.stringify({
              data: {
                type: "profile",
                attributes: {
                  email: c.email,
                  first_name: c.name?.split(" ")[0] || "",
                  last_name: c.name?.split(" ").slice(1).join(" ") || "",
                  phone_number: c.phone || undefined,
                  properties: {
                    segment: c.segment,
                    total_spent: c.total_spent,
                    total_orders: c.total_orders,
                    tags: c.tags,
                  },
                },
              },
            }),
          });
          if (res.ok || res.status === 409) synced++; // 409 = already exists
        } catch {}
      }

      return new Response(JSON.stringify({ synced, total: customers.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "track_order") {
      // Track a Placed Order event with line items
      const { order_id } = event_data || {};
      if (!order_id) {
        return new Response(JSON.stringify({ error: "order_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: order } = await supabase.from("orders")
        .select("*, order_items(*), customers(name, email)")
        .eq("id", order_id).single();

      if (!order?.customers?.email) {
        return new Response(JSON.stringify({ error: "Order or customer email not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const res = await fetch("https://a.klaviyo.com/api/events/", {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            type: "event",
            attributes: {
              metric: { data: { type: "metric", attributes: { name: "Placed Order" } } },
              profile: { data: { type: "profile", attributes: { email: order.customers.email } } },
              properties: {
                OrderId: order.order_number,
                Value: order.total,
                ItemCount: order.order_items?.length || 0,
                Items: (order.order_items || []).map((i: any) => ({
                  ProductName: i.title,
                  Quantity: i.quantity,
                  ItemPrice: i.unit_price,
                  SKU: i.sku,
                })),
              },
              value: order.total,
              time: order.created_at,
            },
          },
        }),
      });

      return new Response(JSON.stringify({ success: res.ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: track_event, sync_profiles, track_order" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
