import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Invalid or expired reset link.</p>
            <Button variant="link" className="text-xs mt-2" onClick={() => navigate("/forgot-password")}>
              Request a new one
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Set New Password</CardTitle>
          <CardDescription className="text-xs">Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">New Password</Label>
              <Input className="h-9 text-xs" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button className="w-full h-9 text-xs" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
