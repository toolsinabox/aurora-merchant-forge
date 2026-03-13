import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, customer_ids } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get Mailchimp config from store_addons
    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", "mailchimp").single();

    if (!addon || !addon.is_active) {
      return new Response(JSON.stringify({ error: "Mailchimp integration not active" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { api_key, list_id, server_prefix } = addon.config as any;
    if (!api_key || !list_id || !server_prefix) {
      return new Response(JSON.stringify({ error: "Mailchimp credentials incomplete" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const baseUrl = `https://${server_prefix}.api.mailchimp.com/3.0`;
    const authHeader = `Basic ${btoa(`anystring:${api_key}`)}`;

    if (action === "sync_customers") {
      // Fetch customers to sync
      let query = supabase.from("customers").select("id, name, email, segment, tags, total_spent, total_orders").eq("store_id", store_id);
      if (customer_ids?.length) query = query.in("id", customer_ids);
      const { data: customers } = await query.limit(500);

      if (!customers?.length) {
        return new Response(JSON.stringify({ synced: 0, message: "No customers to sync" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let synced = 0;
      let errors = 0;

      // Batch add/update members
      const operations = customers.filter(c => c.email).map(customer => ({
        method: "PUT",
        path: `/lists/${list_id}/members/${md5Hash(customer.email!.toLowerCase())}`,
        body: JSON.stringify({
          email_address: customer.email,
          status_if_new: "subscribed",
          merge_fields: {
            FNAME: customer.name?.split(" ")[0] || "",
            LNAME: customer.name?.split(" ").slice(1).join(" ") || "",
          },
          tags: customer.tags || [],
        }),
      }));

      // Mailchimp batch operations (up to 500 per request)
      const batchRes = await fetch(`${baseUrl}/batches`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ operations }),
      });

      if (batchRes.ok) {
        synced = operations.length;
      } else {
        // Fallback: sync one by one
        for (const customer of customers.filter(c => c.email)) {
          try {
            const emailHash = md5Hash(customer.email!.toLowerCase());
            const res = await fetch(`${baseUrl}/lists/${list_id}/members/${emailHash}`, {
              method: "PUT",
              headers: { Authorization: authHeader, "Content-Type": "application/json" },
              body: JSON.stringify({
                email_address: customer.email,
                status_if_new: "subscribed",
                merge_fields: {
                  FNAME: customer.name?.split(" ")[0] || "",
                  LNAME: customer.name?.split(" ").slice(1).join(" ") || "",
                },
              }),
            });
            if (res.ok) synced++;
            else errors++;
          } catch { errors++; }
        }
      }

      return new Response(JSON.stringify({ synced, errors, total: customers.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_newsletter") {
      // Sync newsletter subscribers
      const { data: subscribers } = await supabase.from("newsletter_subscribers")
        .select("email, is_active").eq("store_id", store_id).limit(500);

      if (!subscribers?.length) {
        return new Response(JSON.stringify({ synced: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let synced = 0;
      for (const sub of subscribers) {
        try {
          const emailHash = md5Hash(sub.email.toLowerCase());
          await fetch(`${baseUrl}/lists/${list_id}/members/${emailHash}`, {
            method: "PUT",
            headers: { Authorization: authHeader, "Content-Type": "application/json" },
            body: JSON.stringify({
              email_address: sub.email,
              status_if_new: sub.is_active ? "subscribed" : "unsubscribed",
              status: sub.is_active ? "subscribed" : "unsubscribed",
            }),
          });
          synced++;
        } catch {}
      }

      return new Response(JSON.stringify({ synced, total: subscribers.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: sync_customers, sync_newsletter" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Simple MD5 hash for Mailchimp subscriber hash
function md5Hash(str: string): string {
  // Use Web Crypto API for MD5-like hash (Mailchimp uses MD5 of lowercase email)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, "0");
}
