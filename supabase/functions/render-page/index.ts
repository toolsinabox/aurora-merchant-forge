import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store_id, page_type, slug, extra_context } = await req.json();
    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. Load store ──
    const { data: store } = await supabase
      .from("stores")
      .select("*")
      .eq("id", store_id)
      .single();
    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Load active theme + files ──
    const { data: themePackage } = await supabase
      .from("theme_packages")
      .select("id, name, is_active")
      .eq("store_id", store_id)
      .eq("is_active", true)
      .single();

    if (!themePackage) {
      return new Response(
        JSON.stringify({ html: "", has_theme: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: themeFiles } = await supabase
      .from("theme_files")
      .select("id, file_name, file_path, folder, content, file_type")
      .eq("theme_id", themePackage.id);

    if (!themeFiles || themeFiles.length === 0) {
      return new Response(
        JSON.stringify({ html: "", has_theme: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Build theme file maps ──
    const fileMap: Record<string, string> = {};
    const includesMap: Record<string, string> = {};
    const cssFiles: { file_name: string; file_path: string; content: string }[] = [];
    const jsFiles: { file_name: string; file_path: string; content: string }[] = [];

    for (const f of themeFiles) {
      const content = f.content || "";
      // Map by multiple path variations for flexible resolution
      fileMap[f.file_path] = content;
      fileMap[`${f.folder}/${f.file_name}`] = content;
      fileMap[f.file_name] = content;
      const parts = f.file_path.split("/");
      for (let i = 0; i < parts.length; i++) {
        fileMap[parts.slice(i).join("/")] = content;
      }
      // Build includes map (slug → content)
      if (f.folder?.includes("includes")) {
        const slug = f.file_name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
        includesMap[slug] = content;
      }
      // Categorize CSS/JS
      if (f.file_name.endsWith(".css")) {
        cssFiles.push({ file_name: f.file_name, file_path: f.file_path, content });
      } else if (f.file_name.endsWith(".js") && f.file_name !== "gulpfile.js") {
        jsFiles.push({ file_name: f.file_name, file_path: f.file_path, content });
      }
    }

    // ── 4. Load categories ──
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order, image_url")
      .eq("store_id", store_id)
      .order("sort_order");

    // ── 5. Load page-specific data ──
    let product: Record<string, any> | null = null;
    let products: Record<string, any>[] = [];
    let adverts: Record<string, any>[] = [];
    let contentPage: Record<string, any> | null = null;
    let contentZones: Record<string, string> = {};

    // Content zones
    const { data: zones } = await supabase
      .from("content_zones")
      .select("zone_key, content")
      .eq("store_id", store_id)
      .eq("is_active", true);
    if (zones) {
      for (const z of zones) {
        contentZones[z.zone_key] = z.content;
      }
    }

    // Adverts
    const { data: advertData } = await supabase
      .from("adverts")
      .select("*")
      .eq("store_id", store_id)
      .eq("is_active", true)
      .order("sort_order");
    if (advertData) adverts = advertData;

    // Page-type specific loading
    if (page_type === "product" && slug) {
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store_id)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();
      if (p) product = p;
    }

    if (page_type === "home" || page_type === "category") {
      const query = supabase
        .from("products")
        .select("*")
        .eq("store_id", store_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(24);

      if (page_type === "category" && slug) {
        // TODO: filter by category
      }
      const { data: prods } = await query;
      if (prods) products = prods;
    }

    if (page_type === "content" && slug) {
      const { data: cp } = await supabase
        .from("content_pages")
        .select("*")
        .eq("store_id", store_id)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();
      if (cp) contentPage = cp;
    }

    // ── 6. Find header/footer templates ──
    const headerFile = findMainTemplate(themeFiles, "headers");
    const footerFile = findMainTemplate(themeFiles, "footers");

    if (!headerFile && !footerFile) {
      return new Response(
        JSON.stringify({ html: "", has_theme: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 7. Build template context ──
    const themeAssetBaseUrl = `${supabaseUrl}/storage/v1/object/public/theme-assets/${store_id}/${themePackage.id}`;
    const basePath = extra_context?.basePath || "";

    const ctx: Record<string, any> = {
      store: { ...store, name: store.name, currency: store.default_currency || "AUD" },
      includes: includesMap,
      themeFiles: fileMap,
      themeAssetBaseUrl,
      categories: categories || [],
      baseUrl: store.custom_domain ? `https://${store.custom_domain}` : "",
      basePath,
      pageType: page_type || "content",
      queryParams: extra_context?.queryParams || {},
      contentZones,
      adverts,
      products,
      product: product || undefined,
      content: contentPage || undefined,
      thumblist: products,
      ...(extra_context || {}),
    };

    // ── 8. Render templates ──
    const renderedHeader = headerFile ? renderTemplate(headerFile.content || "", ctx) : "";
    const renderedFooter = footerFile ? renderTemplate(footerFile.content || "", ctx) : "";

    // ── 9. Render body template (page-type specific) ──
    let renderedBody = "";
    const bodyTemplate = findBodyTemplate(themeFiles, page_type, slug);
    if (bodyTemplate) {
      renderedBody = renderTemplate(bodyTemplate.content || "", ctx);
    }

    // ── 10. Extract <head> content and rewrite asset URLs ──
    const headMatch = renderedHeader.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headContent = headMatch?.[1] || "";

    const bodyMatch = renderedHeader.match(/<body[^>]*>([\s\S]*$)/i);
    let headerBody = bodyMatch?.[1] || renderedHeader;
    headerBody = headerBody
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "");

    let footerBody = renderedFooter
      .replace(/<\/body>/gi, "")
      .replace(/<\/html>/gi, "");

    // Rewrite asset URLs
    headerBody = rewriteAssetUrls(headerBody, themeAssetBaseUrl);
    renderedBody = rewriteAssetUrls(renderedBody, themeAssetBaseUrl);
    footerBody = rewriteAssetUrls(footerBody, themeAssetBaseUrl);

    // Build CSS link tags
    const cssLinkTags = cssFiles.map(f =>
      `<link rel="stylesheet" href="${themeAssetBaseUrl}/${f.file_path}" data-theme-css="${f.file_name}" />`
    ).join("\n");

    // Build the full response
    const response = {
      has_theme: true,
      head_content: headContent,
      header_html: headerBody,
      body_html: renderedBody,
      footer_html: footerBody,
      css_link_tags: cssLinkTags,
      css_inline: cssFiles.map(f => ({ name: f.file_name, content: f.content })),
      js_files: jsFiles.map(f => ({ name: f.file_name, content: f.content })),
      theme_asset_base_url: themeAssetBaseUrl,
      store_name: store.name,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("render-page error:", err);
    return new Response(
      JSON.stringify({ error: String(err), has_theme: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ════════════════════════════════════════════════════════════════
// B@SE Template Engine — Server-Side Port
// Full Maropost/Neto Compatibility
// ════════════════════════════════════════════════════════════════

function findMainTemplate(files: any[], folder: string): any | null {
  const candidates = files.filter(
    (f) => f.folder?.toLowerCase().includes(folder) && f.file_name?.endsWith(".html")
  );
  return (
    candidates.find((f) => f.file_name === "template.html") ||
    candidates.find((f) => f.file_name.includes("template")) ||
    candidates[0] ||
    null
  );
}

function findBodyTemplate(files: any[], pageType: string, slug?: string): any | null {
  const typeMap: Record<string, string[]> = {
    home: ["cms/home.template.html", "cms/home.html", "home.template.html"],
    product: ["product/template.html", "product/product.template.html", "products/template.html"],
    category: ["cms/default.template.html", "cms/category.template.html"],
    content: ["cms/default.template.html", "cms/page.template.html"],
    cart: ["cart/shopping_cart.template.html", "cart/template.html"],
    checkout: ["cart/onepage.template.html", "cart/checkout.template.html"],
    blog: ["cms/blog.template.html", "cms/default.template.html"],
    contact: ["cms/contact.template.html", "cms/default.template.html"],
    login: ["customer/login.template.html"],
    register: ["customer/register/template.html"],
    account: ["customer/account/template.html"],
  };

  const paths = typeMap[pageType] || ["cms/default.template.html"];

  for (const path of paths) {
    const found = files.find((f) => {
      const fp = f.file_path?.toLowerCase() || "";
      const p = path.toLowerCase();
      return fp === p || fp.endsWith(`/${p}`) || fp.endsWith(`templates/${p}`);
    });
    if (found) return found;
  }
  return null;
}

// ── Asset URL rewriting ──
function rewriteAssetUrls(html: string, assetBase: string): string {
  if (!assetBase) return html;
  const assetExt = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css)(\?[^"']*)?/i;
  const skipPaths = /^(\/placeholder\.|\/favicon)/i;

  return html
    .replace(/(src|href)=["']((?!https?:\/\/|\/\/|data:|#|mailto:|javascript:|\{)[^"']+)["']/gi, (match, attr, path) => {
      if (!assetExt.test(path)) return match;
      if (skipPaths.test(path)) return match;
      const themePathMatch = path.match(/^\/assets\/themes\/[^/]+\/(.+)/);
      if (themePathMatch) return `${attr}="${assetBase}/${themePathMatch[1]}"`;
      if (/^\/assets\//i.test(path)) return match;
      const cleanPath = path.replace(/^\/+/, "");
      return `${attr}="${assetBase}/${cleanPath}"`;
    })
    .replace(/url\(\s*['"]?((?!https?:\/\/|\/\/|data:)[^)'"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)[^)'"]*?)['"]?\s*\)/gi, (match, path) => {
      const themePathMatch = path.match(/^\/assets\/themes\/[^/]+\/(.+)/);
      if (themePathMatch) return `url("${assetBase}/${themePathMatch[1].trim()}")`;
      if (/^\/assets\//i.test(path)) return match;
      const cleanPath = path.replace(/^\/+/, "").trim();
      return `url("${assetBase}/${cleanPath}")`;
    });
}

// ── Resolve storage URLs ──
function resolveStorageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return url;
}

// ── Format pipes ──
function applyFormat(value: any, format: string): string {
  if (value === null || value === undefined) return "";
  switch (format) {
    case "currency": return `$${Number(value).toFixed(2)}`;
    case "integer": return Math.round(Number(value)).toString();
    case "number": { const n = Number(value); return isNaN(n) ? String(value) : n.toLocaleString(); }
    case "decimal": return Number(value).toFixed(2);
    case "date": return new Date(value).toLocaleDateString();
    case "datetime": return new Date(value).toLocaleString();
    case "uppercase": return String(value).toUpperCase();
    case "lowercase": return String(value).toLowerCase();
    case "url_encode": return encodeURIComponent(String(value));
    case "strip_html": return String(value).replace(/<[^>]*>/g, "");
    case "percentage": return `${Number(value)}%`;
    case "nl2br": return String(value).replace(/\n/g, "<br>");
    default: return String(value);
  }
}

// ── Resolve config ──
function resolveConfig(key: string, ctx: Record<string, any>): string {
  const k = key.toLowerCase();
  const store = ctx.store || {};
  const configMap: Record<string, () => string> = {
    company_name: () => store.name || "",
    website_name: () => store.name || "",
    store_name: () => store.name || "",
    home_url: () => ctx.basePath || ctx.baseUrl || "/",
    current_page_type: () => ctx.pageType || "content",
    templatelang: () => "en-AU",
    neto_css_version: () => Date.now().toString(),
    store_currency: () => store.default_currency || "AUD",
    defaultcurrency: () => store.default_currency || "AUD",
    currency_symbol: () => "$",
    contact_email: () => store.contact_email || "",
    phone: () => store.phone || "",
    logo_url: () => store.logo_url || "",
    logo: () => store.logo_url || "",
    show_home_ads: () => "1",
    show_home_categories: () => "1",
    show_home_products: () => "1",
    show_price: () => "1",
    show_rrp: () => "1",
    show_addcart: () => "1",
    show_wishlist: () => "1",
    show_reviews: () => "1",
    show_breadcrumbs: () => "1",
    show_qty: () => "1",
    show_brand: () => "1",
    show_sku: () => "1",
    show_stock: () => "1",
    items_per_page: () => "24",
    assets_url: () => ctx.themeAssetBaseUrl || "/assets",
    cart_count: () => ctx.cart?.totalItems?.toString() || "0",
    cart_total: () => "$0.00",
    is_logged_in: () => ctx.customer ? "1" : "0",
    customer_name: () => ctx.customer?.name || "",
    cart_url: () => `${ctx.basePath || ""}/cart`,
    checkout_url: () => `${ctx.basePath || ""}/checkout`,
    account_url: () => `${ctx.basePath || ""}/account`,
    wishlist_url: () => `${ctx.basePath || ""}/wishlist`,
    login_url: () => `${ctx.basePath || ""}/login`,
    register_url: () => `${ctx.basePath || ""}/register`,
    search_url: () => `${ctx.basePath || ""}/products`,
    copyright_year: () => new Date().getFullYear().toString(),
    social_facebook: () => store.social_facebook || "",
    social_instagram: () => store.social_instagram || "",
    social_twitter: () => store.social_twitter || "",
    social_youtube: () => store.social_youtube || "",
    social_linkedin: () => store.social_linkedin || "",
    social_tiktok: () => store.social_tiktok || "",
    abn: () => store.abn || "",
    company_abn: () => store.abn || "",
  };
  return configMap[k]?.() ?? store[k] ?? store[key] ?? "";
}

// ── Resolve field ──
function resolveField(field: string, ctx: Record<string, any>): any {
  if (field.startsWith("config:") || field.startsWith("CONFIG:")) {
    return resolveConfig(field.replace(/^config:/i, ""), ctx);
  }
  if (field.startsWith("content_")) {
    return ctx.content?.[field.replace("content_", "")] || ctx.content?.[field] || "";
  }
  if (field.startsWith("form:")) {
    return ctx.queryParams?.[field.replace("form:", "")] || "";
  }

  const p = ctx.product;
  const productFields: Record<string, () => any> = {
    title: () => p?.title, name: () => p?.title || p?.name,
    sku: () => p?.sku, SKU: () => p?.sku,
    price: () => p?.price, store_price: () => p?.price,
    rrp: () => p?.compare_at_price || p?.price,
    description: () => p?.description, short_description: () => p?.short_description,
    brand: () => p?.brand, model: () => p?.model_number || p?.title,
    image_url: () => resolveStorageUrl(p?.images?.[0]) || "",
    thumb: () => resolveStorageUrl(p?.images?.[0]) || "",
    thumb_url: () => resolveStorageUrl(p?.images?.[0]) || "",
    store_quantity: () => p?.stock_on_hand ?? 10,
    url: () => `${ctx.basePath || ""}/product/${p?.slug || p?.id}`,
    URL: () => `${ctx.basePath || ""}/product/${p?.slug || p?.id}`,
    has_child: () => (p?.has_variants || p?.variant_count > 0) ? 1 : 0,
    reviews: () => p?.review_count || 0,
    save: () => {
      const c = p?.compare_at_price, pr = p?.price;
      return c && pr ? Math.round((1 - Number(pr) / Number(c)) * 100) : 0;
    },
    save_percent: () => {
      const c = p?.compare_at_price, pr = p?.price;
      return c && pr ? Math.round((1 - Number(pr) / Number(c)) * 100) : 0;
    },
    store_name: () => ctx.store?.name,
    store_currency: () => ctx.store?.currency,
    page_title: () => ctx.content?.title || ctx.store?.name || "",
    total_showing: () => String((ctx.products || ctx.adverts || []).length),
    rndm: () => Math.random().toString(36).substring(2, 8),
  };

  const resolver = productFields[field];
  if (resolver) return resolver();
  if (ctx[field] !== undefined) return ctx[field];

  // Misc fields
  if (/^misc\d+$/.test(field)) return p?.[field] || "";

  // Dot-path
  const parts = field.split(".");
  let obj: any = ctx;
  for (const part of parts) {
    if (obj == null) return undefined;
    obj = obj[part];
  }
  return obj;
}

// ── Normalize syntax ──
function normalizeTemplateSyntax(t: string): string {
  // [%END tag%] → [%/tag%]
  t = t.replace(/\[%END\s+(\w+)%\]/gi, "[%/$1%]");
  // Handle case-insensitive duplicates
  t = t.replace(/\[%end\s+(\w+)%\]/gi, "[%/$1%]");
  return t;
}

function stripComments(t: string): string {
  return t.replace(/\[%\*[\s\S]*?\*%\]/g, "");
}

// ── Process load_template ──
function processLoadTemplate(template: string, ctx: Record<string, any>, depth = 0): string {
  if (depth > 10) return template;
  return template.replace(/\[%load_template\s+(?:file:\s*)?(['"])([^'"]+)\1\s*\/?%\]/gi, (_, _q: string, filePath: string) => {
    const files = ctx.themeFiles || {};
    const includes = ctx.includes || {};
    const clean = filePath.trim().replace(/^\/+/, "");

    const candidates = [clean, `templates/${clean}`, `templates/${clean}.template.html`, `templates/${clean}.html`];
    for (const c of candidates) {
      if (files[c]) return processLoadTemplate(files[c], ctx, depth + 1);
    }

    const fileName = clean.split("/").pop() || clean;
    const slug = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (includes[slug]) return processLoadTemplate(includes[slug], ctx, depth + 1);

    const lower = clean.toLowerCase();
    for (const key of Object.keys(files)) {
      if (key.toLowerCase() === lower || key.toLowerCase().endsWith(`/${lower}`) ||
          key.toLowerCase().endsWith(`/${lower}.template.html`)) {
        return processLoadTemplate(files[key], ctx, depth + 1);
      }
    }
    return `<!-- load_template "${clean}" not found -->`;
  });
}

// ── Process legacy includes ──
function processLegacyIncludes(t: string, ctx: Record<string, any>, depth = 0): string {
  if (depth > 5) return t;
  return t.replace(/\[!include\s+([\w\-]+)!\]/g, (_, slug: string) => {
    return ctx.includes?.[slug] ? processLegacyIncludes(ctx.includes[slug], ctx, depth + 1) : "";
  });
}

// ── Process theme asset tags ──
function processThemeAssets(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%ntheme_asset%\]([\s\S]*?)\[%\/ntheme_asset%\]/gi, (_, path: string) => {
    return ctx.themeAssetBaseUrl ? `${ctx.themeAssetBaseUrl}/${path.trim()}` : path.trim();
  });
}

// ── Process cache blocks (strip wrappers) ──
function processCacheBlocks(t: string): string {
  return t.replace(/\[%\/?cache[^\]]*%\]/gi, "");
}

// ── Process URL tags ──
function processUrlTags(t: string, ctx: Record<string, any>): string {
  const base = ctx.baseUrl || "";
  const bp = ctx.basePath;
  let result = t.replace(/\[%url\s+([^\]]*?)\/?%\]\[%\/url%\]/gi, (_, a: string) => resolveUrlTag(a, base, bp));
  result = result.replace(/\[%url\s+([^\]]*?)\/%\]/gi, (_, a: string) => resolveUrlTag(a, base, bp));
  result = result.replace(/\[%URL\s+([^\]]*?)%\]\[%\/URL%\]/gi, (_, a: string) => resolveUrlTag(a, base, bp));
  return result;
}

function resolveUrlTag(attrs: string, base: string, basePath?: string): string {
  const page = attrs.match(/page:'([^']+)'/i)?.[1] || "";
  const type = attrs.match(/type:'([^']+)'/i)?.[1] || "";
  const fn = attrs.match(/fn:'([^']+)'/i)?.[1] || "";
  const id = attrs.match(/id:'([^']+)'/i)?.[1] || "";
  const prefix = basePath || base;

  if (!page && type) {
    switch (type) {
      case "home": return prefix || "/";
      case "item": return id ? `${prefix}/product/${id}` : `${prefix}/products`;
      case "content": return id ? `${prefix}/page/${id}` : `${prefix}/`;
      case "page": return id === "contact_us" ? `${prefix}/contact` : `${prefix}/`;
    }
  }

  let url = prefix;
  switch (page) {
    case "account":
      switch (type) {
        case "login": url += "/login"; break;
        case "register": url += "/signup"; break;
        case "wishlist": url += "/wishlist"; break;
        case "forgotpwd": url += "/forgot-password"; break;
        case "orders": case "view_order": url += "/account"; break;
        default: url += "/account"; break;
      }
      break;
    case "checkout":
      url += fn === "payment" ? "/checkout" : "/cart";
      break;
    case "home": url = prefix || "/"; break;
    case "products": case "search": url += "/products"; break;
    case "item": url += id ? `/product/${id}` : "/products"; break;
    case "contact": url += "/contact"; break;
    case "wishlist": url += "/wishlist"; break;
    case "login": url += "/login"; break;
    case "register": url += "/signup"; break;
    default: if (page) url += "/" + page.replace(/_/g, "-"); break;
  }
  return url;
}

// ── Process format blocks ──
function processFormatBlocks(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%(?:format|FORMAT)\s+([^\]]*?)%\]([\s\S]*?)\[%\/(?:format|FORMAT)%\]/gi, (_, attrs: string, content: string) => {
    const type = attrs.match(/type:'(\w+)'/i)?.[1] || "date";
    if (type === "currency") {
      const num = parseFloat(content.trim());
      return !isNaN(num) ? `$${num.toFixed(2)}` : content.trim();
    }
    if (type === "date") {
      const val = content.trim();
      if (!val || val === "0000-00-00 00:00:00") return "";
      if (val === "now" || val === "NOW") return new Date().toLocaleDateString();
      try { return new Date(val).toLocaleDateString(); } catch { return val; }
    }
    if (type === "percent" || type === "percentage") {
      const num = parseFloat(content.trim());
      return !isNaN(num) ? `${Math.round(num)}%` : content.trim();
    }
    if (type === "number") {
      const num = parseFloat(content.trim());
      return !isNaN(num) ? num.toLocaleString() : content.trim();
    }
    if (type === "text") {
      let result = content.trim();
      if (/rmhtml:'1'|nohtml:'1'/i.test(attrs)) result = result.replace(/<[^>]*>/g, "");
      const ml = attrs.match(/maxlength:'(\d+)'/i);
      if (ml && result.length > parseInt(ml[1])) result = result.slice(0, parseInt(ml[1])) + "…";
      return result;
    }
    return content;
  });
}

// ── Process nohtml ──
function processNoHtml(t: string): string {
  return t.replace(/\[%nohtml%\]([\s\S]*?)\[%\/nohtml%\]/gi, (_, c: string) => c.replace(/<[^>]*>/g, ""));
}

// ── Process conditionals ──
function findMatchingEndIf(t: string, start: number): number {
  let depth = 0, i = start;
  while (i < t.length) {
    const ifM = t.slice(i).match(/^\[%if\s+/i);
    const endM = t.slice(i).match(/^\[%\/if%\]/i);
    if (ifM && i !== start) { depth++; i += ifM[0].length; }
    else if (endM) { if (depth === 0) return i; depth--; i += endM[0].length; }
    else i++;
  }
  return -1;
}

function processConditionals(t: string, ctx: Record<string, any>): string {
  let result = t;
  let safety = 0;
  while (safety++ < 200) {
    const ifRegex = /\[%if\s+([\s\S]*?)%\]/gi;
    let match: RegExpExecArray | null;
    const positions: { index: number; condition: string; fullMatch: string }[] = [];
    while ((match = ifRegex.exec(result)) !== null) {
      positions.push({ index: match.index, condition: match[1], fullMatch: match[0] });
    }
    if (positions.length === 0) break;

    let found = false;
    for (let p = positions.length - 1; p >= 0; p--) {
      const pos = positions[p];
      const bodyStart = pos.index + pos.fullMatch.length;
      const endIfPos = findMatchingEndIf(result, pos.index);
      if (endIfPos === -1) continue;
      const body = result.slice(bodyStart, endIfPos);
      if (/\[%if\s+/i.test(body)) continue;

      // Resolve tags in condition
      let cond = pos.condition.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_: string, field: string, fmt?: string) => {
        const v = resolveField(field, ctx);
        if (v == null) return "";
        return fmt ? applyFormat(v, fmt) : String(v);
      });

      // Parse segments
      const conditions: (string | null)[] = [cond];
      const segments: string[] = [];
      let rem = body, cur = "";
      const bndry = /\[%(?:elseif\s+([\s\S]*?)|else)%\]/i;
      while (rem.length > 0) {
        const bm = bndry.exec(rem);
        if (!bm) { cur += rem; rem = ""; }
        else {
          cur += rem.slice(0, bm.index);
          segments.push(cur); cur = "";
          rem = rem.slice(bm.index + bm[0].length);
          conditions.push(bm[1] !== undefined ? bm[1].replace(/\[@([\w:.]+)@\]/g, (_, f: string) => String(resolveField(f, ctx) ?? "")) : null);
        }
      }
      segments.push(cur);

      let replacement = "";
      for (let i = 0; i < segments.length && i < conditions.length; i++) {
        const c = conditions[i];
        if (c === null) { replacement = segments[i]; break; }
        if (evalCond(c, ctx)) { replacement = segments[i]; break; }
      }

      result = result.slice(0, pos.index) + replacement + result.slice(endIfPos + "[%/if%]".length);
      found = true;
      break;
    }
    if (!found) break;
  }
  return result;
}

function evalCond(cond: string, ctx: Record<string, any>): boolean {
  cond = cond.trim();
  if (!cond) return false;

  // OR
  if (/\s+OR\s+/i.test(cond)) {
    return cond.split(/\s+OR\s+/i).some(p => evalCond(p.trim(), ctx));
  }
  // AND
  if (/\s+AND\s+/i.test(cond)) {
    return cond.split(/\s+AND\s+/i).every(p => evalCond(p.trim(), ctx));
  }
  // || and &&
  if (cond.includes("||")) return cond.split("||").some(p => evalCond(p.trim(), ctx));
  if (cond.includes("&&")) return cond.split("&&").every(p => evalCond(p.trim(), ctx));

  // Comparison
  const comp = cond.match(/^(.+?)\s+(eq|ne|!=|==|>=|<=|>|<)\s+(.+)$/i) ||
               cond.match(/^(.+?)\s*(!=|==|>=|<=|>|<)\s*(.+)$/);
  if (comp) {
    const left = resolveOperand(comp[1], ctx);
    const right = resolveOperand(comp[3], ctx);
    const op = comp[2].toLowerCase();
    switch (op) {
      case "eq": case "==": return String(left) === String(right);
      case "ne": case "!=": return String(left) !== String(right);
      case ">": return Number(left) > Number(right);
      case "<": return Number(left) < Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<=": return Number(left) <= Number(right);
    }
  }

  // Truthy check
  const val = resolveOperand(cond, ctx);
  return val != null && val !== false && val !== 0 && val !== "" && val !== "0";
}

function resolveOperand(raw: string, ctx: Record<string, any>): any {
  const o = raw.trim();
  if ((o.startsWith("'") && o.endsWith("'")) || (o.startsWith('"') && o.endsWith('"'))) return o.slice(1, -1);
  const tag = o.match(/^\[@([\w:.]+)(?:\|(\w+))?@\]$/);
  if (tag) { const v = resolveField(tag[1], ctx); return v ?? ""; }
  if (/^config:/i.test(o)) return resolveConfig(o.replace(/^config:/i, ""), ctx);
  if ((ctx as any).__variables?.[o] !== undefined) return (ctx as any).__variables[o];
  const fv = resolveField(o, ctx);
  if (fv != null && fv !== "") return fv;
  if (/^-?\d+(?:\.\d+)?$/.test(o)) return Number(o);
  return o;
}

// ── Process value tags ──
function processValueTags(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_, field: string, fmt?: string) => {
    if ((ctx as any).__variables?.[field] !== undefined) {
      const v = (ctx as any).__variables[field];
      return fmt ? applyFormat(v, fmt) : String(v);
    }
    const v = resolveField(field, ctx);
    if (v == null) return "";
    return fmt ? applyFormat(v, fmt) : String(v);
  });
}

// ── Process inline tags ──
function processInlineTags(t: string, ctx: Record<string, any>): string {
  let r = t;
  r = r.replace(/\[%rndm%\]/gi, () => Math.random().toString(36).substring(2, 8));
  r = r.replace(/\[%now%\]/gi, () => new Date().toISOString());
  r = r.replace(/\[%today%\]/gi, () => new Date().toLocaleDateString());
  r = r.replace(/\[%year%\]/gi, () => new Date().getFullYear().toString());
  r = r.replace(/\[%config:([^\]%]+)%\]/gi, (_, k: string) => resolveConfig(k.trim(), ctx));
  return r;
}

// ── Process set variables ──
function processSetVars(t: string, ctx: Record<string, any>): string {
  if (!(ctx as any).__variables) (ctx as any).__variables = {};
  return t.replace(/\[%set\s+\[@([\w:.]+)@\]\s*%\]([\s\S]*?)\[%\/set%\]/gi, (_, name: string, value: string) => {
    (ctx as any).__variables[name] = value.trim();
    return "";
  });
}

// ── Process system tags (thumb_list, content_menu, advert, breadcrumb, etc.) ──
function processSystemTags(t: string, ctx: Record<string, any>): string {
  let result = t;

  // ── content_zone ──
  result = result.replace(/\[%content_zone\s+([^\]]*?)\/?%\](?:\s*\[%\/content_zone%\])?/gi, (_, attrs: string) => {
    const id = attrs.match(/id:'([^']+)'/i)?.[1] || "";
    return ctx.contentZones?.[id] || "";
  });

  // ── thumb_list ──
  result = result.replace(/\[%thumb_list\s+([^\]]*?)%\]([\s\S]*?)\[%\/thumb_list%\]/gi, (fullMatch, attrs: string, content: string) => {
    const items = ctx.products || ctx.thumblist || [];
    if (items.length === 0) {
      const ifempty = content.match(/\[%param\s+\*?ifempty%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
      return ifempty;
    }

    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";

    const limit = parseInt(attrs.match(/limit:'(\d+)'/i)?.[1] || "24");
    const bp = ctx.basePath || "";

    let html = header;
    items.slice(0, limit).forEach((p: any, idx: number) => {
      const item = buildProductItem(p, idx, bp);
      const itemCtx = { ...ctx, product: p, ...item };
      let row = bodyTpl;
      row = processConditionals(row, itemCtx);
      row = processValueTags(row, itemCtx);
      html += row;
    });
    html += footer;
    return html;
  });

  // ── advert ──
  result = result.replace(/\[%advert\s+([^\]]*?)%\]([\s\S]*?)\[%\/advert%\]/gi, (_, attrs: string, content: string) => {
    const ads = ctx.adverts || [];
    if (ads.length === 0) return content.match(/\[%param\s+\*?ifempty%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";

    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const limit = parseInt(attrs.match(/limit:'(\d+)'/i)?.[1] || "10");

    let html = header;
    ads.slice(0, limit).forEach((ad: any, idx: number) => {
      const item = buildAdvertItem(ad, idx);
      const itemCtx = { ...ctx, ...item };
      let row = bodyTpl;
      row = processConditionals(row, itemCtx);
      row = processValueTags(row, itemCtx);
      html += row;
    });
    html += footer;
    return html;
  });

  // ── content_menu ──
  result = result.replace(/\[%content_menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/content_menu%\]/gi, (_, attrs: string, content: string) => {
    const cats = ctx.categories || [];
    if (cats.length === 0) return "";

    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const level1 = content.match(/\[%param\s+\*?level_1%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const level2 = content.match(/\[%param\s+\*?level_2%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bp = ctx.basePath || "";

    const topLevel = cats.filter((c: any) => !c.parent_id);
    let html = header;
    for (const cat of topLevel) {
      const children = cats.filter((c: any) => c.parent_id === cat.id);
      let childHtml = "";
      if (children.length > 0 && level2) {
        for (const child of children) {
          const cCtx = { ...ctx, name: child.name, url: `${bp}/category/${child.slug}`, content_id: child.id, image: child.image_url || "", next_level: "" };
          childHtml += processValueTags(processConditionals(level2, cCtx), cCtx);
        }
      }
      const catCtx = { ...ctx, name: cat.name, url: `${bp}/category/${cat.slug}`, content_id: cat.id, image: cat.image_url || "", next_level: childHtml, count: children.length };
      html += processValueTags(processConditionals(level1, catCtx), catCtx);
    }
    html += footer;
    return html;
  });

  // ── breadcrumb ──
  result = result.replace(/\[%breadcrumb%\]([\s\S]*?)\[%\/breadcrumb%\]/gi, (_, content: string) => {
    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    // Simple breadcrumb: just current page
    const pageName = ctx.content?.title || ctx.product?.title || "";
    if (!pageName) return header + footer;
    const crumbCtx = { ...ctx, name: pageName, url: "#" };
    return header + processValueTags(bodyTpl, crumbCtx) + footer;
  });

  // ── menu ──
  result = result.replace(/\[%menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/menu%\]/gi, () => "");

  // ── search box ──
  result = result.replace(/\[%search%\]([\s\S]*?)\[%\/search%\]/gi, (_, content: string) => content);

  return result;
}

function buildProductItem(p: any, idx: number, bp: string): Record<string, any> {
  const imageUrl = resolveStorageUrl(p.images?.[0]) || "/placeholder.svg";
  const save = p.compare_at_price && p.price ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
  return {
    ad_id: p.id, inventory_id: p.id, product_id: p.id,
    SKU: p.sku || "", sku: p.sku || "",
    name: p.title || "", model: p.title || "",
    URL: `${bp}/product/${p.slug || p.id}`, url: `${bp}/product/${p.slug || p.id}`,
    image_url: imageUrl, thumb: imageUrl, thumb_url: imageUrl,
    store_price: p.price || 0, rrp: p.compare_at_price || p.price || 0,
    save, save_percent: save,
    store_quantity: p.stock_on_hand ?? 10,
    has_child: p.has_variants ? 1 : 0,
    reviews: p.review_count || 0,
    brand: p.brand || "", short_description: p.short_description || "",
    description: p.description || "",
    count: idx, index: idx,
    rndm: Math.random().toString(36).substring(2, 8),
  };
}

function buildAdvertItem(ad: any, idx: number): Record<string, any> {
  return {
    ad_id: ad.id, headline: ad.title || ad.name || "",
    name: ad.name || ad.title || "",
    url: ad.link_url || "#",
    image: resolveStorageUrl(ad.image_url) || "",
    image_url: resolveStorageUrl(ad.image_url) || "",
    image_url_mobile: resolveStorageUrl(ad.image_url_mobile) || resolveStorageUrl(ad.image_url) || "",
    title: ad.title || "", subtitle: ad.subtitle || "",
    button_text: ad.button_text || "",
    linktext: ad.button_text || "Learn More",
    description: ad.subtitle || "",
    count: idx, index: idx, total_showing: String(idx + 1),
    rndm: Math.random().toString(36).substring(2, 8),
  };
}

// ── Main render pipeline ──
function renderTemplate(template: string, ctx: Record<string, any>): string {
  let r = template;
  r = stripComments(r);
  r = normalizeTemplateSyntax(r);
  r = processCacheBlocks(r);
  r = processLoadTemplate(r, ctx);
  r = processLegacyIncludes(r, ctx);
  r = processThemeAssets(r, ctx);
  r = processUrlTags(r, ctx);
  r = processFormatBlocks(r, ctx);
  r = processNoHtml(r);
  r = processSetVars(r, ctx);
  r = processInlineTags(r, ctx);
  r = processSystemTags(r, ctx);
  r = processConditionals(r, ctx);
  r = processValueTags(r, ctx);
  r = cleanupUnresolved(r);
  return r;
}

function cleanupUnresolved(t: string): string {
  let r = t;
  r = r.replace(/\[%[^\]]+\/%\]/g, "");
  r = r.replace(/\[%\/?(?:set|while|cache|NETO_JS|cdn_asset|tracking_code|site_value|SITE_VALUE|content_zone|parse|escape|ajax_loader|ITEM_KITTING|IN_WISHLIST|url_encode|DATA|search|login|form|foreach|each|switch|case|default|rndm|now|today|year|config:[^\]]*)[^\]]*%\]/gi, "");
  r = r.replace(/\[%IN_WISHLIST[^\]]*%\][\s\S]*?\[%(?:\/\s*IN_WISHLIST|END\s+IN_WISHLIST)\s*%\]/gi, "");
  r = r.replace(/\[%ITEM_KITTING[^\]]*%\][\s\S]*?\[%\/ITEM_KITTING%\]/gi, "");
  r = r.replace(/\[@[\w:.]+(?:\|\w+)?@\]/g, "");
  r = r.replace(/\[%(?:if|elseif|else|\/if)[^\]]*%\]/gi, "");
  r = r.replace(/\[%param\s+[^\]]*%\]([\s\S]*?)\[%\/param%\]/gi, "");
  return r;
}
