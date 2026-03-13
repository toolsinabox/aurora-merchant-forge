import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PROMO_DISMISSED_KEY = "storefront_promo_dismissed";
const PROMO_DELAY_MS = 3000;

interface PromoPopupProps {
  basePath: string;
  storeName?: string;
}

export function PromoPopup({ basePath, storeName }: PromoPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(PROMO_DISMISSED_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), PROMO_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(PROMO_DISMISSED_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-300">
      <div className="relative bg-card border rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-in zoom-in-95 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Welcome to {storeName || "our store"}!</h3>
          <p className="text-sm text-muted-foreground">
            Sign up today and get <span className="font-semibold text-primary">10% off</span> your first order.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link to={`${basePath}/signup`} onClick={dismiss}>
              <Button className="w-full">Sign Up Now</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
              No thanks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
