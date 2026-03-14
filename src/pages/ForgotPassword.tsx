import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Reset link sent to your email");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — dark branded */}
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
            Don't worry,<br />we've got you covered
          </h1>
          <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-sm">
            Reset your password in seconds. We'll send a secure link to your email address so you can get back to managing your store.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold">Commerce Cloud</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-1">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {sent ? "Check your email for a reset link" : "Enter your email to receive a reset link"}
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-10 pl-9 text-sm"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@store.com"
                    required
                  />
                </div>
              </div>
              <Button className="w-full h-10 text-sm font-medium" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a reset link to <strong className="text-foreground">{email}</strong>
              </p>
              <Button variant="outline" className="h-9 text-xs" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
