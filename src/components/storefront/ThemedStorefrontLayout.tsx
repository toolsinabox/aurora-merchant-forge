import { ReactNode, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { useContentZones } from "@/hooks/use-content-zones";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";
import { useSSRPage } from "@/hooks/use-ssr-page";
import { StorefrontLayout } from "./StorefrontLayout";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { MobileBottomNav } from "./MobileBottomNav";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface ThemedStorefrontLayoutProps {
  children: ReactNode;
  storeName?: string;
  /** Extra context to merge into template rendering */
  extraContext?: Partial<TemplateContext>;
}



/**
 * Wrapper that checks for an active theme. If theme exists with header/footer templates,
 * renders full B@SE theme. Otherwise falls back to the default React StorefrontLayout.
 */
/**
 * Derive page type from the current URL path for SSR routing.
 */
function derivePageType(pathname: string, basePath: string): { pageType: string; slug?: string } {
  const relative = pathname.replace(basePath, "").replace(/^\/+/, "");
  if (!relative || relative === "") return { pageType: "home" };
  if (relative.startsWith("product/")) return { pageType: "product", slug: relative.replace("product/", "") };
  if (relative.startsWith("category/")) return { pageType: "category", slug: relative.replace("category/", "") };
  if (relative === "cart") return { pageType: "cart" };
  if (relative === "checkout") return { pageType: "checkout" };
  if (relative === "login") return { pageType: "login" };
  if (relative === "signup") return { pageType: "register" };
  if (relative === "account") return { pageType: "account" };
  if (relative === "blog") return { pageType: "blog" };
  if (relative === "contact") return { pageType: "contact" };
  if (relative.startsWith("page/")) return { pageType: "content", slug: relative.replace("page/", "") };
  if (relative === "products") return { pageType: "category" };
  return { pageType: "content", slug: relative };
}

export function ThemedStorefrontLayout({ children, storeName, extraContext }: ThemedStorefrontLayoutProps) {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const location = useLocation();
  const [storeId, setStoreId] = useState<string>("");
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [storeResolved, setStoreResolved] = useState(false);

  useEffect(() => {
    if (!storeSlug) { setStoreResolved(true); return; }
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) {
        setStoreId(s.id);
        setStore(s);
        supabase
          .from("categories")
          .select("id, name, slug, parent_id, sort_order, image_url")
          .eq("store_id", s.id)
          .order("sort_order")
          .then(({ data }) => {
            if (data) setCategories(data);
            setStoreResolved(true);
          });
      } else {
        setStoreResolved(true);
      }
    });
  }, [storeSlug]);

  const { data: theme, isLoading } = useActiveTheme(storeId);

  // Derive page type for SSR
  const { pageType, slug: pageSlug } = useMemo(
    () => derivePageType(location.pathname, basePath || ""),
    [location.pathname, basePath]
  );

  // SSR: fetch pre-rendered HTML from edge function (Maropost-style server rendering)
  const { data: ssrData, loading: ssrLoading } = useSSRPage({
    storeId: storeId || undefined,
    pageType,
    slug: pageSlug,
    basePath,
    extraContext,
    enabled: !!storeId && storeResolved,
  });

  // Show a minimal loading skeleton while store + theme resolve — never flash the default layout
  if (!storeResolved || (!theme && isLoading) || (storeId && ssrLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-muted/30 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-muted/30 rounded animate-pulse mb-6" />
          <div className="h-[300px] bg-muted/20 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // No active theme package → use default React layout
  if (!theme) {
    return <StorefrontLayout storeName={storeName}>{children}</StorefrontLayout>;
  }

  const { items: cartItems, totalPrice: cartTotal, totalItems: cartCount } = useCart();

  return (
    <ThemedShell
      theme={theme}
      store={store}
      storeName={storeName}
      extraContext={extraContext}
      categories={categories}
      basePath={basePath}
      cartData={{ items: cartItems, totalPrice: cartTotal, totalItems: cartCount }}
      ssrData={ssrData}
    >
      {children}
    </ThemedShell>
  );
}

const SCOPE_SELECTOR = "#neto-theme";

/**
 * Rewrite relative image/asset paths in rendered HTML to point at the theme-assets storage bucket.
 * Handles src="img/foo.png", src="css/foo.png", url(img/foo.png), etc.
 * Skips URLs that are already absolute (http/https/data://).
 */
function rewriteAssetUrls(html: string, assetBase: string): string {
  if (!assetBase) return html;
  const assetExt = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css)(\?[^"']*)?/i;
  // Paths that should NOT be rewritten
  const skipPaths = /^(\/placeholder\.|\/favicon)/i;
  
  return html
    .replace(/(src|href)=["']((?!https?:\/\/|\/\/|data:|#|mailto:|javascript:|\{)[^"']+)["']/gi, (match, attr, path) => {
      if (!assetExt.test(path)) return match;
      if (skipPaths.test(path)) return match;
      
      // Rewrite /assets/themes/THEME_NAME/... to storage bucket
      const themePathMatch = path.match(/^\/assets\/themes\/[^/]+\/(.+)/);
      if (themePathMatch) {
        return `${attr}="${assetBase}/${themePathMatch[1]}"`;
      }
      
      // Skip other /assets/ paths (product images, marketing, cms — already absolute)
      if (/^\/assets\//i.test(path)) return match;
      
      const cleanPath = path.replace(/^\/+/, "");
      return `${attr}="${assetBase}/${cleanPath}"`;
    })
    .replace(/url\(\s*['"]?((?!https?:\/\/|\/\/|data:)[^)'"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)[^)'"]*?)['"]?\s*\)/gi, (match, path) => {
      // Rewrite /assets/themes/... in CSS url()
      const themePathMatch = path.match(/^\/assets\/themes\/[^/]+\/(.+)/);
      if (themePathMatch) {
        return `url("${assetBase}/${themePathMatch[1].trim()}")`;
      }
      if (/^\/assets\//i.test(path)) return match;
      const cleanPath = path.replace(/^\/+/, "").trim();
      return `url("${assetBase}/${cleanPath}")`;
    });
}

/** The actual themed shell that renders header/footer from B@SE templates */
function ThemedShell({ theme, store, storeName, children, extraContext, categories, basePath, cartData, ssrData }: {
  theme: NonNullable<ReturnType<typeof useActiveTheme>["data"]>;
  store: any;
  storeName?: string;
  children: ReactNode;
  extraContext?: Partial<TemplateContext>;
  categories?: any[];
  basePath?: string;
  cartData?: { items: any[]; totalPrice: number; totalItems: number };
  ssrData?: import("@/hooks/use-ssr-page").SSRPageResult | null;
}) {
  const { user } = useAuth();
  const includes = useMemo(() => buildIncludesMap(theme), [theme]);
  const { data: contentZones } = useContentZones(store?.id);

  const themeFiles = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of theme.files) {
      // Map by full file_path (e.g. "headers/includes/head.template.html")
      map[f.file_path] = f.content || "";
      // Map by folder/filename (legacy)
      map[`${f.folder}/${f.file_name}`] = f.content || "";
      // Map by just filename for simple includes
      map[f.file_name] = f.content || "";
      // Map by all sub-path combinations for flexible resolution
      const parts = f.file_path.split("/");
      for (let i = 0; i < parts.length; i++) {
        map[parts.slice(i).join("/")] = f.content || "";
      }
    }
    return map;
  }, [theme.files]);

  const themeAssetBaseUrl = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || !store?.id || !theme.id) return "";
    return `${supabaseUrl}/storage/v1/object/public/theme-assets/${store.id}/${theme.id}`;
  }, [store?.id, theme.id]);

  const baseCtx: TemplateContext = useMemo(() => ({
    store: {
      name: store?.name || storeName || "Store",
      currency: store?.currency || "AUD",
      contact_email: store?.contact_email || "",
      ...(store || {}),
    },
    includes,
    themeFiles,
    themeAssetBaseUrl,
    categories: categories || [],
    baseUrl: store?.custom_domain ? `https://${store.custom_domain}` : "",
    basePath: basePath || "",
    pageType: "content",
    cart: cartData ? { items: cartData.items, totalPrice: cartData.totalPrice, totalItems: cartData.totalItems } : undefined,
    cart_items: cartData?.items,
    customer: user ? { name: user.email?.split("@")[0] || "", email: user.email || "", id: user.id } : undefined,
    contentZones: contentZones || {},
    ...extraContext,
  }), [store, storeName, includes, themeFiles, themeAssetBaseUrl, extraContext, categories, basePath, cartData, contentZones, user]);

  const headerFile = findMainThemeFile(theme, "headers");
  const footerFile = findMainThemeFile(theme, "footers");

  // ── SSR-first rendering: use server-rendered HTML when available, fall back to client-side ──
  const useSSR = !!ssrData;

  // Client-side render (fallback when SSR unavailable)
  const { headContent: clientHeadContent, bodyContent: clientHeader } = useMemo(() => {
    if (useSSR || !headerFile?.content) return { headContent: "", bodyContent: "" };
    const rendered = renderTemplate(headerFile.content, baseCtx);
    const headMatch = rendered.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headContent = headMatch?.[1] || "";
    const bodyMatch = rendered.match(/<body[^>]*>([\s\S]*$)/i);
    let bodyContent = bodyMatch?.[1] || rendered;
    bodyContent = bodyContent
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    bodyContent = rewriteAssetUrls(bodyContent, themeAssetBaseUrl);
    return { headContent, bodyContent };
  }, [useSSR, headerFile, baseCtx, themeAssetBaseUrl]);

  const clientFooter = useMemo(() => {
    if (useSSR || !footerFile?.content) return "";
    let rendered = renderTemplate(footerFile.content, baseCtx);
    rendered = rendered
      .replace(/<\/body>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    rendered = rewriteAssetUrls(rendered, themeAssetBaseUrl);
    return rendered;
  }, [useSSR, footerFile, baseCtx, themeAssetBaseUrl]);

  // Resolve final HTML — SSR takes priority
  const headContent = useSSR ? ssrData!.head_content : clientHeadContent;
  const renderedHeader = useSSR ? ssrData!.header_html : clientHeader;
  const renderedFooter = useSSR ? ssrData!.footer_html : clientFooter;
  const ssrBodyHtml = useSSR ? ssrData!.body_html : "";
  const effectiveAssetBase = useSSR ? ssrData!.theme_asset_base_url : themeAssetBaseUrl;

  // Track when CSS files are ready in storage
  const [cssReady, setCssReady] = useState(false);

  // Ensure CSS/JS files exist in storage bucket (upload from DB content if missing)
  // CSS must be ready BEFORE we inject <link> tags to avoid 404 flash
  useEffect(() => {
    if (!store?.id || !theme.id) return;
    const allTextAssets = [...(theme.cssFiles || []), ...(theme.jsFiles || [])];
    if (allTextAssets.length === 0) { setCssReady(true); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) { setCssReady(true); return; }

    let cancelled = false;
    (async () => {
      for (const f of allTextAssets) {
        if (cancelled) return;
        const storagePath = `${store.id}/${theme.id}/${f.file_path}`;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/theme-assets/${storagePath}`;
        try {
          const res = await fetch(publicUrl, { method: "HEAD" });
          if (res.ok) continue;
        } catch { /* not found, upload it */ }
        if (f.content) {
          const mimeType = f.file_name.endsWith(".css") ? "text/css" : "application/javascript";
          const blob = new Blob([f.content], { type: mimeType });
          await supabase.storage
            .from("theme-assets")
            .upload(storagePath, blob, { contentType: mimeType, upsert: true });
        }
      }
      if (!cancelled) setCssReady(true);
    })();
    return () => { cancelled = true; };
  }, [store?.id, theme.id, theme.cssFiles, theme.jsFiles]);

  // Inject theme CSS as inline <style> blocks immediately for instant rendering
  // This prevents FOUC while storage <link> tags may still be loading
  useEffect(() => {
    if (!theme.cssFiles || theme.cssFiles.length === 0) return;
    const styleEls: HTMLStyleElement[] = [];
    // Priority order for CSS loading
    const priorityOrder = ["slick.css", "slick-theme.css", "app.css", "style.css", "custom.css"];
    const sorted = [...theme.cssFiles].sort((a, b) => {
      const aIdx = priorityOrder.findIndex(p => a.file_name === p);
      const bIdx = priorityOrder.findIndex(p => b.file_name === p);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
    for (const f of sorted) {
      if (!f.content) continue;
      const style = document.createElement("style");
      style.setAttribute("data-theme-inline-css", f.file_name);
      style.textContent = f.content;
      document.head.appendChild(style);
      styleEls.push(style);
    }
    return () => { styleEls.forEach(el => el.remove()); };
  }, [theme.cssFiles]);

  // Platform-level CSS fallbacks for Slick, Bootstrap carousel, and layout fixes
  // These are structural fixes — the actual theme CSS loads via <link> tags from storage
  const fallbackCss = useMemo(() => `
${SCOPE_SELECTOR} .js-list-category:not(.slick-initialized) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}
${SCOPE_SELECTOR} .js-list-category:not(.slick-initialized) > .hovercartmain {
  flex: 0 0 calc(33.333% - 16px);
  max-width: calc(33.333% - 16px);
}
${SCOPE_SELECTOR} .js-usp:not(.slick-initialized) {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
${SCOPE_SELECTOR} .js-usp:not(.slick-initialized) > .col-6,
${SCOPE_SELECTOR} .js-usp:not(.slick-initialized) > .col-md-3 {
  flex: 0 0 25%;
  max-width: 25%;
}
${SCOPE_SELECTOR} .hovercartmain img {
  max-width: 100%;
  height: auto;
  max-height: 180px;
  object-fit: contain;
}
${SCOPE_SELECTOR} img[src="/placeholder.svg"] {
  max-height: 140px;
  object-fit: contain;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}
/* Slick product carousel fallback — display as horizontal scrollable grid */
${SCOPE_SELECTOR} .slick-product:not(.slick-initialized) {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
${SCOPE_SELECTOR} .slick-product:not(.slick-initialized) > * {
  flex: 0 0 calc(25% - 12px);
  min-width: 220px;
  max-width: calc(25% - 12px);
  scroll-snap-align: start;
}
${SCOPE_SELECTOR} .slick-product:not(.slick-initialized) > * img {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
}
/* Bootstrap carousel full width banners */
${SCOPE_SELECTOR} .carousel-item img {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
}
${SCOPE_SELECTOR} .carousel-inner {
  width: 100%;
}
${SCOPE_SELECTOR} .carousel-item {
  display: none;
}
${SCOPE_SELECTOR} .carousel-item.active {
  display: block;
}
/* Carousel controls */
${SCOPE_SELECTOR} .carousel-control-prev,
${SCOPE_SELECTOR} .carousel-control-next {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15%;
  color: #fff;
  text-align: center;
  opacity: 0.5;
  cursor: pointer;
  text-decoration: none;
}
${SCOPE_SELECTOR} .carousel-control-prev { left: 0; }
${SCOPE_SELECTOR} .carousel-control-next { right: 0; }
${SCOPE_SELECTOR} .carousel-control-prev-icon,
${SCOPE_SELECTOR} .carousel-control-next-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  background: no-repeat center/100%;
}
${SCOPE_SELECTOR} .carousel-control-prev-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23fff' viewBox='0 0 8 8'%3e%3cpath d='M5.25 0l-4 4 4 4 1.5-1.5L4.25 4l2.5-2.5L5.25 0z'/%3e%3c/svg%3e");
}
${SCOPE_SELECTOR} .carousel-control-next-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23fff' viewBox='0 0 8 8'%3e%3cpath d='M2.75 0l-1.5 1.5L3.75 4l-2.5 2.5L2.75 8l4-4-4-4z'/%3e%3c/svg%3e");
}
${SCOPE_SELECTOR} .carousel-indicators {
  position: absolute;
  right: 0;
  bottom: 10px;
  left: 0;
  z-index: 15;
  display: flex;
  justify-content: center;
  padding-left: 0;
  margin: 0;
  list-style: none;
}
${SCOPE_SELECTOR} .carousel-indicators li {
  width: 30px;
  height: 3px;
  margin: 0 3px;
  background-color: rgba(255,255,255,.5);
  cursor: pointer;
  border: 0;
}
${SCOPE_SELECTOR} .carousel-indicators .active {
  background-color: #fff;
}
/* Product card defaults */
${SCOPE_SELECTOR} .product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
${SCOPE_SELECTOR} .product-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
${SCOPE_SELECTOR} .product-card__info {
  padding: 12px;
}
${SCOPE_SELECTOR} .product-card__title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${SCOPE_SELECTOR} .product-card__price {
  font-weight: 700;
  font-size: 15px;
}
/* Ensure category and product sections are visible */
${SCOPE_SELECTOR} .list-category-box {
  display: block !important;
  visibility: visible !important;
}
${SCOPE_SELECTOR} .home-outer-wrapper {
  display: block !important;
  visibility: visible !important;
}
${SCOPE_SELECTOR} .firstpage-custom-collection {
  display: block !important;
  visibility: visible !important;
}
${SCOPE_SELECTOR} .hovercartmain img[src="/placeholder.svg"],
${SCOPE_SELECTOR} .hovercartmain img:not([src]),
${SCOPE_SELECTOR} .hovercartmain img[src=""] {
  width: 217px;
  height: 137px;
  background: #f0f0f0;
  border-radius: 8px;
}
${SCOPE_SELECTOR} .section-title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 700;
}
${SCOPE_SELECTOR} .hovercart {
  display: block;
  text-align: center;
  text-decoration: none;
  color: inherit;
}
${SCOPE_SELECTOR} .hovercart .view {
  margin-top: 8px;
  font-weight: 600;
}
@media (max-width: 767px) {
  ${SCOPE_SELECTOR} .js-list-category:not(.slick-initialized) > .hovercartmain {
    flex: 0 0 calc(50% - 16px);
    max-width: calc(50% - 16px);
  }
  ${SCOPE_SELECTOR} .js-usp:not(.slick-initialized) > .col-6 {
    flex: 0 0 50%;
    max-width: 50%;
  }
  ${SCOPE_SELECTOR} .slick-product:not(.slick-initialized) > * {
    flex: 0 0 calc(50% - 8px);
    min-width: 160px;
    max-width: calc(50% - 8px);
  }
  ${SCOPE_SELECTOR} .carousel-item img {
    max-height: 300px;
  }
}
/* Dropdown navigation hover behavior */
${SCOPE_SELECTOR} .mega-menu .nav { display: flex; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; justify-content: center; }
${SCOPE_SELECTOR} .mega-menu .nav > li { position: relative; }
${SCOPE_SELECTOR} .mega-menu .nav > li > .nav-link { display: block; padding: 10px 12px; color: #111; text-decoration: none; font-weight: 600; font-size: 13px; text-transform: uppercase; white-space: nowrap; }
${SCOPE_SELECTOR} .mega-menu .nav > li > .nav-link:hover { color: #a2ce46; }
${SCOPE_SELECTOR} .mega-menu .dropdown > .dropdown-menu { display: none; position: absolute; top: 100%; left: 0; min-width: 220px; background: #fff; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; padding: 8px 0; }
${SCOPE_SELECTOR} .mega-menu .dropdown-hover:hover > .dropdown-menu { display: block; }
${SCOPE_SELECTOR} .mega-menu .dropdown-menu .nav-link { display: block; padding: 6px 16px; color: #333; text-decoration: none; font-size: 13px; }
${SCOPE_SELECTOR} .mega-menu .dropdown-menu .nav-link:hover { background: #f5f5f5; color: #a2ce46; }
${SCOPE_SELECTOR} .mega-menu .dropdown-menu ul { list-style: none; padding: 0; margin: 0; }
${SCOPE_SELECTOR} .mega-menu .dropdown-toggle svg { margin-left: 4px; vertical-align: middle; }
`, []);

  // Inject Font Awesome + Bootstrap CSS (required by most Maropost themes)
  useEffect(() => {
    const cdnLinks = [
      { href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css", attr: "data-theme-fa" },
      { href: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css", attr: "data-theme-bs" },
    ];
    const addedLinks: HTMLLinkElement[] = [];
    for (const { href, attr } of cdnLinks) {
      if (document.querySelector(`link[${attr}]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute(attr, "true");
      document.head.appendChild(link);
      addedLinks.push(link);
    }
    return () => { addedLinks.forEach(l => l.remove()); };
  }, []);

  // Inject CSS links from the theme's <head> content AND from theme.cssFiles
  useEffect(() => {
    const addedElements: Element[] = [];
    
    // 1. Inject <link> tags for known theme CSS files from storage
    if (cssReady && theme.cssFiles && themeAssetBaseUrl) {
      const priorityOrder = ["slick.css", "slick-theme.css", "app.css", "style.css", "custom.css"];
      const sorted = [...theme.cssFiles].sort((a, b) => {
        const aIdx = priorityOrder.findIndex(p => a.file_name === p);
        const bIdx = priorityOrder.findIndex(p => b.file_name === p);
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });
      for (const f of sorted) {
        const href = `${themeAssetBaseUrl}/${f.file_path}`;
        if (document.querySelector(`link[href="${href}"]`)) continue;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.setAttribute("data-theme-css", f.file_name);
        // When external CSS loads, remove the inline fallback
        link.onload = () => {
          document.querySelector(`style[data-theme-inline-css="${f.file_name}"]`)?.remove();
        };
        document.head.appendChild(link);
        addedElements.push(link);
      }
    }

    // 2. Inject CDN <link> tags found in the rendered head/header HTML
    const allCssHtml = (headContent || "") + (renderedHeader || "");
    const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(allCssHtml)) !== null) {
      const fullTag = match[0];
      let href = match[1];
      if (!fullTag.includes("stylesheet") && !href.endsWith(".css")) continue;
      if (!href || href === "#") continue;
      
      // Rewrite hardcoded /assets/themes/ paths to storage bucket
      if (href.includes("/assets/themes/") && !href.includes("storage/v1")) {
        if (!themeAssetBaseUrl) continue;
        // Extract the path after the theme name, e.g. /assets/themes/skeletal/fonts/titillium.css → fonts/titillium.css
        const themePathMatch = href.match(/\/assets\/themes\/[^/]+\/(.+)/);
        if (themePathMatch) {
          href = `${themeAssetBaseUrl}/${themePathMatch[1]}`;
        } else {
          continue;
        }
      }
      
      // Skip non-HTTP relative paths that aren't storage URLs (already handled above)
      if (!href.startsWith("http") && !href.includes("storage/v1")) continue;
      
      if (document.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-theme-css", "true");
      document.head.appendChild(link);
      addedElements.push(link);
    }
    
    return () => { addedElements.forEach(el => el.remove()); };
  }, [headContent, renderedHeader, cssReady, theme.cssFiles, themeAssetBaseUrl]);

  // Inject theme JS files from database (not from CDN — those are stored in theme_files)
  useEffect(() => {
    if (!theme.jsFiles || theme.jsFiles.length === 0) return;
    const addedScripts: HTMLScriptElement[] = [];
    
    const skipFiles = ["gulpfile.js"];
    const priorityOrder = ["jquery", "vendor", "bootstrap", "slick", "fancybox", "instafeed", "lazyload", "custom", "ba_custom"];
    
    const sorted = [...theme.jsFiles]
      .filter(f => !skipFiles.includes(f.file_name) && f.content)
      .sort((a, b) => {
        const aIdx = priorityOrder.findIndex(p => a.file_name.toLowerCase().includes(p));
        const bIdx = priorityOrder.findIndex(p => b.file_name.toLowerCase().includes(p));
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });
    
    // Use a small delay to inject scripts after DOM render
    const timer = setTimeout(() => {
      sorted.forEach(f => {
        const script = document.createElement("script");
        script.textContent = f.content;
        script.setAttribute("data-theme-js", f.file_name);
        document.body.appendChild(script);
        addedScripts.push(script);
      });
    }, 500);
    
    return () => {
      clearTimeout(timer);
      addedScripts.forEach(el => el.remove());
    };
  }, [theme.jsFiles]);

  // Initialize Bootstrap-style carousel with vanilla JS (fallback if jQuery/Bootstrap not loaded)
  useEffect(() => {
    // Wait for DOM to render with theme content
    const timer = setTimeout(() => {
      const container = document.getElementById("neto-theme");
      if (!container) return;
      
      const carousels = container.querySelectorAll(".carousel.slide");
      carousels.forEach((carousel) => {
        const items = carousel.querySelectorAll(".carousel-item");
        if (items.length <= 1) return;
        
        // Check if Bootstrap carousel is already initialized
        if ((carousel as any)._carouselInit) return;
        (carousel as any)._carouselInit = true;
        
        let currentIdx = 0;
        
        const showSlide = (index: number) => {
          items.forEach((item, i) => item.classList.toggle("active", i === index));
          carousel.querySelectorAll(".carousel-indicators li").forEach((ind, i) => {
            ind.classList.toggle("active", i === index);
          });
        };
        
        const autoTimer = setInterval(() => {
          currentIdx = (currentIdx + 1) % items.length;
          showSlide(currentIdx);
        }, 5000);
        
        carousel.querySelector(".carousel-control-prev")?.addEventListener("click", (e) => {
          e.preventDefault();
          currentIdx = (currentIdx - 1 + items.length) % items.length;
          showSlide(currentIdx);
        });
        carousel.querySelector(".carousel-control-next")?.addEventListener("click", (e) => {
          e.preventDefault();
          currentIdx = (currentIdx + 1) % items.length;
          showSlide(currentIdx);
        });
        
        carousel.querySelectorAll(".carousel-indicators li").forEach((ind, i) => {
          ind.addEventListener("click", () => { currentIdx = i; showSlide(currentIdx); });
        });
        
        // Store timer for cleanup
        (carousel as any)._autoTimer = autoTimer;
      });
    }, 300);
    
    return () => {
      clearTimeout(timer);
      document.getElementById("neto-theme")?.querySelectorAll(".carousel.slide").forEach((c) => {
        clearInterval((c as any)?._autoTimer);
      });
    };
  }, [renderedHeader, renderedFooter]);

  // Execute <script> tags inside #neto-theme that were injected via dangerouslySetInnerHTML
  // (e.g. from content zones like Elfsight widgets). React doesn't execute scripts set via innerHTML.
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const timer = setTimeout(() => {
      const scripts = container.querySelectorAll("script:not([data-executed])");
      scripts.forEach((oldScript) => {
        oldScript.setAttribute("data-executed", "true");
        const newScript = document.createElement("script");
        // Copy attributes (src, defer, async, type, etc.)
        Array.from(oldScript.attributes).forEach((attr) => {
          if (attr.name !== "data-executed") {
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        // Copy inline content if no src
        if (!oldScript.getAttribute("src") && oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }, 600);
    return () => clearTimeout(timer);
  });

  // SPA link interception — route internal links through React Router
  const navigate = useNavigate();
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Skip external links, hash links, mailto, tel, javascript, download, new-tab
      if (/^(https?:\/\/|\/\/|mailto:|tel:|javascript:|data:)/.test(href)) return;
      if (href === "#" || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      // Skip if modifier keys held
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      const bp = basePath || "";

      // Map Maropost legacy paths to our React routes
      const maropostPathMap: Record<string, string> = {
        "/_mycart": `${bp}/cart`,
        "/_myaccount": `${bp}/account`,
        "/contact-us": `${bp}/contact`,
        "/contact_us": `${bp}/contact`,
      };

      let resolved = href;

      // Check for Maropost legacy path matches (with query string support)
      const [pathPart, queryPart] = href.split("?");
      const mappedPath = maropostPathMap[pathPart];
      if (mappedPath) {
        // Handle query string params for Maropost-style routing
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          const fn = params.get("fn");
          const pagePar = params.get("page");
          if (pathPart === "/_mycart" && fn === "payment") {
            resolved = `${bp}/checkout`;
          } else if (pathPart === "/_myaccount" && pagePar === "login") {
            resolved = `${bp}/login`;
          } else if (pathPart === "/_myaccount" && pagePar === "register") {
            resolved = `${bp}/signup`;
          } else if (pathPart === "/_myaccount" && pagePar === "wishlist") {
            resolved = `${bp}/wishlist`;
          } else if (pathPart === "/_myaccount" && pagePar === "nr_track_order") {
            resolved = `${bp}/track-order`;
          } else if (pathPart === "/_myaccount" && pagePar === "forgotpwd") {
            resolved = `${bp}/forgot-password`;
          } else if (pathPart === "/_myaccount" && pagePar === "forgotusr") {
            resolved = `${bp}/forgot-username`;
          } else {
            resolved = mappedPath;
          }
        } else {
          resolved = mappedPath;
        }
      } else {
        // Standard path normalization
        resolved = href.startsWith(bp) ? href : href.startsWith("/") ? `${bp}${href}` : `${bp}/${href}`;
      }

      navigate(resolved);
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [basePath, navigate]);

  // Intercept search form submissions in theme HTML
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const handler = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form || form.tagName !== "FORM") return;
      // Detect search forms by name, role, or input with name="kw"/"q"/"search"
      const isSearch = form.getAttribute("role") === "search"
        || form.getAttribute("name") === "productsearch"
        || form.querySelector("input[name='kw'], input[name='q'], input[name='search']");
      if (isSearch) {
        e.preventDefault();
        const input = form.querySelector("input[name='kw'], input[name='q'], input[name='search'], input[type='search'], input.ajax_search") as HTMLInputElement;
        const query = input?.value?.trim();
        if (query) {
          const bp = basePath || "";
          navigate(`${bp}/products?q=${encodeURIComponent(query)}`);
        }
        return;
      }
      // Detect newsletter/subscribe forms
      const isNewsletter = form.getAttribute("name") === "newsletter"
        || form.classList.contains("newsletter-form")
        || form.querySelector("input[name='email']") && (form.action?.includes("subscribe") || form.classList.contains("subscribe"));
      if (isNewsletter) {
        e.preventDefault();
        const emailInput = form.querySelector("input[name='email'], input[type='email']") as HTMLInputElement;
        if (emailInput?.value) {
          // Dispatch custom event for newsletter signup
          window.dispatchEvent(new CustomEvent("theme:newsletter-signup", { detail: { email: emailInput.value } }));
        }
      }
    };
    container.addEventListener("submit", handler, true);
    return () => container.removeEventListener("submit", handler, true);
  }, [basePath, navigate]);

  // Wire wishlist toggle buttons in theme HTML
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(".wishlist_toggle, [data-wishlist], .btn-wishlist") as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const sku = btn.getAttribute("rel") || btn.getAttribute("data-sku") || btn.getAttribute("data-product-id");
      if (sku) {
        window.dispatchEvent(new CustomEvent("theme:wishlist-toggle", { detail: { sku } }));
      }
    };
    container.addEventListener("click", handler, true);
    return () => container.removeEventListener("click", handler, true);
  }, []);

  return (
    <>
      {/* Platform layout fallback CSS — structural fixes for carousel/grid components */}
      {fallbackCss && (
        <style dangerouslySetInnerHTML={{ __html: fallbackCss }} />
      )}

      {/* Theme-rendered sections: header + footer wrapped in scope */}
      <div id="neto-theme" className="min-h-screen flex flex-col">
        {/* Rendered Header */}
        {renderedHeader && (
          <header dangerouslySetInnerHTML={{ __html: renderedHeader }} />
        )}

        {/* Page Content — children render OUTSIDE theme scope for React pages,
            but INSIDE for B@SE-rendered pages (they bring their own themed wrapper) */}
        <main id="main-content" className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        {/* Rendered Footer */}
        {renderedFooter && (
          <footer dangerouslySetInnerHTML={{ __html: renderedFooter }} />
        )}
      </div>

      <CookieConsentBanner />
      <MobileBottomNav />
    </>
  );
}
