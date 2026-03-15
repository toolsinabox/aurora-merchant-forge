import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImportRequest {
  action: string;
  store_id: string;
  source_data: any;
  store_domain?: string;
  api_key?: string;
  migration_job_id?: string;
  dry_run?: boolean;
}

// Supabase JS v2 PromiseLike doesn't have .catch(), wrap in try/catch
const safe = async (p: PromiseLike<any>) => { try { await p; } catch {} };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, store_id, source_data, migration_job_id, dry_run = false }: ImportRequest = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    const logEntity = async (entityType: string, sourceId: string, targetId: string) => {
      if (migration_job_id) {
        await safe(supabase.from("migration_entity_logs").insert({
          migration_job_id,
          entity_type: entityType,
          source_id: sourceId,
          target_id: targetId,
          status: "success",
        } as any));
      }
    };

    // ── IMPORT PRODUCTS ──
    if (action === "import_products") {
      const items = source_data?.Item || source_data || [];
      const products = Array.isArray(items) ? items : [items];

      const rehostImage = async (imageUrl: string, productSlug: string, index: number): Promise<string> => {
        try {
          if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;
          const fullUrl = imageUrl.startsWith("http") ? imageUrl : `https:${imageUrl}`;
          // Add 10s timeout to prevent hanging on slow image downloads
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(fullUrl, { signal: controller.signal });
          clearTimeout(timeout);
          if (!response.ok) return fullUrl;
          const blob = await response.blob();
          const ext = fullUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
          const path = `${store_id}/${productSlug}/${index}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("product-images")
            .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
          if (uploadErr) return fullUrl;
          const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
          return publicUrl.publicUrl;
        } catch {
          return imageUrl;
        }
      };

      for (const p of products) {
        try {
          let imagesArr: string[] = [];
          const slug = (p.ProductURL || p.Model || p.Name || `product-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `p-${Date.now()}`;

          if (p.Images) {
            const imgs = Array.isArray(p.Images) ? p.Images : [p.Images];
            for (let i = 0; i < imgs.length; i++) {
              const img = imgs[i];
              const url = typeof img === "string" ? img : img?.URL || img?.ThumbURL;
              if (url) {
                const rehostedUrl = await rehostImage(url, slug, i);
                imagesArr.push(rehostedUrl);
              }
            }
          }

          const productData: Record<string, any> = {
            store_id,
            title: p.Name || p.Model || "Untitled Product",
            slug,
            sku: p.ParentSKU || p.Model || null,
            barcode: p.Barcode || null,
            brand: p.Brand || null,
            description: p.Description || null,
            short_description: p.ShortDescription || null,
            price: parseFloat(p.DefaultPrice) || 0,
            compare_at_price: parseFloat(p.RRP) || null,
            cost_price: parseFloat(p.CostPrice) || null,
            promo_price: parseFloat(p.PromotionPrice) || null,
            status: p.IsActive === "True" ? "active" : "draft",
            is_active: p.IsActive === "True",
            seo_title: p.SEOPageTitle || null,
            seo_description: p.SEOMetaDescription || null,
            tags: p.Tags ? (Array.isArray(p.Tags) ? p.Tags : String(p.Tags).split(",").map((t: string) => t.trim()).filter(Boolean)) : [],
            images: imagesArr,
            features: p.Features || null,
            specifications: p.Specifications || null,
            warranty: p.Warranty || null,
            search_keywords: p.SearchKeywords || null,
            tax_free: p.TaxFreeItem === "True",
            tax_inclusive: p.TaxInclusive === "True",
            custom_label: p.CustomLabel || null,
            subtitle: p.SubType || null,
            model_number: p.Model || null,
          };

          let productId: string;
          if (p.ParentSKU) {
            const { data: existing } = await supabase
              .from("products")
              .select("id")
              .eq("store_id", store_id)
              .eq("sku", p.ParentSKU)
              .maybeSingle();

            if (existing) {
              await supabase.from("products").update(productData).eq("id", existing.id);
              productId = existing.id;
            } else {
              const { data: inserted, error: insertErr } = await supabase
                .from("products").insert(productData).select("id").single();
              if (insertErr) throw insertErr;
              productId = inserted.id;
            }
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from("products").insert(productData).select("id").single();
            if (insertErr) throw insertErr;
            productId = inserted.id;
          }

          // Import product shipping dimensions
          if (p.ShippingLength || p.ShippingWidth || p.ShippingHeight || p.ShippingWeight) {
            await safe(supabase.from("product_shipping").upsert({
              product_id: productId,
              store_id,
              shipping_length: parseFloat(p.ShippingLength) || null,
              shipping_width: parseFloat(p.ShippingWidth) || null,
              shipping_height: parseFloat(p.ShippingHeight) || null,
              shipping_weight: parseFloat(p.ShippingWeight) || null,
              shipping_cubic: parseFloat(p.CubicWeight) || null,
              actual_length: parseFloat(p.ItemLength) || null,
              actual_width: parseFloat(p.ItemWidth) || null,
              actual_height: parseFloat(p.ItemHeight) || null,
            } as any, { onConflict: "product_id" }));
          }

          // Import pricing tiers
          if (p.PriceGroups) {
            const pgRoot = Array.isArray(p.PriceGroups) ? p.PriceGroups : [p.PriceGroups];
            for (const pgItem of pgRoot) {
              const groups = pgItem?.PriceGroup ? (Array.isArray(pgItem.PriceGroup) ? pgItem.PriceGroup : [pgItem.PriceGroup]) : [];
              for (const pg of groups) {
                if (parseFloat(pg.Price) > 0) {
                  await safe(supabase.from("product_pricing_tiers").insert({
                    product_id: productId,
                    store_id,
                    tier_name: pg.Group || "Default",
                    min_quantity: parseInt(pg.MinimumQuantity) || 1,
                    price: parseFloat(pg.Price) || 0,
                    user_group: pg.Group || null,
                  } as any));
                }
              }
            }
          }

          // Import variants (with SKU-based dedup)
          if (p.VariantInventory) {
            const variants = Array.isArray(p.VariantInventory) ? p.VariantInventory : [p.VariantInventory];
            for (const v of variants) {
              if (v && v.SKU) {
                const variantData = {
                  product_id: productId,
                  store_id,
                  sku: v.SKU || null,
                  name: v.VariationName || v.SKU || "Variant",
                  price: parseFloat(v.DefaultPrice) || null,
                  stock: parseInt(v.Quantity) || 0,
                };
                if (!dry_run) {
                  const { data: existingVar } = await supabase
                    .from("product_variants")
                    .select("id")
                    .eq("store_id", store_id)
                    .eq("sku", v.SKU)
                    .maybeSingle();
                  if (existingVar) {
                    await safe(supabase.from("product_variants").update(variantData as any).eq("id", existingVar.id));
                  } else {
                    await safe(supabase.from("product_variants").insert(variantData as any));
                  }
                }
              }
            }
          }

          // Import warehouse stock levels
          if (p.WarehouseQuantity || p.WarehouseLocations) {
            const whData = p.WarehouseLocations || p.WarehouseQuantity;
            const warehouses = Array.isArray(whData) ? whData : (whData ? [whData] : []);
            for (const wh of warehouses) {
              const whName = wh?.WarehouseName || wh?.Name || "Default";
              const qty = parseInt(wh?.Quantity || wh?.AvailableQuantity || "0") || 0;
              if (qty > 0 || whName) {
                const { data: loc } = await supabase
                  .from("inventory_locations")
                  .select("id")
                  .eq("store_id", store_id)
                  .eq("name", whName)
                  .maybeSingle();
                
                const locationId = loc?.id;
                if (locationId) {
                  await safe(supabase.from("inventory_stock").upsert({
                    store_id,
                    product_id: productId,
                    location_id: locationId,
                    quantity: qty,
                    bin_location: wh?.BinLocation || wh?.PickZone || null,
                  } as any, { onConflict: "product_id,location_id" }));
                }
              }
            }
          }

          // Import item specifics
          if (p.ItemSpecifics) {
            const specsRoot = Array.isArray(p.ItemSpecifics) ? p.ItemSpecifics : [p.ItemSpecifics];
            for (const specItem of specsRoot) {
              const spec = specItem?.ItemSpecific || specItem;
              if (spec && typeof spec === "object" && spec.Name && spec.Value) {
                await safe(supabase.from("product_specifics").insert({
                  product_id: productId,
                  store_id,
                  name: spec.Name || spec.Label || "Spec",
                  value: spec.Value || "",
                } as any));
              }
            }
          }

          // Link product to categories
          if (p.Categories) {
            const cats = Array.isArray(p.Categories) ? p.Categories : [p.Categories];
            for (const catItem of cats) {
              const catId = catItem?.CategoryID || catItem?.Category?.CategoryID || (typeof catItem === "string" ? catItem : null);
              if (catId) {
                const catName = catItem?.CategoryName || catItem?.Category?.CategoryName;
                if (catName) {
                  const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  const { data: foundCat } = await supabase
                    .from("categories")
                    .select("id")
                    .eq("store_id", store_id)
                    .eq("slug", catSlug)
                    .maybeSingle();
                  if (foundCat) {
                    await safe(supabase.from("products").update({ category_id: foundCat.id }).eq("id", productId));
                  }
                }
              }
            }
          }

          // Import product relations (cross-sell, upsell, free gifts)
          const relationTypes: { field: string; type: string }[] = [
            { field: "CrossSellProducts", type: "cross_sell" },
            { field: "UpsellProducts", type: "upsell" },
            { field: "FreeGifts", type: "free_gift" },
          ];
          for (const rel of relationTypes) {
            if (p[rel.field]) {
              const relItems = Array.isArray(p[rel.field]) ? p[rel.field] : [p[rel.field]];
              for (const relItem of relItems) {
                const relSku = typeof relItem === "string" ? relItem : relItem?.SKU || relItem?.ParentSKU;
                if (relSku) {
                  const { data: relProduct } = await supabase
                    .from("products")
                    .select("id")
                    .eq("store_id", store_id)
                    .eq("sku", relSku)
                    .maybeSingle();
                  if (relProduct) {
                    await safe(supabase.from("product_relations").insert({
                      product_id: productId,
                      related_product_id: relProduct.id,
                      store_id,
                      relation_type: rel.type,
                    }));
                  }
                }
              }
            }
          }

          await logEntity("product", p.ID || p.ParentSKU || slug, productId);
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

      const idMap: Record<string, string> = {};
      for (const c of categories) {
        try {
          const slug = (c.CategoryReference || c.CategoryName || `cat-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now()}`;

          const { data: existing } = await supabase
            .from("categories")
            .select("id")
            .eq("store_id", store_id)
            .eq("slug", slug)
            .maybeSingle();

          const catData = {
            store_id,
            name: c.CategoryName || "Untitled",
            slug,
            description: c.Description || c.ShortDescription || null,
            sort_order: parseInt(c.SortOrder) || 0,
            seo_title: c.SEOPageTitle || null,
            seo_description: c.SEOMetaDescription || null,
          };

          let catId: string;
          if (existing) {
            await supabase.from("categories").update(catData).eq("id", existing.id);
            catId = existing.id;
          } else {
            const { data: inserted, error } = await supabase
              .from("categories").insert(catData).select("id").single();
            if (error) throw error;
            catId = inserted.id;
          }

          idMap[c.CategoryID] = catId;
          await logEntity("category", c.CategoryID, catId);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Category ${c.CategoryName}: ${err.message}`);
        }
      }

      // Second pass: link parent/child
      for (const c of categories) {
        if (c.ParentCategoryID && c.ParentCategoryID !== "0" && idMap[c.CategoryID] && idMap[c.ParentCategoryID]) {
          await safe(supabase.from("categories").update({ parent_id: idMap[c.ParentCategoryID] }).eq("id", idMap[c.CategoryID]));
        }
      }
    }

    // ── IMPORT CUSTOMERS ──
    else if (action === "import_customers") {
      const items = source_data?.Customer || source_data || [];
      const customers = Array.isArray(items) ? items : [items];

      const groupMap: Record<string, string> = {};
      const uniqueGroups = [...new Set(customers.map((c: any) => c.UserGroup).filter(Boolean))];
      for (const groupName of uniqueGroups) {
        try {
          const { data: existing } = await supabase
            .from("customer_groups")
            .select("id")
            .eq("store_id", store_id)
            .eq("name", groupName as string)
            .maybeSingle();

          if (existing) {
            groupMap[groupName as string] = existing.id;
          } else {
            const { data: created } = await supabase
              .from("customer_groups")
              .insert({ store_id, name: groupName as string })
              .select("id")
              .single();
            if (created) groupMap[groupName as string] = created.id;
          }
        } catch { /* ignore group creation errors */ }
      }

      for (const c of customers) {
        try {
          const custEmail = c.EmailAddress || c.Email || null;
          const custData: Record<string, any> = {
            store_id,
            name: `${c.Name || ""} ${c.Surname || ""}`.trim() || c.Username || "Unknown",
            email: custEmail,
            phone: c.Phone || c.Mobile || null,
            abn_vat_number: c.ABN || null,
            segment: c.Type === "Wholesale" ? "wholesale" : "regular",
            notes: c.IdentificationDetails || null,
            credit_limit: parseFloat(c.CreditLimit) || null,
            tags: c.UserGroup ? [c.UserGroup] : [],
          };
          if (c.UserGroup && groupMap[c.UserGroup]) {
            custData.customer_group_id = groupMap[c.UserGroup];
          }

          let inserted: { id: string } | null = null;
          if (custEmail) {
            const { data: existing } = await supabase
              .from("customers")
              .select("id")
              .eq("store_id", store_id)
              .eq("email", custEmail)
              .maybeSingle();
            if (existing) {
              await supabase.from("customers").update(custData).eq("id", existing.id);
              inserted = existing;
            }
          }
          if (!inserted) {
            const { data: newCust, error } = await supabase
              .from("customers").insert(custData).select("id").single();
            if (error) throw error;
            inserted = newCust;
          }

          // Import addresses
          for (const addrType of ["BillingAddress", "ShippingAddress"]) {
            const addr = c[addrType];
            if (addr) {
              const addresses = Array.isArray(addr) ? addr : [addr];
              for (const a of addresses) {
                if (a && (a.StreetAddress1 || a.Address1 || a.City)) {
                  await safe(supabase.from("customer_addresses").insert({
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
                  }));
                }
              }
            }
          }

          // Import customer communication logs
          if (c.CustomerLog) {
            const logs = Array.isArray(c.CustomerLog) ? c.CustomerLog : [c.CustomerLog];
            for (const log of logs) {
              if (log && (log.Notes || log.Description || log.Subject)) {
                await safe(supabase.from("customer_communications").insert({
                  customer_id: inserted.id,
                  store_id,
                  channel: log.Type || "note",
                  direction: "inbound",
                  subject: log.Subject || log.Type || "Log Entry",
                  body: log.Notes || log.Description || "",
                  status: "delivered",
                  created_at: log.DateCreated || log.Date || new Date().toISOString(),
                }));
              }
            }
          }

          // Import newsletter subscriber
          if (c.NewsletterSubscriber === "True" && (c.EmailAddress || c.Email)) {
            await safe(supabase.from("newsletter_subscribers").upsert({
              store_id,
              email: c.EmailAddress || c.Email,
              is_active: true,
            } as any, { onConflict: "store_id,email" }));
          }

          await logEntity("customer", c.Username || c.EmailAddress || c.Email, inserted.id);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Customer ${c.Username || c.EmailAddress}: ${err.message}`);
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
          const grandTotal = parseFloat(o.GrandTotal) || 0;
          const taxTotal = parseFloat(o.TaxTotal) || 0;
          const shippingTotal = parseFloat(o.ShippingTotal) || 0;
          const discountTotal = parseFloat(o.DiscountTotal) || 0;

          const orderData: Record<string, any> = {
            store_id,
            order_number: `MP-${o.OrderID}`,
            status: statusMap[o.Status] || "pending",
            subtotal: grandTotal - taxTotal - shippingTotal,
            tax: taxTotal,
            shipping: shippingTotal,
            discount: discountTotal,
            total: grandTotal,
            notes: o.InternalOrderNotes || null,
            created_at: o.DatePlaced || new Date().toISOString(),
          };

          if (o.ShipAddress) orderData.shipping_address = o.ShipAddress;
          if (o.BillAddress) orderData.billing_address = o.BillAddress;

          const orderEmail = o.Email || o.Username;
          if (orderEmail) {
            const { data: cust } = await supabase
              .from("customers")
              .select("id")
              .eq("store_id", store_id)
              .eq("email", orderEmail)
              .maybeSingle();
            if (cust) orderData.customer_id = cust.id;
          }

          const orderNumber = `MP-${o.OrderID}`;
          const { data: existingOrder } = await supabase
            .from("orders")
            .select("id")
            .eq("store_id", store_id)
            .eq("order_number", orderNumber)
            .maybeSingle();

          let orderId: string;
          if (existingOrder) {
            if (!dry_run) {
              await supabase.from("orders").update(orderData).eq("id", existingOrder.id);
            }
            orderId = existingOrder.id;
          } else if (!dry_run) {
            const { data: ins, error } = await supabase
              .from("orders").insert(orderData).select("id").single();
            if (error) throw error;
            orderId = ins.id;
          } else {
            orderId = "dry-run";
          }

          // Import order line items
          if (o.OrderLine && !dry_run && orderId !== "dry-run") {
            const lines = Array.isArray(o.OrderLine) ? o.OrderLine : [o.OrderLine];
            for (const line of lines) {
              await safe(supabase.from("order_items").insert({
                order_id: orderId,
                store_id,
                title: line.ProductName || line.ItemDescription || "Item",
                sku: line.SKU || null,
                quantity: parseInt(line.Quantity) || 1,
                unit_price: parseFloat(line.UnitPrice) || 0,
                total: parseFloat(line.LineTotal) || (parseFloat(line.UnitPrice || "0") * parseInt(line.Quantity || "1")),
              } as any));
            }
          }

          // Import order payments
          if (o.OrderPayment && !dry_run && orderId !== "dry-run") {
            const payments = Array.isArray(o.OrderPayment) ? o.OrderPayment : [o.OrderPayment];
            for (const pay of payments) {
              await safe(supabase.from("order_payments").insert({
                order_id: orderId,
                store_id,
                amount: parseFloat(pay.Amount) || 0,
                payment_method: pay.PaymentMethod || "unknown",
                reference: pay.TransactionID || null,
              } as any));
            }
          }

          await logEntity("order", o.OrderID, orderId);
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
          const slug = (p.ContentReference || p.ContentName || `page-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `page-${Date.now()}`;

          const { data: existing } = await supabase
            .from("content_pages")
            .select("id")
            .eq("store_id", store_id)
            .eq("slug", slug)
            .maybeSingle();

          const pageData = {
            store_id,
            title: p.ContentName || "Untitled Page",
            slug,
            content: p.Description || p.ShortDescription || "",
            page_type: p.ContentType === "blog" ? "blog" : "page",
            status: p.Active === "True" ? "published" : "draft",
            is_published: p.Active === "True",
            sort_order: parseInt(p.SortOrder) || 0,
            seo_title: p.SEOPageTitle || null,
            seo_description: p.SEOMetaDescription || null,
            published_at: p.DatePosted || null,
          };

          if (existing) {
            await supabase.from("content_pages").update(pageData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("content_pages").insert(pageData);
            if (error) throw error;
          }

          await logEntity("content", p.ContentID, existing?.id || "new");
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
          });
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
          });
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
          });
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
            rate_type: m.Type || "flat_rate",
            flat_rate: parseFloat(m.Rate) || 0,
          });
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
            reason: r.Reason || r.ReturnReason || null,
            status: r.Status === "Approved" ? "approved" : r.Status === "Complete" ? "completed" : "pending",
            notes: r.Notes || null,
            created_at: r.DateCreated || new Date().toISOString(),
          });
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`RMA ${r.RmaID}: ${err.message}`);
        }
      }
    }

    // ── IMPORT REDIRECTS (301) ──
    else if (action === "import_redirects") {
      const items = source_data?.Redirect || source_data || [];
      const redirects = Array.isArray(items) ? items : [items];

      for (const r of redirects) {
        try {
          const fromPath = r.OldURL || r.FromPath || r.old_url;
          const toPath = r.NewURL || r.ToPath || r.new_url;
          if (fromPath && toPath) {
            const redirectData = {
              store_id,
              from_path: fromPath.startsWith("/") ? fromPath : `/${fromPath}`,
              to_path: toPath.startsWith("/") ? toPath : toPath.startsWith("http") ? toPath : `/${toPath}`,
              is_active: true,
            };
            const { error: upsertErr } = await supabase.from("redirects").upsert(
              redirectData as any, { onConflict: "store_id,from_path" }
            );
            if (upsertErr) {
              await safe(supabase.from("redirects").insert(redirectData as any));
            }
            imported++;
          }
        } catch (err: any) {
          failed++;
          errors.push(`Redirect ${r.OldURL || r.FromPath}: ${err.message}`);
        }
      }
    }

    // ── IMPORT THEME / CSS ──
    else if (action === "import_theme_css") {
      try {
        if (source_data.templates) {
          for (const tpl of source_data.templates) {
            const tplData = {
              store_id,
              slug: tpl.slug,
              name: tpl.name,
              template_type: tpl.template_type || "page",
              content: tpl.content,
              custom_css: tpl.custom_css || null,
              is_active: true,
            };
            const { error: upsertErr } = await supabase.from("store_templates").upsert(
              tplData as any, { onConflict: "store_id,slug" }
            );
            if (upsertErr) {
              await safe(supabase.from("store_templates").insert(tplData as any));
            }
            imported++;
          }
        }
      } catch (err: any) {
        failed++;
        errors.push(`Theme: ${err.message}`);
      }
    }

    // ── IMPORT CURRENCIES ──
    else if (action === "import_currencies") {
      const items = source_data?.Currency || source_data || [];
      const currencies = Array.isArray(items) ? items : [items];

      for (const c of currencies) {
        try {
          const currCode = c.CurrencyCode || c.Code || "AUD";
          const { data: existing } = await supabase
            .from("currencies")
            .select("id")
            .eq("store_id", store_id)
            .eq("code", currCode)
            .maybeSingle();

          const currData = {
            store_id,
            code: currCode,
            name: c.CurrencyName || c.Name || currCode,
            symbol: c.CurrencySymbol || c.Symbol || "$",
            exchange_rate: parseFloat(c.ExchangeRate) || 1,
            is_default: c.IsDefault === "True" || c.DefaultCurrency === "True",
            is_active: c.Active !== "False",
          };

          if (existing) {
            await supabase.from("currencies").update(currData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("currencies").insert(currData);
            if (error) throw error;
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Currency ${c.CurrencyCode || c.Code}: ${err.message}`);
        }
      }
    }

    // Update migration job progress
    if (migration_job_id) {
      await safe(supabase.from("migration_jobs").update({
        progress: { imported, failed, errors: errors.slice(0, 50) },
      } as any).eq("id", migration_job_id));
    }

    return new Response(JSON.stringify({
      success: true, action, imported, failed,
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
