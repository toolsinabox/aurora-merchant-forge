import { Link, useLocation, useParams } from "react-router-dom";
import { Home, Grid3X3, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStoreSlug } from "@/lib/subdomain";

export function MobileBottomNav() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const { totalItems } = useCart();
  const location = useLocation();

  const links = [
    { to: basePath || "/", icon: Home, label: "Home" },
    { to: `${basePath}/products`, icon: Grid3X3, label: "Shop" },
    { to: `${basePath}/cart`, icon: ShoppingBag, label: "Cart", badge: totalItems },
    { to: `${basePath}/account`, icon: User, label: "Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-14">
        {links.map((link) => {
          const isActive = location.pathname === link.to || (link.to !== (basePath || "/") && location.pathname.startsWith(link.to));
          return (
            <Link
              key={link.label}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
              {link.badge && link.badge > 0 ? (
                <span className="absolute -top-0.5 right-1 h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
