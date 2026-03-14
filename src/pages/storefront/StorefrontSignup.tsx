import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, ArrowRight } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

export default function StorefrontSignup() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) { toast.error(error.message); setLoading(false); return; }

    if (data.user && storeSlug) {
      const store = await resolveStoreBySlug(storeSlug, supabase);
      if (store) {
        await supabase.from("customers").insert({
          store_id: store.id,
          name,
          email,
          user_id: data.user.id,
        } as any);
        supabase.functions.invoke("welcome-email", {
          body: { store_id: store.id, customer_name: name, customer_email: email },
        }).catch(() => {});
      }
    }

    toast.success("Account created! You're signed in.");
    navigate(`${basePath}/account`);
  };

  return (
    <StorefrontLayout>
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
        <Card className="border shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Create Account</CardTitle>
            <p className="text-sm text-muted-foreground">Track orders and checkout faster</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-10 pl-9" placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 pl-9" placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 pl-9" placeholder="Min 6 characters" />
                </div>
              </div>
              <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to={`${basePath}/login`} className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
