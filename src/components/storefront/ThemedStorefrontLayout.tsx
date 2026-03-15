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
function ThemedShell({ theme, store, storeName, children, extraContext }: {
  theme: NonNullable<ReturnType<typeof useActiveTheme>["data"]>;
  store: any;
  storeName?: string;
  children: ReactNode;
  extraContext?: Partial<TemplateContext>;
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
    baseUrl: store?.custom_domain ? `https://${store.custom_domain}` : "",
    pageType: "content",
    ...extraContext,
  }), [store, storeName, includes, themeFiles, extraContext]);

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
      .replace(/<\/?body[^>]*>/gi, "");
    
    return { headContent, bodyContent };
  }, [headerFile, baseCtx]);

  const renderedFooter = useMemo(() => {
    if (!footerFile?.content) return "";
    let rendered = renderTemplate(footerFile.content, baseCtx);
    // Clean up closing tags
    rendered = rendered.replace(/<\/body>/gi, "").replace(/<\/html>/gi, "");
    return rendered;
  }, [footerFile, baseCtx]);

  // Scope all theme CSS under #neto-theme so it doesn't bleed into React components
  const scopedCss = useMemo(() => {
    const raw = theme.cssFiles.map(f => f.content || "").filter(Boolean).join("\n");
    if (!raw) return "";
    return scopeCss(raw, SCOPE_SELECTOR);
  }, [theme.cssFiles]);

  // Combine all JS files
  const combinedJs = useMemo(() => {
    return theme.jsFiles.map(f => f.content || "").filter(Boolean).join("\n");
  }, [theme.jsFiles]);

  // Inject external CSS/JS links from the theme's <head> content
  useEffect(() => {
    if (!headContent) return;
    const addedElements: Element[] = [];
    
    // Extract and inject <link> stylesheet tags
    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(headContent)) !== null) {
      const hrefMatch = match[0].match(/href=["']([^"']+)["']/);
      if (hrefMatch && !document.querySelector(`link[href="${hrefMatch[1]}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = hrefMatch[1];
        link.setAttribute("data-theme-css", "true");
        const mediaMatch = match[0].match(/media=["']([^"']+)["']/);
        if (mediaMatch) link.media = mediaMatch[1];
        document.head.appendChild(link);
        addedElements.push(link);
      }
    }
    
    return () => {
      addedElements.forEach(el => el.remove());
    };
  }, [headContent]);

  // Inject theme JS files
  useEffect(() => {
    if (!combinedJs) return;
    const script = document.createElement("script");
    script.setAttribute("data-theme-js", "true");
    script.textContent = combinedJs;
    document.body.appendChild(script);
    return () => {
      document.querySelectorAll("script[data-theme-js]").forEach(el => el.remove());
    };
  }, [combinedJs]);

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
