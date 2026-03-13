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
    const url = new URL(req.url);
    const storeSlug = url.searchParams.get("store");
    if (!storeSlug) {
      return new Response("Missing store parameter", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get store
    const { data: store } = await supabase
      .from("stores")
      .select("id, slug")
      .eq("slug", storeSlug)
      .maybeSingle();

    if (!store) {
      return new Response("Store not found", { status: 404, headers: corsHeaders });
    }

    const baseUrl = url.searchParams.get("base_url") || `${url.origin}/store/${store.slug}`;

    // Fetch products
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("store_id", store.id)
      .eq("status", "active")
      .not("slug", "is", null);

    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("store_id", store.id);

    // Fetch content pages
    const { data: pages } = await supabase
      .from("content_pages")
      .select("slug, updated_at")
      .eq("store_id", store.id)
      .eq("status", "published");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url>\n    <loc>${baseUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // Products page
    xml += `  <url>\n    <loc>${baseUrl}/products</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    // Individual products
    (products || []).forEach((p: any) => {
      const lastmod = p.updated_at ? p.updated_at.split("T")[0] : "";
      xml += `  <url>\n    <loc>${baseUrl}/products/${p.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // Categories
    (categories || []).forEach((c: any) => {
      const lastmod = c.updated_at ? c.updated_at.split("T")[0] : "";
      xml += `  <url>\n    <loc>${baseUrl}/products?category=${c.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Content pages
    (pages || []).forEach((p: any) => {
      const lastmod = p.updated_at ? p.updated_at.split("T")[0] : "";
      xml += `  <url>\n    <loc>${baseUrl}/page/${p.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    return new Response(`Error: ${(err as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
