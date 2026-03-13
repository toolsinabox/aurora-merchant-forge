import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { ArrowLeft, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoreSlug } from "@/lib/subdomain";

export default function StorefrontForgotUsername() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return "***@***";
    const masked = local.length <= 2 ? "*".repeat(local.length) : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
    return `${masked}@${domain}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !phone.trim()) {
      toast.error("Please enter your name or phone number");
      return;
    }
    setLoading(true);

    let query = supabase.from("customers").select("email").limit(1);
    if (name.trim()) query = query.ilike("name", `%${name.trim()}%`);
    if (phone.trim()) query = query.eq("phone", phone.trim());

    const { data } = await query;
    setLoading(false);

    if (data && data.length > 0 && data[0].email) {
      setMaskedEmail(maskEmail(data[0].email));
      setFound(true);
    } else {
      toast.error("No account found matching those details");
    }
  };

  return (
    <StorefrontLayout storeName="">
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-lg">Forgot Username</CardTitle>
            <CardDescription className="text-xs">
              {found ? "We found your account" : "Enter your details to find your account email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!found ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Full Name</Label>
                  <Input className="h-9 text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone Number</Label>
                  <Input className="h-9 text-xs" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 400 000 000" />
                </div>
                <p className="text-2xs text-muted-foreground">Enter your name, phone, or both to look up your account.</p>
                <Button className="w-full h-9 text-xs" type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Find My Account"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm">Your account email is:</p>
                <p className="text-lg font-mono font-semibold text-primary">{maskedEmail}</p>
                <p className="text-xs text-muted-foreground">For security, the email is partially masked. Use this to log in or reset your password.</p>
                <Button variant="outline" className="h-9 text-xs" onClick={() => { setFound(false); setName(""); setPhone(""); }}>
                  Search again
                </Button>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to={`${basePath}/login`} className="text-2xs text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
