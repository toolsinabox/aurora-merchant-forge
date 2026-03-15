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
  const { storeSlug } = useStoreSlug(paramSlug);
  const [storeId, setStoreId] = useState<string>("");
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) {
        setStoreId(s.id);
        setStore(s);
        // Fetch categories for menu rendering
        supabase
          .from("categories")
          .select("id, name, slug, parent_id, sort_order, image_url")
          .eq("store_id", s.id)
          .order("sort_order")
          .then(({ data }) => {
            if (data) setCategories(data);
          });
      }
    });
  }, [storeSlug]);

  const { data: theme, isLoading } = useActiveTheme(storeId);

  // If no theme or still loading, fall back to default layout
  if (!storeId || isLoading) {
    return <StorefrontLayout storeName={storeName}>{children}</StorefrontLayout>;
  }

  if (!theme) {
    return <StorefrontLayout storeName={storeName}>{children}</StorefrontLayout>;
  }

  return (
    <ThemedShell theme={theme} store={store} storeName={storeName} extraContext={extraContext} categories={categories}>
      {children}
    </ThemedShell>
  );
}

const SCOPE_SELECTOR = "#neto-theme";

/** The actual themed shell that renders header/footer from B@SE templates */
function ThemedShell({ theme, store, storeName, children, extraContext, categories }: {
  theme: NonNullable<ReturnType<typeof useActiveTheme>["data"]>;
  store: any;
  storeName?: string;
  children: ReactNode;
  extraContext?: Partial<TemplateContext>;
  categories?: any[];
}) {
  const includes = useMemo(() => buildIncludesMap(theme), [theme]);

  // Build themeFiles map for [%load_template%] resolution
  const themeFiles = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of theme.files) {
      map[f.file_path] = f.content || "";
      // Also map by folder/filename variants
      map[`${f.folder}/${f.file_name}`] = f.content || "";
      // And by includes-style paths (e.g., "headers/includes/head.template.html")
      const parts = f.file_path.split("/");
      if (parts.length > 1) {
        map[parts.slice(0).join("/")] = f.content || "";
      }
    }
    return map;
  }, [theme.files]);

  const baseCtx: TemplateContext = useMemo(() => ({
    store: {
      name: store?.name || storeName || "Store",
      currency: store?.default_currency || "AUD",
      contact_email: store?.contact_email || "",
      ...(store || {}),
    },
    includes,
    themeFiles,
    categories: categories || [],
    baseUrl: store?.custom_domain ? `https://${store.custom_domain}` : "",
    pageType: "content",
    ...extraContext,
  }), [store, storeName, includes, themeFiles, extraContext, categories]);

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
      .replace(/<link[^>]*>/gi, "");
    
    return { headContent, bodyContent };
  }, [headerFile, baseCtx]);

  const renderedFooter = useMemo(() => {
    if (!footerFile?.content) return "";
    let rendered = renderTemplate(footerFile.content, baseCtx);
    // Clean up closing tags and strip scripts (handled separately)
    rendered = rendered
      .replace(/<\/body>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    return rendered;
  }, [footerFile, baseCtx]);

  // Scope all theme CSS under #neto-theme so it doesn't bleed into React components
  const scopedCss = useMemo(() => {
    const raw = theme.cssFiles.map(f => f.content || "").filter(Boolean).join("\n");
    if (!raw) return "";
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
`;
    return scoped + fallbackCss;
  }, [theme.cssFiles]);

  // Inject external CSS/JS links from the theme's <head> content
  useEffect(() => {
    if (!headContent) return;
    const addedElements: Element[] = [];
    
    // Extract and inject <link> stylesheet tags — only external CDN ones
    const linkRegex = /<link[^>]*(?:rel=["']stylesheet["']|type=["']text\/css["'])[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(headContent)) !== null) {
      const hrefMatch = match[0].match(/href=["']([^"']+)["']/);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];
      // Skip theme asset CSS (already injected via scoped <style>)
      if (href.includes("/assets/themes/") || href.includes("ntheme_asset")) continue;
      if (!href.startsWith("http") && !href.startsWith("//")) continue;
      if (document.querySelector(`link[href="${href}"]`)) continue;
      
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-theme-css", "true");
      const mediaMatch = match[0].match(/media=["']([^"']+)["']/);
      if (mediaMatch) link.media = mediaMatch[1];
      document.head.appendChild(link);
      addedElements.push(link);
    }

    // Also inject CSS links from body (the header template has <link> tags)
    const bodyLinkRegex = /<link[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    const bodyHtml = renderedHeader || "";
    let bm;
    while ((bm = bodyLinkRegex.exec(bodyHtml)) !== null) {
      const href = bm[1];
      if (href.includes("/assets/themes/") || document.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-theme-css", "true");
      document.head.appendChild(link);
      addedElements.push(link);
    }
    
    return () => {
      addedElements.forEach(el => el.remove());
    };
  }, [headContent, renderedHeader]);

  // Inject external scripts from rendered header/footer (CDN jQuery, Bootstrap, etc.)
  useEffect(() => {
    const addedScripts: HTMLScriptElement[] = [];
    const allHtml = (renderedHeader || "") + (renderedFooter || "");
    
    // Extract <script src="..."> tags for external scripts
    const scriptSrcRegex = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    let sm;
    while ((sm = scriptSrcRegex.exec(allHtml)) !== null) {
      const src = sm[1];
      // Skip tracking/analytics scripts
      if (src.includes("google-analytics") || src.includes("googletagmanager")) continue;
      if (document.querySelector(`script[src="${src}"]`)) continue;
      
      const script = document.createElement("script");
      script.src = src;
      script.setAttribute("data-theme-ext-js", "true");
      // Load jQuery first, others after
      if (src.includes("jquery") && !src.includes("jquery-ui") && !src.includes("jquery.")) {
        script.async = false;
        document.head.appendChild(script);
      } else {
        script.async = false;
        document.body.appendChild(script);
      }
      addedScripts.push(script);
    }
    
    return () => {
      addedScripts.forEach(el => el.remove());
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
