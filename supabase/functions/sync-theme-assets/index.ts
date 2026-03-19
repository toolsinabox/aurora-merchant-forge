import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { store_id, theme_id } = await req.json();
    if (!store_id || !theme_id) {
      return new Response(JSON.stringify({ error: "store_id and theme_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all CSS and JS files + font CSS files for this theme
    const { data: files, error } = await supabase
      .from("theme_files")
      .select("file_name, file_path, folder, content")
      .eq("theme_id", theme_id)
      .eq("store_id", store_id);

    if (error) throw error;

    const assetFiles = (files || []).filter((f: any) =>
      f.content && (f.file_name.endsWith(".css") || f.file_name.endsWith(".js"))
    );

    const results: { path: string; status: string }[] = [];

    for (const f of assetFiles) {
      const storagePath = `${store_id}/${theme_id}/${f.file_path}`;
      const mimeType = f.file_name.endsWith(".css") ? "text/css" : "application/javascript";
      const blob = new Blob([f.content], { type: mimeType });

      const { error: uploadErr } = await supabase.storage
        .from("theme-assets")
        .upload(storagePath, blob, { contentType: mimeType, upsert: true });

      results.push({
        path: storagePath,
        status: uploadErr ? `error: ${uploadErr.message}` : "ok",
      });
    }

    return new Response(JSON.stringify({ uploaded: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
