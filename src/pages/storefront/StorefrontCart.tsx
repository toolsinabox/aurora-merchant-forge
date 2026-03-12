import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag, X, Loader2 } from "lucide-react";
import { useStoreSlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  discountAmount: number;
}

export default function StorefrontCart() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error("Invalid coupon code"); return; }

      const coupon = data as any;
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("This coupon has expired"); return;
      }
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error("This coupon has reached its usage limit"); return;
      }
      if (coupon.min_order_amount && totalPrice < Number(coupon.min_order_amount)) {
        toast.error(`Minimum order amount is $${Number(coupon.min_order_amount).toFixed(2)}`); return;
      }

      const amt = coupon.discount_type === "percentage"
        ? totalPrice * (Number(coupon.discount_value) / 100)
        : Math.min(Number(coupon.discount_value), totalPrice);

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discountAmount: Math.round(amt * 100) / 100,
      });
      toast.success("Coupon applied!");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to get started.</p>
          <Link to={`${basePath}/products`}>
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart ({totalItems} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-0 divide-y border rounded-lg">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.variant_id}`} className="flex gap-4 p-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border flex-shrink-0">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`${basePath}/product/${item.product_id}`} className="font-medium text-sm hover:text-primary line-clamp-1">
                    {item.title}
                  </Link>
                  {item.variant_name && <p className="text-xs text-muted-foreground mt-0.5">{item.variant_name}</p>}
                  <p className="text-sm font-semibold mt-1">${Number(item.price).toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive" onClick={() => removeItem(item.product_id, item.variant_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-5 space-y-4 sticky top-20">
              <h2 className="font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-muted-foreground">Calculated at checkout</span></div>
              </div>

              {/* Coupon Code */}
              <Separator />
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono font-medium text-xs">{appliedCoupon.code}</span>
                    <span className="text-muted-foreground">
                      (-{appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value.toFixed(2)}`})
                    </span>
                  </div>
                  <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-9 uppercase text-xs font-mono"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  />
                  <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading} className="h-9 px-3 shrink-0">
                    {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}

              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full h-11 gap-2" onClick={() => navigate(`${basePath}/checkout`)}>
                Checkout <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to={`${basePath}/products`} className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
