import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, ArrowRight, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setCurrentStore } = useAuth();
  const [form, setForm] = useState({ storeName: "", slug: "", currency: "USD", timezone: "America/New_York" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from store name unless manually edited
  useEffect(() => {
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: generateSlug(prev.storeName) }));
    }
  }, [form.storeName, slugEdited]);

  // Check slug availability with debounce
  useEffect(() => {
    const slug = form.slug;
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      setSlugStatus(data ? "taken" : "available");
    }, 500);

    return () => clearTimeout(timer);
  }, [form.slug]);

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 48);
    setForm({ ...form, slug: sanitized });
    setSlugEdited(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.slug || form.slug.length < 3) {
      toast.error("Subdomain must be at least 3 characters");
      return;
    }

    if (slugStatus === "taken") {
      toast.error("That subdomain is already taken. Please choose another.");
      return;
    }

    setLoading(true);

    // Ensure we have a fresh session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    // Insert without .select() to avoid SELECT RLS conflict
    // (the handle_new_store trigger hasn't added user_roles yet when RETURNING runs)
    const { error } = await supabase
      .from("stores")
      .insert({
        owner_id: session.user.id,
        name: form.storeName,
        slug: form.slug,
        currency: form.currency,
        timezone: form.timezone,
        contact_email: session.user.email,
      });

    if (error) {
      setLoading(false);
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        toast.error("That subdomain is already taken. Please choose another.");
        setSlugStatus("taken");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Small delay to let the trigger create user_roles, then fetch the store
    await new Promise((r) => setTimeout(r, 500));

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, currency, timezone")
      .eq("slug", form.slug)
      .single();

    setLoading(false);
    if (store) {
      setCurrentStore({ id: store.id, name: store.name, currency: store.currency, timezone: store.timezone });
      toast.success("Store created! Welcome to Commerce Cloud.");
      navigate("/dashboard");
    } else {
      toast.error("Store created but couldn't load it. Please log in again.");
      navigate("/login");
    }
  };

  const slugValid = form.slug.length >= 3 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(form.slug);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-2">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Set Up Your Store</CardTitle>
          <CardDescription className="text-xs">Configure your commerce platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Store Name</Label>
              <Input
                className="h-9 text-xs"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="My Awesome Store"
                required
                maxLength={100}
              />
            </div>

            {/* Subdomain picker */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Globe className="h-3 w-3" /> Store Subdomain
              </Label>
              <div className="flex items-center gap-0">
                <Input
                  className="h-9 text-xs rounded-r-none border-r-0 font-mono"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-store"
                  required
                  maxLength={48}
                  minLength={3}
                />
                <div className="h-9 px-3 flex items-center bg-muted border border-input rounded-r-md text-2xs text-muted-foreground whitespace-nowrap">
                  .yourplatform.com
                </div>
              </div>
              <div className="flex items-center gap-1.5 min-h-[18px]">
                {form.slug.length >= 3 && (
                  <>
                    {slugStatus === "checking" && (
                      <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
                      </span>
                    )}
                    {slugStatus === "available" && slugValid && (
                      <span className="flex items-center gap-1 text-2xs text-success">
                        <CheckCircle2 className="h-3 w-3" /> Available!
                      </span>
                    )}
                    {slugStatus === "taken" && (
                      <span className="flex items-center gap-1 text-2xs text-destructive">
                        <XCircle className="h-3 w-3" /> Already taken
                      </span>
                    )}
                    {!slugValid && slugStatus !== "checking" && (
                      <span className="text-2xs text-muted-foreground">
                        Use lowercase letters, numbers, and hyphens only
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                    <SelectItem value="EUR" className="text-xs">EUR (€)</SelectItem>
                    <SelectItem value="GBP" className="text-xs">GBP (£)</SelectItem>
                    <SelectItem value="CAD" className="text-xs">CAD (C$)</SelectItem>
                    <SelectItem value="AUD" className="text-xs">AUD (A$)</SelectItem>
                    <SelectItem value="NZD" className="text-xs">NZD (NZ$)</SelectItem>
                    <SelectItem value="ZAR" className="text-xs">ZAR (R)</SelectItem>
                    <SelectItem value="SGD" className="text-xs">SGD (S$)</SelectItem>
                    <SelectItem value="JPY" className="text-xs">JPY (¥)</SelectItem>
                    <SelectItem value="INR" className="text-xs">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York" className="text-xs">Eastern</SelectItem>
                    <SelectItem value="America/Chicago" className="text-xs">Central</SelectItem>
                    <SelectItem value="America/Denver" className="text-xs">Mountain</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="text-xs">Pacific</SelectItem>
                    <SelectItem value="Europe/London" className="text-xs">London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full h-9 text-xs gap-1"
              type="submit"
              disabled={loading || slugStatus === "taken" || slugStatus === "checking" || !slugValid}
            >
              {loading ? "Creating store..." : <>Create Store <ArrowRight className="h-3.5 w-3.5" /></>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
