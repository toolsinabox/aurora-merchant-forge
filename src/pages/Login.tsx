import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      const { data: stores } = await supabase.from("stores").select("id").limit(1);
      if (stores && stores.length > 0) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — dark branded */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-animated text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[150px] h-[150px] rounded-full bg-primary/10 blur-2xl animate-float" />
        </div>
        <div className="relative flex flex-col justify-between p-10 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Commerce Cloud</span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/20 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3" /> 500+ features · 40 modules
            </div>
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              The complete commerce<br />platform for modern<br />merchants
            </h2>
            <p className="text-sm text-primary-foreground/60 max-w-sm leading-relaxed">
              Multi-store, multi-warehouse, B2B, POS, and marketplace integrations — all in one place.
            </p>
          </div>

          <p className="text-xs text-primary-foreground/30">© {new Date().getFullYear()} Commerce Cloud</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Store className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base text-foreground">Commerce Cloud</span>
          </div>

          <div className="space-y-1.5 mb-6">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-xs text-muted-foreground">Sign in to your merchant dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                className="h-10 text-xs"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium">Password</Label>
                <Link to="/forgot-password" className="text-[11px] text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                className="h-10 text-xs"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button className="w-full h-10 text-xs font-medium shadow-sm" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
