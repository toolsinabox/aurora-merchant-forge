import { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface StorefrontLayoutProps {
  children: ReactNode;
  storeName?: string;
}

export function StorefrontLayout({ children, storeName }: StorefrontLayoutProps) {
  const { storeSlug } = useParams();
  const { totalItems } = useCart();
  const base = `/store/${storeSlug}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontSize: "16px" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link to={base} className="text-sm font-medium hover:text-primary">Home</Link>
                    <Link to={`${base}/products`} className="text-sm font-medium hover:text-primary">All Products</Link>
                  </nav>
                </SheetContent>
              </Sheet>
              <Link to={base} className="text-xl font-bold tracking-tight">
                {storeName || "Store"}
              </Link>
              <nav className="hidden sm:flex items-center gap-6">
                <Link to={`${base}/products`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`${base}/cart`}>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <ShoppingBag className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {storeName || "Store"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
