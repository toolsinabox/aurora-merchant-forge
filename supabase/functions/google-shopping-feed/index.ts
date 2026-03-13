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

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, slug, currency, contact_email")
      .eq("slug", storeSlug)
      .maybeSingle();

    if (!store) {
      return new Response("Store not found", { status: 404, headers: corsHeaders });
    }

    const baseUrl = url.searchParams.get("base_url") || `${url.origin}/store/${store.slug}`;

    const { data: products } = await supabase
      .from("products")
      .select("id, title, description, price, compare_at_price, images, slug, brand, sku, barcode, status, is_active, category_id, track_inventory")
      .eq("store_id", store.id)
      .eq("status", "active")
      .eq("is_active", true);

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", store.id);

    const catMap: Record<string, string> = {};
    (categories || []).forEach((c: any) => { catMap[c.id] = c.name; });

    const currency = store.currency || "USD";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
    xml += `<channel>\n`;
    xml += `  <title>${escapeXml(store.name)}</title>\n`;
    xml += `  <link>${baseUrl}</link>\n`;
    xml += `  <description>Products from ${escapeXml(store.name)}</description>\n`;

    (products || []).forEach((p: any) => {
      const link = `${baseUrl}/product/${p.slug || p.id}`;
      const imageUrl = p.images?.[0]?.startsWith("http") 
        ? p.images[0] 
        : p.images?.[0] 
          ? `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/product-images/${p.images[0]}`
          : "";

      xml += `  <item>\n`;
      xml += `    <g:id>${p.id}</g:id>\n`;
      xml += `    <g:title>${escapeXml(p.title)}</g:title>\n`;
      xml += `    <g:description>${escapeXml((p.description || p.title).slice(0, 5000))}</g:description>\n`;
      xml += `    <g:link>${link}</g:link>\n`;
      if (imageUrl) xml += `    <g:image_link>${imageUrl}</g:image_link>\n`;
      xml += `    <g:availability>in_stock</g:availability>\n`;
      xml += `    <g:price>${Number(p.price).toFixed(2)} ${currency}</g:price>\n`;
      if (p.compare_at_price && p.compare_at_price > p.price) {
        xml += `    <g:sale_price>${Number(p.price).toFixed(2)} ${currency}</g:sale_price>\n`;
      }
      if (p.brand) xml += `    <g:brand>${escapeXml(p.brand)}</g:brand>\n`;
      if (p.sku) xml += `    <g:mpn>${escapeXml(p.sku)}</g:mpn>\n`;
      if (p.barcode) xml += `    <g:gtin>${escapeXml(p.barcode)}</g:gtin>\n`;
      if (p.category_id && catMap[p.category_id]) {
        xml += `    <g:product_type>${escapeXml(catMap[p.category_id])}</g:product_type>\n`;
      }
      xml += `    <g:condition>new</g:condition>\n`;
      xml += `  </item>\n`;
    });

    xml += `</channel>\n</rss>`;

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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
