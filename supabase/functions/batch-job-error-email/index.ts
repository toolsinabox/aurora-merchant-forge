import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_id, job_type, job_name, error_message, error_details, affected_records } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get store contact email
    const { data: store } = await supabase
      .from("stores")
      .select("name, contact_email")
      .eq("id", store_id)
      .single();

    if (!store?.contact_email) {
      return new Response(JSON.stringify({ error: "No store contact email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timestamp = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="background: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">⚠️ Batch Job Error</h1>
          </div>
          <div style="padding: 24px;">
            <p style="color: #374151; margin: 0 0 16px;">A batch job has failed and requires attention.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background: #f9fafb; width: 140px; font-size: 13px;">Job Type</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px;">${job_type || "Unknown"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background: #f9fafb; font-size: 13px;">Job Name</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px;">${job_name || "—"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background: #f9fafb; font-size: 13px;">Timestamp</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background: #f9fafb; font-size: 13px;">Records Affected</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px;">${affected_records ?? "—"}</td>
              </tr>
            </table>

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
              <p style="color: #991b1b; font-weight: 600; margin: 0 0 8px; font-size: 13px;">Error Message:</p>
              <p style="color: #b91c1c; margin: 0; font-size: 13px; font-family: monospace; white-space: pre-wrap;">${error_message || "No error message provided"}</p>
            </div>

            ${error_details ? `
            <div style="background: #f3f4f6; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
              <p style="color: #374151; font-weight: 600; margin: 0 0 8px; font-size: 13px;">Details:</p>
              <pre style="color: #4b5563; margin: 0; font-size: 12px; white-space: pre-wrap; overflow-x: auto;">${typeof error_details === "string" ? error_details : JSON.stringify(error_details, null, 2)}</pre>
            </div>
            ` : ""}

            <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0;">This is an automated notification from ${store.name}. Please investigate and resolve the issue promptly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Queue the email
    await supabase.from("email_queue").insert({
      store_id,
      to_email: store.contact_email,
      subject: `[Alert] Batch Job Failed: ${job_type || "Unknown"} — ${job_name || ""}`,
      html_body: html,
      template_key: "batch_job_error",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
