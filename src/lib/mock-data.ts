// Mock data for the entire admin platform

export const mockStore = {
  id: "store-1",
  name: "Acme Commerce",
  currency: "USD",
  timezone: "America/New_York",
  logo: null,
};

export const mockKPIs = {
  totalRevenue: 124892.5,
  ordersToday: 47,
  activeProducts: 1284,
  lowStockAlerts: 23,
  revenueChange: 12.5,
  ordersChange: -3.2,
  productsChange: 4.1,
  alertsChange: 8.7,
};

export const mockSalesData = [
  { date: "Jan", revenue: 18200, orders: 312 },
  { date: "Feb", revenue: 21400, orders: 358 },
  { date: "Mar", revenue: 19800, orders: 342 },
  { date: "Apr", revenue: 24600, orders: 401 },
  { date: "May", revenue: 22100, orders: 378 },
  { date: "Jun", revenue: 26800, orders: 445 },
  { date: "Jul", revenue: 25200, orders: 423 },
  { date: "Aug", revenue: 28900, orders: 467 },
  { date: "Sep", revenue: 27100, orders: 451 },
  { date: "Oct", revenue: 31200, orders: 498 },
  { date: "Nov", revenue: 34500, orders: 534 },
  { date: "Dec", revenue: 38200, orders: 589 },
];

export type ProductStatus = "active" | "draft" | "archived";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  option1: string;
  option2?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  sku: string;
  barcode: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number;
  status: ProductStatus;
  category: string;
  tags: string[];
  stock: number;
  images: string[];
  variants: ProductVariant[];
  seoTitle: string;
  seoDescription: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export const mockProducts: Product[] = [
  {
    id: "prod-1", title: "Premium Wireless Headphones", description: "High-quality noise-cancelling wireless headphones with 30hr battery.",
    sku: "WH-1000XM5", barcode: "4548736132191", price: 349.99, compareAtPrice: 399.99, costPrice: 180.00,
    status: "active", category: "Electronics", tags: ["audio", "wireless", "premium"],
    stock: 234, images: [], variants: [
      { id: "v1", name: "Black", sku: "WH-1000XM5-BLK", price: 349.99, stock: 120, option1: "Black" },
      { id: "v2", name: "Silver", sku: "WH-1000XM5-SLV", price: 349.99, stock: 114, option1: "Silver" },
    ],
    seoTitle: "Premium Wireless Headphones - Noise Cancelling", seoDescription: "Shop premium wireless headphones with active noise cancellation.",
    slug: "premium-wireless-headphones", createdAt: "2025-11-15", updatedAt: "2026-03-10",
  },
  {
    id: "prod-2", title: "Organic Cotton T-Shirt", description: "Sustainably sourced 100% organic cotton crew neck tee.",
    sku: "OCT-001", barcode: "5901234123457", price: 29.99, compareAtPrice: null, costPrice: 8.50,
    status: "active", category: "Apparel", tags: ["clothing", "organic", "basics"],
    stock: 1520, images: [], variants: [
      { id: "v3", name: "S / White", sku: "OCT-001-S-WHT", price: 29.99, stock: 380, option1: "S", option2: "White" },
      { id: "v4", name: "M / White", sku: "OCT-001-M-WHT", price: 29.99, stock: 420, option1: "M", option2: "White" },
      { id: "v5", name: "L / White", sku: "OCT-001-L-WHT", price: 29.99, stock: 360, option1: "L", option2: "White" },
      { id: "v6", name: "M / Black", sku: "OCT-001-M-BLK", price: 29.99, stock: 360, option1: "M", option2: "Black" },
    ],
    seoTitle: "Organic Cotton T-Shirt", seoDescription: "100% organic cotton crew neck tee.",
    slug: "organic-cotton-t-shirt", createdAt: "2025-12-01", updatedAt: "2026-03-08",
  },
  {
    id: "prod-3", title: "Smart Home Hub Pro", description: "Central hub for controlling all smart home devices.",
    sku: "SHH-PRO-2026", barcode: "0123456789012", price: 199.99, compareAtPrice: 249.99, costPrice: 95.00,
    status: "active", category: "Electronics", tags: ["smart-home", "hub", "iot"],
    stock: 89, images: [], variants: [],
    seoTitle: "Smart Home Hub Pro", seoDescription: "Control all your smart devices from one hub.",
    slug: "smart-home-hub-pro", createdAt: "2026-01-10", updatedAt: "2026-03-12",
  },
  {
    id: "prod-4", title: "Artisan Coffee Beans 1kg", description: "Single-origin Ethiopian Yirgacheffe, medium roast.",
    sku: "ACB-ETH-1KG", barcode: "1234567890123", price: 24.99, compareAtPrice: null, costPrice: 12.00,
    status: "active", category: "Food & Beverage", tags: ["coffee", "organic", "single-origin"],
    stock: 3, images: [], variants: [],
    seoTitle: "Artisan Coffee Beans", seoDescription: "Premium Ethiopian single-origin coffee beans.",
    slug: "artisan-coffee-beans", createdAt: "2026-02-01", updatedAt: "2026-03-11",
  },
  {
    id: "prod-5", title: "Leather Weekender Bag", description: "Full-grain leather travel bag with laptop compartment.",
    sku: "LWB-BRN-001", barcode: "2345678901234", price: 289.00, compareAtPrice: 350.00, costPrice: 140.00,
    status: "draft", category: "Accessories", tags: ["bags", "leather", "travel"],
    stock: 0, images: [], variants: [],
    seoTitle: "Leather Weekender Bag", seoDescription: "Premium leather weekender for the modern traveler.",
    slug: "leather-weekender-bag", createdAt: "2026-03-01", updatedAt: "2026-03-12",
  },
  {
    id: "prod-6", title: "Yoga Mat Premium", description: "Non-slip eco-friendly yoga mat, 6mm thick.",
    sku: "YMP-006", barcode: "3456789012345", price: 59.99, compareAtPrice: 79.99, costPrice: 18.00,
    status: "archived", category: "Sports", tags: ["yoga", "fitness", "eco"],
    stock: 45, images: [], variants: [],
    seoTitle: "Premium Yoga Mat", seoDescription: "Eco-friendly non-slip yoga mat.",
    slug: "yoga-mat-premium", createdAt: "2025-08-15", updatedAt: "2026-01-20",
  },
];

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: number;
  date: string;
  paymentStatus: "paid" | "pending" | "refunded";
}

export const mockOrders: Order[] = [
  { id: "ord-1", orderNumber: "#10247", customer: "Sarah Chen", email: "sarah@example.com", total: 379.98, status: "processing", items: 2, date: "2026-03-12 09:14", paymentStatus: "paid" },
  { id: "ord-2", orderNumber: "#10246", customer: "James Wilson", email: "james@example.com", total: 29.99, status: "shipped", items: 1, date: "2026-03-12 08:52", paymentStatus: "paid" },
  { id: "ord-3", orderNumber: "#10245", customer: "Maria Garcia", email: "maria@example.com", total: 489.98, status: "pending", items: 3, date: "2026-03-12 07:33", paymentStatus: "pending" },
  { id: "ord-4", orderNumber: "#10244", customer: "Alex Johnson", email: "alex@example.com", total: 199.99, status: "delivered", items: 1, date: "2026-03-11 22:15", paymentStatus: "paid" },
  { id: "ord-5", orderNumber: "#10243", customer: "Emily Brown", email: "emily@example.com", total: 59.98, status: "cancelled", items: 2, date: "2026-03-11 18:41", paymentStatus: "refunded" },
  { id: "ord-6", orderNumber: "#10242", customer: "David Kim", email: "david@example.com", total: 924.97, status: "processing", items: 4, date: "2026-03-11 16:08", paymentStatus: "paid" },
  { id: "ord-7", orderNumber: "#10241", customer: "Lisa Park", email: "lisa@example.com", total: 149.99, status: "shipped", items: 1, date: "2026-03-11 14:22", paymentStatus: "paid" },
  { id: "ord-8", orderNumber: "#10240", customer: "Tom Baker", email: "tom@example.com", total: 74.97, status: "delivered", items: 3, date: "2026-03-11 11:55", paymentStatus: "paid" },
];

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  segment: "new" | "returning" | "vip";
  lastOrder: string;
  createdAt: string;
}

export const mockCustomers: Customer[] = [
  { id: "cust-1", name: "Sarah Chen", email: "sarah@example.com", phone: "+1 555-0101", totalOrders: 12, totalSpent: 2847.50, segment: "vip", lastOrder: "2026-03-12", createdAt: "2025-06-15" },
  { id: "cust-2", name: "James Wilson", email: "james@example.com", phone: "+1 555-0102", totalOrders: 3, totalSpent: 189.97, segment: "returning", lastOrder: "2026-03-12", createdAt: "2025-11-20" },
  { id: "cust-3", name: "Maria Garcia", email: "maria@example.com", phone: "+1 555-0103", totalOrders: 1, totalSpent: 489.98, segment: "new", lastOrder: "2026-03-12", createdAt: "2026-03-12" },
  { id: "cust-4", name: "Alex Johnson", email: "alex@example.com", phone: "+1 555-0104", totalOrders: 8, totalSpent: 1654.92, segment: "vip", lastOrder: "2026-03-11", createdAt: "2025-08-03" },
  { id: "cust-5", name: "Emily Brown", email: "emily@example.com", phone: "+1 555-0105", totalOrders: 2, totalSpent: 89.98, segment: "returning", lastOrder: "2026-03-11", createdAt: "2026-01-15" },
  { id: "cust-6", name: "David Kim", email: "david@example.com", phone: "+1 555-0106", totalOrders: 15, totalSpent: 4231.85, segment: "vip", lastOrder: "2026-03-11", createdAt: "2025-04-22" },
];

export interface InventoryLocation {
  id: string;
  name: string;
  type: "warehouse" | "store" | "dropship";
  address: string;
}

export const mockLocations: InventoryLocation[] = [
  { id: "loc-1", name: "Main Warehouse", type: "warehouse", address: "123 Commerce St, New York, NY" },
  { id: "loc-2", name: "West Coast DC", type: "warehouse", address: "456 Pacific Ave, Los Angeles, CA" },
  { id: "loc-3", name: "Flagship Store", type: "store", address: "789 5th Ave, New York, NY" },
];

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
  children?: Category[];
}

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Electronics", slug: "electronics", parentId: null, productCount: 342, children: [
    { id: "cat-1a", name: "Audio", slug: "audio", parentId: "cat-1", productCount: 89 },
    { id: "cat-1b", name: "Smart Home", slug: "smart-home", parentId: "cat-1", productCount: 67 },
    { id: "cat-1c", name: "Computers", slug: "computers", parentId: "cat-1", productCount: 186 },
  ]},
  { id: "cat-2", name: "Apparel", slug: "apparel", parentId: null, productCount: 521, children: [
    { id: "cat-2a", name: "Men", slug: "men", parentId: "cat-2", productCount: 245 },
    { id: "cat-2b", name: "Women", slug: "women", parentId: "cat-2", productCount: 276 },
  ]},
  { id: "cat-3", name: "Accessories", slug: "accessories", parentId: null, productCount: 198 },
  { id: "cat-4", name: "Food & Beverage", slug: "food-beverage", parentId: null, productCount: 134 },
  { id: "cat-5", name: "Sports", slug: "sports", parentId: null, productCount: 89 },
];
