import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

interface RenderedTemplateProps {
  storeId: string;
  slug?: string;
  templateType?: string;
  contextType?: string;
  context: TemplateContext;
  className?: string;
  /** Enable AJAX partial refresh — re-renders without full page reload */
  ajaxRefresh?: boolean;
  /** Auto-refresh interval in ms (e.g., 30000 for 30s). 0 = manual only */
  refreshInterval?: number;
}

/**
 * Fetches active B@SE templates from the store and renders them with the provided context.
 * Supports per-template custom CSS injection via the custom_css column.
 * Supports AJAX partial rendering — re-fetches and re-renders template partials
 * without a full page reload using fetch + incremental DOM update.
 */
export function RenderedTemplate({ storeId, slug, templateType, contextType, context, className, ajaxRefresh, refreshInterval = 0 }: RenderedTemplateProps) {
  const [html, setHtml] = useState<string[]>([]);
  const [css, setCss] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAndRender = useCallback(async (isInitial = false) => {
    let query = supabase
      .from("store_templates" as any)
      .select("content, slug, name, custom_css")
      .eq("store_id", storeId)
      .eq("is_active", true);

    if (slug) query = query.eq("slug", slug);
    if (templateType) query = query.eq("template_type", templateType);
    if (contextType) query = query.eq("context_type", contextType);

    const { data, error } = await query.order("created_at");
    if (error || !data || data.length === 0) {
      if (isInitial) setLoading(false);
      return;
    }

    const rendered = (data as any[]).map((t: any) => renderTemplate(t.content || "", context));
    const styles = (data as any[]).map((t: any) => t.custom_css || "").filter(Boolean);

    // AJAX partial update: update DOM directly without React re-render flicker
    if (!isInitial && ajaxRefresh && containerRef.current) {
      const containers = containerRef.current.querySelectorAll("[data-partial]");
      rendered.forEach((content, idx) => {
        const el = containers[idx] || containerRef.current?.children[idx + (styles.length > 0 ? 1 : 0)];
        if (el && el instanceof HTMLElement) {
          el.innerHTML = content;
        }
      });
      return;
    }

    setHtml(rendered);
    setCss(styles);
    if (isInitial) setLoading(false);
  }, [storeId, slug, templateType, contextType, context, ajaxRefresh]);

  useEffect(() => {
    if (storeId) fetchAndRender(true);
  }, [storeId, slug, templateType, contextType, context]);

  // Auto-refresh interval for AJAX partial rendering
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (ajaxRefresh && refreshInterval > 0 && storeId) {
      intervalRef.current = setInterval(() => fetchAndRender(false), refreshInterval);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [ajaxRefresh, refreshInterval, fetchAndRender, storeId]);

  /** Manual refresh trigger — call via ref or event */
  const refresh = useCallback(() => fetchAndRender(false), [fetchAndRender]);

  // Expose refresh via custom event on the container
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !ajaxRefresh) return;
    const handler = () => refresh();
    el.addEventListener("partial-refresh", handler);
    return () => el.removeEventListener("partial-refresh", handler);
  }, [ajaxRefresh, refresh]);

  if (loading || html.length === 0) return null;

  return (
    <div ref={containerRef} data-ajax-partial={ajaxRefresh ? "true" : undefined}>
      {css.length > 0 && (
        <style dangerouslySetInnerHTML={{ __html: css.join("\n") }} />
      )}
      {html.map((content, idx) => (
        <div
          key={idx}
          data-partial={idx}
          className={className || "prose prose-sm max-w-none"}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ))}
    </div>
  );
}
