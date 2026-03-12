import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function StorefrontSignup() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const base = `/store/${storeSlug}`;
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

    // Create a customer record linked to this user for the store
    if (data.user) {
      // Find the store
      const { data: stores } = await supabase.from("stores").select("id").limit(100);
      const store = stores?.find((s: any) => s.name?.toLowerCase().replace(/\s+/g, "-") === storeSlug) || stores?.[0];
      if (store) {
        await supabase.from("customers").insert({
          store_id: store.id,
          name,
          email,
          user_id: data.user.id,
        } as any);
      }
    }

    toast.success("Account created! You're signed in.");
    navigate(`${base}/account`);
  };

  return (
    <StorefrontLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <p className="text-sm text-muted-foreground">Track orders and checkout faster</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10" placeholder="Min 6 characters" />
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to={`${base}/login`} className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
