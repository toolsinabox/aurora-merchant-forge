import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty,
} from "@/components/ui/command";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck, Settings, BarChart3,
  Tag, Gift, FileText, Globe, Megaphone, CreditCard, Box, Warehouse,
  Shield, Layers, Mail, Star, Puzzle, UserPlus, Heart, Repeat,
  ArrowLeftRight, Monitor, Upload, Download, Bell, Zap, HardDrive,
  ClipboardCheck, Scale, BookOpen, Printer,
} from "lucide-react";

const pages = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "New Product", path: "/products/new", icon: Package },
  { name: "Orders", path: "/orders", icon: ShoppingCart },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Categories", path: "/categories", icon: Tag },
  { name: "Inventory", path: "/inventory", icon: Box },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Coupons", path: "/coupons", icon: Tag },
  { name: "Gift Vouchers", path: "/gift-vouchers", icon: Gift },
  { name: "Shipping Zones", path: "/shipping-zones", icon: Truck },
  { name: "Tax Rates", path: "/tax-rates", icon: Scale },
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Marketing", path: "/marketing", icon: Megaphone },
  { name: "Email Templates", path: "/email-templates", icon: Mail },
  { name: "Email Automations", path: "/email-automations", icon: Mail },
  { name: "Content Pages", path: "/content-pages", icon: FileText },
  { name: "Content Blocks", path: "/content-blocks", icon: Layers },
  { name: "Reviews", path: "/reviews", icon: Star },
  { name: "Suppliers", path: "/suppliers", icon: Truck },
  { name: "Purchase Orders", path: "/purchase-orders", icon: ClipboardCheck },
  { name: "Quotes", path: "/quotes", icon: FileText },
  { name: "Returns", path: "/returns", icon: ArrowLeftRight },
  { name: "Templates", path: "/templates", icon: Globe },
  { name: "Redirects", path: "/redirects", icon: Globe },
  { name: "Addons", path: "/addons", icon: Puzzle },
  { name: "Affiliates", path: "/affiliates", icon: UserPlus },
  { name: "Loyalty Program", path: "/loyalty", icon: Heart },
  { name: "Subscriptions", path: "/subscriptions", icon: Repeat },
  { name: "POS", path: "/pos", icon: Monitor },
  { name: "Pick & Pack", path: "/pick-pack", icon: Warehouse },
  { name: "Warehouse", path: "/warehouse", icon: Warehouse },
  { name: "Stock Adjustments", path: "/stock-adjustments", icon: HardDrive },
  { name: "Stocktake", path: "/stocktake", icon: ClipboardCheck },
  { name: "Import", path: "/import", icon: Upload },
  { name: "Export", path: "/export", icon: Download },
  { name: "API Keys", path: "/api-keys", icon: Shield },
  { name: "API Docs", path: "/api-docs", icon: BookOpen },
  { name: "Webhooks", path: "/webhooks", icon: Bell },
  { name: "Price Rules", path: "/price-rules", icon: Zap },
  { name: "Activity Log", path: "/activity-log", icon: FileText },
  { name: "Sessions", path: "/sessions", icon: Shield },
  { name: "Roles & Permissions", path: "/permissions", icon: Shield },
  { name: "Feature Audit", path: "/feature-audit", icon: BarChart3 },
  { name: "Report Builder", path: "/report-builder", icon: BarChart3 },
  { name: "Currencies", path: "/currencies", icon: CreditCard },
  { name: "Multimarket", path: "/multimarket", icon: Globe },
  { name: "Integrations", path: "/integrations", icon: Puzzle },
  { name: "Media Library", path: "/media-library", icon: HardDrive },
  { name: "Go-Live Checklist", path: "/go-live-checklist", icon: ClipboardCheck },
  { name: "Barcode Labels", path: "/print/barcode-labels", icon: Printer },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => {
                navigate(page.path);
                setOpen(false);
              }}
              className="gap-2"
            >
              <page.icon className="h-4 w-4 text-muted-foreground" />
              <span>{page.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
