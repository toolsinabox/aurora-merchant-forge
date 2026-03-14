import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! You can now sign in.");
      navigate("/login");
    }
  };

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center animate-fade-in max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-bold mb-1">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground mb-4">This link is expired or invalid.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/forgot-password")}>
            Request a new link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-animated text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-primary/6 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Commerce Cloud</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-4">
            Almost there!
          </h1>
          <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-sm">
            Choose a strong, unique password to keep your store secure.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold">Commerce Cloud</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-1">Set New Password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your new password below</p>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 text-sm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-2xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <Button className="w-full h-10 text-sm font-medium" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
