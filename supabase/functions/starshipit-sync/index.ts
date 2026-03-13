import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STARSHIPIT_BASE = "https://api.starshipit.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, order_ids } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", "starshipit").single();

    if (!addon?.is_active) {
      return new Response(JSON.stringify({ error: "Starshipit integration not active" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { api_key, subscription_key } = addon.config as any;
    if (!api_key) throw new Error("Starshipit API key not configured");

    const ssHeaders: Record<string, string> = {
      "StarShipIT-Api-Key": api_key,
      "Content-Type": "application/json",
    };
    if (subscription_key) ssHeaders["Ocp-Apim-Subscription-Key"] = subscription_key;

    // ─── Export Orders to Starshipit ───
    if (action === "export_orders") {
      let query = supabase.from("orders").select("*, order_items(*), customers(name, email, phone)")
        .eq("store_id", store_id).in("status", ["processing", "new"]);
      if (order_ids?.length) query = query.in("id", order_ids);
      const { data: orders } = await query.limit(50);

      if (!orders?.length) {
        return new Response(JSON.stringify({ exported: 0, message: "No orders to export" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let exported = 0;
      let errors = 0;

      for (const order of orders) {
        try {
          const o = order as any;
          const [street1, ...streetRest] = (o.shipping_address || "").split(",").map((s: string) => s.trim());

          const ssOrder = {
            order_number: o.order_number,
            order_date: o.created_at,
            destination: {
              name: o.shipping_name || o.customers?.name || "Customer",
              email: o.customers?.email || "",
              phone: o.customers?.phone || "",
              street: street1 || "",
              suburb: streetRest[0] || o.shipping_city || "",
              city: o.shipping_city || "",
              state: o.shipping_state || "",
              post_code: o.shipping_zip || "",
              country: o.shipping_country || "AU",
            },
            items: (o.order_items || []).map((item: any) => ({
              description: item.title,
              sku: item.sku || "",
              quantity: item.quantity,
              value: item.unit_price,
              weight: 0.5,
            })),
          };

          const res = await fetch(`${STARSHIPIT_BASE}/orders`, {
            method: "POST",
            headers: ssHeaders,
            body: JSON.stringify({ order: ssOrder }),
          });

          if (res.ok) exported++;
          else errors++;
        } catch { errors++; }
      }

      return new Response(JSON.stringify({ exported, errors, total: orders.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Get Shipping Rates ───
    if (action === "get_rates") {
      const { destination, parcels } = await req.json().catch(() => ({}));

      const res = await fetch(`${STARSHIPIT_BASE}/rates`, {
        method: "POST",
        headers: ssHeaders,
        body: JSON.stringify({
          destination: {
            street: destination?.street || "",
            suburb: destination?.suburb || "",
            city: destination?.city || "",
            state: destination?.state || "",
            post_code: destination?.postcode || "",
            country_code: destination?.country || "AU",
          },
          packages: (parcels || [{ weight: 1, length: 20, width: 15, height: 10 }]).map((p: any) => ({
            weight: p.weight || 1,
            length: p.length || 20,
            width: p.width || 15,
            height: p.height || 10,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify({ rates: data.rates || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Starshipit rates error: ${res.status}`);
    }

    // ─── Import Tracking Updates ───
    if (action === "import_tracking") {
      const res = await fetch(`${STARSHIPIT_BASE}/orders/shipped?limit=50`, {
        headers: ssHeaders,
      });

      if (!res.ok) throw new Error(`Starshipit API error: ${res.status}`);

      const data = await res.json();
      const shipments = data?.orders || [];
      let updated = 0;

      for (const shipment of shipments) {
        if (!shipment.tracking_number || !shipment.order_number) continue;

        // Find matching order
        const { data: order } = await supabase.from("orders").select("id")
          .eq("store_id", store_id).eq("order_number", shipment.order_number).single();

        if (!order) continue;

        // Upsert shipment
        const { error } = await supabase.from("order_shipments").upsert({
          order_id: order.id,
          store_id,
          shipment_number: `SS-${shipment.order_number}`,
          carrier: shipment.carrier_name || "Starshipit",
          tracking_number: shipment.tracking_number,
          tracking_url: shipment.tracking_url || null,
          status: shipment.status === "Delivered" ? "delivered" : "shipped",
          shipped_at: shipment.shipped_date || new Date().toISOString(),
          delivered_at: shipment.status === "Delivered" ? (shipment.delivered_date || new Date().toISOString()) : null,
        }, { onConflict: "order_id,shipment_number" }).select();

        if (!error) updated++;
      }

      return new Response(JSON.stringify({ updated, total: shipments.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Create Shipping Label ───
    if (action === "create_label") {
      const { order_number } = await req.json().catch(() => ({}));
      if (!order_number) throw new Error("order_number required for label creation");

      const res = await fetch(`${STARSHIPIT_BASE}/orders/shipment`, {
        method: "POST",
        headers: ssHeaders,
        body: JSON.stringify({ order_number }),
      });

      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify({
          label_url: data.labels?.[0]?.label_url || null,
          tracking_number: data.tracking_number,
          carrier: data.carrier_name,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Label creation failed: ${res.status}`);
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: export_orders, get_rates, import_tracking, create_label" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
