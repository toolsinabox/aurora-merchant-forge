import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return json({ error: "Missing x-api-key" }, 401);

    const body = await req.json();
    const requests = body.requests;
    if (!Array.isArray(requests) || requests.length === 0) {
      return json({ error: "requests must be a non-empty array" }, 400);
    }
    if (requests.length > 20) {
      return json({ error: "Maximum 20 requests per batch" }, 400);
    }

    // Forward each request to rest-api
    const baseUrl = Deno.env.get("SUPABASE_URL")!;
    const results = await Promise.all(
      requests.map(async (r: any, index: number) => {
        try {
          const method = (r.method || "GET").toUpperCase();
          const path = r.path || "";
          const url = `${baseUrl}/functions/v1/rest-api${path}`;

          const fetchOpts: RequestInit = {
            method,
            headers: {
              "x-api-key": apiKey,
              "Content-Type": "application/json",
            },
          };

          if (r.body && ["POST", "PUT", "PATCH"].includes(method)) {
            fetchOpts.body = JSON.stringify(r.body);
          }

          const resp = await fetch(url, fetchOpts);
          const data = await resp.json();
          return { index, status: resp.status, data };
        } catch (err: any) {
          return { index, status: 500, data: { error: err.message } };
        }
      })
    );

    return json({ results });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
