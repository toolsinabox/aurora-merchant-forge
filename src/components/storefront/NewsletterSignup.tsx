import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsletterSignupProps {
  storeId: string;
}

export function NewsletterSignup({ storeId }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !storeId) return;

    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers" as any)
      .insert({ email, store_id: storeId } as any);

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already subscribed!");
        setSubscribed(true);
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
      return;
    }

    setSubscribed(true);
    toast.success("Successfully subscribed!");
    setEmail("");
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <CheckCircle className="h-4 w-4" />
        <span>Thanks for subscribing!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pl-9 h-9 text-sm"
        />
      </div>
      <Button type="submit" size="sm" className="h-9" disabled={loading}>
        {loading ? "..." : "Subscribe"}
      </Button>
    </form>
  );
}
