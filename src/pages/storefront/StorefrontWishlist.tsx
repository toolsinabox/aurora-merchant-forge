import { useEffect, useState } from "react";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getSubdomainSlug } from "@/lib/subdomain";

export default function StorefrontWishlist() {
  const { storeSlug } = useParams();
  const slug = storeSlug || getSubdomainSlug();
  const { items: wishlistIds, toggleItem } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .in("id", wishlistIds)
      .eq("status", "active")
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [wishlistIds]);

  const basePath = slug ? `/store/${slug}` : "";

  return (
    <StorefrontLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="h-5 w-5 text-destructive" />
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <span className="text-sm text-muted-foreground">({wishlistIds.length} items)</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
              <Button asChild variant="outline">
                <Link to={`${basePath}/products`}>Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-20 w-20 bg-muted rounded-md overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`${basePath}/product/${product.id}`} className="font-medium hover:underline line-clamp-1">
                      {product.title}
                    </Link>
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{product.short_description}</p>
                    )}
                    <p className="text-sm font-semibold mt-1">${Number(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => addItem({
                        product_id: product.id,
                        title: product.title,
                        price: Number(product.price),
                        image: product.images?.[0],
                        quantity: 1,
                      })}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => toggleItem(product.id, product.store_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
