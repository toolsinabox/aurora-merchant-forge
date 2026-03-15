import { useState, useEffect } from "react";
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
import { FileText, Check, Loader2 } from "lucide-react";

export default function StorefrontRequestQuote() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath, storeSlug } = useStoreSlug(paramSlug);
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", message: "",
  });

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) { setStoreId(s.id); setStoreName(s.name); }
    });
  }, [storeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !form.name || !form.email || !form.message) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("quote_requests" as any).insert({
        store_id: storeId,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || null,
        company_name: form.company || null,
        message: form.message,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Quote request submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit quote request");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <StorefrontLayout storeName={storeName}>
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Quote Request Received</h1>
          <p className="text-muted-foreground mb-6">
            Thank you! We'll review your request and get back to you with a quote shortly.
          </p>
          <Button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", company: "", message: "" }); }}>
            Submit Another Request
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={storeName}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Request a Quote</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tell us what you need and we'll send you a personalized quote
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name *</Label>
                  <Input className="h-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email *</Label>
                  <Input className="h-10" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input className="h-10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Company</Label>
                  <Input className="h-10" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">What do you need a quote for? *</Label>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Describe the products, quantities, and any special requirements..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-10" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : "Submit Quote Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
