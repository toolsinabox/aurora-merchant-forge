import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { toast } from "sonner";
import { Building, CheckCircle } from "lucide-react";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StorefrontWholesale() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    abn_tax_id: "",
    message: "",
  });

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => s && setStore(s));
  }, [storeSlug]);

  const { data: activeTheme } = useActiveTheme(store?.id);

  const themeHtml = useMemo(() => {
    if (!activeTheme || !store) return null;
    const templateFile =
      findMainThemeFile(activeTheme, "wholesale") ||
      findMainThemeFile(activeTheme, "trade") ||
      findMainThemeFile(activeTheme, "wholesale-application");
    if (!templateFile?.content) return null;

    const themeFilesMap: Record<string, string> = {};
    activeTheme.files.forEach(f => { themeFilesMap[f.file_path] = f.content || ""; });
    const themeAssetBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}`;
    const basePath = storeSlug ? `/store/${storeSlug}` : "";

    const ctx: TemplateContext = {
      store,
      basePath,
      pageType: "wholesale",
      themeFiles: themeFilesMap,
      themeAssetBaseUrl,
      includes: buildIncludesMap(activeTheme),
      content: { title: "Wholesale Application", description: "Apply for a wholesale account to access trade pricing and bulk ordering." },
    };

    let html = renderTemplate(templateFile.content, ctx);
    html = html.replace(/(src|href)="(?!https?:\/\/|\/\/|\/|#|data:)([^"]+)"/gi,
      (_, attr, path) => `${attr}="${themeAssetBaseUrl}/${path}"`);
    return html;
  }, [activeTheme, store, storeSlug]);

  const validateABN = (abn: string): boolean => {
    if (!abn) return true;
    const cleaned = abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(cleaned)) return false;
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = cleaned.split("").map(Number);
    digits[0] -= 1;
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    return sum % 89 === 0;
  };

  const [abnError, setAbnError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !form.business_name || !form.contact_name || !form.email) return;
    if (form.abn_tax_id && !validateABN(form.abn_tax_id)) {
      setAbnError("Please enter a valid 11-digit Australian Business Number");
      return;
    }
    setAbnError("");
    setSubmitting(true);
    const { error } = await supabase.from("wholesale_applications" as any).insert({
      store_id: store.id,
      ...form,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit application");
      return;
    }
    setSubmitted(true);
    toast.success("Application submitted successfully!");
  };

  if (submitted) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Application Received</h1>
          <p className="text-muted-foreground">
            Thank you for your wholesale application. We'll review your details and get back to you shortly.
          </p>
        </div>
      </StorefrontLayout>
    );
  }

  if (themeHtml) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div dangerouslySetInnerHTML={{ __html: themeHtml }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Wholesale Application</h1>
          <p className="text-muted-foreground mt-2">
            Apply for a wholesale account to access trade pricing and bulk ordering.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Business Name *</Label>
                  <Input
                    required
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    placeholder="Your Company Pty Ltd"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Name *</Label>
                  <Input
                    required
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="wholesale@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+61 400 000 000"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>ABN / Tax ID</Label>
                <Input
                  value={form.abn_tax_id}
                  onChange={(e) => { setForm({ ...form, abn_tax_id: e.target.value }); setAbnError(""); }}
                  placeholder="12 345 678 901"
                  className={abnError ? "border-destructive" : ""}
                />
                {abnError && <p className="text-xs text-destructive">{abnError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tell us about your business</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What products are you interested in? Expected order volume?"
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
