import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Reset link sent to your email");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Reset Password</CardTitle>
          <CardDescription className="text-xs">
            {sent ? "Check your email for a reset link" : "Enter your email to receive a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input className="h-9 text-xs" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@store.com" required />
              </div>
              <Button className="w-full h-9 text-xs" type="submit">Send Reset Link</Button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">We sent a reset link to <strong>{email}</strong></p>
              <Button variant="outline" className="h-9 text-xs" onClick={() => setSent(false)}>Try another email</Button>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-2xs text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
