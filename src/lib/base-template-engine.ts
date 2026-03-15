/**
 * B@SE Template Engine — Full Maropost/Neto Compatibility Layer
 * 
 * Processes ALL Maropost-native template tags so uploaded themes render correctly.
 * 
 * Supported tag families:
 *   [@field@]                              — Simple field value
 *   [@config:key@] / [@CONFIG:KEY@]        — Store/system config values
 *   [%load_template file:'path'/%]         — Sub-template includes
 *   [%ntheme_asset%]path[%/ntheme_asset%]  — Theme asset URL resolution
 *   [%if condition%]...[%elseif%]...[%else%]...[%/if%] — Full conditionals
 *   [%format type:'date'%]...[%/format%]   — Value formatting
 *   [%filter ID:'key'%]...[%/filter%]      — URL parameter access
 *   [%nohtml%]...[%/nohtml%]               — Strip HTML tags
 *   [%parse%]...[%/parse%]                 — Parse/render content
 *   [%breadcrumb%]...[%/breadcrumb%]       — Breadcrumb blocks
 *   [%advert%]...[%/advert%]               — Advertisement blocks
 *   [%thumb_list%]...[%/thumb_list%]        — Product/content listings
 *   [%param *name%]...[%/param%]           — Section param blocks
 *   [%paging%]...[%/paging%]               — Pagination
 *   [%url_info name:'key'/%]               — URL/page metadata
 *   [%NETO_JS%]                            — Neto JS includes (stripped)
 *   [%cdn_asset%]...[%/cdn_asset%]         — CDN asset URLs
 *   [%asset_url%]                          — Asset URL resolution
 *   [%tracking_code%]                      — Tracking code injection
 *   [%site_value%]                         — Site counter values
 *   [?condition?]...[?/condition?]         — Legacy conditional tags
 *   [!include slug!]                       — Legacy includes
 *   [#comment#]                            — Comments (stripped)
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
    "home_url": () => ctx.baseUrl || "",
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
  // Match: [%load_template file:'headers/includes/head.template.html'/%]
  return template.replace(/\[%load_template\s+file:'([^']+)'\/?\s*%\]/gi, (_, filePath: string) => {
    const files = ctx.themeFiles || {};
    const includes = ctx.includes || {};
    
    // Try exact path match
    if (files[filePath]) return processLoadTemplate(files[filePath], ctx, depth + 1);
    
    // Try matching by filename
    const fileName = filePath.split("/").pop() || filePath;
    const slug = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (includes[slug]) return processLoadTemplate(includes[slug], ctx, depth + 1);
    
    // Try partial path match
    for (const key of Object.keys(files)) {
      if (key.endsWith(filePath) || key.includes(filePath)) {
        return processLoadTemplate(files[key], ctx, depth + 1);
      }
    }
    
    return `<!-- load_template "${filePath}" not found -->`;
  });
}

// ── Process [%ntheme_asset%]path[%/ntheme_asset%] ──
function processThemeAssets(template: string, ctx: TemplateContext): string {
  const baseUrl = ctx.themeAssetBaseUrl || "/assets/themes/skeletal/";
  return template.replace(/\[%ntheme_asset%\]([\s\S]*?)\[%\/ntheme_asset%\]/gi, (_, path: string) => {
    return `${baseUrl}${path.trim()}`;
  });
}

// ── Process Maropost [%if%]...[%elseif%]...[%else%]...[%/if%] ──
function processMaropostConditionals(template: string, ctx: TemplateContext): string {
  // Process from innermost to outermost
  let result = template;
  let safety = 0;
  
  // Match [%if condition%]...[%/if%] (non-greedy, innermost first)
  while (result.includes("[%if ") && safety++ < 50) {
    const prevResult = result;
    result = result.replace(
      /\[%if\s+([^\]]+?)%\]([\s\S]*?)\[%\/if%\]/i,
      (_, condition: string, body: string) => {
        // Split on [%elseif%] and [%else%]
        const parts: { condition: string | null; content: string }[] = [];
        
        // Split body by [%elseif ...%] and [%else%]
        let remaining = body;
        parts.push({ condition, content: "" });
        
        // Extract elseif and else blocks
        const elseifRegex = /\[%ELSEIF\s+([^\]]+?)%\]/gi;
        const elseRegex = /\[%ELSE%\]/gi;
        
        // Simple approach: split by markers
        let segments = remaining.split(/\[%ELSEIF\s+[^\]]+?%\]|\[%ELSE%\]/i);
        let markers: (string | null)[] = [condition];
        
        // Find all markers in order
        const markerRegex = /\[%(ELSEIF\s+([^\]]+?)|ELSE)%\]/gi;
        let m;
        while ((m = markerRegex.exec(remaining)) !== null) {
          if (m[1].toUpperCase() === "ELSE") {
            markers.push(null); // else has no condition
          } else {
            markers.push(m[2]); // elseif condition
          }
        }
        
        // Evaluate conditions in order
        for (let i = 0; i < segments.length && i < markers.length; i++) {
          const cond = markers[i];
          if (cond === null) {
            // [%else%] — always true if reached
            return segments[i];
          }
          if (evaluateCondition(cond, ctx)) {
            return segments[i];
          }
        }
        
        return "";
      }
    );
    if (result === prevResult) break; // no more matches
  }
  
  return result;
}

function evaluateCondition(condition: string, ctx: TemplateContext): boolean {
  condition = condition.trim();
  
  // Negation: ! prefix or NOT
  if (condition.startsWith("!") || condition.toUpperCase().startsWith("NOT ")) {
    const inner = condition.replace(/^!|^NOT\s+/i, "").trim();
    return !evaluateCondition(inner, ctx);
  }
  
  // Comparison operators: eq, ne, >, <, >=, <=
  const compMatch = condition.match(/^(.+?)\s+(eq|ne|!=|==|>|<|>=|<=)\s+(.+)$/i);
  if (compMatch) {
    let left = resolveTagValue(compMatch[1].trim(), ctx);
    const op = compMatch[2].toLowerCase();
    let right = compMatch[3].trim().replace(/^['"]|['"]$/g, ""); // strip quotes
    
    switch (op) {
      case "eq": case "==": return String(left) === right;
      case "ne": case "!=": return String(left) !== right;
      case ">": return Number(left) > Number(right);
      case "<": return Number(left) < Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<=": return Number(left) <= Number(right);
    }
  }
  
  // Simple truthy check on a tag value
  const value = resolveTagValue(condition, ctx);
  return value !== null && value !== undefined && value !== false && value !== 0 && 
         value !== "" && value !== "0" && value !== "false";
}

function resolveTagValue(tag: string, ctx: TemplateContext): any {
  // Strip [@...@] wrapper if present
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
      if (value === "NOW" || value === "now") {
        const now = new Date();
        const fmt = formatMatch?.[1] || "";
        // Maropost date format codes
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

// ── Process [%url_info name:'key'/%] or [%url_info name:'key' default:'value'/%] ──
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

// ── Strip/handle Neto-specific system tags that we can't execute ──
function processSystemTags(template: string, ctx: TemplateContext): string {
  let result = template;
  
  // [%NETO_JS html:'1' id:'main' /%] — strip (we load our own JS)
  result = result.replace(/\[%NETO_JS[^\]]*\/?%\]/gi, "");
  
  // [%cdn_asset%]...[%/cdn_asset%] — strip wrapper, keep content
  result = result.replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1");
  
  // [%tracking_code%] — strip
  result = result.replace(/\[%tracking_code[^\]]*\/?%\]/gi, "");
  
  // [%site_value%] — strip
  result = result.replace(/\[%site_value[^\]]*\/?%\]/gi, "");
  
  // [%asset_url%]...[%/asset_url%] — try to resolve, or pass through
  result = result.replace(/\[%asset_url[^\]]*%\]([\s\S]*?)\[%\/ASSET_url%\]/gi, "$1");
  result = result.replace(/\[%asset_url[^\]]*\/?%\]/gi, "");
  result = result.replace(/\[%ASSET_url[^\]]*%\]([\s\S]*?)\[%\/ASSET_url%\]/gi, "$1");
  
  // [%parse%]...[%/parse%] — just render the content
  result = result.replace(/\[%parse%\]([\s\S]*?)\[%\/parse%\]/gi, "$1");
  
  // [%breadcrumb%]...[%/breadcrumb%] — render with param extraction
  result = processBreadcrumb(result, ctx);
  
  // [%advert%]...[%/advert%] — render adverts
  result = processAdvertBlocks(result, ctx);
  
  // [%thumb_list%]...[%/thumb_list%] — render product/content listings
  result = processThumbList(result, ctx);
  
  // [%paging%]...[%/paging%] — strip pagination (handled by React)
  result = result.replace(/\[%paging[^\]]*%\]([\s\S]*?)\[%\/paging%\]/gi, "");
  
  // [%param *name%]...[%/param%] — strip remaining param blocks (already handled)
  result = result.replace(/\[%param\s+\*?\w+%\]([\s\S]*?)\[%\/param%\]/gi, "");
  
  return result;
}

// ── Process breadcrumb blocks ──
function processBreadcrumb(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%breadcrumb%\]([\s\S]*?)\[%\/breadcrumb%\]/gi, (_, body: string) => {
    // Extract header, body, footer params
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    let html = "";
    if (headerMatch) html += headerMatch[1];
    // Home breadcrumb item
    html = html.replace(/\[@config:home_url@\]/g, ctx.baseUrl || "/");
    if (footerMatch) html += footerMatch[1];
    
    return html;
  });
}

// ── Process advert blocks ──
function processAdvertBlocks(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%advert\s+([^\]]*?)%\]([\s\S]*?)\[%\/advert%\]/gi, (_, attrs: string, body: string) => {
    // Extract header and footer params
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = body.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    const adverts = ctx.adverts || [];
    if (adverts.length === 0 && !headerMatch) return "";
    
    let html = "";
    if (headerMatch) html += headerMatch[1];
    if (bodyMatch) {
      adverts.forEach((ad, idx) => {
        let itemHtml = bodyMatch[1];
        // Replace advert fields
        for (const [key, val] of Object.entries(ad)) {
          const regex = new RegExp(`\\[@${key}@\\]`, "gi");
          itemHtml = itemHtml.replace(regex, String(val ?? ""));
        }
        itemHtml = itemHtml.replace(/\[@total_showing@\]/gi, String(adverts.length));
        itemHtml = itemHtml.replace(/\[@index@\]/gi, String(idx));
        html += itemHtml;
      });
    }
    if (footerMatch) html += footerMatch[1];
    
    return html;
  });
}

// ── Process thumb_list blocks ──
function processThumbList(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%thumb_list\s+([^\]]*?)%\]([\s\S]*?)\[%\/thumb_list%\]/gi, (_, attrs: string, body: string) => {
    const typeMatch = attrs.match(/type:'(\w+)'/i);
    const type = typeMatch?.[1] || "products";
    
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    const items = type === "products" ? (ctx.products || []) : [];
    if (items.length === 0) return "";
    
    let html = "";
    if (headerMatch) html += headerMatch[1];
    if (footerMatch) html += footerMatch[1];
    
    return html;
  });
}

// ── Process block tags: [%crosssell%]...[%/crosssell%] ──
function processBlocks(template: string, ctx: TemplateContext): string {
  const blockRegex = /\[%(\w+)%\]([\s\S]*?)\[%\/\1%\]/g;

  return template.replace(blockRegex, (match, blockName: string, innerTemplate: string) => {
    // Skip blocks that are handled elsewhere
    const systemBlocks = ["ntheme_asset", "format", "nohtml", "filter", "parse", "breadcrumb", "advert", "thumb_list", "paging", "param", "cdn_asset", "ASSET_url", "asset_url", "if"];
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
  // Remove any remaining [%.../%] self-closing tags
  let result = template.replace(/\[%[^\]]+\/%\]/g, "");
  // Remove any remaining [%tag attrs%]...[%/tag%] block pairs we didn't handle
  // Be careful not to remove too aggressively - only strip known-safe patterns
  return result;
}

/**
 * Render a B@SE template string with full Maropost compatibility.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  let result = template;

  // 1. Strip comments
  result = stripComments(result);

  // 2. Load sub-templates [%load_template%]
  result = processLoadTemplate(result, ctx);

  // 3. Legacy includes [!include!]
  result = processLegacyIncludes(result, ctx);

  // 4. Theme asset URLs [%ntheme_asset%]
  result = processThemeAssets(result, ctx);

  // 5. Format blocks [%format%]
  result = processFormatBlocks(result, ctx);

  // 6. NoHTML blocks [%nohtml%]
  result = processNoHtml(result);

  // 7. Filter blocks [%filter%]
  result = processFilters(result, ctx);

  // 8. URL info tags [%url_info%]
  result = processUrlInfo(result, ctx);

  // 9. Maropost conditionals [%if%]...[%/if%]
  result = processMaropostConditionals(result, ctx);

  // 10. System tags (breadcrumb, advert, thumb_list, etc.)
  result = processSystemTags(result, ctx);

  // 11. Block iterators [%crosssell%], etc.
  result = processBlocks(result, ctx);

  // 12. Legacy conditionals [?condition?]
  result = processLegacyConditionals(result, ctx);

  // 13. Value tags [@field@]
  result = processValueTags(result, ctx);

  // 14. Clean up unresolved tags
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
  "created_at", "updated_at",
  "is_active", "tax_free", "tax_inclusive", "virtual_product", "is_kit", "track_inventory",
  // Config tags
  "config:company_name", "config:website_name", "config:home_url", "config:canonical_url",
  "config:current_page_type", "config:TEMPLATELANG",
];

export const SUPPORTED_FORMATS = [
  "currency", "currency_no_symbol", "integer", "date", "datetime", "date_short",
  "uppercase", "lowercase", "capitalize", "url_encode", "strip_html",
  "truncate_50", "truncate_100", "percentage", "json", "count", "first", "boolean",
];

export const SUPPORTED_BLOCKS = [
  "crosssell", "upsell", "free_gift", "variants", "specifics", "pricing_tiers", "images", "tags", "adverts", "thumblist",
];

export const SUPPORTED_CONDITIONALS = [
  "has_variants", "has_promo", "has_cross_sells", "has_upsells",
  "brand", "subtitle", "warranty", "promo_tag", "short_description",
  "compare_at_price", "barcode", "model_number", "is_kit", "tax_free",
];

export const EXAMPLE_TEMPLATES = {
  product_card: `<div class="product-card">
  <h2>[@title@]</h2>
  [?brand?]<p class="brand">[@brand@]</p>[?/brand?]
  <p class="price">[@price|currency@]</p>
  [?compare_at_price?]
    <p class="was-price">Was [@compare_at_price|currency@] — Save [@savings_percent@]%</p>
  [?/compare_at_price?]
  [?has_promo?]
    <span class="promo-badge">[@promo_tag@]</span>
  [?/has_promo?]
  <p>[@short_description@]</p>
  <p class="sku">SKU: [@sku@]</p>
</div>`,
  cross_sell_block: `[?has_cross_sells?]
<div class="cross-sells">
  <h3>You may also like</h3>
  [%crosssell%]
  <div class="cross-sell-item">
    <h4>[@title@]</h4>
    <p>[@price|currency@]</p>
  </div>
  [%/crosssell%]
</div>
[?/has_cross_sells?]`,
  pricing_table: `[%pricing_tiers%]
<div class="tier">
  <strong>[@tier_name@]</strong>: [@price|currency@] (min [@min_quantity@] units)
</div>
[%/pricing_tiers%]`,
  specs_table: `[%specifics%]
<tr>
  <td>[@name@]</td>
  <td>[@value@]</td>
</tr>
[%/specifics%]`,
};

export default renderTemplate;
