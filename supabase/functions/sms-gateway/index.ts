import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, campaign_id, phone_numbers, message } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMS provider config from store_addons
    const { data: addon } = await supabase.from("store_addons").select("addon_key, config, is_active")
      .eq("store_id", store_id).in("addon_key", ["twilio", "messagebird", "sms_broadcast"]).eq("is_active", true).limit(1).single();

    if (!addon?.is_active) {
      return new Response(JSON.stringify({ error: "No active SMS gateway configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = addon.config as Record<string, any>;
    const provider = addon.addon_key;

    // ─── Send Campaign ───
    if (action === "send_campaign") {
      if (!campaign_id) throw new Error("campaign_id required");

      const { data: campaign } = await supabase.from("marketing_campaigns").select("*")
        .eq("id", campaign_id).eq("store_id", store_id).eq("campaign_type", "sms").single();

      if (!campaign) throw new Error("SMS campaign not found");

      // Get target customers
      let query = supabase.from("customers").select("id, name, phone").eq("store_id", store_id).not("phone", "is", null);
      if (campaign.audience_segment && campaign.audience_segment !== "all") {
        query = query.eq("segment", campaign.audience_segment);
      }
      if (campaign.audience_tags?.length) {
        query = query.overlaps("tags", campaign.audience_tags);
      }
      const { data: customers } = await query.limit(500);

      if (!customers?.length) {
        return new Response(JSON.stringify({ sent: 0, message: "No customers with phone numbers" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const smsContent = campaign.content || "";
      let sent = 0;
      let errors = 0;

      for (const customer of customers) {
        if (!customer.phone) continue;
        const personalizedMsg = smsContent.replace(/\{name\}/g, customer.name || "Customer");

        try {
          const success = await sendSms(provider, config, customer.phone, personalizedMsg);
          if (success) sent++;
          else errors++;
        } catch { errors++; }
      }

      // Update campaign stats
      await supabase.from("marketing_campaigns").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        stats: { sent, errors, total: customers.length },
      }).eq("id", campaign_id);

      return new Response(JSON.stringify({ sent, errors, total: customers.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Send Single SMS ───
    if (action === "send_sms") {
      if (!phone_numbers?.length || !message) throw new Error("phone_numbers and message required");

      let sent = 0;
      for (const phone of phone_numbers) {
        const success = await sendSms(provider, config, phone, message);
        if (success) sent++;
      }

      return new Response(JSON.stringify({ sent, total: phone_numbers.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Send Order Notification SMS ───
    if (action === "order_notification") {
      const { order_id, template } = await req.json().catch(() => ({}));
      if (!order_id) throw new Error("order_id required");

      const { data: order } = await supabase.from("orders").select("*, customers(name, phone)")
        .eq("id", order_id).single();

      if (!order || !(order as any).customers?.phone) {
        return new Response(JSON.stringify({ sent: false, reason: "No phone number" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const templates: Record<string, string> = {
        order_confirmed: `Hi {name}, your order #{order_number} has been confirmed. Total: ${(order as any).currency || "$"}${(order as any).total}. Thank you!`,
        order_shipped: `Hi {name}, your order #{order_number} has been shipped! Track your delivery online.`,
        order_delivered: `Hi {name}, your order #{order_number} has been delivered. Enjoy your purchase!`,
      };

      const msg = (templates[template || "order_confirmed"] || templates.order_confirmed)
        .replace(/\{name\}/g, (order as any).customers?.name || "Customer")
        .replace(/\{order_number\}/g, (order as any).order_number || "");

      const success = await sendSms(provider, config, (order as any).customers.phone, msg);

      return new Response(JSON.stringify({ sent: success }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: send_campaign, send_sms, order_notification" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendSms(provider: string, config: Record<string, any>, to: string, body: string): Promise<boolean> {
  // ─── Twilio ───
  if (provider === "twilio") {
    const { account_sid, auth_token, from_number } = config;
    if (!account_sid || !auth_token || !from_number) throw new Error("Twilio credentials incomplete");

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from_number, Body: body }).toString(),
    });
    return res.ok;
  }

  // ─── MessageBird ───
  if (provider === "messagebird") {
    const { api_key, originator } = config;
    if (!api_key) throw new Error("MessageBird API key not configured");

    const res = await fetch("https://rest.messagebird.com/messages", {
      method: "POST",
      headers: { Authorization: `AccessKey ${api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        originator: originator || "Store",
        recipients: [to],
        body,
      }),
    });
    return res.ok;
  }

  // ─── SMS Broadcast (AU) ───
  if (provider === "sms_broadcast") {
    const { username, password, from: smsFrom } = config;
    if (!username || !password) throw new Error("SMS Broadcast credentials not configured");

    const params = new URLSearchParams({
      username,
      password,
      to,
      from: smsFrom || "Store",
      message: body,
    });
    const res = await fetch(`https://api.smsbroadcast.com.au/api-adv.php?${params}`);
    return res.ok;
  }

  throw new Error(`Unknown SMS provider: ${provider}`);
}
