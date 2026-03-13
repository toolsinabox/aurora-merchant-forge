import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send email to admin when a contact form is submitted
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, name, email, subject, message } = await req.json();

    if (!store_id || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, contact_email")
      .eq("id", store_id)
      .single();

    if (!store || !store.contact_email) {
      return new Response(JSON.stringify({ error: "Store not found or no contact email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">New Contact Form Submission</h2>
        <p>A visitor submitted the contact form on <strong>${store.name}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;font-weight:bold;width:100px;vertical-align:top">Name:</td><td style="padding:8px">${name || "N/A"}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Email:</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
          ${subject ? `<tr><td style="padding:8px;font-weight:bold;vertical-align:top">Subject:</td><td style="padding:8px">${subject}</td></tr>` : ""}
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Message:</td><td style="padding:8px;white-space:pre-wrap">${message}</td></tr>
        </table>
        <p style="color:#666;font-size:14px">You can reply directly to <a href="mailto:${email}">${email}</a>.</p>
      </div>
    `;

    await supabase.from("email_queue").insert({
      store_id,
      template_key: "contact_form",
      to_email: store.contact_email,
      subject: `[Contact Form] ${subject || "New message"} — ${store.name}`,
      html_body: html,
      status: "pending",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
