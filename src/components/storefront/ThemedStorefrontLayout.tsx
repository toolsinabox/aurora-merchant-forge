import { ReactNode, useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTheme, findThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
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
 * Wrapper that checks for an active theme. If theme exists with header/footer templates,
 * renders full B@SE theme. Otherwise falls back to the default React StorefrontLayout.
 */
export function ThemedStorefrontLayout({ children, storeName, extraContext }: ThemedStorefrontLayoutProps) {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug } = useStoreSlug(paramSlug);
  const [storeId, setStoreId] = useState<string>("");
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) {
        setStoreId(s.id);
        setStore(s);
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
    <ThemedShell theme={theme} store={store} storeName={storeName} extraContext={extraContext}>
      {children}
    </ThemedShell>
  );
}

/** The actual themed shell that renders header/footer from B@SE templates */
function ThemedShell({ theme, store, storeName, children, extraContext }: {
  theme: NonNullable<ReturnType<typeof useActiveTheme>["data"]>;
  store: any;
  storeName?: string;
  children: ReactNode;
  extraContext?: Partial<TemplateContext>;
}) {
  const includes = useMemo(() => buildIncludesMap(theme), [theme]);

  const baseCtx: TemplateContext = useMemo(() => ({
    store: {
      name: store?.name || storeName || "Store",
      currency: store?.default_currency || "AUD",
      contact_email: store?.contact_email || "",
      ...(store || {}),
    },
    includes,
    ...extraContext,
  }), [store, storeName, includes, extraContext]);

  // Find header template
  const headerFile = findThemeFile(theme, "headers", "header");
  const footerFile = findThemeFile(theme, "footers", "footer");

  const renderedHeader = useMemo(() => {
    if (!headerFile?.content) return "";
    return renderTemplate(headerFile.content, baseCtx);
  }, [headerFile, baseCtx]);

  const renderedFooter = useMemo(() => {
    if (!footerFile?.content) return "";
    return renderTemplate(footerFile.content, baseCtx);
  }, [footerFile, baseCtx]);

  // Combine all CSS files
  const combinedCss = useMemo(() => {
    return theme.cssFiles.map(f => f.content || "").filter(Boolean).join("\n");
  }, [theme.cssFiles]);

  // Combine all JS files
  const combinedJs = useMemo(() => {
    return theme.jsFiles.map(f => f.content || "").filter(Boolean).join("\n");
  }, [theme.jsFiles]);

  // Inject JS
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
    <div className="min-h-screen flex flex-col" id="themed-storefront">
      {/* Theme CSS */}
      {combinedCss && (
        <style dangerouslySetInnerHTML={{ __html: combinedCss }} />
      )}

      {/* Rendered Header */}
      {renderedHeader && (
        <header
          dangerouslySetInnerHTML={{ __html: renderedHeader }}
        />
      )}

      {/* Page Content */}
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* Rendered Footer */}
      {renderedFooter && (
        <footer
          dangerouslySetInnerHTML={{ __html: renderedFooter }}
        />
      )}

      <CookieConsentBanner />
      <MobileBottomNav />
    </div>
  );
}
