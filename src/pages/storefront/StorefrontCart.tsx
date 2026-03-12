import { useParams, Link, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontCart() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const base = `/store/${storeSlug}`;

  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to get started.</p>
          <Link to={`${base}/products`}>
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
                  <Link to={`${base}/product/${item.product_id}`} className="font-medium text-sm hover:text-primary line-clamp-1">
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
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-muted-foreground">Calculated at checkout</span></div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Button className="w-full h-11 gap-2" onClick={() => navigate(`${base}/checkout`)}>
                Checkout <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to={`${base}/products`} className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
