import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/storefront/SEOHead";
import { useParams } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { toast } from "sonner";
import { Mail, Check, Loader2 } from "lucide-react";
import { useActiveTheme, findThemeFile, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StorefrontContact() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath, storeSlug } = useStoreSlug(paramSlug);
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [store, setStore] = useState<any>(null);

  // Theme hooks (must be before early returns)
  const { data: theme } = useActiveTheme(store?.id);

  const contactTemplate = useMemo(() => {
    if (!theme) return null;
    return findThemeFile(theme, "templates", "contact")
      || findMainThemeFile(theme, "contact");
  }, [theme]);

  const themeAssetBaseUrl = useMemo(() => {
    if (!store?.id || !theme?.id) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}/${theme.id}`;
  }, [store?.id, theme?.id]);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) { setStoreId(s.id); setStoreName(s.name); setStore(s); }
    });
  }, [storeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !form.name || !form.email || !form.message) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        store_id: storeId,
        name: form.name,
        email: form.email,
        subject: form.subject || null,
        message: form.message,
      } as any);
      if (error) throw error;
      // Trigger contact form email to admin
      supabase.functions.invoke("contact-email", {
        body: { store_id: storeId, name: form.name, email: form.email, subject: form.subject, message: form.message },
      }).catch(() => {}); // fire and forget
      setSubmitted(true);
      toast.success("Message sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <StorefrontLayout storeName={storeName}>
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Message Sent!</h1>
          <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you as soon as possible.</p>
        </div>
      </StorefrontLayout>
    );
  }

  // Theme-based contact page rendering
  if (contactTemplate?.content && theme && store && !submitted) {
    const includes = buildIncludesMap(theme);
    const themeFiles: Record<string, string> = {};
    for (const f of theme.files) {
      themeFiles[f.file_path] = f.content || "";
      themeFiles[`${f.folder}/${f.file_name}`] = f.content || "";
      themeFiles[f.file_name] = f.content || "";
    }
    const contactCtx: TemplateContext = {
      store: { name: store.name, ...store },
      includes,
      themeFiles,
      themeAssetBaseUrl,
      basePath: basePath || "",
      pageType: "contact",
    };

    let rendered = renderTemplate(contactTemplate.content, contactCtx);

    if (themeAssetBaseUrl) {
      const assetExt = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)(\?[^"']*)?/i;
      rendered = rendered.replace(/(src|href)=["']((?!https?:\/\/|\/\/|data:|#|mailto:|javascript:|\{)[^"']+)["']/gi, (match, attr, path) => {
        if (!assetExt.test(path)) return match;
        if (/^(\/placeholder\.|\/assets\/|\/favicon)/i.test(path)) return match;
        const cleanPath = path.replace(/^\/+/, "");
        return `${attr}="${themeAssetBaseUrl}/${cleanPath}"`;
      });
    }

    return (
      <StorefrontLayout storeName={store.name} extraContext={contactCtx}>
        <SEOHead title={`Contact Us — ${store.name}`} description={`Get in touch with ${store.name}`} />
        <div dangerouslySetInnerHTML={{ __html: rendered }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={storeName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Contact Us</h1>
          <p className="text-muted-foreground text-sm mt-1">We'd love to hear from you</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input required value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" required value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={form.subject}
                  onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="What's this about?" />
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <Textarea required value={form.message}
                  onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Your message..." className="min-h-[120px]" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : "Send Message"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </StorefrontLayout>
  );
}
