import {
  LayoutDashboard, Package, Layers, Warehouse, Users, Megaphone,
  BarChart3, Settings, ChevronDown, Store, Ticket, RotateCcw, Star, ClipboardList, Code2, ClipboardCheck,
  Building, Gift, FileText, ClipboardCopy, Truck, Percent, History, ShoppingCart, ExternalLink, FileQuestion, Link2,
  CreditCard, Webhook, Image, PackageX, Activity, Key, Shield, Monitor, Megaphone as MegaphoneIcon, Mail, Puzzle, Book,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { getSubdomainSlug } from "@/lib/subdomain";

// Determine route prefix based on subdomain mode
const prefix = getSubdomainSlug() ? "/_cpanel" : "";

const mainNav = [
  { title: "Dashboard", url: `${prefix}/dashboard`, icon: LayoutDashboard },
];

const catalogNav = [
  { title: "Products", url: `${prefix}/products`, icon: Package },
  { title: "Categories", url: `${prefix}/categories`, icon: Layers },
  { title: "Inventory", url: `${prefix}/inventory`, icon: Warehouse },
  { title: "Stock Adjustments", url: `${prefix}/stock-adjustments`, icon: History },
  { title: "Stocktake", url: `${prefix}/stocktake`, icon: ClipboardCheck },
  { title: "Suppliers", url: `${prefix}/suppliers`, icon: Building },
  { title: "Purchase Orders", url: `${prefix}/purchase-orders`, icon: ClipboardCopy },
  { title: "Backorders", url: `${prefix}/backorders`, icon: PackageX },
];

const salesNav = [
  { title: "Orders", url: `${prefix}/orders`, icon: Package },
  { title: "Quotes", url: `${prefix}/quotes`, icon: FileQuestion },
  { title: "Layby", url: `${prefix}/layby`, icon: CreditCard },
  { title: "Returns", url: `${prefix}/returns`, icon: RotateCcw },
  { title: "Customers", url: `${prefix}/customers`, icon: Users },
  { title: "Abandoned Carts", url: `${prefix}/abandoned-carts`, icon: ShoppingCart },
  { title: "Warehouse", url: `${prefix}/warehouse`, icon: Warehouse },
  { title: "Pick & Pack", url: `${prefix}/pick-pack`, icon: ClipboardCopy },
];

const marketingNav = [
  { title: "Campaigns", url: `${prefix}/marketing`, icon: Megaphone },
  { title: "Adverts", url: `${prefix}/adverts`, icon: Image },
  { title: "Discounts", url: `${prefix}/coupons`, icon: Ticket },
  { title: "Gift Vouchers", url: `${prefix}/gift-vouchers`, icon: Gift },
  { title: "Reviews", url: `${prefix}/reviews`, icon: Star },
  { title: "Analytics", url: `${prefix}/analytics`, icon: BarChart3 },
];

const contentNav = [
  { title: "Content Pages", url: `${prefix}/content-pages`, icon: FileText },
  { title: "Content Blocks", url: `${prefix}/content-blocks`, icon: LayoutDashboard },
  { title: "Media Library", url: `${prefix}/media`, icon: Image },
  { title: "Templates", url: `${prefix}/templates`, icon: Code2 },
];

const systemNav = [
  { title: "Shipping Zones", url: `${prefix}/shipping-zones`, icon: Truck },
  { title: "Tax Rates", url: `${prefix}/tax-rates`, icon: Percent },
  { title: "Accounting", url: `${prefix}/accounting`, icon: CreditCard },
  { title: "Integrations", url: `${prefix}/integrations`, icon: Link2 },
  { title: "Webhooks", url: `${prefix}/webhooks`, icon: Webhook },
  { title: "API Keys", url: `${prefix}/api-keys`, icon: Key },
  { title: "API Docs", url: `${prefix}/api-docs`, icon: Book },
  { title: "Permissions", url: `${prefix}/permissions`, icon: Shield },
  { title: "Redirects", url: `${prefix}/redirects`, icon: ExternalLink },
  { title: "Activity Log", url: `${prefix}/activity-log`, icon: ClipboardList },
  { title: "Staff Activity", url: `${prefix}/staff-activity`, icon: Activity },
  { title: "Sessions", url: `${prefix}/sessions`, icon: Monitor },
  { title: "Email Templates", url: `${prefix}/email-templates`, icon: Mail },
  { title: "Feature Audit", url: `${prefix}/feature-audit`, icon: ClipboardCheck },
  { title: "Add-Ons", url: `${prefix}/addons`, icon: Puzzle },
  { title: "Settings", url: `${prefix}/settings`, icon: Settings },
];

interface NavGroupProps {
  label: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  collapsed: boolean;
  currentPath: string;
  defaultOpen?: boolean;
}

function NavGroup({ label, items, collapsed, currentPath, defaultOpen = true }: NavGroupProps) {
  const hasActive = items.some((i) => currentPath.startsWith(i.url));

  return (
    <Collapsible defaultOpen={defaultOpen || hasActive}>
      <SidebarGroup>
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="flex items-center justify-between cursor-pointer text-2xs uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80">
            {!collapsed && <span>{label}</span>}
            {!collapsed && <ChevronDown className="h-3 w-3" />}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={currentPath.startsWith(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 text-[13px] px-2 py-1.5 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentStore, availableStores, switchStore } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Store className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              {availableStores.length > 1 ? (
                <select
                  value={currentStore?.id || ""}
                  onChange={(e) => switchStore(e.target.value)}
                  className="text-sm font-semibold text-sidebar-foreground bg-transparent border-none outline-none cursor-pointer truncate p-0 -ml-0.5"
                >
                  {availableStores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-semibold text-sidebar-foreground truncate">
                  {currentStore?.name || "Commerce Cloud"}
                </span>
              )}
              <span className="text-2xs text-sidebar-foreground/50">Commerce Cloud</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1">
        <NavGroup label="Main" items={mainNav} collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Catalog" items={catalogNav} collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Sales" items={salesNav} collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Marketing" items={marketingNav} collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Content" items={contentNav} collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="System" items={systemNav} collapsed={collapsed} currentPath={currentPath} />
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-2xs text-sidebar-foreground/40">
            Commerce Cloud v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
