/**
 * B@SE Template Engine — Full Maropost/Neto Compatibility Layer
 * 
 * Processes ALL Maropost-native template tags so uploaded themes render correctly.
 */

export interface TemplateContext {
  product?: Record<string, any>;
  variants?: Record<string, any>[];
  specifics?: Record<string, any>[];
  pricing_tiers?: Record<string, any>[];
  cross_sells?: Record<string, any>[];
  upsells?: Record<string, any>[];
  free_gifts?: Record<string, any>[];
  adverts?: Record<string, any>[];
  thumblist?: Record<string, any>[];
  shipping?: Record<string, any>;
  store?: Record<string, any>;
  order?: Record<string, any>;
  customer?: Record<string, any>;
  includes?: Record<string, string>;
  /** Theme file contents keyed by relative path for load_template */
  themeFiles?: Record<string, string>;
  /** Base URL for theme assets */
  themeAssetBaseUrl?: string;
  /** Store base URL */
  baseUrl?: string;
  /** Current page type */
  pageType?: string;
  /** URL query params */
  queryParams?: Record<string, string>;
  /** Content page data */
  content?: Record<string, any>;
  /** Categories for navigation */
  categories?: Record<string, any>[];
  /** Products for listings */
  products?: Record<string, any>[];
}

// ── Format pipes ──
function applyFormat(value: any, format: string): string {
  if (value === null || value === undefined) return "";
  switch (format) {
    case "currency": return `$${Number(value).toFixed(2)}`;
    case "currency_no_symbol": return Number(value).toFixed(2);
    case "integer": return Math.round(Number(value)).toString();
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
    case "count": return Array.isArray(value) ? value.length.toString() : "0";
    case "first": return Array.isArray(value) && value.length > 0 ? String(value[0]) : "";
    case "boolean": return value ? "Yes" : "No";
    default: return String(value);
  }
}

// ── Resolve config values: [@config:key@] ──
function resolveConfig(key: string, ctx: TemplateContext): string {
  const k = key.toLowerCase();
  const store = ctx.store || {};
  const configMap: Record<string, () => string> = {
    "company_name": () => store.name || "",
    "website_name": () => store.name || "",
    "home_url": () => ctx.baseUrl || "/",
    "canonical_url": () => ctx.baseUrl || "",
    "current_page_type": () => ctx.pageType || "content",
    "templatelang": () => "en-AU",
    "neto_css_version": () => Date.now().toString(),
    "google_verification": () => store.google_verification || "",
    "related_limit": () => "8",
    "store_currency": () => store.default_currency || store.currency || "AUD",
    "contact_email": () => store.contact_email || "",
    "phone": () => store.phone || "",
    "address": () => store.address || "",
    // Default config values that themes expect to be truthy
    "show_home_ads": () => "1",
    "show_home_categories": () => "1",
    "show_home_products": () => "1",
    "show_price": () => "1",
    "show_rrp": () => "1",
    "show_addcart": () => "1",
    "show_wishlist": () => "1",
    "show_compare": () => "1",
    "show_reviews": () => "1",
    "show_shipping_calculator": () => "1",
    "show_breadcrumbs": () => "1",
    "assets_url": () => "/assets",
    // Social media — empty by default (themes conditionally show these)
    "social_facebook": () => store.social_facebook || "",
    "social_twitter": () => store.social_twitter || "",
    "social_instagram": () => store.social_instagram || "",
    "social_youtube": () => store.social_youtube || "",
    "social_pinterest": () => store.social_pinterest || "",
    "social_google_plus": () => "",
    "social_tumblr": () => "",
    "social_linkedin": () => "",
    // Footer fields
    "abn": () => store.abn || "",
    "company_abn": () => store.abn || store.company_abn || "",
    "copyright_year": () => new Date().getFullYear().toString(),
  };
  const resolver = configMap[k];
  if (resolver) return resolver();
  // Generic store field fallback
  return store[k] || store[key] || "";
}

// ── Resolve field from context ──
function resolveField(field: string, ctx: TemplateContext): any {
  // Config fields: config:key
  if (field.startsWith("config:") || field.startsWith("CONFIG:")) {
    return resolveConfig(field.replace(/^config:/i, ""), ctx);
  }

  // Content page fields
  if (field.startsWith("content_")) {
    const contentKey = field.replace("content_", "");
    return ctx.content?.[contentKey] || ctx.content?.[field] || "";
  }

  // Form/query fields
  if (field.startsWith("form:")) {
    return ctx.queryParams?.[field.replace("form:", "")] || "";
  }

  const productFields: Record<string, () => any> = {
    title: () => ctx.product?.title,
    sku: () => ctx.product?.sku,
    SKU: () => ctx.product?.sku,
    price: () => ctx.product?.price,
    cost_price: () => ctx.product?.cost_price,
    compare_at_price: () => ctx.product?.compare_at_price,
    description: () => ctx.product?.description,
    short_description: () => ctx.product?.short_description,
    brand: () => ctx.product?.brand,
    barcode: () => ctx.product?.barcode,
    model_number: () => ctx.product?.model_number,
    status: () => ctx.product?.status,
    slug: () => ctx.product?.slug,
    subtitle: () => ctx.product?.subtitle,
    features: () => ctx.product?.features,
    specifications: () => ctx.product?.specifications,
    warranty: () => ctx.product?.warranty,
    terms_conditions: () => ctx.product?.terms_conditions,
    availability_description: () => ctx.product?.availability_description,
    custom_label: () => ctx.product?.custom_label,
    product_type: () => ctx.product?.product_type,
    product_subtype: () => ctx.product?.product_subtype,
    supplier_item_code: () => ctx.product?.supplier_item_code,
    search_keywords: () => ctx.product?.search_keywords,
    internal_notes: () => ctx.product?.internal_notes,
    seo_title: () => ctx.product?.seo_title,
    seo_description: () => ctx.product?.seo_description,
    seo_keywords: () => ctx.product?.seo_keywords,
    promo_price: () => ctx.product?.promo_price,
    promo_tag: () => ctx.product?.promo_tag,
    promo_start: () => ctx.product?.promo_start,
    promo_end: () => ctx.product?.promo_end,
    misc1: () => ctx.product?.misc1,
    misc2: () => ctx.product?.misc2,
    misc3: () => ctx.product?.misc3,
    misc4: () => ctx.product?.misc4,
    misc5: () => ctx.product?.misc5,
    images: () => ctx.product?.images,
    image: () => ctx.product?.images?.[0],
    image_1: () => ctx.product?.images?.[0],
    image_2: () => ctx.product?.images?.[1],
    image_3: () => ctx.product?.images?.[2],
    image_count: () => ctx.product?.images?.length || 0,
    tags: () => ctx.product?.tags,
    is_active: () => ctx.product?.is_active,
    tax_free: () => ctx.product?.tax_free,
    tax_inclusive: () => ctx.product?.tax_inclusive,
    virtual_product: () => ctx.product?.virtual_product,
    is_kit: () => ctx.product?.is_kit,
    track_inventory: () => ctx.product?.track_inventory,
    created_at: () => ctx.product?.created_at,
    updated_at: () => ctx.product?.updated_at,
    savings: () => {
      const c = ctx.product?.compare_at_price, p = ctx.product?.price;
      return c && p ? Number(c) - Number(p) : 0;
    },
    savings_percent: () => {
      const c = ctx.product?.compare_at_price, p = ctx.product?.price;
      return c && p ? Math.round((1 - Number(p) / Number(c)) * 100) : 0;
    },
    has_variants: () => (ctx.variants?.length || 0) > 0,
    variant_count: () => ctx.variants?.length || 0,
    has_promo: () => {
      const p = ctx.product;
      if (!p?.promo_price) return false;
      const now = new Date();
      return (!p.promo_start || new Date(p.promo_start) <= now) &&
             (!p.promo_end || new Date(p.promo_end) >= now);
    },
    has_cross_sells: () => (ctx.cross_sells?.length || 0) > 0,
    has_upsells: () => (ctx.upsells?.length || 0) > 0,
    specifics_count: () => ctx.specifics?.length || 0,
    shipping_weight: () => ctx.shipping?.shipping_weight,
    shipping_length: () => ctx.shipping?.shipping_length,
    shipping_width: () => ctx.shipping?.shipping_width,
    shipping_height: () => ctx.shipping?.shipping_height,
    shipping_cubic: () => ctx.shipping?.shipping_cubic,
    flat_rate_charge: () => ctx.shipping?.flat_rate_charge,
    selling_unit: () => ctx.shipping?.selling_unit,
    base_unit: () => ctx.shipping?.base_unit,
    store_name: () => ctx.store?.name,
    store_currency: () => ctx.store?.currency,
    store_email: () => ctx.store?.contact_email,
    order_number: () => ctx.order?.order_number,
    order_total: () => ctx.order?.total,
    order_subtotal: () => ctx.order?.subtotal,
    order_status: () => ctx.order?.status,
    order_date: () => ctx.order?.created_at,
    customer_name: () => ctx.customer?.name,
    customer_email: () => ctx.customer?.email,
    customer_phone: () => ctx.customer?.phone,
    // Page-level fields
    page_content: () => ctx.content?.description || ctx.content?.content || "",
    total_showing: () => String((ctx.adverts || []).length),
  };

  const resolver = productFields[field];
  if (resolver) return resolver();

  // Dot-path resolution fallback
  const parts = field.split(".");
  let obj: any = ctx;
  for (const part of parts) {
    if (obj === null || obj === undefined) return undefined;
    obj = obj[part];
  }
  return obj;
}

// ── Process Maropost [%load_template file:'path'/%] ──
function processLoadTemplate(template: string, ctx: TemplateContext, depth = 0): string {
  if (depth > 10) return template;
  return template.replace(/\[%load_template\s+file:'([^']+)'\/?%\]/gi, (_, filePath: string) => {
    const files = ctx.themeFiles || {};
    const includes = ctx.includes || {};
    
    if (files[filePath]) return processLoadTemplate(files[filePath], ctx, depth + 1);
    
    const fileName = filePath.split("/").pop() || filePath;
    const slug = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (includes[slug]) return processLoadTemplate(includes[slug], ctx, depth + 1);
    
    for (const key of Object.keys(files)) {
      if (key.endsWith(filePath) || key.includes(filePath)) {
        return processLoadTemplate(files[key], ctx, depth + 1);
      }
    }
    
    return `<!-- load_template "${filePath}" not found -->`;
  });
}

// ── Resolve a theme template file by name ──
function resolveThemeTemplate(templateName: string, ctx: TemplateContext): string | null {
  if (!templateName) return null;
  const files = ctx.themeFiles || {};
  const includes = ctx.includes || {};
  
  // Try direct path
  const paths = [
    `templates/${templateName}.template.html`,
    `templates/${templateName}.html`,
    templateName,
  ];
  
  for (const p of paths) {
    if (files[p]) return files[p];
  }
  
  // Try slug match in includes
  const slug = templateName.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  if (includes[slug]) return includes[slug];
  
  // Try partial match in files
  for (const key of Object.keys(files)) {
    if (key.includes(templateName)) return files[key];
  }
  
  return null;
}

// ── Process [%ntheme_asset%]path[%/ntheme_asset%] ──
function processThemeAssets(template: string, ctx: TemplateContext): string {
  const baseUrl = ctx.themeAssetBaseUrl || "/assets/themes/skeletal/";
  return template.replace(/\[%ntheme_asset%\]([\s\S]*?)\[%\/ntheme_asset%\]/gi, (_, path: string) => {
    return `${baseUrl}${path.trim()}`;
  });
}

// ── Process Maropost [%if%]...[%elseif%]...[%else%]...[%/if%] ──
// CRITICAL: Use [\s\S]+? instead of [^\]]+? for condition capture because
// conditions contain [@config:key@] tags which include ] characters.
function processMaropostConditionals(template: string, ctx: TemplateContext): string {
  // First, pre-resolve all [@...@] tags inside [%if ...%] conditions
  // This prevents ] characters in value tags from breaking the regex
  let result = template.replace(
    /\[%if\s+([\s\S]*?)%\]/gi,
    (match, cond: string) => {
      const resolved = cond.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_, field: string, format?: string) => {
        const value = resolveField(field, ctx);
        if (value === undefined || value === null) return "";
        return format ? applyFormat(value, format) : String(value);
      });
      return `[%if ${resolved}%]`;
    }
  );
  // Also pre-resolve in [%elseif ...%]
  result = result.replace(
    /\[%elseif\s+([\s\S]*?)%\]/gi,
    (match, cond: string) => {
      const resolved = cond.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_, field: string, format?: string) => {
        const value = resolveField(field, ctx);
        if (value === undefined || value === null) return "";
        return format ? applyFormat(value, format) : String(value);
      });
      return `[%elseif ${resolved}%]`;
    }
  );

  let safety = 0;
  while (result.includes("[%if ") && safety++ < 100) {
    const prevResult = result;
    result = result.replace(
      /\[%if\s+([\s\S]*?)%\]([\s\S]*?)\[%\/if%\]/i,
      (_, condition: string, body: string) => {
        if (!condition.trim()) return ""; // Empty condition = false
        let segments = body.split(/\[%elseif\s+[\s\S]*?%\]|\[%else%\]/i);
        let markers: (string | null)[] = [condition];
        
        const markerRegex = /\[%(elseif\s+([\s\S]*?)|else)%\]/gi;
        let m;
        while ((m = markerRegex.exec(body)) !== null) {
          if (m[1].toUpperCase() === "ELSE") {
            markers.push(null);
          } else {
            markers.push(m[2]);
          }
        }
        
        for (let i = 0; i < segments.length && i < markers.length; i++) {
          const cond = markers[i];
          if (cond === null) return segments[i];
          if (evaluateCondition(cond, ctx)) return segments[i];
        }
        
        return "";
      }
    );
    if (result === prevResult) break;
  }
  
  return result;
}

function evaluateCondition(condition: string, ctx: TemplateContext): boolean {
  condition = condition.trim();
  
  if (condition.startsWith("!") || condition.toUpperCase().startsWith("NOT ")) {
    const inner = condition.replace(/^!|^NOT\s+/i, "").trim();
    return !evaluateCondition(inner, ctx);
  }
  
  // Comparison operators
  const compMatch = condition.match(/^(.+?)\s+(eq|ne|!=|==|>|<|>=|<=)\s+(.+)$/i);
  if (compMatch) {
    let left = resolveTagValue(compMatch[1].trim(), ctx);
    const op = compMatch[2].toLowerCase();
    let right = compMatch[3].trim().replace(/^['"]|['"]$/g, "");
    
    switch (op) {
      case "eq": case "==": return String(left) === right;
      case "ne": case "!=": return String(left) !== right;
      case ">": return Number(left) > Number(right);
      case "<": return Number(left) < Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<=": return Number(left) <= Number(right);
    }
  }
  
  const value = resolveTagValue(condition, ctx);
  return value !== null && value !== undefined && value !== false && value !== 0 && 
         value !== "" && value !== "0" && value !== "false";
}

function resolveTagValue(tag: string, ctx: TemplateContext): any {
  const cleaned = tag.replace(/^\[@|\@\]$/g, "").trim();
  return resolveField(cleaned, ctx);
}

// ── Process [%format type:'date' format:'...'%]value[%/format%] ──
function processFormatBlocks(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%format\s+([^\]]*?)%\]([\s\S]*?)\[%\/format%\]/gi, (_, attrs: string, content: string) => {
    const typeMatch = attrs.match(/type:'(\w+)'/i);
    const formatMatch = attrs.match(/format:'([^']+)'/i);
    const type = typeMatch?.[1] || "date";
    
    if (type === "date") {
      const value = content.trim();
      if (value === "NOW" || value === "now" || value === "today" || value === "TODAY") {
        const now = new Date();
        const fmt = formatMatch?.[1] || "";
        if (fmt === "#K") return now.toLocaleDateString("en-AU", { weekday: "long" }).toUpperCase();
        if (fmt === "#D") return now.getDate().toString();
        if (fmt === "#M") return (now.getMonth() + 1).toString();
        if (fmt === "#Y") return now.getFullYear().toString();
        return now.toLocaleDateString();
      }
      return new Date(value).toLocaleDateString();
    }
    
    return content;
  });
}

// ── Process [%nohtml%]...[%/nohtml%] ──
function processNoHtml(template: string): string {
  return template.replace(/\[%nohtml%\]([\s\S]*?)\[%\/nohtml%\]/gi, (_, content: string) => {
    return content.replace(/<[^>]*>/g, "");
  });
}

// ── Process [%escape%]...[%/escape%] — HTML entity encoding ──
function processEscape(template: string): string {
  return template.replace(/\[%escape%\]([\s\S]*?)\[%\/escape%\]/gi, (_, content: string) => {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  });
}

// ── Process [%calc expr /%] — simple math ──
function processCalc(template: string): string {
  return template.replace(/\[%calc\s+([^\]]*?)\s*\/?%\]/gi, (_, expr: string) => {
    try {
      // Simple expression: "[@count@] + 1" — resolve any remaining numbers
      const cleaned = expr.replace(/[^0-9+\-*/. ()]/g, "").trim();
      if (!cleaned) return "0";
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${cleaned})`)();
      return String(Math.round(Number(result)));
    } catch {
      return "0";
    }
  });
}

// ── Process [%filter ID:'key'%]...[%/filter%] ──
function processFilters(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%filter\s+([^\]]*?)%\]([\s\S]*?)\[%\/filter%\]/gi, (_, attrs: string, _content: string) => {
    const idMatch = attrs.match(/ID:'(\w+)'/i);
    if (idMatch) {
      return ctx.queryParams?.[idMatch[1]] || "";
    }
    return "";
  });
}

// ── Process [%url_info name:'key'/%] ──
function processUrlInfo(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%url_info\s+([^\]]*?)\/?%\]/gi, (_, attrs: string) => {
    const nameMatch = attrs.match(/name:'([^']+)'/i);
    const defaultMatch = attrs.match(/default:'([^']+)'/i);
    const name = nameMatch?.[1] || "";
    const defaultVal = defaultMatch?.[1] || "";
    
    switch (name) {
      case "page_title": return ctx.store?.name || defaultVal || "Store";
      case "page_heading": return ctx.content?.title || defaultVal || "";
      case "meta_description": return ctx.store?.seo_description || ctx.content?.seo_description || defaultVal || "";
      case "meta_keywords": return ctx.content?.seo_keywords || defaultVal || "";
      default: return defaultVal;
    }
  });
}

// ── Process [%cache%]...[%/cache%] — strip wrapper, keep content ──
function processCacheBlocks(template: string): string {
  return template.replace(/\[%\/?cache[^\]]*%\]/gi, "");
}

// ── Process [%url page:'...' type:'...'/%] ──
function processUrlTags(template: string, ctx: TemplateContext): string {
  const base = ctx.baseUrl || "";
  let result = template.replace(/\[%url\s+([^\]]*?)\/?%\]\[%\/url%\]/gi, (_, attrs: string) => resolveUrlTag(attrs, base));
  result = result.replace(/\[%url\s+([^\]]*?)\/%\]/gi, (_, attrs: string) => resolveUrlTag(attrs, base));
  result = result.replace(/\[%URL\s+([^\]]*?)%\]\[%\/URL%\]/gi, (_, attrs: string) => resolveUrlTag(attrs, base));
  return result;
}

function resolveUrlTag(attrs: string, base: string): string {
  const pageMatch = attrs.match(/page:'([^']+)'/i);
  const typeMatch = attrs.match(/type:'([^']+)'/i);
  const qsMatch = attrs.match(/qs:'([^']+)'/i);
  const page = pageMatch?.[1] || "";
  const type = typeMatch?.[1] || "";
  const qs = qsMatch?.[1] || "";
  
  let url = base;
  switch (page) {
    case "account": url += "/_myacct"; break;
    case "checkout":
      if (type === "cart") url += "/cart";
      else url += "/checkout";
      break;
    case "contact": url += "/contact-us"; break;
    case "wishlist": url += "/_myacct/wishlist"; break;
    default: url += "/" + page;
  }
  if (type === "write_review") url = `${base}/_myacct/write_review`;
  if (qs) url += "?" + qs;
  return url;
}

// ── Process [%menu id:'cat-XXXX'%]...[%/menu%] ──
function processMenuBlocks(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/menu%\]/gi, (_, _attrs: string, body: string) => {
    const categories = ctx.categories || [];
    if (categories.length === 0) return "";

    const levelTemplates: Record<number, string> = {};
    const paramHeaderMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const paramFooterMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    const levelRegex = /\[%param\s+\*?level_(\d+)%\]([\s\S]*?)\[%\/param%\]/gi;
    let m;
    while ((m = levelRegex.exec(body)) !== null) {
      levelTemplates[parseInt(m[1])] = m[2];
    }

    const catMap = new Map<string | null, any[]>();
    for (const cat of categories) {
      const parentId = cat.parent_id || null;
      if (!catMap.has(parentId)) catMap.set(parentId, []);
      catMap.get(parentId)!.push(cat);
    }

    function renderLevel(parentId: string | null, level: number): string {
      const children = catMap.get(parentId) || [];
      if (children.length === 0) return "";
      const tmpl = levelTemplates[level] || levelTemplates[Object.keys(levelTemplates).length > 0 ? Math.max(...Object.keys(levelTemplates).map(Number)) : 1];
      if (!tmpl) return "";

      return children.map(cat => {
        const nextLevelHtml = renderLevel(cat.id, level + 1);
        let html = tmpl;
        html = html.replace(/\[@name@\]/gi, cat.name || "");
        html = html.replace(/\[@url@\]/gi, cat.url || `/${cat.slug}` || "#");
        html = html.replace(/\[@id@\]/gi, cat.id || "");
        html = html.replace(/\[@css_class@\]/gi, cat.css_class || "");
        html = html.replace(/\[@image_url@\]/gi, cat.image_url || "");
        
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

    let result = "";
    if (paramHeaderMatch) result += paramHeaderMatch[1];
    result += renderLevel(null, 1);
    if (paramFooterMatch) result += paramFooterMatch[1];
    return result;
  });
}

// ── Process [%content_menu%] — category listing for storefront pages ──
function processContentMenu(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%content_menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/content_menu%\]/gi, (_, _attrs: string, body: string) => {
    const categories = ctx.categories || [];
    if (categories.length === 0) return "";

    const levelTemplates: Record<number, string> = {};
    const paramHeaderMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const paramFooterMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    const levelRegex = /\[%param\s+\*?level_(\d+)%\]([\s\S]*?)\[%\/param%\]/gi;
    let m;
    while ((m = levelRegex.exec(body)) !== null) {
      levelTemplates[parseInt(m[1])] = m[2];
    }

    const catMap = new Map<string | null, any[]>();
    for (const cat of categories) {
      const parentId = cat.parent_id || null;
      if (!catMap.has(parentId)) catMap.set(parentId, []);
      catMap.get(parentId)!.push(cat);
    }

    function renderLevel(parentId: string | null, level: number): string {
      const children = catMap.get(parentId) || [];
      if (children.length === 0) return "";
      const tmpl = levelTemplates[level] || levelTemplates[1];
      if (!tmpl) return "";

      return children.map(cat => {
        let html = tmpl;
        html = html.replace(/\[@name@\]/gi, cat.name || "");
        html = html.replace(/\[@url@\]/gi, cat.url || `/products?category=${cat.slug}` || "#");
        html = html.replace(/\[@id@\]/gi, cat.id || "");
        html = html.replace(/\[@image@\]/gi, cat.image_url || "");
        html = html.replace(/\[@slug@\]/gi, cat.slug || "");
        // Process any asset_url for category images within the template
        html = processAssetUrl(html, ctx, cat);
        return html;
      }).join("");
    }

    let result = "";
    if (paramHeaderMatch) result += paramHeaderMatch[1];
    result += renderLevel(null, 1);
    if (paramFooterMatch) result += paramFooterMatch[1];
    return result;
  });
}

// ── Process [%asset_url type:'...' id:'...'%]...[%END asset_url%] or [%/asset_url%] ──
function processAssetUrl(template: string, ctx: TemplateContext, item?: any): string {
  // Handle [%asset_url type:'adw' id:'[@ad_id@]'%]...[%END asset_url%]
  // Also [%asset_url type:'category' id:'[@id@]'%]...[%end param%][%END asset_url%]
  let result = template;
  
  // Block variant FIRST (longer match): [%asset_url ...%]...[%END asset_url%]
  // Use ((?:[^\[\]]|\[@[^\]]*@\])*) to allow [@...@] tags inside attrs
  result = result.replace(/\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:END\s+asset_url|\/asset_url|\/ASSET_url|end\s+asset_url)%\]/gi, (_, attrs: string, body: string) => {
    // Pre-resolve [@...@] tags in attrs using item context
    const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
      if (item && item[field] !== undefined) return String(item[field]);
      return String(resolveField(field, ctx) || "");
    });
    const url = resolveAssetUrlAttrs(resolvedAttrs, ctx, item);
    if (url) return url;
    // If no URL resolved, check for a default param
    const defaultMatch = body.match(/\[%param\s+default%\]([\s\S]*?)\[%(?:end\s+param|\/param)%\]/i);
    if (defaultMatch) {
      // The default content might contain cdn_asset — resolve it
      const defaultVal = defaultMatch[1].replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1").trim();
      // If it's just a filename (not a full URL/path), use placeholder
      if (defaultVal && !defaultVal.startsWith("/") && !defaultVal.startsWith("http")) {
        return "/placeholder.svg";
      }
      return defaultVal || "/placeholder.svg";
    }
    return "/placeholder.svg";
  });
  
  // Self-closing variant — also allow [@...@] inside attrs
  result = result.replace(/\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)\/?%\]/gi, (full, attrs: string) => {
    // Pre-resolve [@...@] tags in attrs using item context
    const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
      if (item && item[field] !== undefined) return String(item[field]);
      return String(resolveField(field, ctx) || "");
    });
    return resolveAssetUrlAttrs(resolvedAttrs, ctx, item);
  });
  
  return result;
}

/** Resolve a storage path to a full public URL */
function resolveStorageUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("//") || path.startsWith("/")) return path;
  // Assume it's a Supabase storage path in the product-images bucket
  const supabaseUrl = typeof window !== "undefined"
    ? (window as any).__VITE_SUPABASE_URL || ""
    : "";
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
  }
  return path;
}

function resolveAssetUrlAttrs(attrs: string, ctx: TemplateContext, item?: any): string {
  const typeMatch = attrs.match(/type:'(\w+)'/i);
  const idMatch = attrs.match(/id:'([^']+)'/i);
  const type = typeMatch?.[1] || "";
  let id = idMatch?.[1] || "";
  
  // Resolve any [@...@] tags in the id
  id = id.replace(/\[@(\w+)@\]/gi, (_, field: string) => {
    if (item && item[field] !== undefined) return String(item[field]);
    return String(resolveField(field, ctx) || "");
  });
  
  switch (type) {
    case "adw":
    case "ad":
      // Return the advert image URL from the item
      if (item?.image_url) return resolveStorageUrl(item.image_url);
      // Fallback: look up in adverts
      const ad = (ctx.adverts || []).find(a => a.id === id || a.ad_id === id);
      if (ad?.image_url) return resolveStorageUrl(ad.image_url);
      return "";
    case "category":
      // Return category image
      if (item?.image_url) return resolveStorageUrl(item.image_url);
      const cat = (ctx.categories || []).find(c => c.id === id);
      if (cat?.image_url) return resolveStorageUrl(cat.image_url);
      return "/placeholder.svg";
    case "product":
      if (item?.images?.[0]) return resolveStorageUrl(item.images[0]);
      const prod = (ctx.products || []).find(p => p.id === id);
      if (prod?.images?.[0]) return resolveStorageUrl(prod.images[0]);
      return "/placeholder.svg";
    default:
      return "";
  }
}

// ── Process [%set .../%] and [%while%] — stub out ──
function processSetAndWhile(template: string): string {
  let result = template.replace(/\[%set\s+[^\]]*\/%\]/gi, "");
  result = result.replace(/\[%while\s+[^\]]*%\]([\s\S]*?)\[%\/while%\]/gi, "");
  return result;
}

// ── Process [%FORMAT type:'currency'%]value[%/FORMAT%] ──
function processFormatCurrency(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%FORMAT\s+type:'currency'%\]([\s\S]*?)\[%\/FORMAT%\]/gi, (_, content: string) => {
    const value = content.trim();
    const num = parseFloat(value);
    if (!isNaN(num)) return `$${num.toFixed(2)}`;
    return value;
  });
}

// ── Process [%format type:'percent'%]value[%/format%] ──
function processFormatPercent(template: string): string {
  return template.replace(/\[%format\s+type:'percent'%\]([\s\S]*?)\[%\/format%\]/gi, (_, content: string) => {
    const value = content.trim();
    const num = parseFloat(value);
    if (!isNaN(num)) return `${Math.round(num)}%`;
    return value;
  });
}

// ── Process [%SITE_VALUE id:'counter'%]...[%/SITE_VALUE%] — accumulator/counter blocks ──
// In Maropost, these accumulate HTML across iterations. We render them inline.
function processSiteValueBlocks(template: string): string {
  // [%site_value id:'counter' type:'load'/%] — outputs the accumulated counter HTML
  // We strip these since we handle the counter inline in advert rendering
  let result = template.replace(/\[%site_value[^\]]*\/%\]/gi, "");
  // Block form: [%SITE_VALUE id:'counter'%]...[%/SITE_VALUE%]
  // This defines what to accumulate — we keep the content as-is (it's rendered per-item)
  result = result.replace(/\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi, "");
  return result;
}

// ── Process [%content_zone id:'...'%]...[%end content_zone%] ──
function processContentZone(template: string): string {
  return template.replace(/\[%content_zone[^\]]*%\]([\s\S]*?)\[%end\s+content_zone%\]/gi, "");
}

// ── Strip/handle Neto-specific system tags ──
function processSystemTags(template: string, ctx: TemplateContext): string {
  let result = template;
  
  // [%NETO_JS html:'1' id:'main' /%]
  result = result.replace(/\[%NETO_JS[^\]]*\/?%\]/gi, "");
  
  // [%cdn_asset%]...[%/cdn_asset%] — strip wrapper, keep content
  result = result.replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1");
  
  // [%tracking_code%]
  result = result.replace(/\[%tracking_code[^\]]*\/?%\]/gi, "");
  
  // [%site_value%] blocks
  result = processSiteValueBlocks(result);
  
  // [%content_zone%]
  result = processContentZone(result);
  
  // [%asset_url%] (global pass)
  result = processAssetUrl(result, ctx);
  
  // [%parse%]...[%/parse%] — just render the content
  result = result.replace(/\[%\/?parse%\]/gi, "");
  
  // [%escape%]...[%/escape%]
  result = processEscape(result);
  
  // [%calc%]
  result = processCalc(result);
  
  // [%breadcrumb%]
  result = processBreadcrumb(result, ctx);
  
  // [%advert%] — CRITICAL: render adverts with template resolution
  result = processAdvertBlocks(result, ctx);
  
  // [%content_menu%]
  result = processContentMenu(result, ctx);
  
  // [%thumb_list%]
  result = processThumbList(result, ctx);
  
  // [%paging%]
  result = result.replace(/\[%paging[^\]]*%\]([\s\S]*?)\[%\/paging%\]/gi, "");
  
  // [%param%] — strip remaining
  result = result.replace(/\[%param\s+\*?\w+%\]([\s\S]*?)\[%\/param%\]/gi, "");
  
  return result;
}

// ── Process breadcrumb blocks ──
function processBreadcrumb(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%breadcrumb%\]([\s\S]*?)\[%\/breadcrumb%\]/gi, (_, body: string) => {
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    let html = "";
    if (headerMatch) html += headerMatch[1];
    html = html.replace(/\[@config:home_url@\]/g, ctx.baseUrl || "/");
    if (footerMatch) html += footerMatch[1];
    
    return html;
  });
}

// ── Process [%advert%] blocks — the core carousel/product ad renderer ──
function processAdvertBlocks(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%advert\s+([^\]]*?)%\]([\s\S]*?)\[%\/advert%\]/gi, (_, attrs: string, body: string) => {
    const typeMatch = attrs.match(/type:'(\w+)'/i);
    const templateMatch = attrs.match(/template:'([^']*)'/i);
    const limitMatch = attrs.match(/limit:'(\d+)'/i);
    const adGroupMatch = attrs.match(/ad_group:'([^']*)'/i);
    
    const type = typeMatch?.[1] || "text";
    const templateName = templateMatch?.[1] || "";
    const limit = parseInt(limitMatch?.[1] || "10");
    const adGroup = adGroupMatch?.[1] || "";
    
    // Get items based on type
    let items: Record<string, any>[] = [];
    
    if (type === "product") {
      // Product adverts use the products list
      items = (ctx.products || []).slice(0, limit).map((p, idx) => ({
        ...p,
        ad_id: p.id,
        headline: p.title,
        url: `/product/${p.id}`,
        image_url: p.images?.[0] || "/placeholder.svg",
        price: p.price,
        rrp: p.compare_at_price || p.price,
        count: idx,
        index: idx,
      }));
    } else {
      // Text/banner adverts
      items = (ctx.adverts || []).slice(0, limit).map((ad, idx) => ({
        ...ad,
        ad_id: ad.id,
        headline: ad.title || ad.name,
        url: ad.link_url || "#",
        count: idx,
        index: idx,
      }));
    }
    
    // Extract param blocks from the advert body
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = body.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    // Resolve body template: if no *body param, use theme template file
    let itemTemplate = bodyMatch?.[1] || "";
    if (!itemTemplate && templateName) {
      itemTemplate = resolveThemeTemplate(templateName, ctx) || "";
    }
    
    // For product type without a template, generate a default product card
    if (!itemTemplate && type === "product") {
      itemTemplate = `
        <div class="col-6 col-md-3 product-thumbnail">
          <div class="product-card">
            <a href="[@url@]">
              <img src="[@image_url@]" alt="[@headline@]" class="img-fluid" loading="lazy" />
              <div class="product-card__info">
                <h3 class="product-card__title">[@headline@]</h3>
                <div class="product-card__price">$[@price@]</div>
              </div>
            </a>
          </div>
        </div>`;
    }
    
    if (items.length === 0 && !headerMatch) return "";
    
    // Render header with total_showing
    let html = "";
    if (headerMatch) {
      let headerHtml = headerMatch[1];
      headerHtml = headerHtml.replace(/\[@total_showing@\]/gi, String(items.length));
      // Process conditionals within header (e.g., [%if [@total_showing@] > 1%])
      headerHtml = processInlineConditionals(headerHtml, items.length);
      html += headerHtml;
    }
    
    // Render each item using the body template
    if (itemTemplate) {
      const counterHtml: string[] = [];
      
      items.forEach((item, idx) => {
        let rendered = itemTemplate;
        
        // Replace all [@field@] tags with item values
        rendered = rendered.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
          if (field === "count") return String(idx);
          if (field === "index") return String(idx);
          if (field === "total_showing") return String(items.length);
          if (item[field] !== undefined && item[field] !== null) return String(item[field]);
          // Try resolving from context
          const ctxVal = resolveField(field, ctx);
          return ctxVal !== undefined && ctxVal !== null ? String(ctxVal) : "";
        });
        
        // Process asset_url tags within item template
        rendered = processAssetUrl(rendered, ctx, item);
        
        // Process inline conditionals (e.g., [%if [@count@] eq '0'%])
        rendered = processItemConditionals(rendered, item, idx, items.length);
        
        // Extract and accumulate SITE_VALUE counter content
        const svRegex = /\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi;
        let svMatch;
        while ((svMatch = svRegex.exec(rendered)) !== null) {
          let counterItem = svMatch[1];
          counterItem = counterItem.replace(/\[@(\w+)@\]/gi, (__, f: string) => {
            if (f === "count") return String(idx);
            if (item[f] !== undefined) return String(item[f]);
            return "";
          });
          counterItem = processItemConditionals(counterItem, item, idx, items.length);
          counterHtml.push(counterItem);
        }
        // Strip SITE_VALUE blocks from rendered output
        rendered = rendered.replace(/\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi, "");
        
        // Strip [%site_value .../%] load tags
        rendered = rendered.replace(/\[%site_value[^\]]*\/%\]/gi, "");
        
        html += rendered;
      });
      
      // If header contained a site_value load point, inject counter HTML
      if (counterHtml.length > 0) {
        // Replace the counter indicators placeholder in the header
        // The carousel-indicators <ol> should contain the counter items
        html = html.replace(/<ol class="carousel-indicators">\s*<\/ol>/i, 
          `<ol class="carousel-indicators">${counterHtml.join("")}</ol>`);
      }
    }
    
    // Render footer
    if (footerMatch) {
      let footerHtml = footerMatch[1];
      footerHtml = footerHtml.replace(/\[@total_showing@\]/gi, String(items.length));
      footerHtml = processInlineConditionals(footerHtml, items.length);
      html += footerHtml;
    }
    
    return html;
  });
}

// Process inline [%if%] conditionals with known values for items
function processItemConditionals(template: string, item: any, idx: number, total: number): string {
  let result = template;
  let safety = 0;
  
  while (result.includes("[%if ") && safety++ < 20) {
    const prev = result;
    result = result.replace(/\[%if\s+([^\]]+?)%\]([\s\S]*?)\[%\/if%\]/i, (_, cond: string, body: string) => {
      // Handle [%else%]
      const parts = body.split(/\[%else%\]/i);
      const ifBody = parts[0];
      const elseBody = parts[1] || "";
      
      // Evaluate the condition with item context
      const resolved = cond
        .replace(/\[@count@\]/gi, String(idx))
        .replace(/\[@index@\]/gi, String(idx))
        .replace(/\[@total_showing@\]/gi, String(total))
        .replace(/\[@(\w+)@\]/gi, (__, f: string) => {
          if (item[f] !== undefined) return String(item[f]);
          return "";
        });
      
      // Simple condition evaluation
      const eqMatch = resolved.match(/^(.+?)\s+eq\s+'([^']*)'$/i);
      if (eqMatch) {
        return eqMatch[1].trim() === eqMatch[2] ? ifBody : elseBody;
      }
      
      const neMatch = resolved.match(/^(.+?)\s+ne\s+'([^']*)'$/i);
      if (neMatch) {
        return neMatch[1].trim() !== neMatch[2] ? ifBody : elseBody;
      }
      
      const gtMatch = resolved.match(/^(.+?)\s*>\s*(.+)$/);
      if (gtMatch) {
        return Number(gtMatch[1].trim()) > Number(gtMatch[2].trim()) ? ifBody : elseBody;
      }
      
      // Truthy check
      const val = resolved.trim();
      const isTruthy = val && val !== "0" && val !== "false" && val !== "";
      return isTruthy ? ifBody : elseBody;
    });
    if (result === prev) break;
  }
  
  return result;
}

// Process [%if%] blocks where we only know total_showing
function processInlineConditionals(template: string, totalShowing: number): string {
  let result = template;
  let safety = 0;
  
  while (result.includes("[%if ") && safety++ < 20) {
    const prev = result;
    result = result.replace(/\[%if\s+([^\]]+?)%\]([\s\S]*?)\[%\/if%\]/i, (_, cond: string, body: string) => {
      const resolved = cond.replace(/\[@total_showing@\]/gi, String(totalShowing));
      
      const gtMatch = resolved.match(/^(.+?)\s*>\s*(.+)$/);
      if (gtMatch) {
        return Number(gtMatch[1].trim()) > Number(gtMatch[2].trim()) ? body : "";
      }
      
      // Default: show content
      return body;
    });
    if (result === prev) break;
  }
  
  return result;
}

// ── Process thumb_list blocks ──
function processThumbList(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%thumb_list\s+([^\]]*?)%\]([\s\S]*?)\[%\/thumb_list%\]/gi, (_, attrs: string, body: string) => {
    const typeMatch = attrs.match(/type:'(\w+)'/i);
    const limitMatch = attrs.match(/limit:'([^']+)'/i);
    const templateMatch = attrs.match(/template:'([^']*)'/i);
    const type = typeMatch?.[1] || "products";
    const limitStr = limitMatch?.[1] || "20";
    const limit = parseInt(limitStr) || 20;
    const templateName = templateMatch?.[1] || "";
    
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = body.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    let items: Record<string, any>[] = [];
    if (type === "products") {
      items = (ctx.products || []).slice(0, limit);
    } else if (type === "content") {
      // Content lists — not supported yet, return empty
      return "";
    } else if (type === "content_reviews") {
      return "";
    }
    
    if (items.length === 0) return "";
    
    // Resolve item template: body param or theme template file
    let itemTemplate = bodyMatch?.[1] || "";
    if (!itemTemplate && templateName) {
      itemTemplate = resolveThemeTemplate(templateName, ctx) || "";
    }
    
    // Default product card if no template
    if (!itemTemplate && type === "products") {
      itemTemplate = `
        <div class="col-6 col-md-3 product-thumbnail">
          <div class="product-card">
            <a href="/product/[@id@]">
              <img src="[@image_url@]" alt="[@title@]" class="img-fluid" loading="lazy" />
              <div class="product-card__info">
                <h3 class="product-card__title">[@title@]</h3>
                <div class="product-card__price">$[@price@]</div>
              </div>
            </a>
          </div>
        </div>`;
    }
    
    let html = "";
    if (headerMatch) html += headerMatch[1];
    
    if (itemTemplate) {
      items.forEach((item, idx) => {
        let rendered = itemTemplate;
        // Prepare product item fields
        const productItem = {
          ...item,
          image_url: resolveStorageUrl(item.images?.[0]) || "/placeholder.svg",
          url: `/product/${item.id}`,
          headline: item.title,
          rrp: item.compare_at_price || item.price,
        };
        
        rendered = rendered.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
          if (field === "count") return String(idx);
          if (field === "index") return String(idx);
          if (field === "total_showing") return String(items.length);
          if (productItem[field] !== undefined && productItem[field] !== null) return String(productItem[field]);
          const ctxVal = resolveField(field, ctx);
          return ctxVal !== undefined && ctxVal !== null ? String(ctxVal) : "";
        });
        
        rendered = processAssetUrl(rendered, ctx, productItem);
        rendered = processItemConditionals(rendered, productItem, idx, items.length);
        
        html += rendered;
      });
    }
    
    if (footerMatch) html += footerMatch[1];
    
    return html;
  });
}

// ── Process block tags: [%crosssell%]...[%/crosssell%] ──
function processBlocks(template: string, ctx: TemplateContext): string {
  const blockRegex = /\[%(\w+)%\]([\s\S]*?)\[%\/\1%\]/g;

  return template.replace(blockRegex, (match, blockName: string, innerTemplate: string) => {
    const systemBlocks = ["ntheme_asset", "format", "nohtml", "filter", "parse", "breadcrumb", "advert", "thumb_list", "paging", "param", "cdn_asset", "ASSET_url", "asset_url", "if", "menu", "content_menu", "cache", "escape", "SITE_VALUE", "site_value", "content_zone"];
    if (systemBlocks.includes(blockName) || systemBlocks.includes(blockName.toLowerCase())) return match;
    
    let items: Record<string, any>[] = [];

    switch (blockName.toLowerCase()) {
      case "crosssell": case "cross_sell": items = ctx.cross_sells || []; break;
      case "upsell": case "up_sell": items = ctx.upsells || []; break;
      case "free_gift": case "freegift": items = ctx.free_gifts || []; break;
      case "variant": case "variants": items = ctx.variants || []; break;
      case "specific": case "specifics": items = ctx.specifics || []; break;
      case "pricing_tier": case "pricing_tiers": items = ctx.pricing_tiers || []; break;
      case "images":
        items = (ctx.product?.images || []).map((url: string, idx: number) => ({ url, index: idx + 1 }));
        break;
      case "tags":
        items = (ctx.product?.tags || []).map((tag: string) => ({ name: tag }));
        break;
      case "adverts": items = ctx.adverts || []; break;
      case "thumb": case "thumblist": items = ctx.thumblist || []; break;
      default: return "";
    }

    if (items.length === 0) return "";

    return items.map((item, index) => {
      return innerTemplate.replace(/\[@(\w+)(?:\|(\w+))?@\]/g, (__, field, format) => {
        if (field === "index") return String(index + 1);
        if (field === "count") return String(items.length);
        if (field === "first") return index === 0 ? "true" : "";
        if (field === "last") return index === items.length - 1 ? "true" : "";
        const val = item[field];
        if (val === undefined || val === null) return "";
        return format ? applyFormat(val, format) : String(val);
      });
    }).join("");
  });
}

// ── Process legacy conditional tags: [?condition?]...[?/condition?] ──
function processLegacyConditionals(template: string, ctx: TemplateContext): string {
  return template.replace(/\[\?(\w+)\?\]([\s\S]*?)\[\?\/\1\?\]/g, (_, condition: string, inner: string) => {
    const value = resolveField(condition, ctx);
    const isTruthy = value !== null && value !== undefined && value !== false && value !== 0 && value !== "" &&
      !(Array.isArray(value) && value.length === 0);
    return isTruthy ? inner : "";
  });
}

// ── Strip comments ──
function stripComments(template: string): string {
  return template.replace(/\[#[^#]*#\]/g, "");
}

// ── Process simple value tags: [@field@] and [@field|format@] ──
function processValueTags(template: string, ctx: TemplateContext): string {
  return template.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_, field: string, format?: string) => {
    const value = resolveField(field, ctx);
    if (value === undefined || value === null) return "";
    return format ? applyFormat(value, format) : String(value);
  });
}

// ── Process legacy includes: [!include slug!] ──
function processLegacyIncludes(template: string, ctx: TemplateContext, depth = 0): string {
  if (depth > 5) return template;
  return template.replace(/\[!include\s+([\w\-]+)!\]/g, (_, slug: string) => {
    const includes = ctx.includes || {};
    if (!includes[slug]) return `<!-- include "${slug}" not found -->`;
    return processLegacyIncludes(includes[slug], ctx, depth + 1);
  });
}

// ── Clean up any remaining unresolved Maropost tags ──
function cleanupUnresolvedTags(template: string): string {
  // Remove remaining self-closing tags
  let result = template.replace(/\[%[^\]]+\/%\]/g, "");
  // Remove remaining [%tag%]...[%/tag%] pairs that weren't handled
  // Only remove simple known-safe ones
  result = result.replace(/\[%\/?(?:set|while|cache|NETO_JS|cdn_asset|tracking_code|site_value|SITE_VALUE|content_zone|parse|escape)[^\]]*%\]/gi, "");
  return result;
}

/**
 * Render a B@SE template string with full Maropost compatibility.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  let result = template;

  // 1. Strip comments
  result = stripComments(result);

  // 2. Strip cache wrappers
  result = processCacheBlocks(result);

  // 3. Load sub-templates [%load_template%]
  result = processLoadTemplate(result, ctx);

  // 4. Legacy includes [!include!]
  result = processLegacyIncludes(result, ctx);

  // 5. Theme asset URLs [%ntheme_asset%]
  result = processThemeAssets(result, ctx);

  // 6. URL tags [%url page:'...'/%]
  result = processUrlTags(result, ctx);

  // 7. Menu blocks [%menu%] — must run BEFORE param stripping
  result = processMenuBlocks(result, ctx);

  // 8. Format blocks [%format%] and [%FORMAT%]
  result = processFormatBlocks(result, ctx);
  result = processFormatCurrency(result, ctx);
  result = processFormatPercent(result);

  // 9. NoHTML blocks [%nohtml%]
  result = processNoHtml(result);

  // 10. Filter blocks [%filter%]
  result = processFilters(result, ctx);

  // 11. URL info tags [%url_info%]
  result = processUrlInfo(result, ctx);

  // 12. Set/While stubs
  result = processSetAndWhile(result);

  // 13. Maropost conditionals [%if%]...[%/if%]
  result = processMaropostConditionals(result, ctx);

  // 14. System tags (breadcrumb, advert, thumb_list, content_menu, etc.)
  result = processSystemTags(result, ctx);

  // 15. Block iterators [%crosssell%], etc.
  result = processBlocks(result, ctx);

  // 16. Legacy conditionals [?condition?]
  result = processLegacyConditionals(result, ctx);

  // 17. Value tags [@field@]
  result = processValueTags(result, ctx);

  // 18. Clean up unresolved tags
  result = cleanupUnresolvedTags(result);

  return result;
}

// ── Exports for documentation/tooling ──

export function extractTags(template: string): { valueTags: string[]; blocks: string[]; conditionals: string[] } {
  const valueTags = [...template.matchAll(/\[@([\w:.]+)(?:\|\w+)?@\]/g)].map((m) => m[1]);
  const blocks = [...template.matchAll(/\[%(\w+)%\]/g)].map((m) => m[1]);
  const conditionals = [...template.matchAll(/\[\?(\w+)\?\]/g)].map((m) => m[1]);
  return {
    valueTags: [...new Set(valueTags)],
    blocks: [...new Set(blocks)],
    conditionals: [...new Set(conditionals)],
  };
}

export const SUPPORTED_TAGS = [
  "title", "sku", "price", "cost_price", "compare_at_price", "description", "short_description",
  "brand", "barcode", "model_number", "status", "slug", "subtitle", "features", "specifications",
  "warranty", "terms_conditions", "availability_description", "custom_label", "product_type",
  "product_subtype", "supplier_item_code", "search_keywords",
  "seo_title", "seo_description", "seo_keywords",
  "promo_price", "promo_tag", "promo_start", "promo_end",
  "image", "image_1", "image_2", "image_3", "image_count",
  "misc1", "misc2", "misc3", "misc4", "misc5",
  "savings", "savings_percent", "has_variants", "variant_count", "has_promo",
  "has_cross_sells", "has_upsells", "specifics_count",
  "shipping_weight", "shipping_length", "shipping_width", "shipping_height",
  "shipping_cubic", "flat_rate_charge", "selling_unit", "base_unit",
  "store_name", "store_currency", "store_email",
  "order_number", "order_total", "order_subtotal", "order_status", "order_date",
  "customer_name", "customer_email", "customer_phone",
];

export const SUPPORTED_BLOCKS = [
  "crosssell", "upsell", "free_gift", "variant", "specific",
  "pricing_tier", "images", "tags", "adverts", "thumb",
];

export const SUPPORTED_FORMATS = [
  "currency", "currency_no_symbol", "integer", "date", "datetime", "date_short",
  "uppercase", "lowercase", "capitalize", "url_encode", "strip_html",
  "truncate_50", "truncate_100", "percentage", "json", "count", "first", "boolean",
];

export const SUPPORTED_CONDITIONALS = [
  "has_variants", "has_promo", "has_cross_sells", "has_upsells",
  "is_active", "tax_free", "tax_inclusive", "virtual_product", "is_kit", "track_inventory",
];

export const EXAMPLE_TEMPLATES: Record<string, string> = {
  product_card: `<div class="product-card">
  <h2>[@title@]</h2>
  <p>[@description@]</p>
  <span>[@price|currency@]</span>
</div>`,
  product_list: `[%thumb_list type:'products' limit:'12'%]
  [%param *header%]<div class="product-grid">[%/param%]
  [%param *footer%]</div>[%/param%]
[%/thumb_list%]`,
  banner_carousel: `[%advert type:'text' template:'carousel' limit:'5'%]
  [%param *header%]<div class="carousel">[%/param%]
  [%param *footer%]</div>[%/param%]
[%/advert%]`,
};
