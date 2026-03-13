import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { store_id, to, subject, html, template_key, variables } = await req.json();

    if (!store_id || !to) {
      return new Response(JSON.stringify({ error: "Missing store_id or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get store + SMTP config
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, contact_email, smtp_config")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve template if template_key provided
    let finalSubject = subject || "";
    let finalHtml = html || "";

    if (template_key) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("subject, html_body, is_active")
        .eq("store_id", store_id)
        .eq("template_key", template_key)
        .maybeSingle();

      if (template && template.is_active) {
        finalSubject = finalSubject || template.subject;
        finalHtml = finalHtml || template.html_body;
      }
    }

    // Replace variables in subject and body
    if (variables && typeof variables === "object") {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        finalSubject = finalSubject.replace(placeholder, String(value));
        finalHtml = finalHtml.replace(placeholder, String(value));
      }
    }

    // Replace store-level variables
    finalHtml = finalHtml.replace(/\{\{store_name\}\}/g, store.name || "");
    finalSubject = finalSubject.replace(/\{\{store_name\}\}/g, store.name || "");

    // Queue the email
    const { data: queued } = await supabase
      .from("email_queue")
      .insert({
        store_id,
        template_key: template_key || null,
        to_email: to,
        subject: finalSubject,
        html_body: finalHtml,
        status: "pending",
      })
      .select("id")
      .single();

    // Try to send via SMTP if configured
    const smtp = store.smtp_config as any;
    if (smtp?.host && smtp?.username && smtp?.password) {
      try {
        const client = new SMTPClient({
          connection: {
            hostname: smtp.host,
            port: Number(smtp.port) || 587,
            tls: smtp.encryption === "SSL",
            auth: {
              username: smtp.username,
              password: smtp.password,
            },
          },
        });

        await client.send({
          from: smtp.from_email || store.contact_email || "noreply@store.com",
          to: to,
          subject: finalSubject,
          content: "auto",
          html: finalHtml,
        });

        await client.close();

        // Mark as sent
        if (queued?.id) {
          await supabase
            .from("email_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", queued.id);
        }

        return new Response(JSON.stringify({ success: true, status: "sent", queue_id: queued?.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (smtpErr) {
        // Mark as failed
        if (queued?.id) {
          await supabase
            .from("email_queue")
            .update({ status: "failed", error: (smtpErr as Error).message })
            .eq("id", queued.id);
        }

        return new Response(JSON.stringify({ success: false, status: "queued", error: (smtpErr as Error).message, queue_id: queued?.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No SMTP configured — email stays queued
    return new Response(JSON.stringify({ success: true, status: "queued", queue_id: queued?.id, note: "No SMTP configured — email queued but not sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
