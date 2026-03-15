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
  /** Store base URL (full domain, e.g. https://mystore.example.com) */
  baseUrl?: string;
  /** SPA base path for internal links (e.g. /store/my-store) */
  basePath?: string;
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
  /** Generic key-value overrides (for item conditionals) */
  [key: string]: any;
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
    "home_url": () => ctx.basePath || ctx.baseUrl || "/",
    "canonical_url": () => ctx.baseUrl || ctx.basePath || "",
    "current_page_type": () => ctx.pageType || "content",
    "templatelang": () => "en-AU",
    "neto_css_version": () => Date.now().toString(),
    "google_verification": () => store.google_verification || "",
    "related_limit": () => "8",
    "store_currency": () => store.default_currency || store.currency || "AUD",
    "defaultcurrency": () => store.default_currency || store.currency || "AUD",
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
    "assets_url": () => ctx.themeAssetBaseUrl || "/assets",
    // Purchasing / inventory config
    "allow_nostock_checkout": () => store.allow_nostock_checkout || "0",
    "webstore_use_preorder_quantity": () => store.webstore_use_preorder_quantity || "0",
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

  // Data fields (e.g., data:rating, data:ratings-count)
  if (field.startsWith("data:")) {
    const dataKey = field.replace("data:", "");
    return ctx[`data:${dataKey}`] || ctx[dataKey] || "";
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

  // Direct context lookup (for item conditionals where item fields are spread onto ctx)
  if (ctx[field] !== undefined) return ctx[field];

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
  return template.replace(/\[%load_template\s+file:\s*(['"])([^'"]+)\1\s*\/?%\]/gi, (_, _quote: string, filePath: string) => {
    const files = ctx.themeFiles || {};
    const includes = ctx.includes || {};
    const cleanPath = filePath.trim().replace(/^\/+/, "");

    const directCandidates = [
      cleanPath,
      `templates/${cleanPath}`,
      `templates/${cleanPath}.template.html`,
      `templates/${cleanPath}.html`,
    ];

    for (const candidate of directCandidates) {
      if (files[candidate]) return processLoadTemplate(files[candidate], ctx, depth + 1);
    }

    const fileName = cleanPath.split("/").pop() || cleanPath;
    const slug = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (includes[slug]) return processLoadTemplate(includes[slug], ctx, depth + 1);

    const lowerPath = cleanPath.toLowerCase();
    for (const key of Object.keys(files)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === lowerPath ||
        lowerKey.endsWith(`/${lowerPath}`) ||
        lowerKey.endsWith(`/${lowerPath}.template.html`) ||
        lowerKey.endsWith(`/${lowerPath}.html`)
      ) {
        return processLoadTemplate(files[key], ctx, depth + 1);
      }
    }

    return `<!-- load_template "${cleanPath}" not found -->`;
  });
}

/** Build a Maropost-compatible product item object from our DB product */
function buildMaropostProductItem(p: Record<string, any>, idx: number, basePath: string): Record<string, any> {
  const save = p.compare_at_price && p.price ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
  const imageUrl = resolveStorageUrl(p.images?.[0]) || "/placeholder.svg";
  return {
    ...p,
    // Maropost field mappings
    ad_id: p.id,
    inventory_id: p.id,
    SKU: p.sku || "",
    sku: p.sku || "",
    name: p.title || "",
    model: p.title || p.model_number || "",
    headline: p.title || "",
    URL: `${basePath}/product/${p.slug || p.id}`,
    url: `${basePath}/product/${p.slug || p.id}`,
    image_url: imageUrl,
    thumb: imageUrl,
    store_price: p.price || 0,
    retail: p.compare_at_price || p.price || 0,
    rrp: p.compare_at_price || p.price || 0,
    save: save,
    inpromo: p.promo_price ? 1 : 0,
    promo_price: p.promo_price || p.price || 0,
    store_quantity: p.stock_on_hand ?? 10, // Default to in-stock
    preorder: p.preorder ? 1 : 0,
    available_preorder_quantity: p.preorder_quantity || 0,
    has_child: (p.has_variants || p.variant_count > 0) ? 1 : 0,
    editable_bundle: p.is_kit ? 1 : 0,
    extra: p.extra || 0,
    min_qty: p.min_qty || p.minimum_quantity || 0,
    reviews: p.review_count || 0,
    "data:rating": p.average_rating || 0,
    rndm: Math.random().toString(36).substring(2, 8),
    count: idx,
    index: idx,
    // Misc fields (dimensions etc.)
    misc40: p.misc40 || p.dimensions || "",
    misc45: p.misc45 || p.length || "",
    short_description: p.short_description || "",
    brand: p.brand || "",
    description: p.description || "",
  };
}

/** Build a Maropost-compatible advert item object */
function buildMaropostAdvertItem(ad: Record<string, any>, idx: number): Record<string, any> {
  return {
    ...ad,
    ad_id: ad.id,
    headline: ad.title || ad.name || "",
    url: ad.link_url || "#",
    image_url: resolveStorageUrl(ad.image_url) || "",
    img_width: ad.image_width || ad.img_width || "2880",
    img_height: ad.image_height || ad.img_height || "810",
    linktext: ad.button_text || ad.linktext || "Learn More",
    description: ad.subtitle || ad.description || "",
    count: idx,
    index: idx,
  };
}

/** Filter themeFiles to only include files under a specific path */
function filterThemeFilesByPath(files: Record<string, string>, pathPrefix: string): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(files)) {
    if (key.toLowerCase().includes(pathPrefix.toLowerCase())) {
      // Re-key to just the filename for resolution
      const parts = key.split("/");
      filtered[parts[parts.length - 1]] = value;
      filtered[key] = value;
    }
  }
  return filtered;
}

function resolveThemeTemplate(templateName: string, ctx: TemplateContext): string | null {
  if (!templateName) return null;
  const files = ctx.themeFiles || {};
  const includes = ctx.includes || {};
  const clean = templateName.trim().replace(/^\/+/, "");
  const hasExt = /\.(html?|template\.html)$/i.test(clean);

  const paths = [
    clean,
    `templates/${clean}`,
    `templates/thumbs/advert/${clean}`,
    `templates/thumbs/product/${clean}`,
    `templates/thumbs/content/${clean}`,
    ...(hasExt ? [] : [
      `templates/${clean}.template.html`,
      `templates/${clean}.html`,
      `templates/thumbs/advert/${clean}.template.html`,
      `templates/thumbs/product/${clean}.template.html`,
      `templates/thumbs/content/${clean}.template.html`,
    ]),
  ];

  for (const p of paths) {
    if (files[p]) return files[p];
  }

  const slug = clean.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  if (includes[slug]) return includes[slug];

  const lowerClean = clean.toLowerCase();
  for (const key of Object.keys(files)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === lowerClean ||
      lowerKey.endsWith(`/${lowerClean}`) ||
      (!hasExt && lowerKey.endsWith(`/${lowerClean}.template.html`)) ||
      (!hasExt && lowerKey.endsWith(`/${lowerClean}.html`))
    ) {
      return files[key];
    }
  }

  return null;
}

// ── Process [%ntheme_asset%]path[%/ntheme_asset%] ──
function processThemeAssets(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%ntheme_asset%\]([\s\S]*?)\[%\/ntheme_asset%\]/gi, (_, path: string) => {
    const trimmed = path.trim();
    // CSS/JS files are already injected via scoped <style>/<script> tags — return empty for src references
    if (trimmed.endsWith(".css") || trimmed.endsWith(".js")) return "";
    // Resolve from themeAssetBaseUrl (binary assets stored in storage bucket)
    if (ctx.themeAssetBaseUrl) {
      return `${ctx.themeAssetBaseUrl}/${trimmed}`;
    }
    // Fallback: try storage URL resolution
    return resolveStorageUrl(trimmed) || "/placeholder.svg";
  });
}

// ── Process Maropost [%if%]...[%elseif%]...[%else%]...[%/if%] ──
function processMaropostConditionals(template: string, ctx: TemplateContext): string {
  // First, pre-resolve all [@...@] tags inside [%if ...%] conditions
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
        
        // Split body by elseif/else markers, preserving their conditions
        const segments: string[] = [];
        const conditions: (string | null)[] = [condition];
        
        // Manually parse elseif/else boundaries in body
        let remaining = body;
        let currentSegment = "";
        
        const boundaryRegex = /\[%(?:elseif\s+([\s\S]*?)|else)%\]/i;
        
        while (remaining.length > 0) {
          const match = boundaryRegex.exec(remaining);
          if (!match) {
            currentSegment += remaining;
            remaining = "";
          } else {
            currentSegment += remaining.slice(0, match.index);
            segments.push(currentSegment);
            currentSegment = "";
            remaining = remaining.slice(match.index + match[0].length);
            
            if (match[1] !== undefined) {
              // elseif
              conditions.push(match[1]);
            } else {
              // else
              conditions.push(null);
            }
          }
        }
        segments.push(currentSegment);
        
        for (let i = 0; i < segments.length && i < conditions.length; i++) {
          const cond = conditions[i];
          if (cond === null) return segments[i]; // else branch
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
  if (!condition) return false;

  // Trim wrapping parentheses repeatedly
  while (condition.startsWith("(") && condition.endsWith(")")) {
    const inner = condition.slice(1, -1).trim();
    if (!inner) break;
    // Make sure the parens are balanced (not part of separate sub-expressions)
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === "(") depth++;
      if (inner[i] === ")") depth--;
      if (depth < 0) { balanced = false; break; }
    }
    if (!balanced) break;
    condition = inner;
  }

  // Support leading operators used by some Neto templates: "or X or Y", "and X and Y"
  condition = condition.replace(/^or\s+/i, "").replace(/^and\s+/i, "").trim();

  // Logical OR / AND — split on word boundaries only
  const orParts = splitLogicalOp(condition, "OR");
  if (orParts.length > 1) return orParts.some((part) => evaluateCondition(part, ctx));

  const andParts = splitLogicalOp(condition, "AND");
  if (andParts.length > 1) return andParts.every((part) => evaluateCondition(part, ctx));

  // NOT / !
  if (condition.startsWith("!") || condition.toUpperCase().startsWith("NOT ")) {
    const inner = condition.replace(/^!|^NOT\s+/i, "").trim();
    return !evaluateCondition(inner, ctx);
  }

  // Comparison operators — use a more specific regex that avoids matching inside quoted strings
  const compMatch = condition.match(/^(.+?)\s+(eq|ne|!=|==|>=|<=|>|<)\s+(.+)$/i) ||
                    condition.match(/^(.+?)\s*(!=|==|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const left = resolveConditionOperand(compMatch[1], ctx);
    const right = resolveConditionOperand(compMatch[3], ctx);
    const op = compMatch[2].toLowerCase();

    switch (op) {
      case "eq":
      case "==":
        return String(left) === String(right);
      case "ne":
      case "!=":
        return String(left) !== String(right);
      case ">":
        return Number(left) > Number(right);
      case "<":
        return Number(left) < Number(right);
      case ">=":
        return Number(left) >= Number(right);
      case "<=":
        return Number(left) <= Number(right);
    }
  }

  const value = resolveConditionOperand(condition, ctx);
  return value !== null && value !== undefined && value !== false && value !== 0 &&
         value !== "" && value !== "0" && String(value).toLowerCase() !== "false";
}

/** Split a condition string by a logical operator (AND/OR), respecting parentheses */
function splitLogicalOp(condition: string, op: string): string[] {
  const regex = new RegExp(`\\s+${op}\\s+`, "gi");
  const parts: string[] = [];
  let depth = 0;
  let lastIndex = 0;
  let match;
  
  // Reset regex
  const testRegex = new RegExp(`\\s+${op}\\s+`, "gi");
  while ((match = testRegex.exec(condition)) !== null) {
    // Check parenthesis depth at this position
    depth = 0;
    for (let i = 0; i < match.index; i++) {
      if (condition[i] === '(') depth++;
      if (condition[i] === ')') depth--;
    }
    if (depth === 0) {
      parts.push(condition.slice(lastIndex, match.index));
      lastIndex = match.index + match[0].length;
    }
  }
  parts.push(condition.slice(lastIndex));
  return parts.length > 1 ? parts : [condition];
}

function resolveConditionOperand(raw: string, ctx: TemplateContext): any {
  const operand = raw.trim();

  // Quoted string literal
  if ((operand.startsWith("'") && operand.endsWith("'")) || (operand.startsWith('"') && operand.endsWith('"'))) {
    return operand.slice(1, -1);
  }

  // [@field@] tags — resolve them
  const tagMatch = operand.match(/^\[@([\w:.]+)(?:\|(\w+))?@\]$/);
  if (tagMatch) {
    const val = resolveField(tagMatch[1], ctx);
    if (val !== undefined && val !== null) {
      return tagMatch[2] ? applyFormat(val, tagMatch[2]) : val;
    }
    return "";
  }

  // Tagged / field values (bare field name)
  const tagValue = resolveTagValue(operand, ctx);
  if (tagValue !== undefined && tagValue !== null && tagValue !== "") return tagValue;

  if (/^(true|false)$/i.test(operand)) return operand.toLowerCase() === "true";
  if (/^-?\d+(?:\.\d+)?$/.test(operand)) return Number(operand);

  return operand;
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
        // #Y-#M-#d format
        if (fmt.includes("#Y") || fmt.includes("#M") || fmt.includes("#d")) {
          return fmt
            .replace("#Y", now.getFullYear().toString())
            .replace("#M", (now.getMonth() + 1).toString())
            .replace("#d", now.getDate().toString())
            .replace("#D", now.getDate().toString());
        }
        return now.toLocaleDateString();
      }
      if (!value || value === "0000-00-00 00:00:00") return "";
      try {
        const d = new Date(value);
        const fmt = formatMatch?.[1] || "";
        if (fmt.includes("#Y") || fmt.includes("#M") || fmt.includes("#d")) {
          return fmt
            .replace("#Y", d.getFullYear().toString())
            .replace("#M", (d.getMonth() + 1).toString())
            .replace("#d", d.getDate().toString())
            .replace("#D", d.getDate().toString());
        }
        return d.toLocaleDateString();
      } catch {
        return value;
      }
    }
    
    if (type === "currency") {
      const num = parseFloat(content.trim());
      if (!isNaN(num)) return `$${num.toFixed(2)}`;
      return content.trim();
    }

    if (type === "percent") {
      const num = parseFloat(content.trim());
      if (!isNaN(num)) return `${Math.round(num)}%`;
      return content.trim();
    }

    if (type === "text") {
      let result = content.trim();
      if (/rmhtml:'1'|nohtml:'1'/i.test(attrs)) {
        result = result.replace(/<[^>]*>/g, "");
      }
      const maxLenMatch = attrs.match(/maxlength:'(\d+)'/i);
      if (maxLenMatch) {
        const maxLen = parseInt(maxLenMatch[1]);
        if (result.length > maxLen) result = result.slice(0, maxLen) + "…";
      }
      return result;
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

// ── Process [%url_encode%]...[%/url_encode%] — URL encoding ──
function processUrlEncode(template: string): string {
  return template.replace(/\[%url_encode%\]([\s\S]*?)\[%\/url_encode%\]/gi, (_, content: string) => {
    return encodeURIComponent(content.trim());
  });
}

// ── Process [%FORMAT type:'date'%]value[%/FORMAT%] (uppercase variant) ──
function processFormatDate(template: string): string {
  return template.replace(/\[%FORMAT\s+type:'date'([^%]*)%\]([\s\S]*?)\[%\/FORMAT%\]/gi, (_, attrs: string, content: string) => {
    const val = content.trim();
    if (!val || val === "0000-00-00 00:00:00") return "";
    try {
      const d = new Date(val);
      const formatMatch = (attrs || "").match(/format:'([^']+)'/i);
      const fmt = formatMatch?.[1] || "";
      if (fmt.includes("#Y") || fmt.includes("#M") || fmt.includes("#d")) {
        return fmt
          .replace("#Y", d.getFullYear().toString())
          .replace("#M", (d.getMonth() + 1).toString())
          .replace("#d", d.getDate().toString())
          .replace("#D", d.getDate().toString());
      }
      return d.toLocaleDateString();
    } catch {
      return val;
    }
  });
}

// ── Process [%format type:'text' rmhtml:'1' maxlength:'50'%]...[%/format%] ──
function processFormatText(template: string): string {
  return template.replace(/\[%(?:format|FORMAT)\s+type:'text'([^%]*)%\]([\s\S]*?)\[%\/(?:format|FORMAT)%\]/gi, (_, attrs: string, content: string) => {
    let result = content.trim();
    if (/rmhtml:'1'|nohtml:'1'/i.test(attrs)) {
      result = result.replace(/<[^>]*>/g, "");
    }
    const maxLenMatch = attrs.match(/maxlength:'(\d+)'/i);
    if (maxLenMatch) {
      const maxLen = parseInt(maxLenMatch[1]);
      if (result.length > maxLen) result = result.slice(0, maxLen) + "…";
    }
    // Handle trim:'LE2R' and wordlength:'N' — truncate by word
    const wordLenMatch = attrs.match(/wordlength:'(\d+)'/i);
    if (wordLenMatch) {
      const wLen = parseInt(wordLenMatch[1]);
      const words = result.split(/\s+/);
      if (words.length > wLen) result = words.slice(0, wLen).join(" ") + "…";
    }
    return result;
  });
}

// ── Process [%ajax_loader%]...[%/ajax_loader%] — keep content ──
function processAjaxLoader(template: string): string {
  return template.replace(/\[%\/?ajax_loader%\]/gi, "");
}

// ── Process [%calc expr /%] — simple math ──
function processCalc(template: string): string {
  return template.replace(/\[%calc\s+([^\]]*?)\s*\/?%\]/gi, (_, expr: string) => {
    try {
      const cleaned = expr.replace(/[^0-9+\-*/. ()]/g, "").trim();
      if (!cleaned) return "0";
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
  const bp = ctx.basePath;
  let result = template.replace(/\[%url\s+([^\]]*?)\/?%\]\[%\/url%\]/gi, (_, attrs: string) => resolveUrlTag(attrs, base, bp));
  result = result.replace(/\[%url\s+([^\]]*?)\/%\]/gi, (_, attrs: string) => resolveUrlTag(attrs, base, bp));
  result = result.replace(/\[%URL\s+([^\]]*?)%\]\[%\/URL%\]/gi, (_, attrs: string) => resolveUrlTag(attrs, base, bp));
  return result;
}

function resolveUrlTag(attrs: string, base: string, basePath?: string): string {
  const pageMatch = attrs.match(/page:'([^']+)'/i);
  const typeMatch = attrs.match(/type:'([^']+)'/i);
  const qsMatch = attrs.match(/qs:'([^']+)'/i);
  const page = pageMatch?.[1] || "";
  const type = typeMatch?.[1] || "";
  const qs = qsMatch?.[1] || "";
  
  const prefix = basePath || base;
  
  let url = prefix;
  switch (page) {
    case "account": url += "/account"; break;
    case "checkout":
      if (type === "cart") url += "/cart";
      else url += "/checkout";
      break;
    case "contact": url += "/contact-us"; break;
    case "wishlist": url += "/wishlist"; break;
    case "home": url = prefix || "/"; break;
    case "products": url += "/products"; break;
    default: url += "/" + page;
  }
  if (type === "write_review") url = `${prefix}/account/write_review`;
  if (qs) url += "?" + qs;
  return url;
}

// ── Process [%menu id:'cat-XXXX'%]...[%/menu%] ──
function processMenuBlocks(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%menu\s+([^\]]*?)%\]([\s\S]*?)\[%\/menu%\]/gi, (_, _attrs: string, body: string) => {
    const categories = ctx.categories || [];
    if (categories.length === 0) return "";

    const preprocessedBody = collapseAssetUrlBlocks(body);
    const levelTemplates: Record<number, string> = {};
    const paramHeaderMatch = preprocessedBody.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const paramFooterMatch = preprocessedBody.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    const levelRegex = /\[%param\s+\*?level_(\d+)%\]([\s\S]*?)\[%\/param%\]/gi;
    let m;
    while ((m = levelRegex.exec(preprocessedBody)) !== null) {
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
        html = html.replace(/\[@url@\]/gi, cat.url || `${ctx.basePath || ""}/products?category=${cat.slug}` || "#");
        html = html.replace(/\[@id@\]/gi, cat.id || "");
        html = html.replace(/\[@css_class@\]/gi, cat.css_class || "");
        html = html.replace(/\[@image_url@\]/gi, resolveStorageUrl(cat.image_url) || "/placeholder.svg");
        
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

    const preprocessedBody = collapseAssetUrlBlocks(body);

    const levelTemplates: Record<number, string> = {};
    const paramHeaderMatch = preprocessedBody.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const paramFooterMatch = preprocessedBody.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    const levelRegex = /\[%param\s+\*?level_(\d+)%\]([\s\S]*?)\[%\/param%\]/gi;
    let m;
    while ((m = levelRegex.exec(preprocessedBody)) !== null) {
      levelTemplates[parseInt(m[1])] = m[2];
    }

    const catMap = new Map<string | null, any[]>();
    for (const cat of categories) {
      const parentId = cat.parent_id || null;
      if (!catMap.has(parentId)) catMap.set(parentId, []);
      catMap.get(parentId)!.push(cat);
    }

    const hasMultipleLevels = Object.keys(levelTemplates).some(k => parseInt(k) > 1);

    function renderCat(cat: any, level: number): string {
      const tmpl = levelTemplates[level] || levelTemplates[1];
      if (!tmpl) return "";

      let html = tmpl;
      html = html.replace(/\[@name@\]/gi, cat.name || "");
      html = html.replace(/\[@url@\]/gi, cat.url || `${ctx.basePath || ""}/products?category=${cat.slug}` || "#");
      html = html.replace(/\[@id@\]/gi, cat.id || "");
      html = html.replace(/\[@image@\]/gi, resolveStorageUrl(cat.image_url) || "/placeholder.svg");
      html = html.replace(/\[@image_url@\]/gi, resolveStorageUrl(cat.image_url) || "/placeholder.svg");
      html = html.replace(/\[@slug@\]/gi, cat.slug || "");
      html = html.replace(/alt="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/gi, `alt="${(cat.name || "Category").replace(/"/g, "&quot;")}"`);
      html = processAssetUrl(html, ctx, cat);
      return html;
    }

    function renderLevel(parentId: string | null, level: number): string {
      const children = catMap.get(parentId) || [];
      if (children.length === 0) return "";
      return children.map(cat => renderCat(cat, level)).join("");
    }

    let result = "";
    if (paramHeaderMatch) result += paramHeaderMatch[1];

    if (!hasMultipleLevels) {
      const allCats = categories.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      result += allCats.map((cat: any) => renderCat(cat, 1)).join("");
    } else {
      result += renderLevel(null, 1);
    }

    if (paramFooterMatch) result += paramFooterMatch[1];
    return result;
  });
}

/**
 * Collapse [%asset_url ...%]...[%/asset_url%] blocks into self-closing placeholders
 * so that nested [%param default%] inside them doesn't break outer param extraction.
 */
function collapseAssetUrlBlocks(body: string): string {
  return body.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:\/asset_url|END\s+asset_url|end\s+asset_url|\/ASSET_url|\/\s*asset_url)%\]/gi,
    (_, attrs: string) => `[%asset_url ${attrs}/%]`
  );
}

// ── Process [%asset_url type:'...' id:'...'%]...[%END asset_url%] or [%/asset_url%] ──
function processAssetUrl(template: string, ctx: TemplateContext, item?: any): string {
  let result = template;
  
  // Block variant FIRST (longer match): [%asset_url ...%]...[%END asset_url%]
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:\/asset_url|END\s+asset_url|end\s+asset_url|\/ASSET_url|\/\s*asset_url)%\]/gi,
    (_, attrs: string) => {
      // Resolve any [@...@] tags in the attrs
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        if (item && item[field] !== undefined) return String(item[field]);
        return String(resolveField(field, ctx) || "");
      });
      return resolveAssetUrlAttrs(resolvedAttrs, ctx, item);
    }
  );
  
  // Self-closing variant: [%asset_url .../%]
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)\/\s*%\]/gi,
    (_, attrs: string) => {
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        if (item && item[field] !== undefined) return String(item[field]);
        return String(resolveField(field, ctx) || "");
      });
      return resolveAssetUrlAttrs(resolvedAttrs, ctx, item);
    }
  );
  
  return result;
}

/** Resolve a storage path to a full public URL */
function resolveStorageUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("//") || path.startsWith("/")) return path;
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
  const thumbMatch = attrs.match(/thumb:'(\w+)'/i);
  const defaultMatch = attrs.match(/default:'([^']+)'/i);
  const type = typeMatch?.[1] || "";
  let id = idMatch?.[1] || "";
  
  // Resolve any [@...@] tags in the id
  id = id.replace(/\[@(\w+)@\]/gi, (_, field: string) => {
    if (item && item[field] !== undefined) return String(item[field]);
    return String(resolveField(field, ctx) || "");
  });
  
  const defaultUrl = defaultMatch?.[1] || "";
  
  switch (type.toLowerCase()) {
    case "adw":
    case "ad":
      if (item?.image_url) return resolveStorageUrl(item.image_url);
      const ad = (ctx.adverts || []).find(a => a.id === id || a.ad_id === id);
      if (ad?.image_url) return resolveStorageUrl(ad.image_url);
      return defaultUrl || "";
    case "category":
      if (item?.image_url) return resolveStorageUrl(item.image_url);
      const cat = (ctx.categories || []).find(c => c.id === id);
      if (cat?.image_url) return resolveStorageUrl(cat.image_url);
      return defaultUrl || "/placeholder.svg";
    case "product":
      // First check item context (current product in loop)
      if (item?.images?.[0]) return resolveStorageUrl(item.images[0]);
      if (item?.image_url) return item.image_url;
      // Look up by ID
      const prodById = (ctx.products || []).find(p => p.id === id);
      if (prodById?.images?.[0]) return resolveStorageUrl(prodById.images[0]);
      // Look up by SKU (Maropost themes use SKU as the id)
      const prodBySku = (ctx.products || []).find(p => p.sku === id);
      if (prodBySku?.images?.[0]) return resolveStorageUrl(prodBySku.images[0]);
      return defaultUrl || "/placeholder.svg";
    default:
      return defaultUrl || "";
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
  return template.replace(/\[%(?:FORMAT|format)\s+type:'currency'%\]([\s\S]*?)\[%\/(?:FORMAT|format)%\]/gi, (_, content: string) => {
    const value = content.trim();
    const num = parseFloat(value);
    if (!isNaN(num)) return `$${num.toFixed(2)}`;
    return value;
  });
}

// ── Process [%format type:'percent'%]value[%/format%] ──
function processFormatPercent(template: string): string {
  return template.replace(/\[%(?:format|FORMAT)\s+type:'percent'%\]([\s\S]*?)\[%\/(?:format|FORMAT)%\]/gi, (_, content: string) => {
    const value = content.trim();
    const num = parseFloat(value);
    if (!isNaN(num)) return `${Math.round(num)}%`;
    return value;
  });
}

// ── Process [%SITE_VALUE id:'counter'%]...[%/SITE_VALUE%] — accumulator/counter blocks ──
function processSiteValueBlocks(template: string): string {
  let result = template.replace(/\[%site_value[^\]]*\/%\]/gi, "");
  result = result.replace(/\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi, "");
  return result;
}

// ── Process [%content_zone id:'...'%]...[%end content_zone%] ──
function processContentZone(template: string): string {
  return template.replace(/\[%content_zone[^\]]*%\]([\s\S]*?)\[%(?:end\s+content_zone|\/content_zone)%\]/gi, "");
}

// ── Process [%DATA id:'count' if:'==' value:'0'%]...[%END DATA%] ──
function processDataBlocks(template: string, item?: any): string {
  return template.replace(
    /\[%DATA\s+id:'(\w+)'\s+if:'([^']+)'\s+value:'([^']*)'%\]([\s\S]*?)\[%(?:END\s+DATA|\/DATA)%\]/gi,
    (_, id: string, op: string, value: string, content: string) => {
      const itemValue = item ? String(item[id] ?? "") : "";
      let match = false;
      switch (op) {
        case "==": match = itemValue === value; break;
        case "!=": match = itemValue !== value; break;
        case ">": match = Number(itemValue) > Number(value); break;
        case "<": match = Number(itemValue) < Number(value); break;
        default: match = itemValue === value;
      }
      return match ? content : "";
    }
  );
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
      const bp = ctx.basePath || "";
      items = (ctx.products || []).slice(0, limit).map((p, idx) => buildMaropostProductItem(p, idx, bp));
    } else {
      // Text/banner adverts — filter by ad_group if specified
      let filteredAdverts = ctx.adverts || [];
      if (adGroup) {
        filteredAdverts = filteredAdverts.filter(a => (a.ad_group || a.placement || "") === adGroup);
      }
      items = filteredAdverts.slice(0, limit).map((ad, idx) => buildMaropostAdvertItem(ad, idx));
    }
    
    // Collapse nested asset_url blocks so param extraction doesn't break
    const processedBody = collapseAssetUrlBlocks(body);
    
    // Extract param blocks from the advert body
    const headerMatch = processedBody.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = processedBody.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = processedBody.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    // Resolve body template: if no *body param, use theme template file
    let itemTemplate = bodyMatch?.[1] || "";
    if (!itemTemplate && templateName) {
      itemTemplate = resolveThemeTemplate(templateName, ctx) || "";
    }
    
    // For product type without a template, try loading the theme's thumb template
    if (!itemTemplate && type === "product") {
      itemTemplate = resolveThemeTemplate("template", { ...ctx, themeFiles: filterThemeFilesByPath(ctx.themeFiles || {}, "thumbs/product") }) 
        || resolveThemeTemplate("thumbs/product/template", ctx)
        || "";
    }
    // Ultimate fallback: default product card
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
    
    // Render items and collect counter HTML
    const counterHtml: string[] = [];
    let itemsHtml = "";

    if (itemTemplate) {
      items.forEach((item, idx) => {
        let rendered = itemTemplate;
        
        // Replace all [@field@] tags with item values
        rendered = rendered.replace(/\[@([\w:.]+)@\]/gi, (__, field: string) => {
          if (field === "count") return String(idx);
          if (field === "index") return String(idx);
          if (field === "total_showing") return String(items.length);
          if (item[field] !== undefined && item[field] !== null) return String(item[field]);
          // Try config fields
          if (field.startsWith("config:") || field.startsWith("CONFIG:")) {
            return resolveConfig(field.replace(/^config:/i, ""), ctx);
          }
          const ctxVal = resolveField(field, ctx);
          return ctxVal !== undefined && ctxVal !== null ? String(ctxVal) : "";
        });
        
        // Process format blocks after field resolution
        rendered = processFormatCurrency(rendered, ctx);
        rendered = processFormatPercent(rendered);
        rendered = processFormatText(rendered);
        rendered = processFormatBlocks(rendered, ctx);
        
        // Process asset_url tags within item template
        rendered = processAssetUrl(rendered, ctx, item);
        
        // Process DATA blocks
        rendered = processDataBlocks(rendered, item);
        
        // Process inline conditionals
        rendered = processItemConditionals(rendered, item, idx, items.length, ctx);
        
        // Clean up per-item template tags
        rendered = processSetAndWhile(rendered);
        rendered = processCacheBlocks(rendered);
        rendered = rendered.replace(/\[%escape%\]([\s\S]*?)\[%\/escape%\]/gi, (__, content: string) => {
          return content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        });
        rendered = rendered.replace(/\[%tracking_code[^\]]*\/?%\]/gi, "");
        rendered = rendered.replace(/\[%IN_WISHLIST[^\]]*%\][\s\S]*?\[%(?:\/\s*IN_WISHLIST|END\s+IN_WISHLIST)\s*%\]/gi, "");
        rendered = rendered.replace(/\[%\/?IN_WISHLIST[^\]]*%\]/gi, "");
        
        // Extract and accumulate SITE_VALUE counter content
        const svRegex = /\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi;
        let svMatch;
        while ((svMatch = svRegex.exec(rendered)) !== null) {
          let counterItem = svMatch[1];
          // Resolve item fields in counter
          counterItem = counterItem.replace(/\[@(\w+)@\]/gi, (__, f: string) => {
            if (f === "count") return String(idx);
            if (item[f] !== undefined) return String(item[f]);
            return "";
          });
          // Process DATA blocks in counter
          counterItem = processDataBlocks(counterItem, { ...item, count: idx });
          // Process conditionals in counter
          counterItem = processItemConditionals(counterItem, item, idx, items.length, ctx);
          counterHtml.push(counterItem);
        }
        // Strip SITE_VALUE blocks from rendered output
        rendered = rendered.replace(/\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi, "");
        rendered = rendered.replace(/\[%site_value[^\]]*\/%\]/gi, "");
        
        // Clean remaining unresolved tags in item
        rendered = rendered.replace(/\[@[\w:.]+@\]/g, "");
        
        itemsHtml += rendered;
      });
    }

    // Build final HTML with header, items, footer
    let html = "";
    
    // Render header with total_showing and counter injection
    if (headerMatch) {
      let headerHtml = headerMatch[1];
      headerHtml = headerHtml.replace(/\[@total_showing@\]/gi, String(items.length));
      
      // Inject counter HTML into site_value load point
      headerHtml = headerHtml.replace(/\[%site_value[^\]]*\/%\]/gi, counterHtml.join(""));
      
      // Process conditionals within header
      headerHtml = processInlineConditionals(headerHtml, items.length, ctx);
      html += headerHtml;
    }
    
    html += itemsHtml;
    
    // Render footer
    if (footerMatch) {
      let footerHtml = footerMatch[1];
      footerHtml = footerHtml.replace(/\[@total_showing@\]/gi, String(items.length));
      footerHtml = processInlineConditionals(footerHtml, items.length, ctx);
      html += footerHtml;
    }
    
    return html;
  });
}

// Process inline [%if%] conditionals with known values for items
function processItemConditionals(template: string, item: any, idx: number, total: number, ctx?: TemplateContext): string {
  let result = template;
  let safety = 0;

  // Build a merged context with item fields + special fields
  const mergedCtx: TemplateContext = {
    ...(ctx || {}),
  };
  // Spread item fields onto merged context for field resolution
  if (item) {
    for (const [key, value] of Object.entries(item)) {
      (mergedCtx as any)[key] = value;
    }
  }
  (mergedCtx as any).count = idx;
  (mergedCtx as any).index = idx;
  (mergedCtx as any).total_showing = total;

  // First resolve [@...@] tags using item values
  result = result.replace(/\[@([\w:.]+)@\]/gi, (__, field: string) => {
    if (field === "count") return String(idx);
    if (field === "index") return String(idx);
    if (field === "total_showing") return String(total);
    if (field.startsWith("config:") || field.startsWith("CONFIG:")) {
      return resolveConfig(field.replace(/^config:/i, ""), mergedCtx);
    }
    if (item && item[field] !== undefined && item[field] !== null) return String(item[field]);
    const ctxVal = resolveField(field, mergedCtx);
    return ctxVal !== undefined && ctxVal !== null ? String(ctxVal) : "";
  });

  // Now process if/elseif/else blocks
  while (result.includes("[%if ") && safety++ < 50) {
    const prev = result;
    result = result.replace(/\[%if\s+([\s\S]*?)%\]([\s\S]*?)\[%\/if%\]/i, (_, cond: string, body: string) => {
      // Split by elseif/else
      const segments: string[] = [];
      const conditions: (string | null)[] = [cond];
      let remaining = body;
      let currentSegment = "";
      const boundaryRegex = /\[%(?:elseif\s+([\s\S]*?)|else)%\]/i;
      
      while (remaining.length > 0) {
        const match = boundaryRegex.exec(remaining);
        if (!match) {
          currentSegment += remaining;
          remaining = "";
        } else {
          currentSegment += remaining.slice(0, match.index);
          segments.push(currentSegment);
          currentSegment = "";
          remaining = remaining.slice(match.index + match[0].length);
          if (match[1] !== undefined) {
            conditions.push(match[1]);
          } else {
            conditions.push(null);
          }
        }
      }
      segments.push(currentSegment);
      
      for (let i = 0; i < segments.length && i < conditions.length; i++) {
        const c = conditions[i];
        if (c === null) return segments[i]; // else branch
        if (evaluateCondition(c, mergedCtx)) return segments[i];
      }
      return "";
    });
    if (result === prev) break;
  }

  return result;
}

// Process [%if%] blocks where we only know total_showing
function processInlineConditionals(template: string, totalShowing: number, ctx?: TemplateContext): string {
  let result = template;
  let safety = 0;

  const evalCtx = { ...(ctx || {}), total_showing: totalShowing } as TemplateContext;

  // Pre-resolve [@total_showing@] and similar
  result = result.replace(/\[@total_showing@\]/gi, String(totalShowing));

  while (result.includes("[%if ") && safety++ < 30) {
    const prev = result;
    result = result.replace(/\[%if\s+([\s\S]*?)%\]([\s\S]*?)\[%\/if%\]/i, (_, cond: string, body: string) => {
      const segments: string[] = [];
      const conditions: (string | null)[] = [cond];
      let remaining = body;
      let currentSegment = "";
      const boundaryRegex = /\[%(?:elseif\s+([\s\S]*?)|else)%\]/i;
      
      while (remaining.length > 0) {
        const match = boundaryRegex.exec(remaining);
        if (!match) {
          currentSegment += remaining;
          remaining = "";
        } else {
          currentSegment += remaining.slice(0, match.index);
          segments.push(currentSegment);
          currentSegment = "";
          remaining = remaining.slice(match.index + match[0].length);
          if (match[1] !== undefined) {
            conditions.push(match[1]);
          } else {
            conditions.push(null);
          }
        }
      }
      segments.push(currentSegment);
      
      for (let i = 0; i < segments.length && i < conditions.length; i++) {
        const c = conditions[i];
        if (c === null) return segments[i];
        if (evaluateCondition(c, evalCtx)) return segments[i];
      }
      return "";
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
    
    const processedBody = collapseAssetUrlBlocks(body);
    const headerMatch = processedBody.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = processedBody.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = processedBody.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    let items: Record<string, any>[] = [];
    if (type === "products") {
      const bp = ctx.basePath || "";
      items = (ctx.products || []).slice(0, limit).map((p, idx) => buildMaropostProductItem(p, idx, bp));
    } else if (type === "content") {
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
    
    // Try theme's thumb template
    if (!itemTemplate && type === "products") {
      itemTemplate = resolveThemeTemplate("template", { ...ctx, themeFiles: filterThemeFilesByPath(ctx.themeFiles || {}, "thumbs/product") })
        || resolveThemeTemplate("thumbs/product/template", ctx)
        || "";
    }
    // Ultimate fallback
    if (!itemTemplate && type === "products") {
      itemTemplate = `
        <div class="col-6 col-md-3 product-thumbnail">
          <div class="product-card">
            <a href="[@url@]">
              <img src="[@image_url@]" alt="[@name@]" class="img-fluid" loading="lazy" />
              <div class="product-card__info">
                <h3 class="product-card__title">[@name@]</h3>
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
        
        // Replace [@field@] tags
        rendered = rendered.replace(/\[@([\w:.]+)@\]/gi, (__, field: string) => {
          if (field === "count") return String(idx);
          if (field === "index") return String(idx);
          if (field === "total_showing") return String(items.length);
          if (field.startsWith("config:") || field.startsWith("CONFIG:")) {
            return resolveConfig(field.replace(/^config:/i, ""), ctx);
          }
          if (item[field] !== undefined && item[field] !== null) return String(item[field]);
          const ctxVal = resolveField(field, ctx);
          return ctxVal !== undefined && ctxVal !== null ? String(ctxVal) : "";
        });
        
        rendered = processFormatCurrency(rendered, ctx);
        rendered = processFormatPercent(rendered);
        rendered = processFormatText(rendered);
        rendered = processFormatBlocks(rendered, ctx);
        rendered = processAssetUrl(rendered, ctx, item);
        rendered = processDataBlocks(rendered, item);
        rendered = processItemConditionals(rendered, item, idx, items.length, ctx);
        rendered = processSetAndWhile(rendered);
        rendered = processCacheBlocks(rendered);
        rendered = rendered.replace(/\[%escape%\]([\s\S]*?)\[%\/escape%\]/gi, (__, content: string) => {
          return content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        });
        rendered = rendered.replace(/\[%tracking_code[^\]]*\/?%\]/gi, "");
        rendered = rendered.replace(/\[%IN_WISHLIST[^\]]*%\][\s\S]*?\[%(?:\/\s*IN_WISHLIST|END\s+IN_WISHLIST)\s*%\]/gi, "");
        rendered = rendered.replace(/\[%\/?IN_WISHLIST[^\]]*%\]/gi, "");
        // Clean remaining unresolved tags
        rendered = rendered.replace(/\[@[\w:.]+@\]/g, "");
        
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

// ── Normalize Maropost syntax variants ──
function normalizeTemplateSyntax(template: string): string {
  let result = template;
  // [%END asset_url%] or [%end param%] → [%/asset_url%] or [%/param%]
  result = result.replace(/\[%\s*END\s+([A-Za-z_]+)\s*%\]/gi, "[%/$1%]");
  // [% / param %] or [%/ if%] → [%/param%]
  result = result.replace(/\[%\s*\/\s*([A-Za-z_]+)\s*%\]/g, "[%/$1%]");
  // [%/param%%] → [%/param%] (double percent at end)
  result = result.replace(/\[%\/([A-Za-z_]+)%%\]/g, "[%/$1%]");
  // [%/if%%] → [%/if%]
  result = result.replace(/%\]%\]/g, "%]");
  return result;
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
  // Remove remaining system tags
  result = result.replace(/\[%\/?(?:set|while|cache|NETO_JS|cdn_asset|tracking_code|site_value|SITE_VALUE|content_zone|parse|escape|ajax_loader|ITEM_KITTING|IN_WISHLIST|url_encode|DATA)[^\]]*%\]/gi, "");
  // Remove IN_WISHLIST blocks entirely
  result = result.replace(/\[%IN_WISHLIST[^\]]*%\][\s\S]*?\[%(?:\/\s*IN_WISHLIST|END\s+IN_WISHLIST)\s*%\]/gi, "");
  // Remove remaining block tags
  result = result.replace(/\[%ITEM_KITTING[^\]]*%\][\s\S]*?\[%\/ITEM_KITTING%\]/gi, "");
  // Remove leftover [@...@] value tags
  result = result.replace(/\[@[\w:.]+(?:\|\w+)?@\]/g, "");
  // Remove leftover [%if%]...[%/if%] that couldn't be resolved
  // (safety: only small blocks to avoid eating large sections)
  result = result.replace(/\[%(?:if|elseif|else|\/if)[^\]]*%\]/gi, "");
  return result;
}

/**
 * Render a B@SE template string with full Maropost compatibility.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  let result = template;

  // 1. Strip comments
  result = stripComments(result);

  // 1b. Normalize syntax variants (END tags, spaced closers, double percents)
  result = normalizeTemplateSyntax(result);

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
  result = processFormatDate(result);
  result = processFormatText(result);

  // 8b. URL encode blocks [%url_encode%]
  result = processUrlEncode(result);

  // 8c. Ajax loader — strip wrappers
  result = processAjaxLoader(result);

  // 9. NoHTML blocks [%nohtml%]
  result = processNoHtml(result);

  // 10. Filter blocks [%filter%]
  result = processFilters(result, ctx);

  // 11. URL info tags [%url_info%]
  result = processUrlInfo(result, ctx);

  // 12. Set/While stubs
  result = processSetAndWhile(result);

  // 13. System tags (breadcrumb, advert, thumb_list, content_menu, etc.)
  result = processSystemTags(result, ctx);

  // 14. Maropost conditionals [%if%]...[%/if%]
  result = processMaropostConditionals(result, ctx);

  // 15. Block iterators [%crosssell%], etc.
  result = processBlocks(result, ctx);

  // 16. Legacy conditionals [?condition?]
  result = processLegacyConditionals(result, ctx);

  // 17. Value tags [@field@]
  result = processValueTags(result, ctx);

  // 18. DATA blocks (global pass)
  result = processDataBlocks(result);

  // 19. Clean up unresolved tags
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
