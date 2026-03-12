import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });
    }

    // Create client with user's JWT to verify identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Use service role to check platform admin and fetch all stores
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user is platform admin
    const { data: platformRole } = await supabaseAdmin
      .from("platform_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .maybeSingle();

    if (!platformRole) {
      return new Response(JSON.stringify({ error: "Not a platform admin" }), { status: 403, headers: corsHeaders });
    }

    // Fetch all stores with owner profile info and counts
    const { data: stores, error: storesError } = await supabaseAdmin
      .from("stores")
      .select("id, name, slug, currency, contact_email, logo_url, owner_id, created_at")
      .order("created_at", { ascending: false });

    if (storesError) throw storesError;

    // Get product counts and order counts per store
    const storeIds = (stores || []).map((s: any) => s.id);

    const { data: productCounts } = await supabaseAdmin
      .rpc("get_store_product_counts", {}) // We'll do it manually
      .select("*");

    // Get counts manually
    const enrichedStores = await Promise.all(
      (stores || []).map(async (store: any) => {
        const [{ count: productCount }, { count: orderCount }, { data: ownerProfile }] = await Promise.all([
          supabaseAdmin.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
          supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("store_id", store.id),
          supabaseAdmin.from("profiles").select("display_name, avatar_url").eq("user_id", store.owner_id).maybeSingle(),
        ]);

        return {
          ...store,
          product_count: productCount || 0,
          order_count: orderCount || 0,
          owner_name: ownerProfile?.display_name || "Unknown",
          owner_avatar: ownerProfile?.avatar_url || null,
        };
      })
    );

    return new Response(JSON.stringify(enrichedStores), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
