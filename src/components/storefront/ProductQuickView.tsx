import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

interface ProductQuickViewProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath: string;
  storeId?: string;
}

export function ProductQuickView({ product, open, onOpenChange, basePath, storeId }: ProductQuickViewProps) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();

  if (!product) return null;

  const now = new Date();
  const promoActive = product.promo_price && (!product.promo_start || new Date(product.promo_start) <= now) && (!product.promo_end || new Date(product.promo_end) >= now);
  const displayPrice = promoActive ? product.promo_price : product.price;
  const wishlisted = isWishlisted(product.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.title}</DialogTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* Image */}
          <div className="aspect-square bg-muted">
            {product.images?.[0] ? (
              <img src={getImageUrl(product.images[0])} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              {product.brand && <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{product.brand}</p>}
              <h2 className="text-lg font-bold mb-2">{product.title}</h2>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-bold">${Number(displayPrice).toFixed(2)}</span>
                {promoActive && <span className="text-sm text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>}
                {!promoActive && product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-sm text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                )}
                {promoActive && product.promo_tag && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs">{product.promo_tag}</Badge>
                )}
              </div>

              {product.short_description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{product.short_description}</p>
              )}
              {!product.short_description && product.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{product.description}</p>
              )}

              {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  addItem({
                    product_id: product.id,
                    title: product.title,
                    price: Number(displayPrice),
                    image: product.images?.[0] ? getImageUrl(product.images[0]) : undefined,
                    sku: product.sku,
                  });
                  toast.success("Added to cart");
                  onOpenChange(false);
                }}
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => toggleItem(product.id, storeId)}
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
                  {wishlisted ? "Wishlisted" : "Wishlist"}
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to={`${basePath}/product/${product.id}`} onClick={() => onOpenChange(false)}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
