import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

interface RenderedTemplateProps {
  storeId: string;
  slug?: string;
  templateType?: string;
  contextType?: string;
  context: TemplateContext;
  className?: string;
}

/**
 * Fetches active B@SE templates from the store and renders them with the provided context.
 * Supports per-template custom CSS injection via the custom_css column.
 */
export function RenderedTemplate({ storeId, slug, templateType, contextType, context, className }: RenderedTemplateProps) {
  const [html, setHtml] = useState<string[]>([]);
  const [css, setCss] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
        setLoading(false);
        return;
      }

      const rendered = (data as any[]).map((t: any) => renderTemplate(t.content || "", context));
      const styles = (data as any[]).map((t: any) => t.custom_css || "").filter(Boolean);
      setHtml(rendered);
      setCss(styles);
      setLoading(false);
    }
    if (storeId) load();
  }, [storeId, slug, templateType, contextType, context]);

  if (loading || html.length === 0) return null;

  return (
    <>
      {css.length > 0 && (
        <style dangerouslySetInnerHTML={{ __html: css.join("\n") }} />
      )}
      {html.map((content, idx) => (
        <div
          key={idx}
          className={className || "prose prose-sm max-w-none"}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ))}
    </>
  );
}