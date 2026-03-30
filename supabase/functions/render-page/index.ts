/**
 * render-page Edge Function — Maropost-Compatible SSR Engine
 * 
 * Mirrors Maropost/Neto's server-side rendering architecture exactly:
 * 1. Receives a page request (store_id, page_type, slug)
 * 2. Resolves 3 templates: header + body + footer (exact folder conventions)
 * 3. Processes all B@SE tags server-side
 * 4. Returns pre-rendered HTML to the React shell
 * 
 * Supports:
 * - Template override params (templatehead, templatebody, templatefoot)
 * - Thumbs template resolution (thumbs/product/, thumbs/advert/, thumbs/content/)
 * - AJAX partial rendering (render a single include template)
 * - Full Maropost folder→page type mapping
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ════════════════════════════════════════════════════════════════
// Maropost Page Type → Template Path Mapping
// Every page = headers/template.html + {body} + footers/template.html
// ════════════════════════════════════════════════════════════════

/**
 * Exact Maropost folder structure for body templates.
 * Priority order: first match wins.
 */
const PAGE_TYPE_TEMPLATES: Record<string, string[]> = {
  // CMS pages
  home: ["cms/home.template.html"],
  category: ["cms/category.template.html", "cms/default.template.html"],
  content: ["cms/default.template.html"],
  products: ["cms/products.template.html", "cms/category.template.html"],
  search: ["cms/search_results.template.html", "cms/default.template.html"],
  blog: ["cms/default.template.html"],
  "404": ["cms/404.template.html", "cms/default.template.html"],
  store_finder: ["cms/store_finder.template.html", "cms/default.template.html"],
  modal: ["cms/modal.template.html"],

  // Product pages
  product: ["products/template.html"],

  // Cart & checkout
  cart: ["cart/shopping_cart.template.html"],
  cart_empty: ["cart/empty.template.html"],
  checkout: ["cart/onepage.template.html"],
  invoice: ["cart/invoice.template.html"],
  upsell: ["cart/upsell.template.html"],
  voucher: ["cart/voucher.template.html"],
  quote_invoice: ["cart/quote_invoice.template.html"],

  // Customer/account pages
  account: ["customer/template.html"],
  login: ["customer/login.template.html"],
  register: ["customer/register/template.html"],
  logout: ["customer/logout.template.html"],
  forgotpwd: ["customer/forgotpwd/template.html"],
  forgotusr: ["customer/forgotusr/template.html"],
  resetpwd: ["customer/resetpwd/template.html"],
  edit_account: ["customer/edit_account/template.html"],
  edit_address: ["customer/edit_address/template.html"],
  edit_pwd: ["customer/edit_pwd/template.html"],
  view_order: ["customer/view_order/order.template.html", "customer/view_order/template.html"],
  track_order: ["customer/track_order/order.template.html", "customer/track_order/template.html"],
  wishlist: ["customer/wishlist/view.template.html", "customer/wishlist/template.html"],
  favourites: ["customer/favourites/template.html"],
  pay_order: ["customer/pay_order/pay_now_confirm.template.html"],
  write_review: ["customer/write_review/write.template.html"],
  warranty: ["customer/warranty/template.html"],
  wholesaleregister: ["customer/wholesaleregister/template.html"],
  approve_quote: ["customer/approve_quote/template.html"],
  contact: ["cms/default.template.html"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      store_id,
      page_type = "content",
      slug,
      extra_context = {},
      // Template override params (Maropost: ?templatehead=name&templatebody=name&templatefoot=name)
      template_overrides = {},
      // AJAX partial mode: render only a specific include template
      partial_template,
    } = body;

    if (!store_id) {
      return jsonResponse({ error: "store_id required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. Load store + active theme in parallel ──
    const [storeResult, themePackageResult] = await Promise.all([
      supabase.from("stores").select("*").eq("id", store_id).single(),
      supabase.from("theme_packages").select("id, name, is_active").eq("store_id", store_id).eq("is_active", true).single(),
    ]);

    const store = storeResult.data;
    if (!store) return jsonResponse({ error: "Store not found" }, 404);

    const themePackage = themePackageResult.data;
    if (!themePackage) {
      return jsonResponse({ html: "", has_theme: false });
    }

    // ── 2. Load theme files ──
    const { data: themeFiles } = await supabase
      .from("theme_files")
      .select("id, file_name, file_path, folder, content, file_type")
      .eq("theme_id", themePackage.id);

    if (!themeFiles || themeFiles.length === 0) {
      return jsonResponse({ html: "", has_theme: false });
    }

    // ── 3. Build theme file maps (Maropost path resolution) ──
    const fileMap: Record<string, string> = {};
    const includesMap: Record<string, string> = {};
    const cssFiles: { file_name: string; file_path: string; content: string }[] = [];
    const jsFiles: { file_name: string; file_path: string; content: string }[] = [];
    const thumbTemplates: Record<string, string> = {}; // thumbs/product/template.html etc.

    for (const f of themeFiles) {
      const content = f.content || "";

      // Map by multiple path variations for flexible resolution
      fileMap[f.file_path] = content;
      fileMap[`${f.folder}/${f.file_name}`] = content;
      fileMap[f.file_name] = content;

      // Map by all sub-path combinations
      const parts = f.file_path.split("/");
      for (let i = 0; i < parts.length; i++) {
        fileMap[parts.slice(i).join("/")] = content;
      }

      // Build includes map (slug → content) for [%load_template%]
      if (f.folder?.includes("includes") || f.file_path.includes("/includes/")) {
        const includeSlug = f.file_name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
        includesMap[includeSlug] = content;
        // Also map by folder/filename for direct load_template references
        includesMap[`${f.folder}/${f.file_name}`] = content;
        includesMap[f.file_path] = content;
      }

      // Categorize CSS/JS
      if (f.file_name.endsWith(".css")) {
        cssFiles.push({ file_name: f.file_name, file_path: f.file_path, content });
      } else if (f.file_name.endsWith(".js") && f.file_name !== "gulpfile.js") {
        jsFiles.push({ file_name: f.file_name, file_path: f.file_path, content });
      }

      // Build thumbs template map
      if (f.folder?.startsWith("thumbs") || f.file_path.includes("/thumbs/")) {
        const thumbPath = f.file_path.replace(/^.*?thumbs\//, "thumbs/");
        thumbTemplates[thumbPath] = content;
        // Also map by the template name without extension
        const thumbName = f.file_name.replace(/\.template\.html$/, "").replace(/\.html$/, "");
        const thumbFolder = thumbPath.split("/").slice(0, -1).join("/");
        thumbTemplates[`${thumbFolder}/${thumbName}`] = content;
      }
    }

    // ── 4. Load page data in parallel ──
    const themeAssetBaseUrl = `${supabaseUrl}/storage/v1/object/public/theme-assets/${store_id}/${themePackage.id}`;
    const basePath = extra_context?.basePath || "";

    const [categoriesResult, advertsResult, zonesResult, pageData] = await Promise.all([
      supabase.from("categories").select("id, name, slug, parent_id, sort_order, image_url").eq("store_id", store_id).order("sort_order"),
      supabase.from("adverts").select("*").eq("store_id", store_id).eq("is_active", true).order("sort_order"),
      supabase.from("content_zones").select("zone_key, content").eq("store_id", store_id).eq("is_active", true),
      loadPageData(supabase, store_id, page_type, slug),
    ]);

    const categories = categoriesResult.data || [];
    const adverts = advertsResult.data || [];
    const contentZones: Record<string, string> = {};
    for (const z of (zonesResult.data || [])) {
      if (z.zone_key && z.content) contentZones[z.zone_key] = z.content;
    }

    // ── 5. Build template context ──
    const ctx: Record<string, any> = {
      store: { ...store, name: store.name, currency: store.default_currency || "AUD" },
      includes: includesMap,
      themeFiles: fileMap,
      thumbTemplates,
      themeAssetBaseUrl,
      categories,
      baseUrl: store.custom_domain ? `https://${store.custom_domain}` : "",
      basePath,
      pageType: page_type,
      queryParams: extra_context?.queryParams || {},
      contentZones,
      adverts,
      products: pageData.products,
      product: pageData.product || undefined,
      content: pageData.contentPage || undefined,
      thumblist: pageData.products,
      ...(extra_context || {}),
    };

    // ── 6. AJAX Partial Mode ──
    if (partial_template) {
      const partialContent = resolvePartialTemplate(themeFiles, fileMap, includesMap, partial_template);
      if (!partialContent) {
        return jsonResponse({ error: `Partial template "${partial_template}" not found`, has_theme: true, partial_html: "" });
      }
      const renderedPartial = renderTemplate(partialContent, ctx);
      return jsonResponse({
        has_theme: true,
        partial_html: rewriteAssetUrls(renderedPartial, themeAssetBaseUrl),
        partial_template,
      });
    }

    // ── 7. Resolve header/body/footer templates (with override support) ──
    const headerTemplate = resolveHeaderFooterTemplate(
      themeFiles, "headers", template_overrides?.templatehead
    );
    const footerTemplate = resolveHeaderFooterTemplate(
      themeFiles, "footers", template_overrides?.templatefoot
    );
    const bodyTemplate = resolveBodyTemplate(
      themeFiles, page_type, slug, template_overrides?.templatebody
    );

    if (!headerTemplate && !footerTemplate && !bodyTemplate) {
      return jsonResponse({ html: "", has_theme: false });
    }

    // ── 8. Render all 3 templates (Maropost SSR pipeline) ──
    const renderedHeader = headerTemplate ? renderTemplate(headerTemplate.content || "", ctx) : "";
    const renderedBody = bodyTemplate ? renderTemplate(bodyTemplate.content || "", ctx) : "";
    const renderedFooter = footerTemplate ? renderTemplate(footerTemplate.content || "", ctx) : "";

    // ── 9. Extract <head> content from header, clean up structural tags ──
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

    // ── 10. Rewrite asset URLs ──
    headerBody = rewriteAssetUrls(headerBody, themeAssetBaseUrl);
    const rewrittenBody = rewriteAssetUrls(renderedBody, themeAssetBaseUrl);
    footerBody = rewriteAssetUrls(footerBody, themeAssetBaseUrl);

    // ── 11. Build CSS link tags ──
    const cssLinkTags = cssFiles.map(f =>
      `<link rel="stylesheet" href="${themeAssetBaseUrl}/${f.file_path}" data-theme-css="${f.file_name}" />`
    ).join("\n");

    return jsonResponse({
      has_theme: true,
      head_content: headContent,
      header_html: headerBody,
      body_html: rewrittenBody,
      footer_html: footerBody,
      css_link_tags: cssLinkTags,
      css_inline: cssFiles.map(f => ({ name: f.file_name, content: f.content })),
      js_files: jsFiles.map(f => ({ name: f.file_name, content: f.content })),
      theme_asset_base_url: themeAssetBaseUrl,
      store_name: store.name,
      page_type,
    }, 200, { "Cache-Control": "public, max-age=60, s-maxage=300" });
  } catch (err) {
    console.error("render-page error:", err);
    return jsonResponse({ error: String(err), has_theme: false }, 500);
  }
});

// ════════════════════════════════════════════════════════════════
// Helper: JSON response with CORS
// ════════════════════════════════════════════════════════════════

function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

// ════════════════════════════════════════════════════════════════
// Template Resolution — Exact Maropost Conventions
// ════════════════════════════════════════════════════════════════

/**
 * Resolve a header or footer template.
 * Maropost convention: headers/template.html (primary), headers/empty.template.html (minimal)
 * Override: ?templatehead=name → headers/{name}.template.html
 */
function resolveHeaderFooterTemplate(
  files: any[],
  folder: "headers" | "footers",
  override?: string
): any | null {
  const candidates = files.filter(
    (f) => matchesFolder(f, folder) && f.file_name?.endsWith(".html")
  );

  // Override: look for {override}.template.html or {override}.html
  if (override) {
    const overrideNames = [
      `${override}.template.html`,
      `${override}.html`,
      override,
    ];
    for (const name of overrideNames) {
      const found = candidates.find(f => f.file_name === name);
      if (found) return found;
    }
  }

  // Default: template.html
  return (
    candidates.find(f => f.file_name === "template.html") ||
    candidates.find(f => f.file_name.includes("template")) ||
    candidates[0] ||
    null
  );
}

/**
 * Resolve the body template for a given page type.
 * Uses the exact Maropost folder→page type mapping.
 * Override: ?templatebody=name → cms/{name}.template.html (or products/{name}.template.html etc.)
 */
function resolveBodyTemplate(
  files: any[],
  pageType: string,
  slug?: string,
  override?: string
): any | null {
  // Override: try to find the named template in relevant folders
  if (override) {
    const overridePaths = [
      `cms/${override}.template.html`,
      `products/${override}.template.html`,
      `cart/${override}.template.html`,
      `customer/${override}.template.html`,
      `customer/${override}/template.html`,
      `${override}.template.html`,
      `${override}.html`,
    ];
    for (const path of overridePaths) {
      const found = findFileByPath(files, path);
      if (found) return found;
    }
  }

  // Use the page type → template path mapping
  const templatePaths = PAGE_TYPE_TEMPLATES[pageType] || PAGE_TYPE_TEMPLATES.content;

  for (const path of templatePaths) {
    const found = findFileByPath(files, path);
    if (found) return found;
  }

  // Fallback: cms/default.template.html
  return findFileByPath(files, "cms/default.template.html");
}

/**
 * Find a file by its path (flexible matching like Maropost).
 * Matches: exact path, folder/filename, templates/path, any suffix match.
 */
function findFileByPath(files: any[], path: string): any | null {
  const lowerPath = path.toLowerCase();
  return files.find(f => {
    const fp = (f.file_path || "").toLowerCase();
    return (
      fp === lowerPath ||
      fp.endsWith(`/${lowerPath}`) ||
      fp.endsWith(`/templates/${lowerPath}`) ||
      `${f.folder}/${f.file_name}`.toLowerCase() === lowerPath
    );
  }) || null;
}

/**
 * Check if a file belongs to a given folder.
 */
function matchesFolder(f: any, folder: string): boolean {
  return (
    f.folder?.toLowerCase() === folder ||
    f.file_path?.toLowerCase().includes(`/${folder}/`) ||
    f.file_path?.toLowerCase().startsWith(`${folder}/`)
  );
}

/**
 * Resolve a partial template for AJAX rendering.
 * Searches includes/ subfolders first, then all theme files.
 */
function resolvePartialTemplate(
  files: any[],
  fileMap: Record<string, string>,
  includesMap: Record<string, string>,
  partialPath: string
): string | null {
  // Direct path match
  if (fileMap[partialPath]) return fileMap[partialPath];

  // Try with templates/ prefix
  if (fileMap[`templates/${partialPath}`]) return fileMap[`templates/${partialPath}`];

  // Try includes map by slug
  const slug = partialPath.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  if (includesMap[slug]) return includesMap[slug];

  // Fuzzy match by filename
  const fileName = partialPath.split("/").pop()?.toLowerCase();
  if (fileName) {
    const found = files.find(f => f.file_name.toLowerCase() === fileName);
    if (found) return found.content || "";
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
// Page Data Loading
// ════════════════════════════════════════════════════════════════

async function loadPageData(supabase: any, storeId: string, pageType: string, slug?: string) {
  let product: any = null;
  let products: any[] = [];
  let contentPage: any = null;

  const productListTypes = ["home", "category", "products", "search"];
  const contentTypes = ["content", "blog", "contact"];

  // Load product for product detail page
  if (pageType === "product" && slug) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single();
    if (data) product = data;
  }

  // Load product listings
  if (productListTypes.includes(pageType)) {
    const query = supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(24);

    const { data } = await query;
    if (data) products = data;
  }

  // Load content page - also load for "home" to get [@page_content@]
  if (pageType === "home") {
    const { data } = await supabase
      .from("content_pages")
      .select("*")
      .eq("store_id", storeId)
      .eq("slug", "home")
      .single();
    if (data) contentPage = data;
  } else if (contentTypes.includes(pageType) && slug) {
    const { data } = await supabase
      .from("content_pages")
      .select("*")
      .eq("store_id", storeId)
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single();
    if (data) contentPage = data;
  }

  return { product, products, contentPage };
}

// ════════════════════════════════════════════════════════════════
// Asset URL Rewriting
// ════════════════════════════════════════════════════════════════

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

function resolveStorageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return url;
}

// ════════════════════════════════════════════════════════════════
// B@SE Template Engine — Server-Side (Full Maropost Compatibility)
// ════════════════════════════════════════════════════════════════

// ── Format pipes ──
function applyFormat(value: any, format: string): string {
  if (value === null || value === undefined) return "";
  switch (format) {
    case "currency": return `$${Number(value).toFixed(2)}`;
    case "currency_no_symbol": return Number(value).toFixed(2);
    case "integer": return Math.round(Number(value)).toString();
    case "number": { const n = Number(value); return isNaN(n) ? String(value) : n.toLocaleString(); }
    case "decimal": return Number(value).toFixed(2);
    case "date": return new Date(value).toLocaleDateString();
    case "datetime": return new Date(value).toLocaleString();
    case "date_short": return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "uppercase": return String(value).toUpperCase();
    case "lowercase": return String(value).toLowerCase();
    case "capitalize": return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    case "url_encode": return encodeURIComponent(String(value));
    case "strip_html": return String(value).replace(/<[^>]*>/g, "");
    case "truncate_50": return String(value).length > 50 ? String(value).slice(0, 50) + "…" : String(value);
    case "truncate_100": return String(value).length > 100 ? String(value).slice(0, 100) + "…" : String(value);
    case "percentage": return `${Number(value)}%`;
    case "json": return JSON.stringify(value);
    case "nl2br": return String(value).replace(/\n/g, "<br>");
    default: return String(value);
  }
}

// ── Resolve config values: [@config:key@] ──
function resolveConfig(key: string, ctx: Record<string, any>): string {
  const k = key.toLowerCase();
  const store = ctx.store || {};
  const configMap: Record<string, () => string> = {
    company_name: () => store.name || "",
    website_name: () => store.name || "",
    store_name: () => store.name || "",
    home_url: () => ctx.basePath || ctx.baseUrl || "/",
    canonical_url: () => ctx.baseUrl || ctx.basePath || "",
    current_page_type: () => ctx.pageType || "content",
    templatelang: () => "en-AU",
    template_lang: () => "en-AU",
    neto_css_version: () => Date.now().toString(),
    google_verification: () => store.google_verification || "",
    related_limit: () => "8",
    store_currency: () => store.default_currency || store.currency || "AUD",
    defaultcurrency: () => store.default_currency || store.currency || "AUD",
    currency_symbol: () => store.currency_symbol || "$",
    contact_email: () => store.contact_email || "",
    phone: () => store.phone || "",
    address: () => store.address || "",
    logo_url: () => store.logo_url || "",
    logo: () => store.logo_url || "",
    show_home_ads: () => "1",
    show_home_categories: () => "1",
    show_home_products: () => "1",
    show_price: () => "1",
    show_rrp: () => "1",
    show_addcart: () => "1",
    show_wishlist: () => "1",
    show_compare: () => "1",
    show_reviews: () => "1",
    show_shipping_calculator: () => "1",
    show_breadcrumbs: () => "1",
    show_qty: () => "1",
    show_brand: () => "1",
    show_sku: () => "1",
    show_stock: () => "1",
    show_save: () => "1",
    show_tax_info: () => "0",
    tax_label: () => store.tax_label || "inc. GST",
    tax_rate: () => store.tax_rate || "10",
    assets_url: () => ctx.themeAssetBaseUrl || "/assets",
    allow_nostock_checkout: () => store.allow_nostock_checkout || "0",
    webstore_use_preorder_quantity: () => store.webstore_use_preorder_quantity || "0",
    items_per_page: () => store.items_per_page || "24",
    default_sort: () => store.default_sort || "relevance",
    free_shipping_threshold: () => store.free_shipping_threshold || "0",
    shipping_from: () => store.shipping_from || store.address || "",
    social_facebook: () => store.social_facebook || "",
    social_twitter: () => store.social_twitter || "",
    social_instagram: () => store.social_instagram || "",
    social_youtube: () => store.social_youtube || "",
    social_pinterest: () => store.social_pinterest || "",
    social_google_plus: () => "",
    social_tumblr: () => "",
    social_linkedin: () => store.social_linkedin || "",
    social_tiktok: () => store.social_tiktok || "",
    abn: () => store.abn || "",
    company_abn: () => store.abn || store.company_abn || "",
    copyright_year: () => new Date().getFullYear().toString(),
    cart_url: () => `${ctx.basePath || ""}/cart`,
    checkout_url: () => `${ctx.basePath || ""}/checkout`,
    account_url: () => `${ctx.basePath || ""}/account`,
    wishlist_url: () => `${ctx.basePath || ""}/wishlist`,
    compare_url: () => `${ctx.basePath || ""}/compare`,
    login_url: () => `${ctx.basePath || ""}/login`,
    register_url: () => `${ctx.basePath || ""}/register`,
    search_url: () => `${ctx.basePath || ""}/products`,
    cart_count: () => ctx.cart?.totalItems?.toString() || ctx.cart_items?.length?.toString() || "0",
    cart_total: () => ctx.cart?.totalPrice ? `$${Number(ctx.cart.totalPrice).toFixed(2)}` : "$0.00",
    cart_subtotal: () => ctx.cart?.totalPrice ? `$${Number(ctx.cart.totalPrice).toFixed(2)}` : "$0.00",
    is_logged_in: () => ctx.customer ? "1" : "0",
    customer_name: () => ctx.customer?.name || "",
    customer_email: () => ctx.customer?.email || "",
    customer_first_name: () => ctx.customer?.name?.split(" ")[0] || "",
  };
  return configMap[k]?.() ?? store[k] ?? store[key] ?? "";
}

// ── Resolve field from context ──
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
  if (field.startsWith("data:")) {
    const dataKey = field.replace("data:", "");
    return ctx[`data:${dataKey}`] || ctx[dataKey] || "";
  }

  const p = ctx.product;
  const productFields: Record<string, () => any> = {
    title: () => p?.title,
    name: () => p?.title || p?.name,
    sku: () => p?.sku, SKU: () => p?.sku,
    inventory_id: () => p?.id, product_id: () => p?.id,
    price: () => p?.price, store_price: () => p?.price, retail_price: () => p?.price,
    price_inc: () => p?.price,
    price_ex: () => { const pr = Number(p?.price || 0); const rate = Number(ctx.store?.tax_rate || 10); return (pr / (1 + rate / 100)).toFixed(2); },
    cost_price: () => p?.cost_price,
    compare_at_price: () => p?.compare_at_price,
    rrp: () => p?.compare_at_price || p?.price,
    rrp_inc: () => p?.compare_at_price || p?.price,
    rrp_ex: () => { const pr = Number(p?.compare_at_price || p?.price || 0); const rate = Number(ctx.store?.tax_rate || 10); return (pr / (1 + rate / 100)).toFixed(2); },
    description: () => p?.description, short_description: () => p?.short_description,
    brand: () => p?.brand, barcode: () => p?.barcode,
    model_number: () => p?.model_number, model: () => p?.model_number || p?.title,
    status: () => p?.status, slug: () => p?.slug,
    subtitle: () => p?.subtitle, headline: () => p?.title,
    features: () => p?.features, specifications: () => p?.specifications,
    warranty: () => p?.warranty,
    seo_title: () => p?.seo_title, seo_description: () => p?.seo_description,
    promo_price: () => p?.promo_price, promo_tag: () => p?.promo_tag,
    image_url: () => resolveStorageUrl(p?.images?.[0]) || "",
    thumb: () => resolveStorageUrl(p?.images?.[0]) || "",
    thumb_url: () => resolveStorageUrl(p?.images?.[0]) || "",
    image_1: () => p?.images?.[0], image_2: () => p?.images?.[1], image_3: () => p?.images?.[2],
    image_count: () => p?.images?.length || 0,
    store_quantity: () => p?.stock_on_hand ?? 10,
    available_quantity: () => p?.stock_on_hand ?? 10,
    stock_on_hand: () => p?.stock_on_hand ?? 10,
    URL: () => `${ctx.basePath || ""}/product/${p?.slug || p?.id}`,
    url: () => `${ctx.basePath || ""}/product/${p?.slug || p?.id}`,
    add_to_cart_url: () => "#",
    wishlist_url: () => `${ctx.basePath || ""}/wishlist`,
    compare_url: () => `${ctx.basePath || ""}/compare`,
    savings: () => { const c = p?.compare_at_price, pr = p?.price; return c && pr ? Number(c) - Number(pr) : 0; },
    save: () => { const c = p?.compare_at_price, pr = p?.price; return c && pr ? Math.round((1 - Number(pr) / Number(c)) * 100) : 0; },
    savings_percent: () => { const c = p?.compare_at_price, pr = p?.price; return c && pr ? Math.round((1 - Number(pr) / Number(c)) * 100) : 0; },
    save_percent: () => { const c = p?.compare_at_price, pr = p?.price; return c && pr ? Math.round((1 - Number(pr) / Number(c)) * 100) : 0; },
    has_variants: () => (p?.variant_count || 0) > 0,
    variant_count: () => p?.variant_count || 0,
    has_child: () => (p?.has_variants || (p?.variant_count || 0) > 0) ? 1 : 0,
    has_variation: () => (p?.has_variants || (p?.variant_count || 0) > 0) ? 1 : 0,
    has_components: () => p?.is_kit ? 1 : 0,
    has_promo: () => { if (!p?.promo_price) return false; const now = new Date(); return (!p.promo_start || new Date(p.promo_start) <= now) && (!p.promo_end || new Date(p.promo_end) >= now); },
    inpromo: () => {
      // Check both promo_price AND compare_at_price > price for sale detection
      if (p?.promo_price) { const now = new Date(); return (!p.promo_start || new Date(p.promo_start) <= now) && (!p.promo_end || new Date(p.promo_end) >= now) ? 1 : 0; }
      if (p?.compare_at_price && p?.price && Number(p.compare_at_price) > Number(p.price)) return 1;
      return 0;
    },
    promo_price: () => p?.promo_price || (p?.compare_at_price && p?.price && Number(p.compare_at_price) > Number(p.price) ? p.price : ""),
    retail: () => p?.compare_at_price || p?.price || 0,
    retail_price: () => p?.compare_at_price || p?.price || 0,
    reviews: () => p?.review_count || 0,
    rating: () => p?.average_rating || 0,
    "data:rating": () => p?.average_rating || 0,
    "data:ratings-count": () => p?.review_count || 0,
    min_qty: () => p?.minimum_quantity || p?.min_qty || 0,
    max_qty: () => p?.maximum_quantity || p?.max_qty || 0,
    multiplier_qty: () => p?.multiplier_quantity || p?.multiplier_qty || 0,
    editable_bundle: () => p?.is_kit ? 1 : 0,
    preorder: () => p?.preorder ? 1 : 0,
    current_sku: () => p?.sku || "",
    store_name: () => ctx.store?.name,
    store_currency: () => ctx.store?.currency,
    page_title: () => ctx.content?.title || ctx.store?.name || "",
    page_content: () => ctx.content?.content || ctx.content?.description || "",
    content_name: () => ctx.content?.name || ctx.content?.title || "",
    category_name: () => ctx.content?.name || ctx.content?.title || "",
    category_description: () => ctx.content?.description || "",
    total_showing: () => String((ctx.products || ctx.adverts || []).length),
    rndm: () => Math.random().toString(36).substring(2, 8),
  };

  const resolver = productFields[field];
  if (resolver) return resolver();
  if (ctx[field] !== undefined) return ctx[field];
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
  // [%END keyword%] → [%/keyword%]
  t = t.replace(/\[%\s*END\s+([A-Za-z_]+)\s*%\]/gi, "[%/$1%]");
  // [%/ keyword%] or [% / keyword %] → [%/keyword%]
  t = t.replace(/\[%\s*\/\s*([A-Za-z_]+)\s*%\]/g, "[%/$1%]");
  // [%/keyword%%] → [%/keyword%]
  t = t.replace(/\[%\/([A-Za-z_]+)%%\]/g, "[%/$1%]");
  return t;
}

function stripComments(t: string): string {
  return t.replace(/\[%\*[\s\S]*?\*%\]/g, "");
}

// ── Process load_template ──
function processLoadTemplate(template: string, ctx: Record<string, any>, depth = 0): string {
  if (depth > 10) return template;
  // Handle both [%load_template%] and [%load_ajax_template%]
  return template.replace(/\[%load_(?:ajax_)?template\s+(?:file:\s*)?(['"])([^'"]+)\1[^%]*\/?%\]/gi, (_, _q: string, filePath: string) => {
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

// Handle [%load_ajax_template .../%] self-closing with attributes
function processLoadAjaxTemplate(template: string, ctx: Record<string, any>): string {
  return template.replace(/\[%load_ajax_template\s+([^\]]*?)\/?%\]/gi, (_, attrs: string) => {
    const templateName = attrs.match(/template:'([^']+)'/i)?.[1];
    const type = attrs.match(/type:'([^']+)'/i)?.[1] || "item";
    if (!templateName) return `<!-- load_ajax_template: no template name -->`;
    
    const files = ctx.themeFiles || {};
    // Try various paths
    const paths = [
      `products/includes/${templateName}.template.html`,
      `templates/products/includes/${templateName}.template.html`,
      `${templateName}.template.html`,
      `includes/${templateName}.template.html`,
    ];
    for (const p of paths) {
      if (files[p]) return files[p];
    }
    // Fuzzy match
    const lower = templateName.toLowerCase();
    for (const key of Object.keys(files)) {
      if (key.toLowerCase().includes(lower) && key.toLowerCase().includes("template")) {
        return files[key];
      }
    }
    return `<!-- load_ajax_template "${templateName}" not found -->`;
  });
}

function processLegacyIncludes(t: string, ctx: Record<string, any>, depth = 0): string {
  if (depth > 5) return t;
  return t.replace(/\[!include\s+([\w\-]+)!\]/g, (_, slug: string) => {
    return ctx.includes?.[slug] ? processLegacyIncludes(ctx.includes[slug], ctx, depth + 1) : "";
  });
}

function processThemeAssets(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%ntheme_asset%\]([\s\S]*?)\[%\/ntheme_asset%\]/gi, (_, path: string) => {
    return ctx.themeAssetBaseUrl ? `${ctx.themeAssetBaseUrl}/${path.trim()}` : path.trim();
  });
}

function processCacheBlocks(t: string): string {
  return t.replace(/\[%\/?cache[^\]]*%\]/gi, "");
}

// ── URL tags ──
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
    case "checkout": url += fn === "payment" ? "/checkout" : "/cart"; break;
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

// ── Format blocks ──
function processFormatBlocks(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%(?:format|FORMAT)\s+([^\]]*?)%\]([\s\S]*?)\[%\/(?:format|FORMAT)%\]/gi, (_, attrs: string, content: string) => {
    const type = attrs.match(/type:'(\w+)'/i)?.[1] || "date";
    if (type === "currency") { const num = parseFloat(content.trim()); return !isNaN(num) ? `$${num.toFixed(2)}` : content.trim(); }
    if (type === "date") {
      const val = content.trim();
      if (!val || val === "0000-00-00 00:00:00") return "";
      if (val === "now" || val === "NOW") return new Date().toLocaleDateString();
      try { return new Date(val).toLocaleDateString(); } catch { return val; }
    }
    if (type === "percent" || type === "percentage") { const num = parseFloat(content.trim()); return !isNaN(num) ? `${Math.round(num)}%` : content.trim(); }
    if (type === "number") { const num = parseFloat(content.trim()); return !isNaN(num) ? num.toLocaleString() : content.trim(); }
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

function processNoHtml(t: string): string {
  return t.replace(/\[%nohtml%\]([\s\S]*?)\[%\/nohtml%\]/gi, (_, c: string) => c.replace(/<[^>]*>/g, ""));
}

// ── Conditionals ──
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

      let cond = pos.condition.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_: string, field: string, fmt?: string) => {
        const v = resolveField(field, ctx);
        if (v == null) return "";
        return fmt ? applyFormat(v, fmt) : String(v);
      });

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
  if (/\s+OR\s+/i.test(cond)) return cond.split(/\s+OR\s+/i).some(p => evalCond(p.trim(), ctx));
  if (/\s+AND\s+/i.test(cond)) return cond.split(/\s+AND\s+/i).every(p => evalCond(p.trim(), ctx));
  if (cond.includes("||")) return cond.split("||").some(p => evalCond(p.trim(), ctx));
  if (cond.includes("&&")) return cond.split("&&").every(p => evalCond(p.trim(), ctx));

  const comp = cond.match(/^(.+?)\s+(eq|ne|!=|==|>=|<=|>|<)\s+(.+)$/i) || cond.match(/^(.+?)\s*(!=|==|>=|<=|>|<)\s*(.+)$/);
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

// ── Value tags ──
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

// ── Inline tags ──
function processInlineTags(t: string, ctx: Record<string, any>): string {
  let r = t;
  r = r.replace(/\[%rndm%\]/gi, () => Math.random().toString(36).substring(2, 8));
  r = r.replace(/\[%now%\]/gi, () => new Date().toISOString());
  r = r.replace(/\[%today%\]/gi, () => new Date().toLocaleDateString());
  r = r.replace(/\[%year%\]/gi, () => new Date().getFullYear().toString());
  r = r.replace(/\[%config:([^\]%]+)%\]/gi, (_, k: string) => resolveConfig(k.trim(), ctx));
  return r;
}

// ── Set variables ──
function processSetVars(t: string, ctx: Record<string, any>): string {
  if (!(ctx as any).__variables) (ctx as any).__variables = {};
  return t.replace(/\[%set\s+\[@([\w:.]+)@\]\s*%\]([\s\S]*?)\[%\/set%\]/gi, (_, name: string, value: string) => {
    (ctx as any).__variables[name] = value.trim();
    return "";
  });
}

// ── Resolve [%asset_url%] blocks (critical for Maropost themes) ──
function processAssetUrlBlocks(t: string, ctx: Record<string, any>): string {
  let result = t;

  // Block variant: [%asset_url type:'...' id:'...'%][%param default%]fallback[%end param%][%/asset_url%]
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:\/asset_url|END\s+asset_url|end\s+asset_url)%\]/gi,
    (_, attrs: string, innerContent: string) => {
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        return String(resolveField(field, ctx) || "");
      });
      const resolved = resolveAssetUrl(resolvedAttrs, ctx);
      if (resolved) return resolved;
      // Extract fallback from [%param default%]...[%end param%] or [%/param%]
      const fallbackMatch = innerContent.match(/\[%param\s+default%\]([\s\S]*?)\[%(?:end\s+param|\/param)%\]/i);
      if (fallbackMatch) {
        let fb = fallbackMatch[1].replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1").trim();
        return fb || "/placeholder.svg";
      }
      return resolved || "/placeholder.svg";
    }
  );

  // Self-closing variant: [%asset_url type:'...' id:'...'/%]
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)\/\s*%\]/gi,
    (_, attrs: string) => {
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        return String(resolveField(field, ctx) || "");
      });
      return resolveAssetUrl(resolvedAttrs, ctx);
    }
  );

  return result;
}

function resolveAssetUrl(attrs: string, ctx: Record<string, any>, item?: any): string {
  const typeMatch = attrs.match(/type:'(\w+)'/i);
  const idMatch = attrs.match(/id:'([^']+)'/i);
  const defaultMatch = attrs.match(/default:'([^']+)'/i);
  const type = (typeMatch?.[1] || "").toLowerCase();
  let id = idMatch?.[1] || "";
  
  // Resolve any remaining [@...@] in id
  id = id.replace(/\[@(\w+)@\]/gi, (_, field: string) => {
    if (item && item[field] !== undefined) return String(item[field]);
    return String(resolveField(field, ctx) || "");
  });

  const defaultUrl = defaultMatch?.[1] || "";
  const assetBase = ctx.themeAssetBaseUrl || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const storeId = ctx.store?.id || "";

  switch (type) {
    case "adw": case "ad": case "advert": {
      if (item?.image_url && item.image_url.startsWith("http")) return item.image_url;
      const ad = (ctx.adverts || []).find((a: any) => a.id === id || String(a.ad_id) === id);
      if (ad?.image_url) return ad.image_url.startsWith("http") ? ad.image_url : `${supabaseUrl}/storage/v1/object/public/store-assets/${storeId}/marketing/${id}.webp`;
      if (id && storeId) return `${supabaseUrl}/storage/v1/object/public/store-assets/${storeId}/marketing/${id}.webp`;
      return defaultUrl || "/placeholder.svg";
    }
    case "content": case "category": {
      if (item?.image_url && item.image_url.startsWith("http")) return item.image_url;
      const cat = (ctx.categories || []).find((c: any) => c.id === id || String(c.content_id) === id);
      if (cat?.image_url) return cat.image_url.startsWith("http") ? cat.image_url : `${supabaseUrl}/storage/v1/object/public/product-images/${cat.image_url}`;
      // Maropost convention: /assets/webshop/cms/{last2digits}/{id}.webp
      if (id && storeId) {
        const numId = parseInt(id) || 0;
        const last2 = String(numId % 100).padStart(2, "0");
        return `${supabaseUrl}/storage/v1/object/public/store-assets/${storeId}/cms/${last2}/${numId}.webp`;
      }
      return defaultUrl || "/placeholder.svg";
    }
    case "product": {
      if (item?.images?.[0]) {
        const img = item.images[0];
        return img.startsWith("http") ? img : `${supabaseUrl}/storage/v1/object/public/product-images/${img}`;
      }
      if (item?.image_url) return item.image_url;
      const prod = (ctx.products || []).find((p: any) => p.id === id || p.sku === id);
      if (prod?.images?.[0]) {
        const img = prod.images[0];
        return img.startsWith("http") ? img : `${supabaseUrl}/storage/v1/object/public/product-images/${img}`;
      }
      return defaultUrl || "/placeholder.svg";
    }
    case "logo":
      if (ctx.store?.logo_url) return ctx.store.logo_url;
      if (assetBase) return `${assetBase}/img/logo.png`;
      return defaultUrl || "";
    default:
      if (id && assetBase) return `${assetBase}/${id}`;
      return defaultUrl || "";
  }
}

// ── Process [%filter ID:'key'%][%/filter%] ──
function processFilterTags(t: string, ctx: Record<string, any>): string {
  // Block variant
  let result = t.replace(/\[%filter\s+([^\]]*?)%\]([\s\S]*?)\[%\/filter%\]/gi, (_, attrs: string) => {
    const id = attrs.match(/ID:'([^']+)'/i)?.[1] || attrs.match(/id:'([^']+)'/i)?.[1] || "";
    return ctx.queryParams?.[id] || "";
  });
  // Self-closing variant
  result = result.replace(/\[%filter\s+([^\]]*?)\/%\]/gi, (_, attrs: string) => {
    const id = attrs.match(/ID:'([^']+)'/i)?.[1] || attrs.match(/id:'([^']+)'/i)?.[1] || "";
    return ctx.queryParams?.[id] || "";
  });
  return result;
}

// ── Process item asset_url tags within rendered item HTML ──
function processItemAssetUrls(html: string, ctx: Record<string, any>, item: any): string {
  let result = html;
  // Block variant within items
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:\/asset_url|END\s+asset_url|end\s+asset_url)%\]/gi,
    (_, attrs: string, innerContent: string) => {
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        if (item && item[field] !== undefined) return String(item[field]);
        return String(resolveField(field, ctx) || "");
      });
      const resolved = resolveAssetUrl(resolvedAttrs, ctx, item);
      if (resolved && resolved !== "/placeholder.svg") return resolved;
      const fallbackMatch = innerContent.match(/\[%param\s+default%\]([\s\S]*?)\[%(?:end\s+param|\/param)%\]/i);
      if (fallbackMatch) {
        return fallbackMatch[1].replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1").trim() || "/placeholder.svg";
      }
      return resolved || "/placeholder.svg";
    }
  );
  // Self-closing variant within items
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)\/\s*%\]/gi,
    (_, attrs: string) => {
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        if (item && item[field] !== undefined) return String(item[field]);
        return String(resolveField(field, ctx) || "");
      });
      return resolveAssetUrl(resolvedAttrs, ctx, item);
    }
  );
  return result;
}

// ── System tags (thumb_list, content_menu, advert, breadcrumb, etc.) ──
function processSystemTags(t: string, ctx: Record<string, any>): string {
  let result = t;

  // ── content_zone ──
  result = result.replace(/\[%content_zone\s+([^\]]*?)\/?%\](?:[\s\S]*?\[%(?:\/content_zone|end\s+content_zone)%\])?/gi, (_, attrs: string) => {
    const id = attrs.match(/id:'([^']+)'/i)?.[1] || "";
    return ctx.contentZones?.[id] || "";
  });

  // ── filter tags ──
  result = processFilterTags(result, ctx);

  // ── asset_url blocks (must run before thumb_list/advert so inner templates have resolved URLs) ──
  result = processAssetUrlBlocks(result, ctx);

  // ── thumb_list (with thumbs template support) ──
  result = result.replace(/\[%thumb_list\s+([^\]]*?)%\]([\s\S]*?)\[%\/thumb_list%\]/gi, (_fullMatch, attrs: string, content: string) => {
    const thumbType = attrs.match(/type:'([^']*)'/i)?.[1] || "products";
    
    // Get the right items based on type
    let items: any[] = [];
    const bp = ctx.basePath || "";
    
    if (thumbType === "products" || thumbType === "product") {
      items = ctx.products || ctx.thumblist || [];
    } else if (thumbType === "category" || thumbType === "categories") {
      items = ctx.categories || [];
    }
    
    if (items.length === 0) {
      return content.match(/\[%param\s+\*?ifempty%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    }

    // Resolve thumb template from thumbs/ folder
    const templateName = attrs.match(/template:'([^']*)'/i)?.[1];
    let bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";

    if (templateName !== undefined && ctx.thumbTemplates) {
      const thumbFolder = (thumbType === "products" || thumbType === "product") ? "product" : thumbType === "content" ? "content" : "product";
      const thumbPaths = [
        `thumbs/${thumbFolder}/${templateName || "template"}.template.html`,
        `thumbs/${thumbFolder}/${templateName || "template"}.html`,
        `thumbs/${thumbFolder}/template.html`,
      ];
      for (const tp of thumbPaths) {
        if (ctx.thumbTemplates[tp]) {
          bodyTpl = ctx.thumbTemplates[tp];
          break;
        }
      }
    }

    // Fallback: try to find thumbs/product/box.template.html for product lists
    if (!bodyTpl && ctx.thumbTemplates && (thumbType === "products" || thumbType === "product")) {
      const fallbackPaths = [
        "thumbs/product/box.template.html",
        "thumbs/product/template.template.html",
        "thumbs/product/template.html",
      ];
      for (const tp of fallbackPaths) {
        if (ctx.thumbTemplates[tp]) {
          bodyTpl = ctx.thumbTemplates[tp];
          break;
        }
      }
    }

    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const limit = parseInt(attrs.match(/limit:'(\d+)'/i)?.[1] || "24");

    let html = header;
    bodyTpl = normalizeTemplateSyntax(bodyTpl);
    items.slice(0, limit).forEach((p: any, idx: number) => {
      const item = (thumbType === "category" || thumbType === "categories")
        ? buildCategoryItem(p, idx, bp)
        : buildProductItem(p, idx, bp);
      const itemCtx = { ...ctx, product: p, ...item };
      let row = bodyTpl;
      row = processFormatBlocks(row, itemCtx);
      row = processItemAssetUrls(row, ctx, item);
      row = processConditionals(row, itemCtx);
      row = processValueTags(row, itemCtx);
      html += row;
    });
    html += footer;
    return html;
  });

  // ── advert (with thumbs template support) ──
  result = result.replace(/\[%advert\s+([^\]]*?)%\]([\s\S]*?)\[%\/advert%\]/gi, (_, attrs: string, content: string) => {
    const advertType = attrs.match(/type:'([^']*)'/i)?.[1] || "";
    
    // type:'product' means show products, not adverts
    if (advertType === "product") {
      const items = ctx.products || [];
      if (items.length === 0) return content.match(/\[%param\s+\*?ifempty%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
      
      const templateName = attrs.match(/template:'([^']*)'/i)?.[1];
      let bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
      
      if (templateName !== undefined && ctx.thumbTemplates) {
        const thumbPaths = [
          `thumbs/product/${templateName || "template"}.template.html`,
          `thumbs/product/${templateName || "box"}.template.html`,
          `thumbs/product/box.template.html`,
          `thumbs/product/template.html`,
        ];
        for (const tp of thumbPaths) {
          if (ctx.thumbTemplates[tp]) { bodyTpl = ctx.thumbTemplates[tp]; break; }
        }
      }
      if (!bodyTpl && ctx.thumbTemplates) {
        const fallbackPaths = ["thumbs/product/box.template.html", "thumbs/product/template.html"];
        for (const tp of fallbackPaths) {
          if (ctx.thumbTemplates[tp]) { bodyTpl = ctx.thumbTemplates[tp]; break; }
        }
      }
      
      const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
      const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
      const limit = parseInt(attrs.match(/limit:'(\d+)'/i)?.[1] || "12");
      const bp = ctx.basePath || "";
      
      let html = header;
      bodyTpl = normalizeTemplateSyntax(bodyTpl);
      items.slice(0, limit).forEach((p: any, idx: number) => {
        const item = buildProductItem(p, idx, bp);
        const itemCtx = { ...ctx, product: p, ...item };
        let row = bodyTpl;
        row = processFormatBlocks(row, itemCtx);
        row = processItemAssetUrls(row, ctx, item);
        row = processConditionals(row, itemCtx);
        row = processValueTags(row, itemCtx);
        html += row;
      });
      html += footer;
      return html;
    }
    
    // Regular advert rendering
    const ads = ctx.adverts || [];
    if (ads.length === 0) return content.match(/\[%param\s+\*?ifempty%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";

    const templateName = attrs.match(/template:'([^']*)'/i)?.[1];
    let bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";

    if (templateName !== undefined && ctx.thumbTemplates) {
      const thumbPaths = [
        `thumbs/advert/${templateName || "template"}.template.html`,
        `thumbs/advert/${templateName || "carousel"}.template.html`,
        `thumbs/advert/template.html`,
      ];
      for (const tp of thumbPaths) {
        if (ctx.thumbTemplates[tp]) { bodyTpl = ctx.thumbTemplates[tp]; break; }
      }
    }

    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const limit = parseInt(attrs.match(/limit:'(\d+)'/i)?.[1] || "10");

    let html = header;
    bodyTpl = normalizeTemplateSyntax(bodyTpl);
    ads.slice(0, limit).forEach((ad: any, idx: number) => {
      const item = buildAdvertItem(ad, idx);
      const itemCtx = { ...ctx, ...item };
      let row = bodyTpl;
      row = processFormatBlocks(row, itemCtx);
      row = processItemAssetUrls(row, ctx, item);
      row = processConditionals(row, itemCtx);
      row = processValueTags(row, itemCtx);
      html += row;
    });
    html += footer;
    return html;
  });

  // ── random_products ──
  result = result.replace(/\[%random_products\s+([^\]]*?)%\]([\s\S]*?)\[%\/random_products%\]/gi, (_, attrs: string, content: string) => {
    const items = ctx.products || [];
    if (items.length === 0) return "";
    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const limit = parseInt(attrs.match(/limit:'(\d+)'/i)?.[1] || "8");
    const bp = ctx.basePath || "";
    const shuffled = [...items].sort(() => Math.random() - 0.5).slice(0, limit);
    let html = header;
    const normalizedBodyTpl = normalizeTemplateSyntax(bodyTpl);
    shuffled.forEach((p: any, idx: number) => {
      const item = buildProductItem(p, idx, bp);
      const itemCtx = { ...ctx, product: p, ...item };
      let row = normalizedBodyTpl;
      row = processFormatBlocks(row, itemCtx);
      row = processItemAssetUrls(row, ctx, item);
      row = processConditionals(row, itemCtx);
      row = processValueTags(row, itemCtx);
      html += row;
    });
    html += footer;
    return html;
  });

  // ── content_menu ──
  result = result.replace(/\[%content_menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/content_menu%\]/gi, (_, _attrs: string, content: string) => {
    const cats = ctx.categories || [];
    if (cats.length === 0) return "";

    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const level1 = normalizeTemplateSyntax(content.match(/\[%param\s+\*?level_1%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "");
    const level2 = normalizeTemplateSyntax(content.match(/\[%param\s+\*?level_2%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "");
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bp = ctx.basePath || "";

    const topLevel = cats.filter((c: any) => !c.parent_id);
    let html = header;
    for (const cat of topLevel) {
      const children = cats.filter((c: any) => c.parent_id === cat.id);
      let childHtml = "";
      if (children.length > 0 && level2) {
        for (const child of children) {
          const cCtx = {
            ...ctx,
            name: child.name,
            url: `${bp}/products?category=${child.slug}`,
            content_id: child.id,
            id: child.id,
            slug: child.slug,
            image: child.image_url || "",
            image_url: child.image_url || "/placeholder.svg",
            next_level: "",
            description: child.description || "",
          };
          let rendered = level2;
          rendered = processItemAssetUrls(rendered, ctx, { ...child, content_id: child.id });
          rendered = processConditionals(rendered, cCtx);
          rendered = processValueTags(rendered, cCtx);
          childHtml += rendered;
        }
      }
      const catCtx = {
        ...ctx,
        name: cat.name,
        url: `${bp}/products?category=${cat.slug}`,
        content_id: cat.id,
        id: cat.id,
        slug: cat.slug,
        image: cat.image_url || "",
        image_url: cat.image_url || "/placeholder.svg",
        next_level: childHtml,
        count: children.length,
        description: cat.description || "",
      };
      let rendered = level1;
      rendered = processItemAssetUrls(rendered, ctx, { ...cat, content_id: cat.id });
      rendered = processConditionals(rendered, catCtx);
      rendered = processValueTags(rendered, catCtx);
      html += rendered;
    }
    html += footer;
    return html;
  });

  // ── menu blocks ──
  result = result.replace(/\[%menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/menu%\]/gi, (_, _attrs: string, content: string) => {
    const cats = ctx.categories || [];
    if (cats.length === 0) return "";
    
    const levelTemplates: Record<number, string> = {};
    const paramHeaderMatch = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const paramFooterMatch = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const levelRegex = /\[%param\s+\*?level_(\d+)%\]([\s\S]*?)\[%\/param%\]/gi;
    let m;
    while ((m = levelRegex.exec(content)) !== null) {
      levelTemplates[parseInt(m[1])] = m[2];
    }

    const catMap = new Map<string | null, any[]>();
    for (const cat of cats) {
      const pid = cat.parent_id || null;
      if (!catMap.has(pid)) catMap.set(pid, []);
      catMap.get(pid)!.push(cat);
    }

    const bp = ctx.basePath || "";
    function renderMenuLevel(parentId: string | null, level: number): string {
      const children = catMap.get(parentId) || [];
      if (children.length === 0) return "";
      const tmpl = levelTemplates[level] || levelTemplates[1];
      if (!tmpl) return "";
      return children.map(cat => {
        const nextLevelHtml = renderMenuLevel(cat.id, level + 1);
        let html = tmpl;
        html = html.replace(/\[@name@\]/gi, cat.name || "");
        html = html.replace(/\[@url@\]/gi, `${bp}/products?category=${cat.slug}`);
        html = html.replace(/\[@id@\]/gi, cat.id || "");
        html = html.replace(/\[@slug@\]/gi, cat.slug || "");
        html = html.replace(/\[@description@\]/gi, cat.description || "");
        html = html.replace(/\[@image_url@\]/gi, cat.image_url || "/placeholder.svg");
        html = html.replace(/\[@image@\]/gi, cat.image_url || "/placeholder.svg");
        if (nextLevelHtml) {
          html = html.replace(/\[%if\s+\[@next_level@\]%\]([\s\S]*?)\[%\/if%\]/gi, "$1");
          html = html.replace(/\[@next_level@\]/gi, nextLevelHtml);
        } else {
          html = html.replace(/\[%if\s+\[@next_level@\]%\]([\s\S]*?)\[%\/if%\]/gi, "");
          html = html.replace(/\[@next_level@\]/gi, "");
        }
        return html;
      }).join("");
    }

    let html = "";
    if (paramHeaderMatch) html += paramHeaderMatch[1];
    html += renderMenuLevel(null, 1);
    if (paramFooterMatch) html += paramFooterMatch[1];
    return html;
  });

  // ── breadcrumb ──
  result = result.replace(/\[%breadcrumb%\]([\s\S]*?)\[%\/breadcrumb%\]/gi, (_, content: string) => {
    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const pageName = ctx.content?.title || ctx.product?.title || "";
    if (!pageName) return header + footer;
    const crumbCtx = { ...ctx, name: pageName, url: "#" };
    return header + processValueTags(bodyTpl, crumbCtx) + footer;
  });

  // ── site_value (accumulator) ──
  result = result.replace(/\[%site_value\s+([^\]]*?)\/?%\]/gi, (_, attrs: string) => {
    const id = attrs.match(/id:'([^']+)'/i)?.[1] || "";
    const type = attrs.match(/type:'([^']+)'/i)?.[1] || "";
    if (!id) return "";
    if (type === "load") return (ctx as any).__variables?.[`site_value_${id}`] || "0";
    if (type === "increment") {
      if (!(ctx as any).__variables) (ctx as any).__variables = {};
      const key = `site_value_${id}`;
      const current = parseInt((ctx as any).__variables[key] || "0");
      (ctx as any).__variables[key] = String(current + 1);
      return "";
    }
    return "";
  });

  // ── search box ──
  result = result.replace(/\[%search%\]([\s\S]*?)\[%\/search%\]/gi, (_, content: string) => content);

  // ── cdn_asset — strip wrapper, keep content ──
  result = result.replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1");

  // ── NETO_JS ──
  result = result.replace(/\[%NETO_JS[^\]]*\/?%\]/gi, "");

  // ── tracking_code ──
  result = result.replace(/\[%tracking_code[^\]]*\/?%\]/gi, "");

  // ── form blocks ──
  result = result.replace(/\[%form\s+([^\]]*?)%\]([\s\S]*?)\[%\/form%\]/gi, (_, attrs: string, body: string) => {
    const type = attrs.match(/type:'([^']+)'/i)?.[1] || "";
    const bp = ctx.basePath || "";
    const urlMap: Record<string, string> = {
      newsletter: "#", subscribe: "#", contact: `${bp}/contact`,
      login: `${bp}/login`, register: `${bp}/signup`,
      quote: `${bp}/request-quote`, wholesale: `${bp}/wholesale`,
    };
    return body.replace(/\[@form_action@\]/gi, urlMap[type] || "#");
  });

  // ── newsletter blocks ──
  result = result.replace(/\[%newsletter\s*([^\]]*?)%\]([\s\S]*?)\[%\/newsletter%\]/gi, (_, _a: string, body: string) => {
    return body.replace(/\[@form_action@\]/gi, "#").replace(/\[@newsletter_url@\]/gi, "#");
  });

  // ── login blocks ──
  result = result.replace(/\[%login\s*([^\]]*?)%\]([\s\S]*?)\[%\/login%\]/gi, (_, _a: string, body: string) => {
    const bp = ctx.basePath || "";
    return body.replace(/\[@form_action@\]/gi, `${bp}/login`);
  });

  return result;
}

function buildCategoryItem(cat: any, idx: number, bp: string): Record<string, any> {
  return {
    ...cat,
    ad_id: cat.id, content_id: cat.id, id: cat.id,
    name: cat.name || "", headline: cat.name || "",
    URL: `${bp}/products?category=${cat.slug}`,
    url: `${bp}/products?category=${cat.slug}`,
    image_url: cat.image_url || "/placeholder.svg",
    thumb_url: cat.image_url || "/placeholder.svg",
    description: cat.description || "",
    slug: cat.slug || "",
    count: idx, index: idx,
    rndm: Math.random().toString(36).substring(2, 8),
  };
}

function buildProductItem(p: any, idx: number, bp: string): Record<string, any> {
  const imageUrl = resolveStorageUrl(p.images?.[0]) || "/placeholder.svg";
  const save = p.compare_at_price && p.price ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
  const isInPromo = (p.promo_price || (p.compare_at_price && p.price && Number(p.compare_at_price) > Number(p.price))) ? 1 : 0;
  const promoPrice = p.promo_price || (isInPromo ? p.price : "");
  const retail = p.compare_at_price || p.price || 0;
  return {
    ...p,
    ad_id: p.id, inventory_id: p.id, product_id: p.id,
    SKU: p.sku || "", sku: p.sku || "",
    name: p.title || "", model: p.title || "", headline: p.title || "",
    URL: `${bp}/product/${p.slug || p.id}`, url: `${bp}/product/${p.slug || p.id}`,
    image_url: imageUrl, thumb: imageUrl, thumb_url: imageUrl,
    store_price: p.price || 0, price: p.price || 0,
    price_inc: Number(p.price || 0).toFixed(2),
    rrp: retail, retail: retail, retail_price: retail,
    rrp_inc: retail,
    save, save_percent: save, savings_percent: save,
    inpromo: isInPromo,
    promo_price: promoPrice,
    store_quantity: p.stock_on_hand ?? 10,
    has_child: p.has_variants ? 1 : 0,
    has_variation: p.has_variants ? 1 : 0,
    has_components: p.is_kit ? 1 : 0,
    reviews: p.review_count || 0,
    rating: p.average_rating || 0,
    brand: p.brand || "", short_description: p.short_description || "",
    description: p.description || "",
    current_sku: p.sku || "",
    count: idx, index: idx,
    rndm: Math.random().toString(36).substring(2, 8),
    images: p.images || [],
  };
}

function buildAdvertItem(ad: any, idx: number, totalCount?: number): Record<string, any> {
  return {
    ...ad,
    ad_id: ad.id, headline: ad.title || ad.name || "",
    name: ad.name || ad.title || "",
    url: ad.link_url || "#",
    image: resolveStorageUrl(ad.image_url) || "",
    image_url: resolveStorageUrl(ad.image_url) || "",
    image_url_mobile: resolveStorageUrl(ad.image_url_mobile) || resolveStorageUrl(ad.image_url) || "",
    img_width: ad.img_width || "2880", img_height: ad.img_height || "810",
    title: ad.title || "", subtitle: ad.subtitle || "",
    button_text: ad.button_text || "",
    linktext: ad.button_text || "Learn More",
    description: ad.subtitle || "",
    count: idx, index: idx,
    total_showing: String(totalCount || idx + 1),
    rndm: Math.random().toString(36).substring(2, 8),
  };
}

// ── DATA blocks: [%DATA id:'field' if:'op' value:'val'%]...[%/DATA%] ──
function processDataBlocks(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%DATA\s+([^\]]*?)%\]([\s\S]*?)\[%(?:\/DATA|END\s+DATA)%\]/gi, (_, attrs: string, body: string) => {
    const id = attrs.match(/id:'([^']+)'/i)?.[1] || "";
    const op = attrs.match(/if:'([^']+)'/i)?.[1] || "!=";
    const val = attrs.match(/value:'([^']*)'/i)?.[1] || "";
    
    const fieldVal = String(resolveField(id, ctx) ?? ctx[id] ?? "");
    let condMet = false;
    switch (op) {
      case "==": case "eq": condMet = fieldVal === val; break;
      case "!=": case "ne": condMet = fieldVal !== val; break;
      case ">": condMet = Number(fieldVal) > Number(val); break;
      case "<": condMet = Number(fieldVal) < Number(val); break;
      case ">=": condMet = Number(fieldVal) >= Number(val); break;
      case "<=": condMet = Number(fieldVal) <= Number(val); break;
      default: condMet = fieldVal !== val;
    }
    return condMet ? body : "";
  });
}

// ── calc: [%calc expression /%] ──
function processCalcTags(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%calc\s+([\s\S]*?)\/?%\]/gi, (_, expr: string) => {
    // Resolve any [@...@] tags in the expression
    let resolved = expr.replace(/\[@([\w:.]+)@\]/gi, (__, field: string) => {
      const v = resolveField(field, ctx);
      return v != null ? String(v) : "0";
    });
    // Simple math evaluation (safe: only numbers and operators)
    resolved = resolved.trim();
    try {
      // Only allow safe math chars
      if (/^[\d\s+\-*/().]+$/.test(resolved)) {
        return String(Math.round(eval(resolved) * 100) / 100);
      }
    } catch {}
    return resolved;
  });
}

// ── SITE_VALUE block form: accumulates content across loop iterations ──
function processSiteValueBlocks(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%SITE_VALUE\s+([^\]]*?)%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi, (_, attrs: string, body: string) => {
    const id = attrs.match(/id:'([^']+)'/i)?.[1] || "";
    if (!id) return "";
    // Accumulate the body content into the site_value variable
    if (!(ctx as any).__variables) (ctx as any).__variables = {};
    const key = `site_value_${id}`;
    const existing = (ctx as any).__variables[key] || "";
    // Process value tags in body
    const processed = processValueTags(body, ctx);
    (ctx as any).__variables[key] = existing + processed;
    return "";
  });
}

// ── multilevelpricing: [%multilevelpricing id:'SKU'%]...[%/multilevelpricing%] ──
function processMultilevelPricing(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%multilevelpricing\s+([^\]]*?)%\]([\s\S]*?)\[%\/multilevelpricing%\]/gi, (_, _attrs: string, content: string) => {
    const tiers = ctx.pricing_tiers || [];
    if (tiers.length === 0) return "";
    
    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const bodyTpl = content.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    
    let html = header;
    for (const tier of tiers) {
      const tierCtx = { ...ctx, minqty: tier.min_qty || 0, maxqty: tier.max_qty || 0, price: tier.price || 0 };
      let row = normalizeTemplateSyntax(bodyTpl);
      row = processFormatBlocks(row, tierCtx);
      row = processConditionals(row, tierCtx);
      row = processValueTags(row, tierCtx);
      html += row;
    }
    html += footer;
    return html;
  });
}

// ── extra_options: [%extra_options id:'SKU'%]...[%/extra_options%] ──
function processExtraOptions(t: string, ctx: Record<string, any>): string {
  return t.replace(/\[%extra_options\s+([^\]]*?)%\]([\s\S]*?)\[%\/extra_options%\]/gi, (_, _attrs: string, content: string) => {
    const specifics = ctx.specifics || [];
    if (specifics.length === 0) return "";
    
    const header = content.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const selectTpl = content.match(/\[%param\s+\*?select_option%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const choicesTpl = content.match(/\[%param\s+\*?choices%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    const footer = content.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i)?.[1] || "";
    
    let html = header;
    specifics.forEach((spec: any, idx: number) => {
      const options = spec.options || [];
      let choicesHtml = "";
      for (const opt of options) {
        const optCtx = { ...ctx, option_id: opt.id || "", text: opt.label || opt.value || "", price: opt.price_modifier || 0 };
        let choiceRow = normalizeTemplateSyntax(choicesTpl);
        choiceRow = processDataBlocks(choiceRow, optCtx);
        choiceRow = processFormatBlocks(choiceRow, optCtx);
        choiceRow = processValueTags(choiceRow, optCtx);
        choicesHtml += choiceRow;
      }
      const specCtx = { ...ctx, name: spec.name || "", count: idx, choices: choicesHtml, total_options: specifics.length };
      let row = normalizeTemplateSyntax(selectTpl);
      row = processConditionals(row, specCtx);
      row = processValueTags(row, specCtx);
      html += row;
    });
    html += footer.replace(/\[@total_options@\]/gi, String(specifics.length));
    return html;
  });
}

// ── Main render pipeline ──
function renderTemplate(template: string, ctx: Record<string, any>): string {
  let r = template;
  r = stripComments(r);
  r = normalizeTemplateSyntax(r);
  r = processCacheBlocks(r);
  r = processLoadTemplate(r, ctx);
  r = processLoadAjaxTemplate(r, ctx);
  r = processLegacyIncludes(r, ctx);
  r = processThemeAssets(r, ctx);
  r = processUrlTags(r, ctx);
  r = processFormatBlocks(r, ctx);
  r = processNoHtml(r);
  r = processSetVars(r, ctx);
  r = processCalcTags(r, ctx);
  r = processInlineTags(r, ctx);
  r = processSystemTags(r, ctx);
  r = processMultilevelPricing(r, ctx);
  r = processExtraOptions(r, ctx);
  r = processDataBlocks(r, ctx);
  r = processConditionals(r, ctx);
  r = processValueTags(r, ctx);
  r = cleanupUnresolved(r);
  return r;
}

function cleanupUnresolved(t: string): string {
  let r = t;
  // Remove self-closing tags
  r = r.replace(/\[%[^\]]+\/%\]/g, "");
  // Remove known system/decorative tags only
  r = r.replace(/\[%\/?(?:set|while|cache|NETO_JS|cdn_asset|tracking_code|site_value|SITE_VALUE|content_zone|parse|escape|ajax_loader|ITEM_KITTING|IN_WISHLIST|url_encode|DATA|search|login|form|foreach|each|switch|case|default|rndm|now|today|year|show_content|config:[^\]]*)[^\]]*%\]/gi, "");
  r = r.replace(/\[%show_content[^\]]*%\][\s\S]*?\[%\/show_content%\]/gi, "");
  r = r.replace(/\[%IN_WISHLIST[^\]]*%\][\s\S]*?\[%(?:\/\s*IN_WISHLIST|END\s+IN_WISHLIST)\s*%\]/gi, "");
  r = r.replace(/\[%ITEM_KITTING[^\]]*%\][\s\S]*?\[%\/ITEM_KITTING%\]/gi, "");
  // Remove [%param%] blocks
  r = r.replace(/\[%param\s+[^\]]*%\]([\s\S]*?)\[%\/param%\]/gi, "");
  // Remove remaining [%if%] tags that couldn't be processed (deeply nested edge cases)
  r = r.replace(/\[%(?:if|elseif|else|\/if)[^\]]*%\]/gi, "");
  // Replace unresolved value tags with empty string
  r = r.replace(/\[@[\w:.]+(?:\|\w+)?@\]/g, "");
  return r;
}
