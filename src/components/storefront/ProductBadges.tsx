import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, Clock } from "lucide-react";

interface ProductBadgesProps {
  product: any;
  className?: string;
}

export function ProductBadges({ product, className = "" }: ProductBadgesProps) {
  const badges: { label: string; icon: React.ReactNode; variant: string }[] = [];

  // New product (created within last 14 days)
  if (product.created_at) {
    const daysOld = (Date.now() - new Date(product.created_at).getTime()) / 86400000;
    if (daysOld <= 14) {
      badges.push({ label: "New", icon: <Sparkles className="h-3 w-3" />, variant: "bg-blue-500/10 text-blue-700 border-blue-200" });
    }
  }

  // On sale
  if (product.promo_price && product.promo_start && product.promo_end) {
    const now = new Date();
    if (now >= new Date(product.promo_start) && now <= new Date(product.promo_end)) {
      badges.push({ label: "Sale", icon: null, variant: "bg-destructive/10 text-destructive border-destructive/20" });
    }
  } else if (product.compare_at_price && product.price && product.compare_at_price > product.price) {
    badges.push({ label: "Sale", icon: null, variant: "bg-destructive/10 text-destructive border-destructive/20" });
  }

  // Low stock
  if (product.track_inventory && product.stock_on_hand !== undefined && product.stock_on_hand > 0 && product.stock_on_hand <= 5) {
    badges.push({ label: `Only ${product.stock_on_hand} left`, icon: <AlertTriangle className="h-3 w-3" />, variant: "bg-orange-500/10 text-orange-700 border-orange-200" });
  }

  // Best seller (custom_label)
  if (product.custom_label?.toLowerCase().includes("best seller")) {
    badges.push({ label: "Best Seller", icon: <TrendingUp className="h-3 w-3" />, variant: "bg-green-500/10 text-green-700 border-green-200" });
  }

  // Pre-order
  if (product.preorder_quantity > 0 && (!product.stock_on_hand || product.stock_on_hand <= 0)) {
    badges.push({ label: "Pre-Order", icon: <Clock className="h-3 w-3" />, variant: "bg-purple-500/10 text-purple-700 border-purple-200" });
  }

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges.map((b, i) => (
        <Badge key={i} variant="outline" className={`text-xs gap-1 ${b.variant}`}>
          {b.icon}
          {b.label}
        </Badge>
      ))}
    </div>
  );
}
