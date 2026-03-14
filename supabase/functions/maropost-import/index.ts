import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  action: string; // import_products, import_categories, import_customers, import_orders, import_content, import_vouchers, import_suppliers, import_warehouses, import_rma, import_shipping, import_templates, import_theme_css
  store_id: string;
  source_data: any;
  store_domain?: string;
  api_key?: string;
  migration_job_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, store_id, source_data, migration_job_id }: ImportRequest = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Helper to log each entity mapping
    const logEntity = async (entityType: string, sourceId: string, targetId: string) => {
      if (migration_job_id) {
        await supabase.from("migration_entity_logs").insert({
          migration_job_id,
          entity_type: entityType,
          source_id: sourceId,
          target_id: targetId,
          status: "success",
        } as any);
      }
    };

    // ── IMPORT PRODUCTS ──
    if (action === "import_products") {
      const items = source_data?.Item || source_data || [];
      const products = Array.isArray(items) ? items : [items];

      for (const p of products) {
        try {
          const productData = {
            store_id,
            name: p.Name || p.Model || "Untitled Product",
            slug: (p.ProductURL || p.Model || p.Name || `product-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            sku: p.ParentSKU || p.Model || null,
            barcode: p.Barcode || null,
            brand: p.Brand || null,
            description: p.Description || null,
            short_description: p.ShortDescription || null,
            price: parseFloat(p.DefaultPrice) || 0,
            compare_at_price: parseFloat(p.RRP) || null,
            cost_price: parseFloat(p.CostPrice) || null,
            promo_price: parseFloat(p.PromotionPrice) || null,
            weight: parseFloat(p.ShippingWeight) || null,
            status: p.IsActive === "True" ? "active" : "draft",
            is_active: p.IsActive === "True",
            seo_title: p.SEOPageTitle || null,
            seo_description: p.SEOMetaDescription || null,
            tags: p.Tags ? (Array.isArray(p.Tags) ? p.Tags : p.Tags.split(",").map((t: string) => t.trim())) : [],
            features: p.Features || null,
            specifications: p.Specifications || null,
            warranty: p.Warranty || null,
            search_keywords: p.SearchKeywords || null,
            tax_category: p.TaxCategory || null,
            is_taxable: p.TaxFreeItem !== "True",
            sort_order: parseInt(p.SortOrder) || 0,
            custom_label: p.CustomLabel || null,
            subtitle: p.SubType || null,
          };

          const { data: inserted, error: insertErr } = await supabase
            .from("products")
            .upsert(productData as any, { onConflict: "store_id,slug" })
            .select("id")
            .single();

          if (insertErr) throw insertErr;
          const productId = inserted.id;

          // Import product shipping dimensions
          if (p.ShippingLength || p.ShippingWidth || p.ShippingHeight) {
            await supabase.from("product_shipping").upsert({
              product_id: productId,
              store_id,
              length: parseFloat(p.ShippingLength) || null,
              width: parseFloat(p.ShippingWidth) || null,
              height: parseFloat(p.ShippingHeight) || null,
              weight: parseFloat(p.ShippingWeight) || null,
              cubic_weight: parseFloat(p.CubicWeight) || null,
            } as any, { onConflict: "product_id" });
          }

          // Import product images
          if (p.Images?.length) {
            const images = Array.isArray(p.Images) ? p.Images : [p.Images];
            for (let i = 0; i < images.length; i++) {
              const img = images[i];
              const imageUrl = typeof img === "string" ? img : img?.URL || img?.ThumbURL;
              if (imageUrl) {
                await supabase.from("product_images").insert({
                  product_id: productId,
                  store_id,
                  url: imageUrl,
                  alt_text: p.Name || "",
                  sort_order: i,
                  is_primary: i === 0,
                } as any);
              }
            }
          }

          // Import pricing tiers
          if (p.PriceGroups?.length) {
            const groups = Array.isArray(p.PriceGroups) ? p.PriceGroups : [p.PriceGroups];
            for (const pg of groups) {
              await supabase.from("product_pricing_tiers").insert({
                product_id: productId,
                store_id,
                group_name: pg.Group || "Default",
                min_quantity: parseInt(pg.MinQuantity) || 1,
                price: parseFloat(pg.Price) || 0,
              } as any);
            }
          }

          // Import variants
          if (p.VariantInventory?.length) {
            const variants = Array.isArray(p.VariantInventory) ? p.VariantInventory : [p.VariantInventory];
            for (const v of variants) {
              await supabase.from("product_variants").insert({
                product_id: productId,
                store_id,
                sku: v.SKU || null,
                name: v.VariationName || v.SKU || "Variant",
                price: parseFloat(v.DefaultPrice) || null,
                stock_quantity: parseInt(v.Quantity) || 0,
                is_active: true,
              } as any);
            }
          }

          // Import cross-sell / up-sell relations
          if (p.CrossSellProducts || p.UpsellProducts) {
            // Store as JSON for later resolution (product IDs need mapping)
            await supabase.from("product_relations").upsert({
              product_id: productId,
              store_id,
              cross_sell_skus: p.CrossSellProducts || null,
              upsell_skus: p.UpsellProducts || null,
            } as any, { onConflict: "product_id" }).catch(() => {});
          }

          // Import item specifics as product_specifics
          if (p.ItemSpecifics?.length) {
            const specs = Array.isArray(p.ItemSpecifics) ? p.ItemSpecifics : [p.ItemSpecifics];
            for (const spec of specs) {
              await supabase.from("product_specifics").insert({
                product_id: productId,
                store_id,
                name: spec.Name || spec.Label || "Spec",
                value: spec.Value || "",
              } as any).catch(() => {});
            }
          }

          await logEntity("product", p.ID || p.ParentSKU, productId);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Product ${p.Name || p.ParentSKU}: ${err.message}`);
        }
      }
    }

    // ── IMPORT CATEGORIES ──
    else if (action === "import_categories") {
      const items = source_data?.Category || source_data || [];
      const categories = Array.isArray(items) ? items : [items];

      // First pass: create all categories
      const idMap: Record<string, string> = {};
      for (const c of categories) {
        try {
          const catData = {
            store_id,
            name: c.CategoryName || "Untitled",
            slug: (c.CategoryReference || c.CategoryName || `cat-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: c.Description || c.ShortDescription || null,
            sort_order: parseInt(c.SortOrder) || 0,
            seo_title: c.SEOPageTitle || null,
            seo_description: c.SEOMetaDescription || null,
          };

          const { data: inserted, error } = await supabase
            .from("categories")
            .upsert(catData as any, { onConflict: "store_id,slug" })
            .select("id")
            .single();

          if (error) throw error;
          idMap[c.CategoryID] = inserted.id;
          await logEntity("category", c.CategoryID, inserted.id);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Category ${c.CategoryName}: ${err.message}`);
        }
      }

      // Second pass: link parent/child
      for (const c of categories) {
        if (c.ParentCategoryID && c.ParentCategoryID !== "0" && idMap[c.CategoryID] && idMap[c.ParentCategoryID]) {
          await supabase.from("categories").update({ parent_id: idMap[c.ParentCategoryID] } as any).eq("id", idMap[c.CategoryID]);
        }
      }
    }

    // ── IMPORT CUSTOMERS ──
    else if (action === "import_customers") {
      const items = source_data?.Customer || source_data || [];
      const customers = Array.isArray(items) ? items : [items];

      for (const c of customers) {
        try {
          const custData = {
            store_id,
            name: `${c.Name || ""} ${c.Surname || ""}`.trim() || c.Username || "Unknown",
            email: c.EmailAddress || c.Email || null,
            phone: c.Phone || c.Mobile || null,
            abn_vat_number: c.ABN || null,
            segment: c.Type === "Wholesale" ? "wholesale" : "regular",
            notes: c.IdentificationDetails || null,
            credit_limit: parseFloat(c.CreditLimit) || null,
            tags: c.UserGroup ? [c.UserGroup] : [],
          };

          const { data: inserted, error } = await supabase
            .from("customers")
            .insert(custData as any)
            .select("id")
            .single();

          if (error) throw error;

          // Import addresses
          for (const addrType of ["BillingAddress", "ShippingAddress"]) {
            const addr = c[addrType];
            if (addr) {
              const addresses = Array.isArray(addr) ? addr : [addr];
              for (const a of addresses) {
                await supabase.from("customer_addresses").insert({
                  customer_id: inserted.id,
                  store_id,
                  address_type: addrType === "BillingAddress" ? "billing" : "shipping",
                  first_name: a.FirstName || c.Name || "",
                  last_name: a.LastName || c.Surname || "",
                  company: a.Company || c.CompanyName || null,
                  address_1: a.StreetAddress1 || a.Address1 || "",
                  address_2: a.StreetAddress2 || a.Address2 || null,
                  city: a.City || "",
                  state: a.State || "",
                  postcode: a.PostCode || "",
                  country: a.Country || "AU",
                  phone: a.Phone || c.Phone || null,
                  is_default: true,
                } as any).catch(() => {});
              }
            }
          }

          await logEntity("customer", c.Username || c.Email, inserted.id);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Customer ${c.Username || c.Email}: ${err.message}`);
        }
      }
    }

    // ── IMPORT ORDERS ──
    else if (action === "import_orders") {
      const items = source_data?.Order || source_data || [];
      const orders = Array.isArray(items) ? items : [items];

      const statusMap: Record<string, string> = {
        "New": "pending", "New Backorder": "pending", "Pending": "pending",
        "Pick": "processing", "Pack": "processing", "On Hold": "on_hold",
        "Dispatched": "shipped", "Shipped": "shipped",
        "Cancelled": "cancelled", "Completed": "completed",
      };

      for (const o of orders) {
        try {
          const orderData = {
            store_id,
            order_number: `MP-${o.OrderID}`,
            status: statusMap[o.Status] || "pending",
            subtotal: parseFloat(o.GrandTotal) - parseFloat(o.TaxTotal || "0") - parseFloat(o.ShippingTotal || "0"),
            tax: parseFloat(o.TaxTotal) || 0,
            shipping_cost: parseFloat(o.ShippingTotal) || 0,
            discount: parseFloat(o.DiscountTotal) || 0,
            total: parseFloat(o.GrandTotal) || 0,
            notes: o.InternalOrderNotes || null,
            shipping_method: o.ShippingOption || null,
            delivery_instructions: o.DeliveryInstruction || null,
            created_at: o.DatePlaced || new Date().toISOString(),
          };

          const { data: inserted, error } = await supabase
            .from("orders")
            .insert(orderData as any)
            .select("id")
            .single();

          if (error) throw error;

          // Import order line items
          if (o.OrderLine) {
            const lines = Array.isArray(o.OrderLine) ? o.OrderLine : [o.OrderLine];
            for (const line of lines) {
              await supabase.from("order_items").insert({
                order_id: inserted.id,
                store_id,
                product_name: line.ProductName || line.ItemDescription || "",
                sku: line.SKU || null,
                quantity: parseInt(line.Quantity) || 1,
                unit_price: parseFloat(line.UnitPrice) || 0,
                total: parseFloat(line.LineTotal) || parseFloat(line.UnitPrice) * parseInt(line.Quantity || "1"),
                tax: parseFloat(line.TaxAmount) || 0,
              } as any).catch(() => {});
            }
          }

          // Import order payments
          if (o.OrderPayment) {
            const payments = Array.isArray(o.OrderPayment) ? o.OrderPayment : [o.OrderPayment];
            for (const pay of payments) {
              await supabase.from("order_payments").insert({
                order_id: inserted.id,
                store_id,
                amount: parseFloat(pay.Amount) || 0,
                method: pay.PaymentMethod || "unknown",
                status: "completed",
                transaction_id: pay.TransactionID || null,
                paid_at: pay.DatePaid || o.DatePaid || new Date().toISOString(),
              } as any).catch(() => {});
            }
          }

          await logEntity("order", o.OrderID, inserted.id);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Order ${o.OrderID}: ${err.message}`);
        }
      }
    }

    // ── IMPORT CONTENT PAGES ──
    else if (action === "import_content") {
      const items = source_data?.Content || source_data || [];
      const pages = Array.isArray(items) ? items : [items];

      for (const p of pages) {
        try {
          const pageData = {
            store_id,
            title: p.ContentName || "Untitled Page",
            slug: (p.ContentReference || p.ContentName || `page-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            content: p.Description || p.ShortDescription || "",
            page_type: p.ContentType === "blog" ? "blog" : "page",
            status: p.Active === "True" ? "published" : "draft",
            is_published: p.Active === "True",
            sort_order: parseInt(p.SortOrder) || 0,
            seo_title: p.SEOPageTitle || null,
            seo_description: p.SEOMetaDescription || null,
            published_at: p.DatePosted || null,
          };

          const { data: inserted, error } = await supabase
            .from("content_pages")
            .upsert(pageData as any, { onConflict: "store_id,slug" })
            .select("id")
            .single();

          if (error) throw error;
          await logEntity("content", p.ContentID, inserted.id);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Content ${p.ContentName}: ${err.message}`);
        }
      }
    }

    // ── IMPORT GIFT VOUCHERS ──
    else if (action === "import_vouchers") {
      const items = source_data?.Voucher || source_data || [];
      const vouchers = Array.isArray(items) ? items : [items];

      for (const v of vouchers) {
        try {
          await supabase.from("gift_vouchers").insert({
            store_id,
            code: v.VoucherCode || v.Code || `GV-${Date.now()}`,
            initial_value: parseFloat(v.Value) || 0,
            balance: parseFloat(v.Balance) || parseFloat(v.Value) || 0,
            is_active: v.Active !== "False",
            expires_at: v.ExpiryDate || null,
            recipient_email: v.RecipientEmail || null,
            recipient_name: v.RecipientName || null,
            sender_name: v.SenderName || null,
            message: v.Message || null,
          } as any);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Voucher ${v.VoucherCode}: ${err.message}`);
        }
      }
    }

    // ── IMPORT SUPPLIERS ──
    else if (action === "import_suppliers") {
      const items = source_data?.Supplier || source_data || [];
      const suppliers = Array.isArray(items) ? items : [items];

      for (const s of suppliers) {
        try {
          await supabase.from("suppliers").insert({
            store_id,
            name: s.SupplierName || s.CompanyName || "Unknown Supplier",
            email: s.Email || null,
            phone: s.Phone || null,
            contact_name: s.ContactName || null,
            address: [s.Address1, s.Address2, s.City, s.State, s.PostCode, s.Country].filter(Boolean).join(", ") || null,
            lead_time_days: parseInt(s.LeadTime) || null,
            notes: s.Notes || null,
          } as any);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Supplier ${s.SupplierName}: ${err.message}`);
        }
      }
    }

    // ── IMPORT WAREHOUSES ──
    else if (action === "import_warehouses") {
      const items = source_data?.Warehouse || source_data || [];
      const warehouses = Array.isArray(items) ? items : [items];

      for (const w of warehouses) {
        try {
          await supabase.from("inventory_locations").insert({
            store_id,
            name: w.WarehouseName || w.Name || "Warehouse",
            address: [w.Address1, w.Address2, w.City, w.State, w.PostCode, w.Country].filter(Boolean).join(", ") || null,
            type: "warehouse",
          } as any);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Warehouse ${w.WarehouseName}: ${err.message}`);
        }
      }
    }

    // ── IMPORT SHIPPING METHODS ──
    else if (action === "import_shipping") {
      const items = source_data?.ShippingMethod || source_data || [];
      const methods = Array.isArray(items) ? items : [items];

      for (const m of methods) {
        try {
          await supabase.from("shipping_zones").insert({
            store_id,
            name: m.ShippingMethodName || m.Name || "Shipping Method",
            type: m.Type || "flat_rate",
            is_active: m.Active !== "False",
            base_rate: parseFloat(m.Rate) || 0,
          } as any);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Shipping ${m.ShippingMethodName}: ${err.message}`);
        }
      }
    }

    // ── IMPORT RETURNS / RMA ──
    else if (action === "import_rma") {
      const items = source_data?.Rma || source_data || [];
      const rmas = Array.isArray(items) ? items : [items];

      for (const r of rmas) {
        try {
          await supabase.from("returns").insert({
            store_id,
            return_number: `RMA-${r.RmaID || Date.now()}`,
            reason: r.Reason || r.ReturnReason || null,
            status: r.Status === "Approved" ? "approved" : r.Status === "Complete" ? "completed" : "pending",
            notes: r.Notes || null,
            created_at: r.DateCreated || new Date().toISOString(),
          } as any);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`RMA ${r.RmaID}: ${err.message}`);
        }
      }
    }

    // ── IMPORT THEME / CSS ──
    else if (action === "import_theme_css") {
      // source_data contains { templates: [...], css: string, js: string }
      try {
        if (source_data.css) {
          await supabase.from("store_settings" as any).upsert({
            store_id,
            setting_key: "custom_css",
            setting_value: source_data.css,
          }, { onConflict: "store_id,setting_key" });
          imported++;
        }
        if (source_data.js) {
          await supabase.from("store_settings" as any).upsert({
            store_id,
            setting_key: "custom_js",
            setting_value: source_data.js,
          }, { onConflict: "store_id,setting_key" });
          imported++;
        }
        if (source_data.templates) {
          for (const tpl of source_data.templates) {
            await supabase.from("store_templates" as any).upsert({
              store_id,
              slug: tpl.slug,
              name: tpl.name,
              template_type: tpl.template_type || "page",
              content: tpl.content,
              custom_css: tpl.custom_css || null,
              is_active: true,
            }, { onConflict: "store_id,slug" });
            imported++;
          }
        }
      } catch (err: any) {
        failed++;
        errors.push(`Theme: ${err.message}`);
      }
    }

    // Update migration job progress
    if (migration_job_id) {
      await supabase.from("migration_jobs").update({
        progress: { imported, failed, errors: errors.slice(0, 50) },
        updated_at: new Date().toISOString(),
      } as any).eq("id", migration_job_id);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      imported,
      failed,
      errors: errors.slice(0, 50),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Maropost import error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
