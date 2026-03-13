/**
 * B@SE Template Engine
 * 
 * Processes Maropost-compatible data tags for dynamic content rendering.
 * 
 * Tag syntax:
 *   [@field@]           — Simple field value (e.g., [@sku@], [@price@], [@title@])
 *   [@field|format@]    — Field with format pipe (e.g., [@price|currency@], [@created_at|date@])
 *   [%block%]...[%/block%]  — Block tags for collections (e.g., [%crosssell%]...[%/crosssell%])
 *   [?condition?]...[?/condition?]  — Conditional tags (e.g., [?has_variants?]...[?/has_variants?])
 *   [#comment#]         — Comments (stripped from output)
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
  shipping?: Record<string, any>;
  store?: Record<string, any>;
  order?: Record<string, any>;
  customer?: Record<string, any>;
}

// Format pipes
function applyFormat(value: any, format: string): string {
  if (value === null || value === undefined) return "";
  switch (format) {
    case "currency":
      return `$${Number(value).toFixed(2)}`;
    case "currency_no_symbol":
      return Number(value).toFixed(2);
    case "integer":
      return Math.round(Number(value)).toString();
    case "date":
      return new Date(value).toLocaleDateString();
    case "datetime":
      return new Date(value).toLocaleString();
    case "date_short":
      return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "uppercase":
      return String(value).toUpperCase();
    case "lowercase":
      return String(value).toLowerCase();
    case "capitalize":
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    case "url_encode":
      return encodeURIComponent(String(value));
    case "strip_html":
      return String(value).replace(/<[^>]*>/g, "");
    case "truncate_50":
      return String(value).length > 50 ? String(value).slice(0, 50) + "…" : String(value);
    case "truncate_100":
      return String(value).length > 100 ? String(value).slice(0, 100) + "…" : String(value);
    case "percentage":
      return `${Number(value)}%`;
    case "json":
      return JSON.stringify(value);
    case "count":
      return Array.isArray(value) ? value.length.toString() : "0";
    case "first":
      return Array.isArray(value) && value.length > 0 ? String(value[0]) : "";
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

// Resolve a dotted field path from context
function resolveField(field: string, ctx: TemplateContext): any {
  // Direct product fields (most common)
  const productFields: Record<string, () => any> = {
    // Core
    title: () => ctx.product?.title,
    sku: () => ctx.product?.sku,
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

    // SEO
    seo_title: () => ctx.product?.seo_title,
    seo_description: () => ctx.product?.seo_description,
    seo_keywords: () => ctx.product?.seo_keywords,

    // Promo
    promo_price: () => ctx.product?.promo_price,
    promo_tag: () => ctx.product?.promo_tag,
    promo_start: () => ctx.product?.promo_start,
    promo_end: () => ctx.product?.promo_end,

    // Misc
    misc1: () => ctx.product?.misc1,
    misc2: () => ctx.product?.misc2,
    misc3: () => ctx.product?.misc3,
    misc4: () => ctx.product?.misc4,
    misc5: () => ctx.product?.misc5,

    // Images
    images: () => ctx.product?.images,
    image: () => ctx.product?.images?.[0],
    image_1: () => ctx.product?.images?.[0],
    image_2: () => ctx.product?.images?.[1],
    image_3: () => ctx.product?.images?.[2],
    image_count: () => ctx.product?.images?.length || 0,

    // Tags
    tags: () => ctx.product?.tags,

    // Booleans
    is_active: () => ctx.product?.is_active,
    tax_free: () => ctx.product?.tax_free,
    tax_inclusive: () => ctx.product?.tax_inclusive,
    virtual_product: () => ctx.product?.virtual_product,
    is_kit: () => ctx.product?.is_kit,
    track_inventory: () => ctx.product?.track_inventory,

    // Dates
    created_at: () => ctx.product?.created_at,
    updated_at: () => ctx.product?.updated_at,

    // Computed
    savings: () => {
      const compare = ctx.product?.compare_at_price;
      const price = ctx.product?.price;
      return compare && price ? Number(compare) - Number(price) : 0;
    },
    savings_percent: () => {
      const compare = ctx.product?.compare_at_price;
      const price = ctx.product?.price;
      return compare && price ? Math.round((1 - Number(price) / Number(compare)) * 100) : 0;
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

    // Shipping
    shipping_weight: () => ctx.shipping?.shipping_weight,
    shipping_length: () => ctx.shipping?.shipping_length,
    shipping_width: () => ctx.shipping?.shipping_width,
    shipping_height: () => ctx.shipping?.shipping_height,
    shipping_cubic: () => ctx.shipping?.shipping_cubic,
    flat_rate_charge: () => ctx.shipping?.flat_rate_charge,
    selling_unit: () => ctx.shipping?.selling_unit,
    base_unit: () => ctx.shipping?.base_unit,

    // Store
    store_name: () => ctx.store?.name,
    store_currency: () => ctx.store?.currency,
    store_email: () => ctx.store?.contact_email,

    // Order
    order_number: () => ctx.order?.order_number,
    order_total: () => ctx.order?.total,
    order_subtotal: () => ctx.order?.subtotal,
    order_status: () => ctx.order?.status,
    order_date: () => ctx.order?.created_at,

    // Customer
    customer_name: () => ctx.customer?.name,
    customer_email: () => ctx.customer?.email,
    customer_phone: () => ctx.customer?.phone,
  };

  const resolver = productFields[field];
  if (resolver) return resolver();

  // Fallback: dot-path resolution (e.g., "product.title", "store.name")
  const parts = field.split(".");
  let obj: any = ctx;
  for (const part of parts) {
    if (obj === null || obj === undefined) return undefined;
    obj = obj[part];
  }
  return obj;
}

// Process block tags: [%crosssell%]...[%/crosssell%]
function processBlocks(template: string, ctx: TemplateContext): string {
  const blockRegex = /\[%(\w+)%\]([\s\S]*?)\[%\/\1%\]/g;

  return template.replace(blockRegex, (_, blockName: string, innerTemplate: string) => {
    let items: Record<string, any>[] = [];

    switch (blockName) {
      case "crosssell":
      case "cross_sell":
        items = ctx.cross_sells || [];
        break;
      case "upsell":
      case "up_sell":
        items = ctx.upsells || [];
        break;
      case "free_gift":
      case "freegift":
        items = ctx.free_gifts || [];
        break;
      case "variant":
      case "variants":
        items = ctx.variants || [];
        break;
      case "specific":
      case "specifics":
        items = ctx.specifics || [];
        break;
      case "pricing_tier":
      case "pricing_tiers":
        items = ctx.pricing_tiers || [];
        break;
      case "images":
        items = (ctx.product?.images || []).map((url: string, idx: number) => ({ url, index: idx + 1 }));
        break;
      case "tags":
        items = (ctx.product?.tags || []).map((tag: string) => ({ name: tag }));
        break;
      default:
        return "";
    }

    if (items.length === 0) return "";

    return items.map((item, index) => {
      // Replace item-level [@field@] tags within the block
      return innerTemplate.replace(/\[@(\w+)(?:\|(\w+))?@\]/g, (__, field, format) => {
        // Special block variables
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

// Process conditional tags: [?condition?]...[?/condition?]
function processConditionals(template: string, ctx: TemplateContext): string {
  const condRegex = /\[\?(\w+)\?\]([\s\S]*?)\[\?\/\1\?\]/g;

  return template.replace(condRegex, (_, condition: string, inner: string) => {
    const value = resolveField(condition, ctx);
    // Truthy check: non-null, non-empty, non-zero, non-false
    const isTruthy = value !== null && value !== undefined && value !== false && value !== 0 && value !== "" &&
      !(Array.isArray(value) && value.length === 0);
    return isTruthy ? inner : "";
  });
}

// Strip comments: [#comment#]
function stripComments(template: string): string {
  return template.replace(/\[#[^#]*#\]/g, "");
}

// Process simple value tags: [@field@] and [@field|format@]
function processValueTags(template: string, ctx: TemplateContext): string {
  return template.replace(/\[@(\w+)(?:\|(\w+))?@\]/g, (_, field: string, format?: string) => {
    const value = resolveField(field, ctx);
    if (value === undefined || value === null) return "";
    return format ? applyFormat(value, format) : String(value);
  });
}

/**
 * Render a B@SE template string with the given context data.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  let result = template;

  // 1. Strip comments
  result = stripComments(result);

  // 2. Process blocks (iterators)
  result = processBlocks(result, ctx);

  // 3. Process conditionals
  result = processConditionals(result, ctx);

  // 4. Process value tags
  result = processValueTags(result, ctx);

  return result;
}

/**
 * Extract all data tags from a template for validation/documentation.
 */
export function extractTags(template: string): { valueTags: string[]; blocks: string[]; conditionals: string[] } {
  const valueTags = [...template.matchAll(/\[@(\w+)(?:\|\w+)?@\]/g)].map((m) => m[1]);
  const blocks = [...template.matchAll(/\[%(\w+)%\]/g)].map((m) => m[1]);
  const conditionals = [...template.matchAll(/\[\?(\w+)\?\]/g)].map((m) => m[1]);
  return {
    valueTags: [...new Set(valueTags)],
    blocks: [...new Set(blocks)],
    conditionals: [...new Set(conditionals)],
  };
}

/** All supported simple tags for documentation / autocomplete */
export const SUPPORTED_TAGS = [
  // Product core
  "title", "sku", "price", "cost_price", "compare_at_price", "description", "short_description",
  "brand", "barcode", "model_number", "status", "slug", "subtitle", "features", "specifications",
  "warranty", "terms_conditions", "availability_description", "custom_label", "product_type",
  "product_subtype", "supplier_item_code", "search_keywords",
  // SEO
  "seo_title", "seo_description", "seo_keywords",
  // Promo
  "promo_price", "promo_tag", "promo_start", "promo_end",
  // Images
  "image", "image_1", "image_2", "image_3", "image_count",
  // Misc
  "misc1", "misc2", "misc3", "misc4", "misc5",
  // Computed
  "savings", "savings_percent", "has_variants", "variant_count", "has_promo",
  "has_cross_sells", "has_upsells", "specifics_count",
  // Shipping
  "shipping_weight", "shipping_length", "shipping_width", "shipping_height",
  "shipping_cubic", "flat_rate_charge", "selling_unit", "base_unit",
  // Store
  "store_name", "store_currency", "store_email",
  // Order
  "order_number", "order_total", "order_subtotal", "order_status", "order_date",
  // Customer
  "customer_name", "customer_email", "customer_phone",
  // Dates
  "created_at", "updated_at",
  // Boolean
  "is_active", "tax_free", "tax_inclusive", "virtual_product", "is_kit", "track_inventory",
];

export const SUPPORTED_FORMATS = [
  "currency", "currency_no_symbol", "integer", "date", "datetime", "date_short",
  "uppercase", "lowercase", "capitalize", "url_encode", "strip_html",
  "truncate_50", "truncate_100", "percentage", "json", "count", "first", "boolean",
];

export const SUPPORTED_BLOCKS = [
  "crosssell", "upsell", "free_gift", "variants", "specifics", "pricing_tiers", "images", "tags",
];

export const SUPPORTED_CONDITIONALS = [
  "has_variants", "has_promo", "has_cross_sells", "has_upsells",
  "brand", "subtitle", "warranty", "promo_tag", "short_description",
  "compare_at_price", "barcode", "model_number", "is_kit", "tax_free",
];

/** Example templates for quick start */
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
