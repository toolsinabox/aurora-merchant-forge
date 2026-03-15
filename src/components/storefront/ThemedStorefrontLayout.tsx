import { ReactNode, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";
import { StorefrontLayout } from "./StorefrontLayout";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { MobileBottomNav } from "./MobileBottomNav";

interface ThemedStorefrontLayoutProps {
  children: ReactNode;
  storeName?: string;
  /** Extra context to merge into template rendering */
  extraContext?: Partial<TemplateContext>;
}

/**
 * Scope all CSS rules under a given selector so theme CSS doesn't bleed
 * into React-rendered components. Handles @media, @keyframes, @font-face, etc.
 */
function scopeCss(css: string, scopeSelector: string): string {
  // Remove source map comments
  let result = css.replace(/\/\*#\s*sourceMappingURL=.*?\*\//g, "");

  // Process the CSS by splitting on top-level braces
  // We need to prefix selectors but leave @-rules intact
  const output: string[] = [];
  let i = 0;

  while (i < result.length) {
    // Skip whitespace
    while (i < result.length && /\s/.test(result[i])) { output.push(result[i]); i++; }
    if (i >= result.length) break;

    // Find the next { to determine if this is an @-rule or a selector
    const braceIdx = result.indexOf("{", i);
    if (braceIdx === -1) { output.push(result.slice(i)); break; }

    const prelude = result.slice(i, braceIdx).trim();

    if (prelude.startsWith("@media") || prelude.startsWith("@supports") || prelude.startsWith("@layer")) {
      // Nested @-rule: output the @-rule opener, then recursively scope its contents
      output.push(prelude + " {");
      i = braceIdx + 1;
      // Find matching closing brace
      let depth = 1;
      let blockStart = i;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        i++;
      }
      const innerBlock = result.slice(blockStart, i - 1);
      output.push(scopeCss(innerBlock, scopeSelector));
      output.push("}");
    } else if (prelude.startsWith("@keyframes") || prelude.startsWith("@-webkit-keyframes") || prelude.startsWith("@font-face") || prelude.startsWith("@import") || prelude.startsWith("@charset")) {
      // Pass through as-is (don't scope these)
      output.push(prelude + " {");
      i = braceIdx + 1;
      let depth = 1;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        output.push(result[i]);
        i++;
      }
    } else {
      // Regular selector(s) — scope them
      const scopedSelectors = prelude
        .split(",")
        .map(sel => {
          sel = sel.trim();
          if (!sel) return sel;
          // Don't double-scope
          if (sel.includes(scopeSelector)) return sel;
          // :root and html and body → replace with scope selector
          if (sel === ":root" || sel === "html" || sel === "body") {
            return scopeSelector;
          }
          if (sel.startsWith("html ") || sel.startsWith("body ")) {
            return `${scopeSelector} ${sel.replace(/^(?:html|body)\s+/, "")}`;
          }
          return `${scopeSelector} ${sel}`;
        })
        .join(", ");

      output.push(scopedSelectors + " {");
      i = braceIdx + 1;
      // Find the closing brace for this rule
      let depth = 1;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        output.push(result[i]);
        i++;
      }
    }
  }

  return output.join("");
}

/**
 * Wrapper that checks for an active theme. If theme exists with header/footer templates,
 * renders full B@SE theme. Otherwise falls back to the default React StorefrontLayout.
 */
export function ThemedStorefrontLayout({ children, storeName, extraContext }: ThemedStorefrontLayoutProps) {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
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

  // Show a minimal loading skeleton while store + theme resolve — never flash the default layout
  if (!storeResolved || (!theme && isLoading)) {
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

  return (
    <ThemedShell theme={theme} store={store} storeName={storeName} extraContext={extraContext} categories={categories} basePath={basePath}>
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
  // Rewrite src="..." and href="..." that are relative paths to theme assets
  // Match common asset extensions
  const assetExt = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)(\?[^"']*)?/i;
  // Paths that should NOT be rewritten (app-level or already resolved)
  const skipPaths = /^(\/placeholder\.|\/assets\/|\/favicon)/i;
  return html
    .replace(/(src|href)=["']((?!https?:\/\/|\/\/|data:|#|mailto:|javascript:|\{)[^"']+)["']/gi, (match, attr, path) => {
      if (!assetExt.test(path)) return match;
      if (skipPaths.test(path)) return match;
      const cleanPath = path.replace(/^\/+/, "");
      return `${attr}="${assetBase}/${cleanPath}"`;
    })
    .replace(/url\(\s*['"]?((?!https?:\/\/|\/\/|data:)[^)'"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)[^)'"]*?)['"]?\s*\)/gi, (match, path) => {
      const cleanPath = path.replace(/^\/+/, "").trim();
      return `url("${assetBase}/${cleanPath}")`;
    });
}

/** The actual themed shell that renders header/footer from B@SE templates */
function ThemedShell({ theme, store, storeName, children, extraContext, categories, basePath }: {
  theme: NonNullable<ReturnType<typeof useActiveTheme>["data"]>;
  store: any;
  storeName?: string;
  children: ReactNode;
  extraContext?: Partial<TemplateContext>;
  categories?: any[];
  basePath?: string;
}) {
  const includes = useMemo(() => buildIncludesMap(theme), [theme]);

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
      currency: store?.default_currency || "AUD",
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
    ...extraContext,
  }), [store, storeName, includes, themeFiles, themeAssetBaseUrl, extraContext, categories, basePath]);

  const headerFile = findMainThemeFile(theme, "headers");
  const footerFile = findMainThemeFile(theme, "footers");

  // Render header — the Maropost header template contains <!DOCTYPE>, <html>, <head>, <body>
  // We need to extract just the <body> content for rendering
  const { headContent, bodyContent: renderedHeader } = useMemo(() => {
    if (!headerFile?.content) return { headContent: "", bodyContent: "" };
    const rendered = renderTemplate(headerFile.content, baseCtx);
    
    // Extract <head> content for CSS/meta injection
    const headMatch = rendered.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headContent = headMatch?.[1] || "";
    
    // Extract <body> content — everything after <body...>
    const bodyMatch = rendered.match(/<body[^>]*>([\s\S]*$)/i);
    let bodyContent = bodyMatch?.[1] || rendered;
    
    // Remove DOCTYPE, html, head tags if present at top level
    bodyContent = bodyContent
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      // Strip local theme asset links but preserve CDN links (Google Fonts, etc.)
      .replace(/<link[^>]*href=["'][^"']*\/assets\/themes\/[^"']*["'][^>]*>/gi, "")
      .replace(/<link[^>]*href=["'](?!https?:\/\/|\/\/)[^"']*["'][^>]*>/gi, "");
    
    // Rewrite relative asset paths to storage bucket URLs
    bodyContent = rewriteAssetUrls(bodyContent, themeAssetBaseUrl);
    
    return { headContent, bodyContent };
  }, [headerFile, baseCtx, themeAssetBaseUrl]);

  const renderedFooter = useMemo(() => {
    if (!footerFile?.content) return "";
    let rendered = renderTemplate(footerFile.content, baseCtx);
    // Clean up closing tags and strip scripts (handled separately)
    rendered = rendered
      .replace(/<\/body>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    // Rewrite relative asset paths to storage bucket URLs
    rendered = rewriteAssetUrls(rendered, themeAssetBaseUrl);
    return rendered;
  }, [footerFile, baseCtx, themeAssetBaseUrl]);

  // Scope all theme CSS under #neto-theme so it doesn't bleed into React components
  const scopedCss = useMemo(() => {
    let raw = theme.cssFiles.map(f => f.content || "").filter(Boolean).join("\n");
    if (!raw) return "";
    // Rewrite relative url() paths in CSS to storage bucket
    if (themeAssetBaseUrl) {
      raw = raw.replace(/url\(\s*['"]?((?!https?:\/\/|\/\/|data:)[^)'"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)[^)'"]*?)['"]?\s*\)/gi, (_, path) => {
        const cleanPath = path.replace(/^\.?\/+/, "").trim();
        return `url("${themeAssetBaseUrl}/${cleanPath}")`;
      });
    }
    const scoped = scopeCss(raw, SCOPE_SELECTOR);
    
    // Add CSS fallbacks for Slick carousel wrappers that need JS to layout
    // Without Slick JS, these containers stack vertically — provide flexbox fallback
    const fallbackCss = `
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
`;
    return scoped + fallbackCss;
  }, [theme.cssFiles, themeAssetBaseUrl]);

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

  // Inject external CSS links from the theme's <head> content (CDN only)
  useEffect(() => {
    if (!headContent && !renderedHeader) return;
    const addedElements: Element[] = [];
    
    const allCssHtml = (headContent || "") + (renderedHeader || "");
    const linkRegex = /<link[^>]*href=["']((?:https?:)?\/\/[^"']+)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(allCssHtml)) !== null) {
      const href = match[1];
      if (href.includes("/assets/themes/")) continue;
      if (document.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-theme-css", "true");
      document.head.appendChild(link);
      addedElements.push(link);
    }
    
    return () => { addedElements.forEach(el => el.remove()); };
  }, [headContent, renderedHeader]);

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

  return (
    <>
      {/* Scoped Theme CSS — only applies inside #neto-theme */}
      {scopedCss && (
        <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
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
