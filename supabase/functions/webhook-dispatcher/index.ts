import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, event_type, payload } = await req.json();

    if (!store_id || !event_type) {
      return new Response(JSON.stringify({ error: "store_id and event_type required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get all automation integrations (Zapier + Make)
    const { data: addons } = await supabase.from("store_addons").select("addon_key, config, is_active")
      .eq("store_id", store_id).in("addon_key", ["zapier", "make"]).eq("is_active", true);

    if (!addons?.length) {
      return new Response(JSON.stringify({ dispatched: 0, message: "No active automation integrations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also get registered webhooks for this event type
    const { data: webhooks } = await supabase.from("webhooks").select("id, endpoint_url, signing_secret, is_active")
      .eq("store_id", store_id).eq("is_active", true).contains("events", [event_type]);

    const targets: { url: string; source: string; signing_secret?: string }[] = [];

    // Add automation webhook URLs
    for (const addon of addons) {
      const url = (addon.config as any)?.webhook_url;
      if (url) targets.push({ url, source: addon.addon_key });
    }

    // Add registered webhooks
    for (const wh of webhooks || []) {
      if (wh.endpoint_url) targets.push({ url: wh.endpoint_url, source: "webhook", signing_secret: wh.signing_secret });
    }

    if (!targets.length) {
      return new Response(JSON.stringify({ dispatched: 0, message: "No webhook URLs configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventPayload = {
      event: event_type,
      store_id,
      timestamp: new Date().toISOString(),
      data: payload || {},
    };

    let dispatched = 0;
    let errors = 0;
    const results: { source: string; status: number; ok: boolean }[] = [];

    for (const target of targets) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        
        // Add HMAC signature for registered webhooks with signing secret
        if (target.signing_secret) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            "raw", encoder.encode(target.signing_secret),
            { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
          );
          const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(eventPayload)));
          const hexSig = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
          headers["X-Webhook-Signature"] = `sha256=${hexSig}`;
        }

        const res = await fetch(target.url, {
          method: "POST",
          headers,
          body: JSON.stringify(eventPayload),
        });

        results.push({ source: target.source, status: res.status, ok: res.ok });
        if (res.ok) dispatched++;
        else errors++;

        // Update webhook last_triggered_at
        if (target.source === "webhook") {
          const wh = (webhooks || []).find(w => w.endpoint_url === target.url);
          if (wh) {
            await supabase.from("webhooks").update({
              last_triggered_at: new Date().toISOString(),
              last_status: res.status,
            }).eq("id", wh.id);
          }
        }
      } catch (err) {
        results.push({ source: target.source, status: 0, ok: false });
        errors++;
      }
    }

    return new Response(JSON.stringify({ dispatched, errors, total: targets.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
