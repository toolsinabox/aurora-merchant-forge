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
 * Can filter by slug, template_type, or context_type.
 */
export function RenderedTemplate({ storeId, slug, templateType, contextType, context, className }: RenderedTemplateProps) {
  const [html, setHtml] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("store_templates" as any)
        .select("content, slug, name")
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
      setHtml(rendered);
      setLoading(false);
    }
    if (storeId) load();
  }, [storeId, slug, templateType, contextType, context]);

  if (loading || html.length === 0) return null;

  return (
    <>
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

/**
 * Hook to fetch and render a single template by slug.
 */
export function useRenderedTemplate(storeId: string | undefined, slug: string, context: TemplateContext) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!storeId || !slug) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("store_templates" as any)
        .select("content")
        .eq("store_id", storeId)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setHtml(renderTemplate((data as any).content || "", context));
      setLoading(false);
    }
    load();
  }, [storeId, slug, context]);

  return { html, loading };
}
