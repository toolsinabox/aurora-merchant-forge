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
  reviews?: Record<string, any>[];
  shipping?: Record<string, any>;
  store?: Record<string, any>;
  order?: Record<string, any>;
  customer?: Record<string, any>;
  cart?: Record<string, any>;
  cart_items?: Record<string, any>[];
  wishlist_items?: Record<string, any>[];
  locations?: Record<string, any>[];
  addresses?: Record<string, any>[];
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
    case "count": return Array.isArray(value) ? value.length.toString() : "0";
    case "first": return Array.isArray(value) && value.length > 0 ? String(value[0]) : "";
    case "boolean": return value ? "Yes" : "No";
    case "nl2br": return String(value).replace(/\n/g, "<br>");
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
    "store_name": () => store.name || "",
    "home_url": () => ctx.basePath || ctx.baseUrl || "/",
    "canonical_url": () => ctx.baseUrl || ctx.basePath || "",
    "current_page_type": () => ctx.pageType || "content",
    "templatelang": () => "en-AU",
    "template_lang": () => "en-AU",
    "neto_css_version": () => Date.now().toString(),
    "google_verification": () => store.google_verification || "",
    "related_limit": () => "8",
    "store_currency": () => store.default_currency || store.currency || "AUD",
    "defaultcurrency": () => store.default_currency || store.currency || "AUD",
    "currency_symbol": () => store.currency_symbol || "$",
    "contact_email": () => store.contact_email || "",
    "phone": () => store.phone || "",
    "address": () => store.address || "",
    "logo_url": () => store.logo_url || "",
    "logo": () => store.logo_url || "",
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
    "show_qty": () => "1",
    "show_brand": () => "1",
    "show_sku": () => "1",
    "show_stock": () => "1",
    "show_save": () => "1",
    "show_tax_info": () => "0",
    "tax_label": () => store.tax_label || "inc. GST",
    "tax_rate": () => store.tax_rate || "10",
    "assets_url": () => ctx.themeAssetBaseUrl || "/assets",
    // Purchasing / inventory config
    "allow_nostock_checkout": () => store.allow_nostock_checkout || "0",
    "webstore_use_preorder_quantity": () => store.webstore_use_preorder_quantity || "0",
    "items_per_page": () => store.items_per_page || "24",
    "default_sort": () => store.default_sort || "relevance",
    // Shipping
    "free_shipping_threshold": () => store.free_shipping_threshold || "0",
    "shipping_from": () => store.shipping_from || store.address || "",
    // Social media — empty by default (themes conditionally show these)
    "social_facebook": () => store.social_facebook || "",
    "social_twitter": () => store.social_twitter || "",
    "social_instagram": () => store.social_instagram || "",
    "social_youtube": () => store.social_youtube || "",
    "social_pinterest": () => store.social_pinterest || "",
    "social_google_plus": () => "",
    "social_tumblr": () => "",
    "social_linkedin": () => store.social_linkedin || "",
    "social_tiktok": () => store.social_tiktok || "",
    // Footer fields
    "abn": () => store.abn || "",
    "company_abn": () => store.abn || store.company_abn || "",
    "copyright_year": () => new Date().getFullYear().toString(),
    // Cart URLs
    "cart_url": () => `${ctx.basePath || ""}/cart`,
    "checkout_url": () => `${ctx.basePath || ""}/checkout`,
    "account_url": () => `${ctx.basePath || ""}/account`,
    "wishlist_url": () => `${ctx.basePath || ""}/wishlist`,
    "compare_url": () => `${ctx.basePath || ""}/compare`,
    "login_url": () => `${ctx.basePath || ""}/login`,
    "register_url": () => `${ctx.basePath || ""}/register`,
    "search_url": () => `${ctx.basePath || ""}/products`,
    // Cart data
    "cart_count": () => ctx.cart?.totalItems?.toString() || ctx.cart_items?.length?.toString() || "0",
    "cart_total": () => ctx.cart?.totalPrice ? `$${Number(ctx.cart.totalPrice).toFixed(2)}` : "$0.00",
    "cart_subtotal": () => ctx.cart?.totalPrice ? `$${Number(ctx.cart.totalPrice).toFixed(2)}` : "$0.00",
    // User state
    "is_logged_in": () => ctx.customer ? "1" : "0",
    "customer_name": () => ctx.customer?.name || "",
    "customer_email": () => ctx.customer?.email || "",
    "customer_first_name": () => ctx.customer?.name?.split(" ")[0] || "",
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
    name: () => ctx.product?.title || ctx.product?.name,
    sku: () => ctx.product?.sku,
    SKU: () => ctx.product?.sku,
    inventory_id: () => ctx.product?.id,
    product_id: () => ctx.product?.id,
    price: () => ctx.product?.price,
    store_price: () => ctx.product?.price,
    retail_price: () => ctx.product?.price,
    price_inc: () => ctx.product?.price,
    price_ex: () => { const p = Number(ctx.product?.price || 0); const rate = Number(ctx.store?.tax_rate || 10); return (p / (1 + rate / 100)).toFixed(2); },
    cost_price: () => ctx.product?.cost_price,
    compare_at_price: () => ctx.product?.compare_at_price,
    rrp: () => ctx.product?.compare_at_price || ctx.product?.price,
    rrp_inc: () => ctx.product?.compare_at_price || ctx.product?.price,
    rrp_ex: () => { const p = Number(ctx.product?.compare_at_price || ctx.product?.price || 0); const rate = Number(ctx.store?.tax_rate || 10); return (p / (1 + rate / 100)).toFixed(2); },
    description: () => ctx.product?.description,
    short_description: () => ctx.product?.short_description,
    brand: () => ctx.product?.brand,
    barcode: () => ctx.product?.barcode,
    model_number: () => ctx.product?.model_number,
    model: () => ctx.product?.model_number || ctx.product?.title,
    status: () => ctx.product?.status,
    slug: () => ctx.product?.slug,
    subtitle: () => ctx.product?.subtitle,
    headline: () => ctx.product?.title,
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
    misc6: () => ctx.product?.misc6,
    misc7: () => ctx.product?.misc7,
    misc8: () => ctx.product?.misc8,
    misc9: () => ctx.product?.misc9,
    misc10: () => ctx.product?.misc10,
    misc40: () => ctx.product?.misc40 || ctx.product?.dimensions || "",
    misc45: () => ctx.product?.misc45 || ctx.product?.length || "",
    images: () => ctx.product?.images,
    image: () => ctx.product?.images?.[0],
    image_url: () => resolveStorageUrl(ctx.product?.images?.[0]) || "",
    thumb_url: () => resolveStorageUrl(ctx.product?.images?.[0]) || "",
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
    date_added: () => ctx.product?.created_at,
    date_updated: () => ctx.product?.updated_at,
    // Stock fields
    store_quantity: () => ctx.product?.stock_on_hand ?? 10,
    available_quantity: () => ctx.product?.stock_on_hand ?? 10,
    committed_quantity: () => ctx.product?.committed_quantity || 0,
    stock_on_hand: () => ctx.product?.stock_on_hand ?? 10,
    preorder: () => ctx.product?.preorder ? 1 : 0,
    available_preorder_quantity: () => ctx.product?.preorder_quantity || 0,
    // URLs
    URL: () => `${ctx.basePath || ""}/product/${ctx.product?.slug || ctx.product?.id}`,
    url: () => `${ctx.basePath || ""}/product/${ctx.product?.slug || ctx.product?.id}`,
    add_to_cart_url: () => "#",
    wishlist_url: () => `${ctx.basePath || ""}/wishlist`,
    compare_url: () => `${ctx.basePath || ""}/compare`,
    // Computed
    savings: () => {
      const c = ctx.product?.compare_at_price, p = ctx.product?.price;
      return c && p ? Number(c) - Number(p) : 0;
    },
    save: () => {
      const c = ctx.product?.compare_at_price, p = ctx.product?.price;
      return c && p ? Math.round((1 - Number(p) / Number(c)) * 100) : 0;
    },
    savings_percent: () => {
      const c = ctx.product?.compare_at_price, p = ctx.product?.price;
      return c && p ? Math.round((1 - Number(p) / Number(c)) * 100) : 0;
    },
    has_variants: () => (ctx.variants?.length || 0) > 0,
    variant_count: () => ctx.variants?.length || 0,
    has_child: () => (ctx.variants?.length || 0) > 0 ? 1 : 0,
    has_promo: () => {
      const p = ctx.product;
      if (!p?.promo_price) return false;
      const now = new Date();
      return (!p.promo_start || new Date(p.promo_start) <= now) &&
             (!p.promo_end || new Date(p.promo_end) >= now);
    },
    inpromo: () => {
      const p = ctx.product;
      if (!p?.promo_price) return 0;
      const now = new Date();
      return (!p.promo_start || new Date(p.promo_start) <= now) &&
             (!p.promo_end || new Date(p.promo_end) >= now) ? 1 : 0;
    },
    has_cross_sells: () => (ctx.cross_sells?.length || 0) > 0,
    has_upsells: () => (ctx.upsells?.length || 0) > 0,
    specifics_count: () => ctx.specifics?.length || 0,
    editable_bundle: () => ctx.product?.is_kit ? 1 : 0,
    min_qty: () => ctx.product?.minimum_quantity || ctx.product?.min_qty || 0,
    extra: () => ctx.product?.extra || 0,
    reviews: () => ctx.product?.review_count || 0,
    "data:rating": () => ctx.product?.average_rating || 0,
    "data:ratings-count": () => ctx.product?.review_count || 0,
    // Shipping fields
    shipping_weight: () => ctx.shipping?.shipping_weight,
    shipping_length: () => ctx.shipping?.shipping_length,
    shipping_width: () => ctx.shipping?.shipping_width,
    shipping_height: () => ctx.shipping?.shipping_height,
    shipping_cubic: () => ctx.shipping?.shipping_cubic,
    flat_rate_charge: () => ctx.shipping?.flat_rate_charge,
    selling_unit: () => ctx.shipping?.selling_unit,
    base_unit: () => ctx.shipping?.base_unit,
    // Store fields
    store_name: () => ctx.store?.name,
    store_currency: () => ctx.store?.currency,
    store_email: () => ctx.store?.contact_email,
    // Order fields
    order_number: () => ctx.order?.order_number,
    order_total: () => ctx.order?.total,
    order_subtotal: () => ctx.order?.subtotal,
    order_status: () => ctx.order?.status,
    order_date: () => ctx.order?.created_at,
    // Customer fields
    customer_name: () => ctx.customer?.name,
    customer_email: () => ctx.customer?.email,
    customer_phone: () => ctx.customer?.phone,
    // Category fields (for category pages)
    category_name: () => ctx.content?.name || ctx.content?.title || "",
    category_url: () => ctx.content?.url || "",
    category_description: () => ctx.content?.description || "",
    category_image: () => ctx.content?.image_url || "",
    // Page-level fields
    page_content: () => ctx.content?.description || ctx.content?.content || "",
    page_title: () => ctx.content?.title || ctx.store?.name || "",
    total_showing: () => String((ctx.products || ctx.adverts || []).length),
    rndm: () => Math.random().toString(36).substring(2, 8),
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
  return template.replace(/\[%load_template\s+(?:file:\s*)?(['"])([^'"]+)\1\s*\/?%\]/gi, (_, _quote: string, filePath: string) => {
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
  const saveDollar = p.compare_at_price && p.price ? (Number(p.compare_at_price) - Number(p.price)).toFixed(2) : "0.00";
  const imageUrl = resolveStorageUrl(p.images?.[0]) || "/placeholder.svg";
  const taxRate = 10; // default GST
  const priceNum = Number(p.price || 0);
  const rrpNum = Number(p.compare_at_price || p.price || 0);
  return {
    ...p,
    // Maropost field mappings
    ad_id: p.id,
    inventory_id: p.id,
    product_id: p.id,
    SKU: p.sku || "",
    sku: p.sku || "",
    name: p.title || "",
    model: p.title || p.model_number || "",
    headline: p.title || "",
    subtitle: p.subtitle || "",
    URL: `${basePath}/product/${p.slug || p.id}`,
    url: `${basePath}/product/${p.slug || p.id}`,
    add_to_cart_url: "#",
    wishlist_url: `${basePath}/wishlist`,
    compare_url: `${basePath}/compare`,
    image_url: imageUrl,
    thumb: imageUrl,
    thumb_url: imageUrl,
    image_url_small: imageUrl,
    image_url_medium: imageUrl,
    image_url_large: imageUrl,
    store_price: p.price || 0,
    price_inc: priceNum.toFixed(2),
    price_ex: (priceNum / (1 + taxRate / 100)).toFixed(2),
    retail: rrpNum,
    rrp: rrpNum,
    rrp_inc: rrpNum.toFixed(2),
    rrp_ex: (rrpNum / (1 + taxRate / 100)).toFixed(2),
    save: save,
    save_dollar: saveDollar,
    save_percent: save,
    inpromo: p.promo_price ? 1 : 0,
    promo_price: p.promo_price || p.price || 0,
    store_quantity: p.stock_on_hand ?? 10,
    available_quantity: p.stock_on_hand ?? 10,
    committed_quantity: p.committed_quantity || 0,
    preorder: p.preorder ? 1 : 0,
    available_preorder_quantity: p.preorder_quantity || 0,
    has_child: (p.has_variants || p.variant_count > 0) ? 1 : 0,
    editable_bundle: p.is_kit ? 1 : 0,
    extra: p.extra || 0,
    min_qty: p.min_qty || p.minimum_quantity || 0,
    reviews: p.review_count || 0,
    "data:rating": p.average_rating || 0,
    "data:ratings-count": p.review_count || 0,
    rndm: Math.random().toString(36).substring(2, 8),
    count: idx,
    index: idx,
    // Date fields
    date_added: p.created_at || "",
    date_updated: p.updated_at || "",
    // Category fields
    category_name: p.category_name || "",
    category_url: p.category_url || "",
    // Misc fields (dimensions etc.)
    misc1: p.misc1 || "",
    misc2: p.misc2 || "",
    misc3: p.misc3 || "",
    misc4: p.misc4 || "",
    misc5: p.misc5 || "",
    misc40: p.misc40 || p.dimensions || "",
    misc45: p.misc45 || p.length || "",
    short_description: p.short_description || "",
    brand: p.brand || "",
    description: p.description || "",
    // Custom label / badge
    custom_label: p.custom_label || p.promo_tag || "",
  };
}

/** Build a Maropost-compatible advert item object */
function buildMaropostAdvertItem(ad: Record<string, any>, idx: number): Record<string, any> {
  return {
    ...ad,
    ad_id: ad.id,
    headline: ad.title || ad.name || "",
    name: ad.name || ad.title || "",
    url: ad.link_url || "#",
    image_url: resolveStorageUrl(ad.image_url) || "",
    image_url_mobile: resolveStorageUrl(ad.image_url_mobile) || resolveStorageUrl(ad.image_url) || "",
    image_url_tablet: resolveStorageUrl(ad.image_url_tablet) || resolveStorageUrl(ad.image_url) || "",
    img_width: ad.image_width || ad.img_width || "2880",
    img_height: ad.image_height || ad.img_height || "810",
    linktext: ad.button_text || ad.linktext || "Learn More",
    description: ad.subtitle || ad.description || "",
    subtitle: ad.subtitle || "",
    button_text: ad.button_text || "",
    count: idx,
    index: idx,
    rndm: Math.random().toString(36).substring(2, 8),
  };
}

/** Filter themeFiles to only include files under a specific path */
function filterThemeFilesByPath(files: Record<string, string>, pathPrefix: string): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(files)) {
    if (key.toLowerCase().includes(pathPrefix.toLowerCase())) {
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
    // Resolve ALL asset types (including CSS/JS) to the storage bucket URL
    if (ctx.themeAssetBaseUrl) {
      return `${ctx.themeAssetBaseUrl}/${trimmed}`;
    }
    return resolveStorageUrl(trimmed) || "/placeholder.svg";
  });
}

// ── Find the matching [%/if%] for the [%if ...%] at position `start`, handling nesting ──
function findMatchingEndIf(template: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < template.length) {
    const ifMatch = template.slice(i).match(/^\[%if\s+/i);
    const endMatch = template.slice(i).match(/^\[%\/if%\]/i);
    if (ifMatch && i !== start) {
      depth++;
      i += ifMatch[0].length;
    } else if (endMatch) {
      if (depth === 0) return i;
      depth--;
      i += endMatch[0].length;
    } else {
      i++;
    }
  }
  return -1; // no matching [%/if%]
}

// ── Process Maropost [%if%]...[%elseif%]...[%else%]...[%/if%] with proper nesting ──
function processMaropostConditionals(template: string, ctx: TemplateContext): string {
  let result = template;
  let safety = 0;

  while (safety++ < 200) {
    // Find the innermost [%if ...%] that has no nested [%if inside its body
    // We do this by finding [%if%] tags and processing from the inside out
    const ifRegex = /\[%if\s+([\s\S]*?)%\]/gi;
    let match: RegExpExecArray | null;
    let found = false;
    
    // Reset regex
    ifRegex.lastIndex = 0;
    
    // Find all [%if%] positions, then process the last one first (innermost)
    const ifPositions: { index: number; condition: string; fullMatch: string }[] = [];
    while ((match = ifRegex.exec(result)) !== null) {
      ifPositions.push({ index: match.index, condition: match[1], fullMatch: match[0] });
    }
    
    if (ifPositions.length === 0) break;
    
    // Process from last to first to handle innermost blocks first
    for (let p = ifPositions.length - 1; p >= 0; p--) {
      const pos = ifPositions[p];
      const bodyStart = pos.index + pos.fullMatch.length;
      const endIfPos = findMatchingEndIf(result, pos.index);
      if (endIfPos === -1) continue;
      
      const body = result.slice(bodyStart, endIfPos);
      
      // Check if body contains nested [%if — skip if so (will be processed first on next pass)
      if (/\[%if\s+/i.test(body)) continue;
      
      // Pre-resolve [@...@] in condition
      let resolvedCond = pos.condition.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_: string, field: string, format?: string) => {
        const value = resolveField(field, ctx);
        if (value === undefined || value === null) return "";
        return format ? applyFormat(value, format) : String(value);
      });
      
      // Parse segments: if / elseif / else
      const segments: string[] = [];
      const conditions: (string | null)[] = [resolvedCond];
      let remaining = body;
      let currentSegment = "";
      // Match elseif or else at the TOP level only (no nested ifs to worry about here)
      const boundaryRegex = /\[%(?:elseif\s+([\s\S]*?)|else)%\]/i;
      
      while (remaining.length > 0) {
        const bMatch = boundaryRegex.exec(remaining);
        if (!bMatch) {
          currentSegment += remaining;
          remaining = "";
        } else {
          currentSegment += remaining.slice(0, bMatch.index);
          segments.push(currentSegment);
          currentSegment = "";
          remaining = remaining.slice(bMatch.index + bMatch[0].length);
          if (bMatch[1] !== undefined) {
            // elseif — pre-resolve tags in condition
            let elseifCond = bMatch[1].replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_: string, field: string, format?: string) => {
              const value = resolveField(field, ctx);
              if (value === undefined || value === null) return "";
              return format ? applyFormat(value, format) : String(value);
            });
            conditions.push(elseifCond);
          } else {
            conditions.push(null); // else
          }
        }
      }
      segments.push(currentSegment);
      
      // Evaluate
      let replacement = "";
      for (let i = 0; i < segments.length && i < conditions.length; i++) {
        const c = conditions[i];
        if (c === null) { replacement = segments[i]; break; }
        if (evaluateCondition(c, ctx)) { replacement = segments[i]; break; }
      }
      
      // Replace the entire [%if ...%]...[%/if%] block
      result = result.slice(0, pos.index) + replacement + result.slice(endIfPos + "[%/if%]".length);
      found = true;
      break; // restart from scratch since positions shifted
    }
    
    if (!found) break;
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

  // Support leading operators used by some Neto templates
  condition = condition.replace(/^or\s+/i, "").replace(/^and\s+/i, "").trim();

  // Logical OR / AND — split on word boundaries only
  const orParts = splitLogicalOp(condition, "OR");
  if (orParts.length > 1) return orParts.some((part) => evaluateCondition(part, ctx));

  const andParts = splitLogicalOp(condition, "AND");
  if (andParts.length > 1) return andParts.every((part) => evaluateCondition(part, ctx));

  // NOT / !
  if (condition.startsWith("!") || /^NOT\s+/i.test(condition)) {
    const inner = condition.replace(/^!|^NOT\s+/i, "").trim();
    return !evaluateCondition(inner, ctx);
  }

  // "contains" operator: field contains 'value'
  const containsMatch = condition.match(/^(.+?)\s+contains\s+['"]([^'"]*)['"]\s*$/i);
  if (containsMatch) {
    const left = String(resolveConditionOperand(containsMatch[1], ctx) || "");
    return left.toLowerCase().includes(containsMatch[2].toLowerCase());
  }

  // "starts_with" operator
  const startsMatch = condition.match(/^(.+?)\s+starts_with\s+['"]([^'"]*)['"]\s*$/i);
  if (startsMatch) {
    const left = String(resolveConditionOperand(startsMatch[1], ctx) || "");
    return left.toLowerCase().startsWith(startsMatch[2].toLowerCase());
  }

  // "ends_with" operator
  const endsMatch = condition.match(/^(.+?)\s+ends_with\s+['"]([^'"]*)['"]\s*$/i);
  if (endsMatch) {
    const left = String(resolveConditionOperand(endsMatch[1], ctx) || "");
    return left.toLowerCase().endsWith(endsMatch[2].toLowerCase());
  }

  // "IN" operator: field IN 'val1,val2,val3'
  const inMatch = condition.match(/^(.+?)\s+IN\s+['"]([^'"]*)['"]\s*$/i);
  if (inMatch) {
    const left = String(resolveConditionOperand(inMatch[1], ctx) || "");
    const values = inMatch[2].split(",").map(v => v.trim().toLowerCase());
    return values.includes(left.toLowerCase());
  }

  // "NOT IN" operator
  const notInMatch = condition.match(/^(.+?)\s+NOT\s+IN\s+['"]([^'"]*)['"]\s*$/i);
  if (notInMatch) {
    const left = String(resolveConditionOperand(notInMatch[1], ctx) || "");
    const values = notInMatch[2].split(",").map(v => v.trim().toLowerCase());
    return !values.includes(left.toLowerCase());
  }

  // Comparison operators — expanded set
  const compMatch = condition.match(/^(.+?)\s+(eq|ne|!=|==|>=|<=|>|<|gt|lt|gte|lte|is|isnot)\s+(.+)$/i) ||
                    condition.match(/^(.+?)\s*(!=|==|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const left = resolveConditionOperand(compMatch[1], ctx);
    const right = resolveConditionOperand(compMatch[3], ctx);
    const op = compMatch[2].toLowerCase();

    switch (op) {
      case "eq":
      case "==":
      case "is":
        return String(left) === String(right);
      case "ne":
      case "!=":
      case "isnot":
        return String(left) !== String(right);
      case ">":
      case "gt":
        return Number(left) > Number(right);
      case "<":
      case "lt":
        return Number(left) < Number(right);
      case ">=":
      case "gte":
        return Number(left) >= Number(right);
      case "<=":
      case "lte":
        return Number(left) <= Number(right);
    }
  }

  const value = resolveConditionOperand(condition, ctx);
  return value !== null && value !== undefined && value !== false && value !== 0 &&
         value !== "" && value !== "0" && String(value).toLowerCase() !== "false";
}

/** Split a condition string by a logical operator (AND/OR), respecting parentheses */
function splitLogicalOp(condition: string, op: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let lastIndex = 0;
  
  const testRegex = new RegExp(`\\s+${op}\\s+`, "gi");
  let match;
  while ((match = testRegex.exec(condition)) !== null) {
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

  // config:key bare reference (common in Maropost: [%if config:show_price%])
  if (/^config:/i.test(operand)) {
    return resolveConfig(operand.replace(/^config:/i, ""), ctx);
  }

  // Check variables stored by [%set%]
  if ((ctx as any).__variables?.[operand] !== undefined) {
    return (ctx as any).__variables[operand];
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

// ── Process [%format type:'...' ...%]value[%/format%] ──
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

    if (type === "percent" || type === "percentage") {
      const num = parseFloat(content.trim());
      if (!isNaN(num)) return `${Math.round(num)}%`;
      return content.trim();
    }

    if (type === "number") {
      const num = parseFloat(content.trim());
      if (!isNaN(num)) return num.toLocaleString();
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
      const wordLenMatch = attrs.match(/wordlength:'(\d+)'/i);
      if (wordLenMatch) {
        const wLen = parseInt(wordLenMatch[1]);
        const words = result.split(/\s+/);
        if (words.length > wLen) result = words.slice(0, wLen).join(" ") + "…";
      }
      if (/nl2br:'1'/i.test(attrs)) {
        result = result.replace(/\n/g, "<br>");
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
    const wordLenMatch = attrs.match(/wordlength:'(\d+)'/i);
    if (wordLenMatch) {
      const wLen = parseInt(wordLenMatch[1]);
      const words = result.split(/\s+/);
      if (words.length > wLen) result = words.slice(0, wLen).join(" ") + "…";
    }
    if (/nl2br:'1'/i.test(attrs)) {
      result = result.replace(/\n/g, "<br>");
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
      case "page_title": return ctx.content?.title || ctx.store?.name || defaultVal || "Store";
      case "page_heading": return ctx.content?.title || defaultVal || "";
      case "meta_description": return ctx.store?.seo_description || ctx.content?.seo_description || defaultVal || "";
      case "meta_keywords": return ctx.content?.seo_keywords || defaultVal || "";
      case "page_type": return ctx.pageType || defaultVal || "content";
      case "canonical_url": return ctx.baseUrl || ctx.basePath || defaultVal || "";
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
  const fnMatch = attrs.match(/fn:'([^']+)'/i);
  const idMatch = attrs.match(/id:'([^']+)'/i);
  const qsMatch = attrs.match(/qs:'([^']+)'/i);
  const page = pageMatch?.[1] || "";
  const type = typeMatch?.[1] || "";
  const fn = fnMatch?.[1] || "";
  const id = idMatch?.[1] || "";
  const qs = qsMatch?.[1] || "";
  
  const prefix = basePath || base;
  
  let url = prefix;

  // Handle type-only shortcuts (no page param)
  if (!page && type) {
    switch (type) {
      case "home": return prefix || "/";
      case "item": return id ? `${prefix}/product/${id}` : `${prefix}/products`;
      case "content": return id ? `${prefix}/page/${id}` : `${prefix}/`;
      case "page":
        if (id === "contact_us") return `${prefix}/contact`;
        if (id === "subscribe") return `${prefix}/`;
        return id ? `${prefix}/page/${id}` : `${prefix}/`;
      default: break;
    }
  }

  switch (page) {
    case "account":
      // Maropost account sub-pages
      switch (type) {
        case "login": url += "/login"; break;
        case "register": url += "/signup"; break;
        case "logout": url += "/login"; break; // Will need logout logic
        case "forgotpwd": url += "/forgot-password"; break;
        case "forgotusr": url += "/forgot-username"; break;
        case "resetpwd": url += "/reset-password"; break;
        case "edit_account": url += "/account"; break;
        case "edit_address": url += "/account"; break;
        case "edit_pwd": url += "/account"; break;
        case "wishlist": url += "/wishlist"; break;
        case "favourites": url += "/account"; break;
        case "orders": url += "/account"; break;
        case "view_order": url += "/account"; break;
        case "nr_view_order": url += "/account"; break;
        case "track_order":
        case "nr_track_order": url += "/track-order"; break;
        case "documents": url += "/account"; break;
        case "approve_quote": url += "/account"; break;
        case "payrec": url += "/account"; break;
        case "pay_order": url += "/account"; break;
        case "warranty": url += "/account"; break;
        case "write_review": url += "/account"; break;
        case "write_contentreview": url += "/account"; break;
        case "wholesaleregister": url += "/wholesale"; break;
        case "mystore": url += "/account"; break;
        case "logos": url += "/account"; break;
        case "cart": url += "/cart"; break;
        default: url += "/account"; break;
      }
      break;
    case "checkout":
      if (type === "cart" || (!fn && !type)) {
        url += "/cart";
      } else if (fn === "payment" || fn === "3rdparty") {
        url += "/checkout";
      } else if (fn === "quote") {
        url += "/request-quote";
      } else if (fn === "voucher") {
        url += "/gift-vouchers";
      } else if (fn === "upsell") {
        url += "/cart";
      } else {
        url += "/checkout";
      }
      break;
    case "contact": url += "/contact"; break;
    case "wishlist": url += "/wishlist"; break;
    case "compare": url += "/compare"; break;
    case "home": url = prefix || "/"; break;
    case "products":
    case "search": url += "/products"; break;
    case "item": url += id ? `/product/${id}` : "/products"; break;
    case "content": url += id ? `/page/${id}` : "/"; break;
    case "login": url += "/login"; break;
    case "register": url += "/signup"; break;
    case "blog": url += "/blog"; break;
    case "store-finder":
    case "store_finder": url += "/store-finder"; break;
    default:
      if (page) url += "/" + page.replace(/_/g, "-");
      break;
  }

  // Append ID to URL for order/item views
  if (id && type === "view_order") url += `?order=${id}`;
  else if (id && type === "track_order") url += `?order=${id}`;
  else if (id && page === "item") { /* already handled */ }

  if (qs) url += (url.includes("?") ? "&" : "?") + qs;
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
        html = html.replace(/\[@slug@\]/gi, cat.slug || "");
        html = html.replace(/\[@description@\]/gi, cat.description || "");
        html = html.replace(/\[@css_class@\]/gi, cat.css_class || "");
        html = html.replace(/\[@image_url@\]/gi, resolveStorageUrl(cat.image_url) || "/placeholder.svg");
        html = html.replace(/\[@image@\]/gi, resolveStorageUrl(cat.image_url) || "/placeholder.svg");
        html = html.replace(/\[@count@\]/gi, String(cat.product_count || 0));
        
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
      html = html.replace(/\[@description@\]/gi, cat.description || "");
      html = html.replace(/\[@count@\]/gi, String(cat.product_count || 0));
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
 */
function collapseAssetUrlBlocks(body: string): string {
  return body.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:\/asset_url|END\s+asset_url|end\s+asset_url|\/ASSET_url|\/\s*asset_url)%\]/gi,
    (full, attrs: string, inner: string) => {
      // Preserve any default param fallback in a data attribute for later processing
      const defaultMatch = inner.match(/\[%param\s+default%\]([\s\S]*?)\[%(?:end\s+param|\/param)%\]/i);
      if (defaultMatch) {
        // Encode fallback content into the tag for later extraction
        const fallbackContent = defaultMatch[1].replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1").trim();
        return `[%asset_url ${attrs} default:'${fallbackContent.replace(/'/g, "\\'")}'/%]`;
      }
      return `[%asset_url ${attrs}/%]`;
    }
  );
}

// ── Process [%asset_url type:'...' id:'...'%]...[%END asset_url%] or [%/asset_url%] ──
function processAssetUrl(template: string, ctx: TemplateContext, item?: any): string {
  let result = template;
  
  // Block variant FIRST
  result = result.replace(
    /\[%asset_url\s+((?:[^\[\]]|\[@[^\]]*@\])*)%\]([\s\S]*?)\[%(?:\/asset_url|END\s+asset_url|end\s+asset_url|\/ASSET_url|\/\s*asset_url)%\]/gi,
    (_, attrs: string, innerContent: string) => {
      const resolvedAttrs = attrs.replace(/\[@(\w+)@\]/gi, (__, field: string) => {
        if (item && item[field] !== undefined) return String(item[field]);
        return String(resolveField(field, ctx) || "");
      });
      const resolved = resolveAssetUrlAttrs(resolvedAttrs, ctx, item);
      if (resolved) return resolved;
      // Extract fallback from [%param default%]...[%end param%] or [%/param%]
      const fallbackMatch = innerContent.match(/\[%param\s+default%\]([\s\S]*?)\[%(?:end\s+param|\/param)%\]/i);
      if (fallbackMatch) {
        // Process cdn_asset within fallback
        let fallback = fallbackMatch[1].replace(/\[%cdn_asset[^\]]*%\]([\s\S]*?)\[%\/cdn_asset%\]/gi, "$1").trim();
        return fallback || "/placeholder.svg";
      }
      return resolved || "/placeholder.svg";
    }
  );
  
  // Self-closing variant
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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
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
    case "advert":
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
      if (item?.images?.[0]) return resolveStorageUrl(item.images[0]);
      if (item?.image_url) return item.image_url;
      const prodById = (ctx.products || []).find(p => p.id === id);
      if (prodById?.images?.[0]) return resolveStorageUrl(prodById.images[0]);
      const prodBySku = (ctx.products || []).find(p => p.sku === id);
      if (prodBySku?.images?.[0]) return resolveStorageUrl(prodBySku.images[0]);
      return defaultUrl || "/placeholder.svg";
    case "logo":
      return ctx.store?.logo_url || defaultUrl || "";
    default:
      // Check if the id references a theme asset
      if (id && ctx.themeAssetBaseUrl) {
        return `${ctx.themeAssetBaseUrl}/${id}`;
      }
      return defaultUrl || "";
  }
}

// ── Process [%set name:'varname' value:'val'/%] — store variables in context ──
function processSetAndWhile(template: string, ctx?: TemplateContext): string {
  let result = template;
  
  // Process [%set%] with name/value pairs — store in context.__variables
  if (ctx) {
    if (!(ctx as any).__variables) (ctx as any).__variables = {};
    result = result.replace(/\[%set\s+(?:name:|var:)?'([^']+)'\s+(?:value:|to:)?'([^']*)'\s*\/?%\]/gi, (_, name: string, value: string) => {
      // Resolve any [@...@] tags in the value
      const resolved = value.replace(/\[@([\w:.]+)@\]/gi, (__: string, field: string) => {
        const val = resolveField(field, ctx);
        return val !== undefined && val !== null ? String(val) : "";
      });
      (ctx as any).__variables[name] = resolved;
      return "";
    });
    // Also support [%set varname = 'value'%] syntax
    result = result.replace(/\[%set\s+(\w+)\s*=\s*'([^']*)'\s*\/?%\]/gi, (_, name: string, value: string) => {
      (ctx as any).__variables[name] = value;
      return "";
    });
    // Support [%set varname = [@field@]%] syntax
    result = result.replace(/\[%set\s+(\w+)\s*=\s*\[@([\w:.]+)@\]\s*\/?%\]/gi, (_, name: string, field: string) => {
      const val = resolveField(field, ctx);
      (ctx as any).__variables[name] = val !== undefined && val !== null ? String(val) : "";
      return "";
    });
  } else {
    result = result.replace(/\[%set\s+[^\]]*\/?%\]/gi, "");
  }
  
  result = result.replace(/\[%while\s+[^\]]*%\]([\s\S]*?)\[%\/while%\]/gi, "");
  return result;
}

// ── Process [%foreach items:'...' as:'...'%]...[%/foreach%] ──
function processForeach(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%(?:foreach|each)\s+([^\]]*?)%\]([\s\S]*?)\[%\/(?:foreach|each)%\]/gi, (_, attrs: string, body: string) => {
    const itemsMatch = attrs.match(/(?:items|list|collection):'([^']+)'/i);
    const asMatch = attrs.match(/(?:as|var):'([^']+)'/i);
    const limitMatch = attrs.match(/limit:'(\d+)'/i);
    
    const itemsKey = itemsMatch?.[1] || "";
    const asVar = asMatch?.[1] || "item";
    const limit = limitMatch ? parseInt(limitMatch[1]) : 999;
    
    // Resolve the items collection from context
    let items: any[] = [];
    if (itemsKey.startsWith("config:")) {
      const val = resolveConfig(itemsKey.replace("config:", ""), ctx);
      if (val && typeof val === "string") items = val.split(",").map(v => ({ value: v.trim(), name: v.trim() }));
    } else {
      const resolved = resolveField(itemsKey, ctx);
      if (Array.isArray(resolved)) items = resolved;
      else if (resolved && typeof resolved === "string") items = resolved.split(",").map(v => ({ value: v.trim(), name: v.trim() }));
    }
    
    items = items.slice(0, limit);
    if (items.length === 0) return "";
    
    return items.map((item, idx) => {
      let rendered = body;
      const isObj = typeof item === "object" && item !== null;
      
      // Replace [@as_var.field@] or [@as_var@]
      rendered = rendered.replace(new RegExp(`\\[@${asVar}\\.?(\\w*)@\\]`, "gi"), (__, field: string) => {
        if (!field) return isObj ? JSON.stringify(item) : String(item);
        return isObj ? String(item[field] ?? "") : "";
      });
      
      // Replace [@index@], [@count@]
      rendered = rendered.replace(/\[@index@\]/gi, String(idx));
      rendered = rendered.replace(/\[@count@\]/gi, String(items.length));
      rendered = rendered.replace(/\[@first@\]/gi, idx === 0 ? "1" : "");
      rendered = rendered.replace(/\[@last@\]/gi, idx === items.length - 1 ? "1" : "");
      
      return rendered;
    }).join("");
  });
}

// ── Process [%switch field%]...[%case 'val'%]...[%/switch%] ──
function processSwitchCase(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%switch\s+([^\]]+)%\]([\s\S]*?)\[%\/switch%\]/gi, (_, expr: string, body: string) => {
    // Resolve the switch expression
    let switchVal = expr.trim();
    const tagMatch = switchVal.match(/^\[@([\w:.]+)@\]$/);
    if (tagMatch) {
      const resolved = resolveField(tagMatch[1], ctx);
      switchVal = resolved !== undefined && resolved !== null ? String(resolved) : "";
    } else if (/^config:/i.test(switchVal)) {
      switchVal = resolveConfig(switchVal.replace(/^config:/i, ""), ctx);
    }
    
    // Split into cases
    const caseRegex = /\[%case\s+'([^']*)'%\]/gi;
    const defaultMatch = body.match(/\[%default%\]([\s\S]*?)(?=\[%(?:case|\/switch))/i);
    let lastIndex = 0;
    let caseMatch;
    const cases: { value: string; start: number }[] = [];
    
    while ((caseMatch = caseRegex.exec(body)) !== null) {
      cases.push({ value: caseMatch[1], start: caseMatch.index + caseMatch[0].length });
    }
    
    for (let i = 0; i < cases.length; i++) {
      if (cases[i].value === switchVal || cases[i].value === "*") {
        const endPos = i + 1 < cases.length ? body.indexOf("[%case", cases[i].start) : body.length;
        return body.slice(cases[i].start, endPos > -1 ? endPos : body.length).replace(/\[%\/switch%\]/gi, "").replace(/\[%default%\][\s\S]*/i, "");
      }
    }
    
    // Default case
    if (defaultMatch) return defaultMatch[1];
    return "";
  });
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
  return template.replace(/\[%(?:format|FORMAT)\s+type:'percent(?:age)?'%\]([\s\S]*?)\[%\/(?:format|FORMAT)%\]/gi, (_, content: string) => {
    const value = content.trim();
    const num = parseFloat(value);
    if (!isNaN(num)) return `${Math.round(num)}%`;
    return value;
  });
}

// ── Process [%SITE_VALUE id:'counter'%]...[%/SITE_VALUE%] — accumulator/counter blocks ──
function processSiteValueBlocks(template: string): string {
  // Only strip site_value LOAD points here — accumulator SET blocks are handled in item loops
  let result = template.replace(/\[%site_value[^\]]*type:'load'[^\]]*\/%\]/gi, "");
  // Strip remaining load-only references
  result = result.replace(/\[%site_value[^\]]*\/%\]/gi, "");
  // Strip SET blocks that weren't processed by item loops
  result = result.replace(/\[%SITE_VALUE[^\]]*%\]([\s\S]*?)\[%\/SITE_VALUE%\]/gi, "");
  return result;
}

// ── Process [%content_zone id:'...'%]...[%end content_zone%] ──
function processContentZone(template: string, ctx?: TemplateContext): string {
  return template.replace(/\[%content_zone\s+([^\]]*?)%\]([\s\S]*?)\[%(?:end\s+content_zone|\/content_zone)%\]/gi, (_, attrs: string, fallback: string) => {
    const idMatch = attrs.match(/id:'([^']+)'/i);
    if (!idMatch) return fallback;
    const key = idMatch[1];
    const zones = (ctx as any)?.contentZones as Record<string, string> | undefined;
    if (zones && zones[key]) return zones[key];
    return fallback;
  });
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
        case ">=": match = Number(itemValue) >= Number(value); break;
        case "<=": match = Number(itemValue) <= Number(value); break;
        case "contains": match = itemValue.toLowerCase().includes(value.toLowerCase()); break;
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
  
  // [%site_value%] blocks — MUST run AFTER item loops that accumulate counters
  result = processSiteValueBlocks(result);
  
  // [%content_zone%]
  result = processContentZone(result, ctx);
  
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
  
  // [%search%] — search form stub
  result = processSearchBlock(result, ctx);
  
  // [%login%] — login form stub
  result = processLoginBlock(result, ctx);
  
  // [%form%] — form stubs
  result = processFormBlocks(result, ctx);
  
  // [%newsletter%] — newsletter signup
  result = processNewsletterBlock(result, ctx);
  
  // [%account%] — account info
  result = processAccountBlock(result, ctx);
  
  // [%paging%]
  result = result.replace(/\[%paging[^\]]*%\]([\s\S]*?)\[%\/paging%\]/gi, "");
  
  // [%param%] — strip remaining
  result = result.replace(/\[%param\s+\*?\w+%\]([\s\S]*?)\[%\/param%\]/gi, "");
  
  return result;
}

// ── Process [%search%] — search form ──
function processSearchBlock(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%search\s*([^\]]*?)%\]([\s\S]*?)\[%\/search%\]/gi, (_, _attrs: string, body: string) => {
    let result = body;
    result = result.replace(/\[@search_url@\]/gi, `${ctx.basePath || ""}/products`);
    result = result.replace(/\[@search_query@\]/gi, ctx.queryParams?.q || "");
    result = result.replace(/\[@search_results_count@\]/gi, String((ctx.products || []).length));
    return result;
  });
}

// ── Process [%login%] — login form stub ──
function processLoginBlock(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%login\s*([^\]]*?)%\]([\s\S]*?)\[%\/login%\]/gi, (_, _attrs: string, body: string) => {
    let result = body;
    const bp = ctx.basePath || "";
    result = result.replace(/\[@login_url@\]/gi, `${bp}/login`);
    result = result.replace(/\[@register_url@\]/gi, `${bp}/register`);
    result = result.replace(/\[@forgot_password_url@\]/gi, `${bp}/forgot-password`);
    result = result.replace(/\[@account_url@\]/gi, `${bp}/account`);
    result = result.replace(/\[@is_logged_in@\]/gi, ctx.customer ? "1" : "0");
    result = result.replace(/\[@customer_name@\]/gi, ctx.customer?.name || "");
    return result;
  });
}

// ── Process [%form%] — generic form blocks with expanded type support ──
function processFormBlocks(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%form\s+([^\]]*?)%\]([\s\S]*?)\[%\/form%\]/gi, (_, attrs: string, body: string) => {
    const typeMatch = attrs.match(/type:'([^']+)'/i);
    const type = typeMatch?.[1] || "contact";
    let result = body;
    const bp = ctx.basePath || "";
    const urlMap: Record<string, string> = {
      newsletter: "#", subscribe: "#", contact: `${bp}/contact-us`,
      login: `${bp}/login`, register: `${bp}/register`, signup: `${bp}/register`,
      "forgot_password": `${bp}/forgot-password`, "forgot-password": `${bp}/forgot-password`,
      quote: `${bp}/request-quote`, request_quote: `${bp}/request-quote`,
      wholesale: `${bp}/wholesale`,
      "gift_voucher": `${bp}/gift-vouchers`, "gift-voucher": `${bp}/gift-vouchers`,
      "track_order": `${bp}/track-order`, "track-order": `${bp}/track-order`,
      review: "#", write_review: "#",
    };
    result = result.replace(/\[@form_action@\]/gi, urlMap[type] || "#");
    return result;
  });
}

// ── Process [%newsletter%] — newsletter signup block ──
function processNewsletterBlock(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%newsletter\s*([^\]]*?)%\]([\s\S]*?)\[%\/newsletter%\]/gi, (_, _attrs: string, body: string) => {
    return body.replace(/\[@form_action@\]/gi, "#").replace(/\[@newsletter_url@\]/gi, "#");
  });
}

// ── Process [%account%] — account info blocks ──
function processAccountBlock(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%account\s*([^\]]*?)%\]([\s\S]*?)\[%\/account%\]/gi, (_, _attrs: string, body: string) => {
    let result = body;
    const bp = ctx.basePath || "";
    result = result.replace(/\[@account_url@\]/gi, `${bp}/account`);
    result = result.replace(/\[@orders_url@\]/gi, `${bp}/account`);
    result = result.replace(/\[@wishlist_url@\]/gi, `${bp}/wishlist`);
    result = result.replace(/\[@logout_url@\]/gi, `${bp}/login`);
    result = result.replace(/\[@customer_name@\]/gi, ctx.customer?.name || "");
    result = result.replace(/\[@customer_email@\]/gi, ctx.customer?.email || "");
    result = result.replace(/\[@total_orders@\]/gi, String(ctx.customer?.total_orders || 0));
    result = result.replace(/\[@total_spent@\]/gi, `$${Number(ctx.customer?.total_spent || 0).toFixed(2)}`);
    return result;
  });
}

// ── Process breadcrumb blocks ──
function processBreadcrumb(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%breadcrumb%\]([\s\S]*?)\[%\/breadcrumb%\]/gi, (_, body: string) => {
    const headerMatch = body.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = body.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    
    let html = "";
    if (headerMatch) html += headerMatch[1];
    html = html.replace(/\[@config:home_url@\]/g, ctx.basePath || ctx.baseUrl || "/");
    if (footerMatch) html += footerMatch[1];
    
    return html;
  });
}

// ── Render items with a template (shared between advert/thumb_list) ──
function renderItemsWithTemplate(
  items: Record<string, any>[],
  itemTemplate: string,
  headerHtml: string | null,
  footerHtml: string | null,
  ctx: TemplateContext
): string {
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
      
      // Process nohtml blocks
      rendered = processNoHtml(rendered);
      
      // Process url_encode blocks
      rendered = processUrlEncode(rendered);
      
      // Process inline conditionals
      rendered = processItemConditionals(rendered, item, idx, items.length, ctx);
      
      // Clean up per-item template tags
      rendered = processSetAndWhile(rendered, ctx);
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
        counterItem = counterItem.replace(/\[@(\w+)@\]/gi, (__, f: string) => {
          if (f === "count") return String(idx);
          if (item[f] !== undefined) return String(item[f]);
          return "";
        });
        counterItem = processDataBlocks(counterItem, { ...item, count: idx });
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
  
  if (headerHtml) {
    let h = headerHtml;
    h = h.replace(/\[@total_showing@\]/gi, String(items.length));
    // Inject counter HTML into site_value load point
    h = h.replace(/\[%site_value[^\]]*\/%\]/gi, counterHtml.join(""));
    h = processInlineConditionals(h, items.length, ctx);
    html += h;
  }
  
  html += itemsHtml;
  
  if (footerHtml) {
    let f = footerHtml;
    f = f.replace(/\[@total_showing@\]/gi, String(items.length));
    f = f.replace(/\[%site_value[^\]]*\/%\]/gi, counterHtml.join(""));
    f = processInlineConditionals(f, items.length, ctx);
    html += f;
  }
  
  return html;
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
    
    let items: Record<string, any>[] = [];
    
    if (type === "product") {
      const bp = ctx.basePath || "";
      items = (ctx.products || []).slice(0, limit).map((p, idx) => buildMaropostProductItem(p, idx, bp));
    } else {
      let filteredAdverts = ctx.adverts || [];
      if (adGroup) {
        filteredAdverts = filteredAdverts.filter(a => (a.ad_group || a.placement || "") === adGroup);
      }
      items = filteredAdverts.slice(0, limit).map((ad, idx) => buildMaropostAdvertItem(ad, idx));
    }
    
    const processedBody = collapseAssetUrlBlocks(body);
    
    const headerMatch = processedBody.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = processedBody.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = processedBody.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    let itemTemplate = bodyMatch?.[1] || "";
    if (!itemTemplate && templateName) {
      itemTemplate = resolveThemeTemplate(templateName, ctx) || "";
    }
    
    if (!itemTemplate && type === "product") {
      itemTemplate = resolveThemeTemplate("template", { ...ctx, themeFiles: filterThemeFilesByPath(ctx.themeFiles || {}, "thumbs/product") }) 
        || resolveThemeTemplate("thumbs/product/template", ctx)
        || "";
    }
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
    
    return renderItemsWithTemplate(
      items,
      itemTemplate,
      headerMatch?.[1] || null,
      footerMatch?.[1] || null,
      ctx
    );
  });
}

// Process inline [%if%] conditionals with known values for items — uses depth-tracking
function processItemConditionals(template: string, item: any, idx: number, total: number, ctx?: TemplateContext): string {
  const mergedCtx: TemplateContext = {
    ...(ctx || {}),
  };
  if (item) {
    for (const [key, value] of Object.entries(item)) {
      (mergedCtx as any)[key] = value;
    }
  }
  (mergedCtx as any).count = idx;
  (mergedCtx as any).index = idx;
  (mergedCtx as any).total_showing = total;

  // First resolve [@...@] tags using item values
  let result = template.replace(/\[@([\w:.]+)@\]/gi, (__, field: string) => {
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

  // Process inline tags
  result = processInlineTags(result, mergedCtx);

  // Process [%if%] blocks using depth-tracking parser
  result = processMaropostConditionals(result, mergedCtx);

  return result;
}

// Process [%if%] blocks where we only know total_showing — uses depth-tracking
function processInlineConditionals(template: string, totalShowing: number, ctx?: TemplateContext): string {
  const evalCtx = { ...(ctx || {}), total_showing: totalShowing } as TemplateContext;
  let result = template.replace(/\[@total_showing@\]/gi, String(totalShowing));
  result = processMaropostConditionals(result, evalCtx);
  return result;
}

// ── Process thumb_list blocks ──
function processThumbList(template: string, ctx: TemplateContext): string {
  return template.replace(/\[%thumb_list\s+([^\]]*?)%\]([\s\S]*?)\[%\/thumb_list%\]/gi, (_, attrs: string, body: string) => {
    const typeMatch = attrs.match(/type:'(\w+)'/i);
    const limitMatch = attrs.match(/limit:'([^']+)'/i);
    const templateMatch = attrs.match(/template:'([^']*)'/i);
    const sortMatch = attrs.match(/sort:'([^']*)'/i);
    const type = typeMatch?.[1] || "products";
    const limitStr = limitMatch?.[1] || "20";
    const limit = parseInt(limitStr) || 20;
    const templateName = templateMatch?.[1] || "";
    
    const processedBody = collapseAssetUrlBlocks(body);
    const headerMatch = processedBody.match(/\[%param\s+\*?header%\]([\s\S]*?)\[%\/param%\]/i);
    const footerMatch = processedBody.match(/\[%param\s+\*?footer%\]([\s\S]*?)\[%\/param%\]/i);
    const bodyMatch = processedBody.match(/\[%param\s+\*?body%\]([\s\S]*?)\[%\/param%\]/i);
    
    let items: Record<string, any>[] = [];
    if (type === "products" || type === "product") {
      const bp = ctx.basePath || "";
      let prods = [...(ctx.products || [])];
      // Sort if specified
      const sort = sortMatch?.[1] || "";
      if (sort === "newest" || sort === "date_desc") {
        prods.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      } else if (sort === "price_asc") {
        prods.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      } else if (sort === "price_desc") {
        prods.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      } else if (sort === "name" || sort === "name_asc") {
        prods.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }
      items = prods.slice(0, limit).map((p, idx) => buildMaropostProductItem(p, idx, bp));
    } else if (type === "category" || type === "categories") {
      const bp = ctx.basePath || "";
      items = (ctx.categories || []).slice(0, limit).map((cat: any, idx: number) => ({
        ...cat,
        URL: cat.url || `${bp}/products?category=${cat.slug}`,
        url: cat.url || `${bp}/products?category=${cat.slug}`,
        image_url: resolveStorageUrl(cat.image_url) || "/placeholder.svg",
        thumb_url: resolveStorageUrl(cat.image_url) || "/placeholder.svg",
        name: cat.name || "",
        headline: cat.name || "",
        description: cat.description || "",
        count: idx,
        index: idx,
        product_count: cat.product_count || 0,
        rndm: Math.random().toString(36).substring(2, 8),
      }));
    } else if (type === "content" || type === "content_reviews") {
      return "";
    }
    
    if (items.length === 0) return "";
    
    // Resolve item template
    let itemTemplate = bodyMatch?.[1] || "";
    if (!itemTemplate && templateName) {
      itemTemplate = resolveThemeTemplate(templateName, ctx) || "";
    }
    
    if (!itemTemplate && (type === "products" || type === "product")) {
      itemTemplate = resolveThemeTemplate("template", { ...ctx, themeFiles: filterThemeFilesByPath(ctx.themeFiles || {}, "thumbs/product") })
        || resolveThemeTemplate("thumbs/product/template", ctx)
        || "";
    }
    if (!itemTemplate && (type === "products" || type === "product")) {
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
    
    return renderItemsWithTemplate(
      items,
      itemTemplate,
      headerMatch?.[1] || null,
      footerMatch?.[1] || null,
      ctx
    );
  });
}

// ── Process block tags: [%crosssell%]...[%/crosssell%] ──
function processBlocks(template: string, ctx: TemplateContext): string {
  const blockRegex = /\[%(\w+)%\]([\s\S]*?)\[%\/\1%\]/g;

  return template.replace(blockRegex, (match, blockName: string, innerTemplate: string) => {
    const systemBlocks = ["ntheme_asset", "format", "nohtml", "filter", "parse", "breadcrumb", "advert", "thumb_list", "paging", "param", "cdn_asset", "ASSET_url", "asset_url", "if", "menu", "content_menu", "cache", "escape", "SITE_VALUE", "site_value", "content_zone", "search", "login", "form", "url_encode", "foreach", "each", "switch"];
    if (systemBlocks.includes(blockName) || systemBlocks.includes(blockName.toLowerCase())) return match;
    
    let items: Record<string, any>[] = [];

    switch (blockName.toLowerCase()) {
      case "crosssell": case "cross_sell": case "related": case "related_products": items = ctx.cross_sells || []; break;
      case "upsell": case "up_sell": items = ctx.upsells || []; break;
      case "free_gift": case "freegift": items = ctx.free_gifts || []; break;
      case "variant": case "variants": case "child_products": case "child":
        items = (ctx.variants || []).map((v: any, idx: number) => ({
          ...v,
          index: idx,
          count: idx,
          inventory_id: v.id,
          SKU: v.sku || "",
          sku: v.sku || "",
          name: v.name || v.option_value || "",
          option_name: v.option_name || v.name || "",
          option_value: v.option_value || v.name || "",
          price: v.price || ctx.product?.price || 0,
          store_price: v.price || ctx.product?.price || 0,
          store_quantity: v.stock ?? v.stock_on_hand ?? 10,
          available_quantity: v.stock ?? v.stock_on_hand ?? 10,
          image_url: resolveStorageUrl(v.image || v.images?.[0] || ctx.product?.images?.[0]) || "/placeholder.svg",
          URL: `${ctx.basePath || ""}/product/${ctx.product?.slug || ctx.product?.id}?variant=${v.id}`,
        }));
        break;
      case "specific": case "specifics": case "item_specifics": case "item_specific":
        items = (ctx.specifics || []).map((s: any, idx: number) => ({
          ...s,
          index: idx,
          count: idx,
          spec_name: s.name || "",
          spec_value: s.value || "",
          label: s.name || "",
        }));
        break;
      case "pricing_tier": case "pricing_tiers": case "quantity_price": case "qty_price":
        items = (ctx.pricing_tiers || []).map((t: any, idx: number) => ({
          ...t,
          index: idx,
          count: idx,
          qty: t.min_quantity || 1,
          min_quantity: t.min_quantity || 1,
          tier_price: t.price || 0,
          store_price: t.price || 0,
        }));
        break;
      case "images": case "item_images":
        items = (ctx.product?.images || []).map((url: string, idx: number) => ({
          url: resolveStorageUrl(url),
          image_url: resolveStorageUrl(url),
          thumb_url: resolveStorageUrl(url),
          src: resolveStorageUrl(url),
          alt: ctx.product?.title || "",
          index: idx + 1,
          count: idx,
          is_primary: idx === 0 ? 1 : 0,
          position: idx + 1,
        }));
        break;
      case "tags":
        items = (ctx.product?.tags || []).map((tag: string, idx: number) => ({ name: tag, tag: tag, index: idx, count: idx }));
        break;
      case "adverts": items = ctx.adverts || []; break;
      case "thumb": case "thumblist": items = ctx.thumblist || []; break;
      case "reviews": case "review":
        items = ctx.reviews || [];
        break;
      case "categories": case "category_list": case "category":
        items = (ctx.categories || []).map((cat: any, idx: number) => ({
          ...cat,
          URL: cat.url || `${ctx.basePath || ""}/products?category=${cat.slug}`,
          url: cat.url || `${ctx.basePath || ""}/products?category=${cat.slug}`,
          image_url: resolveStorageUrl(cat.image_url) || "/placeholder.svg",
          name: cat.name || "",
          headline: cat.name || "",
          description: cat.description || "",
          count: idx,
          index: idx,
          product_count: cat.product_count || 0,
        }));
        break;
      case "order_lines": case "order_line": case "order_items": case "order_item":
        items = (ctx.order?.items || ctx.order?.line_items || []).map((item: any, idx: number) => ({
          ...item,
          index: idx,
          count: idx,
          SKU: item.sku || "",
          sku: item.sku || "",
          name: item.title || item.product_name || "",
          headline: item.title || item.product_name || "",
          quantity: item.quantity || 1,
          unit_price: item.price || item.unit_price || 0,
          store_price: item.price || item.unit_price || 0,
          line_total: (item.quantity || 1) * (item.price || item.unit_price || 0),
          subtotal: (item.quantity || 1) * (item.price || item.unit_price || 0),
          image_url: resolveStorageUrl(item.image || item.images?.[0]) || "/placeholder.svg",
          URL: `${ctx.basePath || ""}/product/${item.product_slug || item.product_id || ""}`,
        }));
        break;
      case "cart_items": case "cart_item": case "cart_line": case "cart_lines":
        items = (ctx.cart?.items || ctx.cart_items || []).map((item: any, idx: number) => ({
          ...item,
          index: idx,
          count: idx,
          SKU: item.sku || "",
          sku: item.sku || "",
          name: item.title || item.product_name || "",
          headline: item.title || item.product_name || "",
          quantity: item.quantity || 1,
          unit_price: item.price || item.unit_price || 0,
          store_price: item.price || item.unit_price || 0,
          line_total: (item.quantity || 1) * (item.price || item.unit_price || 0),
          subtotal: (item.quantity || 1) * (item.price || item.unit_price || 0),
          image_url: resolveStorageUrl(item.image || item.images?.[0]) || "/placeholder.svg",
          URL: `${ctx.basePath || ""}/product/${item.product_slug || item.product_id || ""}`,
          remove_url: "#",
        }));
        break;
      case "wishlist_items": case "wishlist_item": case "wishlist":
        items = (ctx.wishlist_items || []).map((item: any, idx: number) => ({
          ...item,
          index: idx,
          count: idx,
          SKU: item.sku || "",
          sku: item.sku || "",
          name: item.title || "",
          headline: item.title || "",
          store_price: item.price || 0,
          image_url: resolveStorageUrl(item.images?.[0] || item.image_url) || "/placeholder.svg",
          URL: `${ctx.basePath || ""}/product/${item.slug || item.id}`,
          remove_url: "#",
        }));
        break;
      case "locations": case "location": case "store_locations": case "store_finder":
        items = (ctx.locations || []).map((loc: any, idx: number) => ({
          ...loc,
          index: idx,
          count: idx,
          name: loc.name || "",
          address: loc.address || "",
          phone: loc.phone || "",
          email: loc.email || "",
          type: loc.type || "store",
          hours: loc.hours || "Mon-Fri 9am-5pm",
          lat: loc.lat || loc.latitude || "",
          lng: loc.lng || loc.longitude || "",
        }));
        break;
      case "addresses": case "address": case "customer_addresses":
        items = (ctx.customer?.addresses || ctx.addresses || []).map((addr: any, idx: number) => ({
          ...addr,
          index: idx,
          count: idx,
          full_address: [addr.address_1, addr.address_2, addr.city, addr.state, addr.postcode, addr.country].filter(Boolean).join(", "),
          is_default: addr.is_default ? 1 : 0,
        }));
        break;
      default: return "";
    }

    if (items.length === 0) return "";

    return items.map((item, index) => {
      let rendered = innerTemplate;
      // First resolve tags
      rendered = rendered.replace(/\[@(\w+)(?:\|(\w+))?@\]/g, (__, field, format) => {
        if (field === "index") return String(index + 1);
        if (field === "count") return String(items.length);
        if (field === "first") return index === 0 ? "true" : "";
        if (field === "last") return index === items.length - 1 ? "true" : "";
        const val = item[field];
        if (val === undefined || val === null) return "";
        return format ? applyFormat(val, format) : String(val);
      });
      // Process conditionals within block items
      const mergedCtx: TemplateContext = { ...ctx };
      for (const [k, v] of Object.entries(item)) {
        (mergedCtx as any)[k] = v;
      }
      (mergedCtx as any).index = index + 1;
      (mergedCtx as any).count = items.length;
      rendered = processMaropostConditionals(rendered, mergedCtx);
      // Process asset_url
      rendered = processAssetUrl(rendered, ctx, item);
      return rendered;
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
  // Normalize [%IF → [%if (case insensitive handling is already in regex, but normalize for consistency)
  return result;
}

// ── Process simple value tags: [@field@] and [@field|format@] ──
function processValueTags(template: string, ctx: TemplateContext): string {
  return template.replace(/\[@([\w:.]+)(?:\|(\w+))?@\]/g, (_, field: string, format?: string) => {
    // Check __variables first
    if ((ctx as any).__variables?.[field] !== undefined) {
      const val = (ctx as any).__variables[field];
      return format ? applyFormat(val, format) : String(val);
    }
    const value = resolveField(field, ctx);
    if (value === undefined || value === null) return "";
    return format ? applyFormat(value, format) : String(value);
  });
}

// ── Process inline tags: [%rndm%], [%config:key%], [%now%] ──
function processInlineTags(template: string, ctx: TemplateContext): string {
  let result = template;
  // [%rndm%] — random string
  result = result.replace(/\[%rndm%\]/gi, () => Math.random().toString(36).substring(2, 8));
  // [%now%] — current timestamp
  result = result.replace(/\[%now%\]/gi, () => new Date().toISOString());
  // [%today%] — current date
  result = result.replace(/\[%today%\]/gi, () => new Date().toLocaleDateString());
  // [%year%] — current year
  result = result.replace(/\[%year%\]/gi, () => new Date().getFullYear().toString());
  // [%config:key%] — inline config values
  result = result.replace(/\[%config:([^\]%]+)%\]/gi, (_, key: string) => resolveConfig(key.trim(), ctx));
  // [%var:name%] — variable references
  result = result.replace(/\[%var:([^\]%]+)%\]/gi, (_, name: string) => {
    return (ctx as any).__variables?.[name.trim()] ?? "";
  });
  return result;
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
  result = result.replace(/\[%\/?(?:set|while|cache|NETO_JS|cdn_asset|tracking_code|site_value|SITE_VALUE|content_zone|parse|escape|ajax_loader|ITEM_KITTING|IN_WISHLIST|url_encode|DATA|search|login|form|foreach|each|switch|case|default|rndm|now|today|year|config:[^\]]*)[^\]]*%\]/gi, "");
  // Remove IN_WISHLIST blocks entirely
  result = result.replace(/\[%IN_WISHLIST[^\]]*%\][\s\S]*?\[%(?:\/\s*IN_WISHLIST|END\s+IN_WISHLIST)\s*%\]/gi, "");
  // Remove remaining block tags
  result = result.replace(/\[%ITEM_KITTING[^\]]*%\][\s\S]*?\[%\/ITEM_KITTING%\]/gi, "");
  // Remove leftover [@...@] value tags
  result = result.replace(/\[@[\w:.]+(?:\|\w+)?@\]/g, "");
  // Remove leftover [%if%]...[%/if%] that couldn't be resolved
  result = result.replace(/\[%(?:if|elseif|else|\/if)[^\]]*%\]/gi, "");
  // Remove leftover [%param%] blocks
  result = result.replace(/\[%param\s+[^\]]*%\]([\s\S]*?)\[%\/param%\]/gi, "");
  // Remove leftover [%var:...%] tags
  result = result.replace(/\[%var:[^\]]*%\]/gi, "");
  return result;
}

/**
 * Render a B@SE template string with full Maropost compatibility.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  let result = template;

  // 1. Strip comments
  result = stripComments(result);

  // 1b. Normalize syntax variants
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

  // 12. Set variables [%set%] — MUST be before conditionals so vars are available
  result = processSetAndWhile(result, ctx);

  // 12b. Inline tags [%rndm%], [%config:key%], [%var:name%]
  result = processInlineTags(result, ctx);

  // 12c. Switch/case blocks
  result = processSwitchCase(result, ctx);

  // 12d. Foreach/each blocks
  result = processForeach(result, ctx);

  // 13. System tags (breadcrumb, advert, thumb_list, content_menu, search, login, form, etc.)
  result = processSystemTags(result, ctx);

  // 14. Maropost conditionals [%if%]...[%/if%] — now with proper nesting support
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
  "order_lines", "cart_items", "wishlist_items", "locations", "addresses",
  "reviews", "categories",
];

export const SUPPORTED_FORMATS = [
  "currency", "currency_no_symbol", "integer", "number", "decimal", "date", "datetime", "date_short",
  "uppercase", "lowercase", "capitalize", "url_encode", "strip_html",
  "truncate_50", "truncate_100", "percentage", "json", "count", "first", "boolean", "nl2br",
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

export default renderTemplate;
