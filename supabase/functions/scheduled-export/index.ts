import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { store_id, export_id } = await req.json();

    // Get the export config
    const { data: exportConfig } = await supabase
      .from("scheduled_exports")
      .select("*")
      .eq("id", export_id)
      .eq("store_id", store_id)
      .single();

    if (!exportConfig) {
      return new Response(JSON.stringify({ error: "Export not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("name, contact_email")
      .eq("id", store_id)
      .single();

    // Build query based on entity type
    const entityType = exportConfig.entity_type;
    const fields = exportConfig.fields?.length > 0 ? exportConfig.fields.join(",") : "*";
    const filters = exportConfig.filters || {};

    let query = supabase.from(entityType).select(fields).eq("store_id", store_id);

    // Apply date filters
    if (filters.date_from) query = query.gte("created_at", filters.date_from);
    if (filters.date_to) query = query.lte("created_at", filters.date_to);
    if (filters.status) query = query.eq("status", filters.status);

    // For scheduled runs, default to last period
    if (!filters.date_from && !filters.date_to) {
      const freq = exportConfig.frequency;
      const now = new Date();
      const offset = freq === "daily" ? 1 : freq === "weekly" ? 7 : 30;
      const since = new Date(now.getTime() - offset * 86400000).toISOString();
      query = query.gte("created_at", since);
    }

    const { data: rows, error } = await query.limit(5000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to CSV
    if (!rows || rows.length === 0) {
      // Update last run
      await supabase.from("scheduled_exports").update({
        last_run_at: new Date().toISOString(),
      }).eq("id", export_id);

      return new Response(JSON.stringify({ success: true, rows: 0, note: "No data for period" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      ),
    ];
    const csv = csvLines.join("\n");

    // Email the export
    const emailTo = exportConfig.email_to || store?.contact_email;
    if (emailTo) {
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>📦 Scheduled Export: ${exportConfig.name}</h2>
          <p>Your scheduled <strong>${entityType}</strong> export from <strong>${store?.name}</strong> is ready.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#6b7280">
              <strong>Records:</strong> ${rows.length}<br/>
              <strong>Entity:</strong> ${entityType}<br/>
              <strong>Frequency:</strong> ${exportConfig.frequency}<br/>
              <strong>Generated:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          <p style="font-size:13px;color:#6b7280">The CSV data is attached below as a code block for easy copy-paste:</p>
          <pre style="background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;font-size:11px;overflow-x:auto;max-height:400px">${csv.substring(0, 10000)}${csv.length > 10000 ? "\n... (truncated)" : ""}</pre>
        </div>
      `;

      await supabase.from("email_queue").insert({
        store_id,
        to_email: emailTo,
        subject: `Scheduled Export: ${exportConfig.name} — ${new Date().toLocaleDateString()}`,
        html_body: html,
        template_key: "scheduled_export",
      });
    }

    // Update last run time
    await supabase.from("scheduled_exports").update({
      last_run_at: new Date().toISOString(),
    }).eq("id", export_id);

    return new Response(JSON.stringify({ success: true, rows: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
