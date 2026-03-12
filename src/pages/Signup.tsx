import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
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
    } else {
      toast.success("Account created! Set up your store.");
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Create Account</CardTitle>
          <CardDescription className="text-xs">Get started with Commerce Cloud</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input className="h-9 text-xs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input className="h-9 text-xs" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <Input className="h-9 text-xs" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
            </div>
            <Button className="w-full h-9 text-xs" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
            <p className="text-center text-2xs text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
