import {
  LayoutDashboard, Package, Layers, Warehouse, Users, Megaphone,
  BarChart3, Settings, ChevronDown, Store, Ticket, RotateCcw, Star, ClipboardList, Code2, ClipboardCheck,
  Building, Gift, FileText, ClipboardCopy, Truck, Percent, History, ShoppingCart, ExternalLink, FileQuestion, Link2,
  CreditCard, Webhook, Image, PackageX, Activity, Key, Shield, Monitor, Mail, Puzzle, Book,
  Heart, PieChart, Smartphone, UserPlus, DollarSign, Sparkles, Globe, ShoppingBag, Repeat,
  FileDown, TrendingUp, Save, Zap, MapPin, Calculator, Archive, Boxes, Bell, List, Navigation, Printer, Target,
  FormInput, ReceiptText, Share2, ArrowLeftRight, Palette, HelpCircle, FolderOpen, BarChart, Newspaper, Calendar,
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

const prefix = getSubdomainSlug() ? "/_cpanel" : "";

// ════════════════════════════════════════════════════════════════
// Maropost Control Panel Navigation — Exact parity with Neto CP
// ════════════════════════════════════════════════════════════════

// ── Dashboard ──
const dashboardNav = [
  { title: "Dashboard", url: `${prefix}/dashboard`, icon: LayoutDashboard },
];

// ── Orders & Invoices (Maropost: "Orders & Invoices") ──
const ordersNav = [
  { title: "All Orders", url: `${prefix}/orders`, icon: Package },
  { title: "Quotes", url: `${prefix}/quotes`, icon: FileQuestion },
  { title: "Returns", url: `${prefix}/returns`, icon: RotateCcw },
  { title: "Credit Notes", url: `${prefix}/credit-notes`, icon: FileText },
  { title: "Refunds", url: `${prefix}/refunds`, icon: ReceiptText },
  { title: "Layby", url: `${prefix}/layby`, icon: CreditCard },
  { title: "Subscriptions", url: `${prefix}/subscriptions`, icon: Repeat },
  { title: "Order Holds", url: `${prefix}/order-holds`, icon: Shield },
  { title: "Abandoned Carts", url: `${prefix}/abandoned-carts`, icon: ShoppingCart },
  { title: "Saved Carts", url: `${prefix}/saved-carts`, icon: Save },
  { title: "Batch Invoices", url: `${prefix}/batch-invoices`, icon: Printer },
  { title: "Order Workflows", url: `${prefix}/order-workflows`, icon: Zap },
];

// ── Products (Maropost: "Products") ──
const productsNav = [
  { title: "All Products", url: `${prefix}/products`, icon: Package },
  { title: "Categories", url: `${prefix}/categories`, icon: Layers },
  { title: "Smart Collections", url: `${prefix}/smart-collections`, icon: Sparkles },
  { title: "Digital Downloads", url: `${prefix}/digital-downloads`, icon: FileDown },
  { title: "Price Lists", url: `${prefix}/price-lists`, icon: List },
  { title: "Price Rules", url: `${prefix}/price-rules`, icon: Zap },
  { title: "Scheduled Prices", url: `${prefix}/scheduled-prices`, icon: Calendar },
];

// ── Customers (Maropost: "Customers") ──
const customersNav = [
  { title: "All Customers", url: `${prefix}/customers`, icon: Users },
  { title: "Customer Segments", url: `${prefix}/customer-segments`, icon: Target },
  { title: "Customer Groups", url: `${prefix}/customers`, icon: Users },
  { title: "Reviews", url: `${prefix}/reviews`, icon: Star },
  { title: "Affiliates", url: `${prefix}/affiliates`, icon: UserPlus },
  { title: "Loyalty Program", url: `${prefix}/loyalty`, icon: Heart },
];

// ── Inventory (Maropost: "Inventory") ──
const inventoryNav = [
  { title: "Inventory", url: `${prefix}/inventory`, icon: Warehouse },
  { title: "Stock Adjustments", url: `${prefix}/stock-adjustments`, icon: History },
  { title: "Stocktake", url: `${prefix}/stocktake`, icon: ClipboardCheck },
  { title: "Backorders", url: `${prefix}/backorders`, icon: PackageX },
  { title: "Suppliers", url: `${prefix}/suppliers`, icon: Building },
  { title: "Purchase Orders", url: `${prefix}/purchase-orders`, icon: ClipboardCopy },
  { title: "Forecasting", url: `${prefix}/inventory-forecasting`, icon: TrendingUp },
  { title: "Inventory Reports", url: `${prefix}/inventory-reports`, icon: BarChart3 },
];

// ── Warehousing & Fulfillment (Maropost: "Warehousing & Fulfillment") ──
const fulfillmentNav = [
  { title: "Warehouse", url: `${prefix}/warehouse`, icon: Warehouse },
  { title: "Pick & Pack", url: `${prefix}/pick-pack`, icon: ClipboardCopy },
  { title: "Inventory Transfers", url: `${prefix}/inventory-transfers`, icon: ArrowLeftRight },
  { title: "Carrier Manifest", url: `${prefix}/carrier-manifest`, icon: Truck },
  { title: "Shipping Zones", url: `${prefix}/shipping-zones`, icon: MapPin },
];

// ── Point of Sale ──
const posNav = [
  { title: "Point of Sale", url: `${prefix}/pos`, icon: Smartphone },
];

// ── Webstore (Maropost: "Webstore") — Content + Design ──
const webstoreNav = [
  { title: "Content Pages", url: `${prefix}/content-pages`, icon: FileText },
  { title: "Blog Posts", url: `${prefix}/content-pages`, icon: Newspaper },
  { title: "Content Blocks", url: `${prefix}/content-blocks`, icon: LayoutDashboard },
  { title: "Content Zones", url: `${prefix}/content-zones`, icon: LayoutDashboard },
  { title: "Media Library", url: `${prefix}/media`, icon: Image },
  { title: "Store Locator", url: `${prefix}/store-locator`, icon: Navigation },
];

// ── Design (Maropost: "Design" sub-section of Webstore) ──
const designNav = [
  { title: "Theme Files", url: `${prefix}/theme-files`, icon: Palette },
  { title: "Templates", url: `${prefix}/templates`, icon: Code2 },
  { title: "Template Reference", url: `${prefix}/template-reference`, icon: Book },
  { title: "Email Templates", url: `${prefix}/email-templates`, icon: Mail },
];

// ── Marketing (Maropost: "Marketing") ──
const marketingNav = [
  { title: "Campaigns", url: `${prefix}/marketing`, icon: Megaphone },
  { title: "Adverts & Banners", url: `${prefix}/adverts`, icon: Image },
  { title: "Coupons & Discounts", url: `${prefix}/coupons`, icon: Ticket },
  { title: "Gift Vouchers", url: `${prefix}/gift-vouchers`, icon: Gift },
  { title: "Email Automations", url: `${prefix}/email-automations`, icon: Zap },
  { title: "Marketplaces", url: `${prefix}/marketplaces`, icon: ShoppingBag },
  { title: "Sales Channels", url: `${prefix}/sales-channels`, icon: Share2 },
];

// ── Reports (Maropost: "Reports") ──
const reportsNav = [
  { title: "Analytics", url: `${prefix}/analytics`, icon: BarChart3 },
  { title: "Report Builder", url: `${prefix}/report-builder`, icon: PieChart },
];

// ── Settings & Tools (Maropost: "Settings & Tools") ──
const settingsNav = [
  { title: "General Settings", url: `${prefix}/settings`, icon: Settings },
  { title: "Tax Rates", url: `${prefix}/tax-rates`, icon: Percent },
  { title: "Currencies", url: `${prefix}/currencies`, icon: DollarSign },
  { title: "Accounting", url: `${prefix}/accounting`, icon: Calculator },
  { title: "Multimarket", url: `${prefix}/multimarket`, icon: Globe },
  { title: "Notifications", url: `${prefix}/notifications`, icon: Bell },
  { title: "Integrations", url: `${prefix}/integrations`, icon: Link2 },
  { title: "Webhooks", url: `${prefix}/webhooks`, icon: Webhook },
  { title: "API Keys", url: `${prefix}/api-keys`, icon: Key },
  { title: "API Docs", url: `${prefix}/api-docs`, icon: Book },
  { title: "Permissions", url: `${prefix}/permissions`, icon: Shield },
  { title: "Redirects", url: `${prefix}/redirects`, icon: ExternalLink },
  { title: "Custom Fields", url: `${prefix}/custom-fields`, icon: FormInput },
  { title: "Activity Log", url: `${prefix}/activity-log`, icon: ClipboardList },
  { title: "Staff Activity", url: `${prefix}/staff-activity`, icon: Activity },
  { title: "Sessions", url: `${prefix}/sessions`, icon: Monitor },
  { title: "Add-Ons", url: `${prefix}/addons`, icon: Puzzle },
  { title: "Go-Live Checklist", url: `${prefix}/go-live`, icon: Sparkles },
  { title: "Feature Audit", url: `${prefix}/feature-audit`, icon: ClipboardCheck },
];

// ── Maropost / Neto Migration ──
const migrationNav = [
  { title: "Maropost Learning", url: `${prefix}/maropost-learning`, icon: Book },
  { title: "Theme Learning", url: `${prefix}/maropost-theme-learning`, icon: Book },
  { title: "Maropost Migration", url: `${prefix}/maropost-migration`, icon: ArrowLeftRight },
  { title: "Transfer Audit", url: `${prefix}/maropost-transfer-audit`, icon: ClipboardCheck },
  { title: "API Log", url: `${prefix}/maropost-api-log`, icon: Activity },
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
                  {currentStore?.name || "Control Panel"}
                </span>
              )}
              <span className="text-2xs text-sidebar-foreground/50">Commerce Cloud</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1">
        <NavGroup label="Dashboard"       items={dashboardNav}   collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Orders & Invoices" items={ordersNav}    collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Products"         items={productsNav}   collapsed={collapsed} currentPath={currentPath} />
        <NavGroup label="Customers"        items={customersNav}  collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Inventory"        items={inventoryNav}  collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Warehousing & Fulfillment" items={fulfillmentNav} collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="POS"              items={posNav}        collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Webstore"         items={webstoreNav}   collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Design"           items={designNav}     collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Marketing"        items={marketingNav}  collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Reports"          items={reportsNav}    collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Settings & Tools" items={settingsNav}   collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
        <NavGroup label="Maropost / Neto"  items={migrationNav}  collapsed={collapsed} currentPath={currentPath} defaultOpen={false} />
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
