
# Phase 1: Multi-Tenant Admin Dashboard + Product Management

## Overview
Build the foundational admin back-office for a SaaS ecommerce platform modeled after Maropost Commerce Cloud. This phase establishes multi-tenancy, authentication, and a data-dense product/catalog management system.

---

## 1. Authentication & Multi-Tenancy Foundation
- **Auth pages**: Login, signup, and password reset using Supabase Auth
- **Tenant (Store) creation flow**: After signup, users create their first store (name, currency, timezone)
- **Multi-store support**: Users can create and switch between multiple stores from the dashboard
- **Role-based access**: Owner, Admin, Staff roles per store using a dedicated `user_roles` table
- **Team invites**: Store owners can invite team members via email

## 2. Admin Dashboard Layout (Data-Dense Style)
- **Sidebar navigation** with collapsible sections: Dashboard, Products, Inventory, Orders, Customers, Marketing, Analytics, Settings
- **Top bar** with store switcher, notifications bell, user avatar/menu, and quick search
- **Dashboard home page** with KPI cards (Total Revenue, Orders Today, Active Products, Low Stock Alerts), recent orders table, and sales chart (using Recharts with mock data)
- Dense, information-rich layout with tables, filters, and inline actions throughout

## 3. Product Catalog Management
- **Product list page**: Searchable, filterable, sortable data table with bulk actions (delete, archive, change status)
- **Product creation/edit form**: 
  - Basic info (title, description, SKU, barcode)
  - Pricing (base price, compare-at price, cost price, tax settings)
  - Media uploads (product images with drag-and-drop reordering)
  - Variants (size, color, etc.) with individual pricing/SKU/stock per variant
  - Categories and tags assignment
  - SEO fields (meta title, description, URL slug)
  - Status (draft, active, archived)
- **Category management**: Tree/hierarchy of categories with drag-and-drop ordering
- **Bulk import**: CSV upload for products

## 4. Inventory Management
- **Inventory overview**: Stock levels across all products, filterable by status (in stock, low stock, out of stock)
- **Multi-location warehouses**: Define warehouse locations, track stock per location
- **Stock adjustments**: Manual stock updates with reason tracking
- **Low stock alerts**: Configurable thresholds with visual indicators

## 5. Customer Management (Basic)
- **Customer list**: Table with search, filters (new, returning, VIP)
- **Customer detail page**: Contact info, order history, total spend, notes
- **Customer groups/segments**: Tag-based grouping for future marketing use

## 6. Settings & Store Configuration
- **Store settings**: Name, logo, currency, timezone, contact details
- **Tax configuration**: Tax rates by region
- **Shipping zones**: Basic shipping zone and rate configuration
- **Team management**: View/invite/remove team members, assign roles

## Data Approach
- Supabase database with full schema for tenants, products, variants, categories, inventory, customers
- Row-Level Security ensuring tenants can only access their own data
- All dashboard metrics use mock/seed data for this phase

## Pages & Routes
- `/login`, `/signup`, `/forgot-password`
- `/onboarding` (store creation)
- `/dashboard` (KPI overview)
- `/products` (list), `/products/new`, `/products/:id` (edit)
- `/categories`
- `/inventory`
- `/customers`, `/customers/:id`
- `/settings` (store, team, tax, shipping)
