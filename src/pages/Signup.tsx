import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  "Unlimited products & variants",
  "Built-in POS system",
  "Multi-warehouse inventory",
  "10+ marketplace integrations",
];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data.session) {
      toast.success("Account created! Set up your store.");
      navigate("/onboarding");
    } else {
      toast.info("Check your email to confirm your account before signing in.");
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

          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              Start selling<br />in minutes
            </h2>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-primary-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
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
            <h1 className="text-xl font-bold text-foreground tracking-tight">Create your account</h1>
            <p className="text-xs text-muted-foreground">Get started with Commerce Cloud — it's free</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <Input
                className="h-10 text-xs"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                className="h-10 text-xs"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Password</Label>
              <Input
                className="h-10 text-xs"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8+ characters"
                required
                minLength={8}
              />
            </div>
            <Button className="w-full h-10 text-xs font-medium shadow-sm" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
