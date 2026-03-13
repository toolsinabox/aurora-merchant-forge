import { Search, ChevronDown, User, LogOut, ExternalLink } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { getSubdomainSlug } from "@/lib/subdomain";

const PLATFORM_DOMAINS = ["localhost", "lovable.app", "lovable.dev", "lovableproject.com", "127.0.0.1"];

function getStorefrontUrl(slug: string | undefined): string | null {
  if (!slug) return null;
  const hostname = window.location.hostname;

  // Subdomain mode — storefront is at root
  if (getSubdomainSlug()) return "/";

  // Preview/dev — use path-based route
  const isPreview = PLATFORM_DOMAINS.some((d) => hostname.includes(d));
  if (isPreview) return `/store/${slug}`;

  // Production — subdomain URL
  const parts = hostname.split(".");
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
  return `https://${slug}.${baseDomain}`;
}

export function TopBar() {
  const { user, currentStore, signOut } = useAuth();
  const navigate = useNavigate();
  const isSubdomain = !!getSubdomainSlug();

  const handleSignOut = async () => {
    await signOut();
    navigate(isSubdomain ? "/_cpanel" : "/login");
  };

  const storefrontUrl = getStorefrontUrl(currentStore?.slug ?? currentStore?.name?.toLowerCase().replace(/\s+/g, "-"));

  return (
    <header className="h-12 flex items-center gap-2 border-b border-border bg-card px-3 shrink-0">
      <SidebarTrigger className="h-8 w-8" />

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search products, orders, customers..."
          className="h-8 pl-8 text-xs bg-muted/50 border-transparent focus:border-border"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {storefrontUrl && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            asChild
          >
            <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View Storefront
            </a>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              {currentStore?.name || "No Store"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">Switch Store</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {currentStore && <DropdownMenuItem className="text-xs">{currentStore.name}</DropdownMenuItem>}
            <DropdownMenuItem className="text-xs" onClick={() => navigate(isSubdomain ? "/_cpanel/onboarding" : "/onboarding")}>+ Create New Store</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs" onClick={() => navigate(isSubdomain ? "/_cpanel/settings" : "/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
