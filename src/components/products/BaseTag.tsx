import { toast } from "sonner";
import { Copy } from "lucide-react";

interface BaseTagProps {
  tag: string;
  /** Optional format pipe hint, e.g. "currency" */
  format?: string;
}

/**
 * Displays a clickable B@SE data tag next to a form field label.
 * Clicking copies the tag syntax to clipboard for pasting into storefront templates.
 */
export function BaseTag({ tag, format }: BaseTagProps) {
  const fullTag = format ? `[@${tag}|${format}@]` : `[@${tag}@]`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(fullTag);
    toast.success(`Copied ${fullTag}`, { duration: 1500 });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0 rounded bg-accent/50 hover:bg-accent text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border"
      title={`Click to copy: ${fullTag}`}
    >
      {fullTag}
      <Copy className="h-2.5 w-2.5 ml-0.5 opacity-50" />
    </button>
  );
}

/** Mapping of product form field keys to their B@SE data tag names */
export const FIELD_TAG_MAP: Record<string, { tag: string; format?: string }> = {
  // General
  title: { tag: "title" },
  subtitle: { tag: "subtitle" },
  sku: { tag: "sku" },
  barcode: { tag: "barcode" },
  brand: { tag: "brand" },
  model_number: { tag: "model_number" },
  product_type: { tag: "product_type" },
  product_subtype: { tag: "product_subtype" },
  custom_label: { tag: "custom_label" },
  supplier_item_code: { tag: "supplier_item_code" },

  // Content
  description: { tag: "description" },
  short_description: { tag: "short_description" },
  features: { tag: "features" },
  specifications: { tag: "specifications" },
  terms_conditions: { tag: "terms_conditions" },
  warranty: { tag: "warranty" },
  availability_description: { tag: "availability_description" },
  internal_notes: { tag: "internal_notes" },

  // Pricing
  price: { tag: "price", format: "currency" },
  compare_at_price: { tag: "compare_at_price", format: "currency" },
  cost_price: { tag: "cost_price", format: "currency" },
  promo_price: { tag: "promo_price", format: "currency" },
  promo_tag: { tag: "promo_tag" },
  promo_start: { tag: "promo_start", format: "date" },
  promo_end: { tag: "promo_end", format: "date" },

  // Inventory
  reorder_quantity: { tag: "reorder_quantity" },
  restock_quantity: { tag: "restock_quantity" },
  preorder_quantity: { tag: "preorder_quantity" },

  // Shipping
  shipping_weight: { tag: "shipping_weight" },
  shipping_length: { tag: "shipping_length" },
  shipping_width: { tag: "shipping_width" },
  shipping_height: { tag: "shipping_height" },
  shipping_cubic: { tag: "shipping_cubic" },
  flat_rate_charge: { tag: "flat_rate_charge", format: "currency" },
  selling_unit: { tag: "selling_unit" },
  base_unit: { tag: "base_unit" },

  // SEO
  seo_title: { tag: "seo_title" },
  seo_description: { tag: "seo_description" },
  seo_keywords: { tag: "seo_keywords" },
  slug: { tag: "slug" },

  // Images
  images: { tag: "image" },

  // Misc
  misc1: { tag: "misc1" },
  misc2: { tag: "misc2" },
  misc3: { tag: "misc3" },
  misc4: { tag: "misc4" },
  misc5: { tag: "misc5" },

  // Booleans
  is_active: { tag: "is_active", format: "boolean" },
  tax_free: { tag: "tax_free", format: "boolean" },
  tax_inclusive: { tag: "tax_inclusive", format: "boolean" },
  virtual_product: { tag: "virtual_product", format: "boolean" },
  is_kit: { tag: "is_kit", format: "boolean" },
  track_inventory: { tag: "track_inventory", format: "boolean" },

  // Tags & search
  tags: { tag: "tags" },
  search_keywords: { tag: "search_keywords" },
};

/** Helper: renders a Label with optional BaseTag inline */
export function FieldLabel({ label, field, className = "text-xs" }: { label: string; field?: string; className?: string }) {
  const mapping = field ? FIELD_TAG_MAP[field] : undefined;
  return (
    <div className={`flex items-center flex-wrap gap-y-0.5 ${className}`}>
      <span className="font-medium">{label}</span>
      {mapping && <BaseTag tag={mapping.tag} format={mapping.format} />}
    </div>
  );
}
