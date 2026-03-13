import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Authenticate via API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return json({ error: "Missing x-api-key header" }, 401);

    const prefix = apiKey.substring(0, 8);
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("id, store_id, scopes, is_active, rate_limit")
      .eq("key_prefix", prefix)
      .eq("is_active", true)
      .single();

    if (!keyRow) return json({ error: "Invalid API key" }, 401);

    // Verify full key hash
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (hashHex !== keyRow.key_hash) {
      // key_hash check - fetch it
      const { data: fullKey } = await supabase.from("api_keys").select("key_hash").eq("id", keyRow.id).single();
      if (!fullKey || fullKey.key_hash !== hashHex) return json({ error: "Invalid API key" }, 401);
    }

    const storeId = keyRow.store_id;
    const scopes = keyRow.scopes || [];

    // Update last_used_at
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

    // Parse URL path: /rest-api/v1/{entity}/{id?}
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // parts: ["rest-api", "v1", entity, id?]
    const entity = parts[2] || "";
    const entityId = parts[3] || null;
    const method = req.method;

    // Map entities to tables and required scopes
    const entityMap: Record<string, { table: string; scope: string }> = {
      products: { table: "products", scope: "products" },
      orders: { table: "orders", scope: "orders" },
      customers: { table: "customers", scope: "customers" },
      inventory: { table: "inventory_stock", scope: "inventory" },
      categories: { table: "categories", scope: "products" },
      coupons: { table: "coupons", scope: "orders" },
    };

    const mapping = entityMap[entity];
    if (!mapping) return json({ error: `Unknown entity: ${entity}. Available: ${Object.keys(entityMap).join(", ")}` }, 404);

    // Check scope
    const readScope = `${mapping.scope}:read`;
    const writeScope = `${mapping.scope}:write`;
    if (method === "GET" && !scopes.includes(readScope) && !scopes.includes(writeScope)) {
      return json({ error: `Insufficient scope. Required: ${readScope}` }, 403);
    }
    if (["POST", "PUT", "DELETE"].includes(method) && !scopes.includes(writeScope)) {
      return json({ error: `Insufficient scope. Required: ${writeScope}` }, 403);
    }

    // GET (list or single)
    if (method === "GET") {
      if (entityId) {
        const { data, error } = await supabase.from(mapping.table).select("*").eq("store_id", storeId).eq("id", entityId).single();
        if (error || !data) return json({ error: "Not found" }, 404);
        return json({ data });
      }
      const limit = parseInt(url.searchParams.get("limit") || "25");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const orderBy = url.searchParams.get("order_by") || "created_at";
      const order = url.searchParams.get("order") || "desc";

      let query = supabase.from(mapping.table).select("*", { count: "exact" }).eq("store_id", storeId);
      
      // Status filter
      const status = url.searchParams.get("status");
      if (status) query = query.eq("status", status);

      // Search
      const search = url.searchParams.get("search");
      if (search && ["products", "customers"].includes(entity)) {
        const col = entity === "products" ? "title" : "name";
        query = query.ilike(col, `%${search}%`);
      }

      const { data, error, count } = await query.order(orderBy, { ascending: order === "asc" }).range(offset, offset + limit - 1);
      if (error) return json({ error: error.message }, 400);
      return json({ data, meta: { total: count, limit, offset } });
    }

    // POST (create)
    if (method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from(mapping.table).insert({ ...body, store_id: storeId }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ data }, 201);
    }

    // PUT (update)
    if (method === "PUT") {
      if (!entityId) return json({ error: "Entity ID required for updates" }, 400);
      const body = await req.json();
      delete body.store_id;
      delete body.id;
      const { data, error } = await supabase.from(mapping.table).update(body).eq("id", entityId).eq("store_id", storeId).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    // DELETE
    if (method === "DELETE") {
      if (!entityId) return json({ error: "Entity ID required for deletion" }, 400);
      const { error } = await supabase.from(mapping.table).delete().eq("id", entityId).eq("store_id", storeId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
