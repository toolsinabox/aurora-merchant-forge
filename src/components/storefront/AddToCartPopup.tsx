import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AddToCartPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    title: string;
    price: number;
    quantity: number;
    image?: string;
    variant_name?: string;
  } | null;
  cartTotal: number;
  cartItemCount: number;
  basePath: string;
}

export function AddToCartPopup({ open, onOpenChange, item, cartTotal, cartItemCount, basePath }: AddToCartPopupProps) {
  const navigate = useNavigate();

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <div className="bg-primary/5 p-4 flex items-center gap-3 border-b">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium">Added to cart!</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            {item.image && (
              <img
                src={item.image.startsWith("http") ? item.image : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.image}`}
                alt={item.title}
                className="h-14 w-14 rounded-md object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              {item.variant_name && <p className="text-xs text-muted-foreground">{item.variant_name}</p>}
              <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> {cartItemCount} items in cart
            </span>
            <span className="font-medium text-foreground">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Continue Shopping
            </Button>
            <Button size="sm" className="text-xs" onClick={() => { onOpenChange(false); navigate(`${basePath}/cart`); }}>
              View Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
