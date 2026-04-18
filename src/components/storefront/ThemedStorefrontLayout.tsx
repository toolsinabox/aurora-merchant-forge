import { ReactNode, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useSSRPage } from "@/hooks/use-ssr-page";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface ThemedStorefrontLayoutProps {
  children: ReactNode;
  storeName?: string;
  extraContext?: Partial<Record<string, any>>;
}

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
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string>("");
  const [store, setStore] = useState<any>(null);
  const [storeResolved, setStoreResolved] = useState(false);
  const { user } = useAuth();
  const { items: cartItems, totalPrice: cartTotal, totalItems: cartCount } = useCart();

  // Step 1: Resolve store (single DB query)
  useEffect(() => {
    if (!storeSlug) { setStoreResolved(true); return; }
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) {
        setStoreId(s.id);
        setStore(s);
      }
      setStoreResolved(true);
    });
  }, [storeSlug]);

  // Derive page type for SSR
  const { pageType, slug: pageSlug } = useMemo(
    () => derivePageType(location.pathname, basePath || ""),
    [location.pathname, basePath]
  );

  // Step 2: Single SSR call — edge function handles ALL data loading & template rendering
  const { data: ssrData, loading: ssrLoading } = useSSRPage({
    storeId: storeId || undefined,
    pageType,
    slug: pageSlug,
    basePath,
    extraContext,
    enabled: !!storeId && storeResolved,
  });

  // Block until store + SSR are resolved
  if (!storeResolved || ssrLoading) {
    return <div className="min-h-screen" />;
  }

  // No SSR data means no active theme
  if (!ssrData) {
    return <div className="min-h-screen" />;
  }

  const headContent = ssrData.head_content || "";
  const renderedHeader = ssrData.header_html || "";
  const renderedFooter = ssrData.footer_html || "";
  const ssrBodyHtml = ssrData.body_html || "";
  const themeAssetBaseUrl = ssrData.theme_asset_base_url || "";

  // Derive Maropost body ID/class from page type for CSS targeting
  const bodyId = (() => {
    const map: Record<string, string> = {
      home: "n_home", product: "n_product", category: "n_category",
      cart: "n_cart", checkout: "n_checkout", login: "n_login",
      register: "n_register", account: "n_account", content: "n_content",
      blog: "n_blog", contact: "n_content", search: "n_search",
    };
    return map[pageType] || "n_content";
  })();

  return (
    <ThemedShellInner
      headContent={headContent}
      renderedHeader={renderedHeader}
      renderedFooter={renderedFooter}
      ssrBodyHtml={ssrBodyHtml}
      ssrData={ssrData}
      bodyId={bodyId}
      basePath={basePath}
      navigate={navigate}
    >
      {children}
    </ThemedShellInner>
  );
}

/** Inner component that handles DOM side-effects for injected theme HTML */
function ThemedShellInner({
  headContent, renderedHeader, renderedFooter, ssrBodyHtml, ssrData, bodyId, basePath, navigate, children,
}: {
  headContent: string;
  renderedHeader: string;
  renderedFooter: string;
  ssrBodyHtml: string;
  ssrData: import("@/hooks/use-ssr-page").SSRPageResult;
  bodyId: string;
  basePath?: string;
  navigate: ReturnType<typeof useNavigate>;
  children: ReactNode;
}) {
  // Inject CSS <link> and <style> tags into document <head>
  useEffect(() => {
    const ssrCssLinks = ssrData?.css_link_tags || "";
    const allHeadHtml = (headContent || "") + (renderedHeader || "") + ssrCssLinks;
    if (!allHeadHtml) return;

    const addedElements: Element[] = [];

    // Extract and inject <link rel="stylesheet"> tags
    const linkRegex = /<link[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(allHeadHtml)) !== null) {
      const tag = match[0];
      if (!tag.includes("stylesheet") && !tag.match(/href=["'][^"']+\.css/i)) continue;
      const hrefMatch = tag.match(/href=["']([^"']+)["']/);
      if (!hrefMatch || !hrefMatch[1] || hrefMatch[1] === "#") continue;
      const href = hrefMatch[1];
      if (document.querySelector(`link[href="${CSS.escape(href)}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      const mediaMatch = tag.match(/media=["']([^"']+)["']/);
      if (mediaMatch) link.media = mediaMatch[1];
      link.setAttribute("data-theme-css", "true");
      document.head.appendChild(link);
      addedElements.push(link);
    }

    // Extract and inject inline <style> blocks
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleRegex.exec(allHeadHtml)) !== null) {
      const content = styleMatch[1];
      if (!content.trim()) continue;
      const style = document.createElement("style");
      style.setAttribute("data-theme-css", "true");
      style.textContent = content;
      document.head.appendChild(style);
      addedElements.push(style);
    }

    return () => { addedElements.forEach(el => el.remove()); };
  }, [headContent, renderedHeader, ssrData]);

  // Inject theme JS via <script src="..."> — browser caches them across SPA navigations
  useEffect(() => {
    const jsFiles = ssrData?.js_files;
    if (!jsFiles || jsFiles.length === 0) return;

    const skipFiles = ["gulpfile.js"];
    const priorityOrder = ["jquery", "vendor", "bootstrap", "slick", "fancybox", "instafeed", "lazyload", "custom", "ba_custom"];

    const sorted = [...jsFiles]
      .filter(f => !skipFiles.includes(f.name) && f.src)
      .sort((a, b) => {
        const aIdx = priorityOrder.findIndex(p => a.name.toLowerCase().includes(p));
        const bIdx = priorityOrder.findIndex(p => b.name.toLowerCase().includes(p));
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });

    sorted.forEach(f => {
      const selector = `script[data-theme-js="${f.name.replace(/"/g, '\\"')}"]`;
      if (document.querySelector(selector)) return; // already loaded
      const script = document.createElement("script");
      script.src = f.src;
      script.defer = true;
      script.setAttribute("data-theme-js", f.name);
      document.body.appendChild(script);
    });
    // No cleanup — let cached scripts persist across SPA navigation
  }, [ssrData?.js_files]);

  // Execute <script> tags inside #neto-theme injected via dangerouslySetInnerHTML
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const timer = setTimeout(() => {
      const scripts = container.querySelectorAll("script:not([data-executed])");
      scripts.forEach((oldScript) => {
        oldScript.setAttribute("data-executed", "true");
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          if (attr.name !== "data-executed") {
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        if (!oldScript.getAttribute("src") && oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }, 200);
    return () => clearTimeout(timer);
  });

  // SPA link interception — route internal links through React Router
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (/^(https?:\/\/|\/\/|mailto:|tel:|javascript:|data:)/.test(href)) return;
      if (href === "#" || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      const bp = basePath || "";

      const maropostPathMap: Record<string, string> = {
        "/_mycart": `${bp}/cart`,
        "/_myaccount": `${bp}/account`,
        "/contact-us": `${bp}/contact`,
        "/contact_us": `${bp}/contact`,
      };

      let resolved = href;
      const [pathPart, queryPart] = href.split("?");
      const mappedPath = maropostPathMap[pathPart];
      if (mappedPath) {
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          const fn = params.get("fn");
          const pagePar = params.get("page");
          if (pathPart === "/_mycart" && fn === "payment") resolved = `${bp}/checkout`;
          else if (pathPart === "/_myaccount" && pagePar === "login") resolved = `${bp}/login`;
          else if (pathPart === "/_myaccount" && pagePar === "register") resolved = `${bp}/signup`;
          else if (pathPart === "/_myaccount" && pagePar === "wishlist") resolved = `${bp}/wishlist`;
          else if (pathPart === "/_myaccount" && pagePar === "nr_track_order") resolved = `${bp}/track-order`;
          else if (pathPart === "/_myaccount" && pagePar === "forgotpwd") resolved = `${bp}/forgot-password`;
          else if (pathPart === "/_myaccount" && pagePar === "forgotusr") resolved = `${bp}/forgot-username`;
          else resolved = mappedPath;
        } else {
          resolved = mappedPath;
        }
      } else {
        resolved = href.startsWith(bp) ? href : href.startsWith("/") ? `${bp}${href}` : `${bp}/${href}`;
      }

      navigate(resolved);
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [basePath, navigate]);

  // Intercept search form submissions
  useEffect(() => {
    const container = document.getElementById("neto-theme");
    if (!container) return;
    const handler = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form || form.tagName !== "FORM") return;
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
      const isNewsletter = form.getAttribute("name") === "newsletter"
        || form.classList.contains("newsletter-form")
        || form.querySelector("input[name='email']") && (form.action?.includes("subscribe") || form.classList.contains("subscribe"));
      if (isNewsletter) {
        e.preventDefault();
        const emailInput = form.querySelector("input[name='email'], input[type='email']") as HTMLInputElement;
        if (emailInput?.value) {
          window.dispatchEvent(new CustomEvent("theme:newsletter-signup", { detail: { email: emailInput.value } }));
        }
      }
    };
    container.addEventListener("submit", handler, true);
    return () => container.removeEventListener("submit", handler, true);
  }, [basePath, navigate]);

  // Wire wishlist toggle buttons
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
    <div id="neto-theme" className={`min-h-screen flex flex-col n_skeletal ${bodyId}`} data-page-id={bodyId}>
      {renderedHeader && (
        <header dangerouslySetInnerHTML={{ __html: renderedHeader }} />
      )}
      <main id="main-content" className="flex-1">
        {ssrBodyHtml ? (
          <div dangerouslySetInnerHTML={{ __html: ssrBodyHtml }} />
        ) : (
          children
        )}
      </main>
      {renderedFooter && (
        <footer dangerouslySetInnerHTML={{ __html: renderedFooter }} />
      )}
    </div>
  );
}
