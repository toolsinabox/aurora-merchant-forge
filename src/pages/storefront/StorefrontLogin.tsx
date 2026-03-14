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
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { useStoreSlug } from "@/lib/subdomain";

export default function StorefrontLogin() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Signed in!");
    navigate(`${basePath}/account`);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + `${basePath}/account` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <StorefrontLayout>
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
        <Card className="border shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <p className="text-sm text-muted-foreground">Sign in to access your account and order history</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 pl-9" placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Password</Label>
                  <Link to={`${basePath}/forgot-username`} className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 pl-9" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to={`${basePath}/signup`} className="text-primary font-medium hover:underline">Create one</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
