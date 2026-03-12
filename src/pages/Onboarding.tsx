import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ storeName: "", currency: "USD", timezone: "America/New_York" });
  const [loading, setLoading] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Store created! Welcome to Commerce Cloud.");
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-2">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Set Up Your Store</CardTitle>
          <CardDescription className="text-xs">Configure your commerce platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Store Name</Label>
              <Input className="h-9 text-xs" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="My Awesome Store" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                    <SelectItem value="EUR" className="text-xs">EUR (€)</SelectItem>
                    <SelectItem value="GBP" className="text-xs">GBP (£)</SelectItem>
                    <SelectItem value="CAD" className="text-xs">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York" className="text-xs">Eastern</SelectItem>
                    <SelectItem value="America/Chicago" className="text-xs">Central</SelectItem>
                    <SelectItem value="America/Denver" className="text-xs">Mountain</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="text-xs">Pacific</SelectItem>
                    <SelectItem value="Europe/London" className="text-xs">London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full h-9 text-xs gap-1" type="submit" disabled={loading}>
              {loading ? "Creating store..." : <>Create Store <ArrowRight className="h-3.5 w-3.5" /></>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
