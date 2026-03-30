import { ReactNode, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTheme, buildIncludesMap } from "@/hooks/use-active-theme";
import { useContentZones } from "@/hooks/use-content-zones";
import { type TemplateContext } from "@/lib/base-template-engine";
import { useSSRPage } from "@/hooks/use-ssr-page";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface ThemedStorefrontLayoutProps {
  children: ReactNode;
  storeName?: string;
  /** Extra context to merge into template rendering */
  extraContext?: Partial<TemplateContext>;
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
  // Non-blocking: renders client-side immediately while SSR loads in background
  const { data: ssrData, loading: ssrLoading } = useSSRPage({
    storeId: storeId || undefined,
    pageType,
    slug: pageSlug,
    basePath,
    extraContext,
    enabled: !!storeId && storeResolved,
  });

  // Block on store + theme + SSR resolution so the page appears complete in one shot
  if (!storeResolved || (!theme && isLoading) || ssrLoading) {
    return <div className="min-h-screen" />;
  }

  // No active theme — render nothing (never fall back to React layout)
  if (!theme) {
    return <div className="min-h-screen" />;
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


  // ── SSR-only rendering: no client-side template fallbacks ──
  const headContent = ssrData?.head_content || "";
  const renderedHeader = ssrData?.header_html || "";
  const renderedFooter = ssrData?.footer_html || "";
  const ssrBodyHtml = ssrData?.body_html || "";
  const effectiveAssetBase = ssrData?.theme_asset_base_url || themeAssetBaseUrl;

  // Ensure CSS/JS files exist in storage so <link> tags resolve
  useEffect(() => {
    if (!store?.id || !theme.id) return;
    const allTextAssets = [...(theme.cssFiles || []), ...(theme.jsFiles || [])];
    if (allTextAssets.length === 0) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return;
    let cancelled = false;
    (async () => {
      await Promise.all(allTextAssets.map(async (f) => {
        if (cancelled || !f.content) return;
        const storagePath = `${store.id}/${theme.id}/${f.file_path}`;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/theme-assets/${storagePath}`;
        try {
          const res = await fetch(publicUrl, { method: "HEAD" });
          if (res.ok) return;
        } catch { /* not found */ }
        const mimeType = f.file_name.endsWith(".css") ? "text/css" : "application/javascript";
        const blob = new Blob([f.content], { type: mimeType });
        await supabase.storage
          .from("theme-assets")
          .upload(storagePath, blob, { contentType: mimeType, upsert: true });
      }));
    })();
    return () => { cancelled = true; };
  }, [store?.id, theme.id, theme.cssFiles, theme.jsFiles]);

  // Inject <link> and <style> tags from the rendered head content directly into <head>.
  // The B@SE engine already resolved [%ntheme_asset%] to storage URLs,
  // so we just need to move those tags into the document head.
  useEffect(() => {
    const ssrCssLinks = ssrData?.css_link_tags ? ssrData.css_link_tags : "";
    const allHeadHtml = (headContent || "") + (renderedHeader || "") + ssrCssLinks;
    if (!allHeadHtml) return;

    const addedElements: Element[] = [];

    // Extract and inject <link rel="stylesheet"> tags
    const linkRegex = /<link[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(allHeadHtml)) !== null) {
      const tag = match[0];
      // Only stylesheet links
      if (!tag.includes("stylesheet") && !tag.match(/href=["'][^"']+\.css/i)) continue;
      const hrefMatch = tag.match(/href=["']([^"']+)["']/);
      if (!hrefMatch || !hrefMatch[1] || hrefMatch[1] === "#") continue;
      const href = hrefMatch[1];
      // Skip if already in head
      if (document.querySelector(`link[href="${CSS.escape(href)}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      // Copy media attribute if present
      const mediaMatch = tag.match(/media=["']([^"']+)["']/);
      if (mediaMatch) link.media = mediaMatch[1];
      link.setAttribute("data-theme-css", "true");
      document.head.appendChild(link);
      addedElements.push(link);
    }

    // Extract and inject inline <style> blocks from head content
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

  // No platform carousel init — theme's own JS handles Bootstrap carousel

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

  // Derive Maropost body ID/class from page type for CSS targeting
  const bodyId = useMemo(() => {
    const pt = baseCtx.pageType || "content";
    const map: Record<string, string> = {
      home: "n_home", product: "n_product", category: "n_category",
      cart: "n_cart", checkout: "n_checkout", login: "n_login",
      register: "n_register", account: "n_account", content: "n_content",
      blog: "n_blog", contact: "n_content", search: "n_search",
    };
    return map[pt] || "n_content";
  }, [baseCtx.pageType]);

  return (
    <>
      {/* Theme-rendered sections with Maropost body classes for CSS targeting */}
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
    </>
  );
}
