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
const safe = async (p: PromiseLike<any>) => { try { return await p; } catch { return null; } };

const VALID_SEGMENTS = new Set(["new", "returning", "vip"]);

const sanitizeDate = (d: any): string | null => {
  if (!d || d === "0000-00-00 00:00:00" || d === "0000-00-00" || d === "0001-01-01T00:00:00" || d === "0001-01-01 00:00:00") return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime()) || parsed.getFullYear() < 1970) return null;
  return parsed.toISOString();
};

const normalizeSegment = (c: any): "new" | "returning" | "vip" => {
  const vals = [c?.segment, c?.Segment, c?.Type, c?.CustomerType, c?.UserGroup]
    .filter(Boolean).map((v: any) => String(v).trim().toLowerCase());
  for (const v of vals) {
    if (VALID_SEGMENTS.has(v)) return v as any;
    if (v.includes("vip") || v.includes("wholesale") || v.includes("trade")) return "vip";
    if (v.includes("return")) return "returning";
    if (v.includes("new")) return "new";
  }
  const orders = Number(c?.TotalOrders ?? c?.OrderCount ?? 0);
  return orders > 0 ? "returning" : "new";
};

const toBool = (v: any): boolean => v === "True" || v === "true" || v === true;
const toFloat = (v: any): number | null => { const n = parseFloat(v); return isNaN(n) ? null : n; };
const toInt = (v: any): number | null => { const n = parseInt(v); return isNaN(n) ? null : n; };

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
          migration_job_id, entity_type: entityType, source_id: sourceId,
          target_id: targetId, status: "success",
        } as any));
      }
    };

    // ══════════════════════════════════════════════════════════
    // ── IMPORT PRODUCTS (full fidelity) ──
    // ══════════════════════════════════════════════════════════
    if (action === "import_products") {
      const items = source_data?.Item || source_data || [];
      const products = Array.isArray(items) ? items : [items];

      const rehostImage = async (imageUrl: string, productSlug: string, index: number): Promise<string> => {
        try {
          if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;
          const fullUrl = imageUrl.startsWith("http") ? imageUrl : `https:${imageUrl}`;
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
            // Maropost returns Images as {Image: [{URL:..., ThumbURL:...}]} or direct array
            let rawImgs = p.Images;
            if (rawImgs && !Array.isArray(rawImgs) && rawImgs.Image) {
              rawImgs = rawImgs.Image; // unwrap nested {Image: [...]}
            }
            const imgs = Array.isArray(rawImgs) ? rawImgs : [rawImgs];
            for (let i = 0; i < imgs.length; i++) {
              const img = imgs[i];
              if (!img) continue;
              const url = typeof img === "string" ? img : img?.URL || img?.ThumbURL || img?.MediumURL || img?.SmallURL || img?.LargeURL;
              if (url) {
                const rehostedUrl = await rehostImage(url, slug, i);
                imagesArr.push(rehostedUrl);
              }
            }
          }

          // Fallback: check top-level image fields if Images array is empty
          if (imagesArr.length === 0) {
            const fallbackUrl = p.ThumbURL || p.ImageURL || p.DefaultImageURL || p.MainImageURL || p.Thumbnail || p.ImageSmallURL || p.ImageLargeURL;
            if (fallbackUrl) {
              const rehostedUrl = await rehostImage(fallbackUrl, slug, 0);
              imagesArr.push(rehostedUrl);
            }
          }

          // Map EVERY Maropost product field to our schema
          const productData: Record<string, any> = {
            store_id,
            title: p.Name || p.Model || "Untitled Product",
            slug,
            sku: p.SKU || p.ParentSKU || null,
            barcode: p.Barcode || null,
            brand: p.Brand || null,
            description: p.Description || null,
            short_description: p.ShortDescription || null,
            price: toFloat(p.DefaultPrice) || 0,
            compare_at_price: toFloat(p.RRP),
            cost_price: toFloat(p.CostPrice),
            promo_price: toFloat(p.PromotionPrice),
            promo_start: sanitizeDate(p.PromotionStartDate || p.PromotionStartDateLocal),
            promo_end: sanitizeDate(p.PromotionExpiryDate || p.PromotionExpiryDateLocal),
            promo_tag: p.PromotionLabel || p.PromotionID || null,
            status: toBool(p.IsActive) ? "active" : "draft", // constraint: draft, active, archived
            is_active: toBool(p.IsActive),
            is_approved: toBool(p.Approved) || toBool(p.IsApproved),
            seo_title: p.SEOPageTitle || null,
            seo_description: p.SEOMetaDescription || null,
            seo_keywords: p.SEOMetaKeywords || null,
            tags: p.Tags ? (Array.isArray(p.Tags) ? p.Tags : String(p.Tags).split(",").map((t: string) => t.trim()).filter(Boolean)) : [],
            images: imagesArr,
            features: p.Features || null,
            specifications: p.Specifications || null,
            warranty: p.Warranty || null,
            terms_conditions: p.TermsConditions || null,
            search_keywords: p.SearchKeywords || null,
            tax_free: toBool(p.TaxFreeItem),
            tax_inclusive: toBool(p.TaxInclusive),
            custom_label: p.CustomLabel || null,
            subtitle: p.SubTitle || p.SubType || null,
            model_number: p.Model || null,
            product_type: p.Type === "Kit" ? "kit" : p.Type === "Virtual" ? "virtual" : "regular",
            product_subtype: p.SubType || null,
            availability_description: p.AvailabilityDescription || p.Availability || null,
            internal_notes: p.InternalNotes || null,
            supplier_item_code: p.SupplierItemCode || null,
            reorder_quantity: toInt(p.ReorderQuantity) || 0,
            restock_quantity: toInt(p.RestockQuantity) || 0,
            preorder_quantity: toInt(p.PreorderQuantity) || 0,
            poa: toBool(p.POA),
            virtual_product: toBool(p.Virtual),
            is_kit: p.Type === "Kit",
            misc1: p.Misc1 || p.Misc01 || null,
            misc2: p.Misc2 || p.Misc02 || null,
            misc3: p.Misc3 || p.Misc03 || null,
            misc4: p.Misc4 || p.Misc04 || null,
            misc5: p.Misc5 || p.Misc05 || null,
            created_at: sanitizeDate(p.DateAdded || p.DateCreated) || new Date().toISOString(),
            updated_at: sanitizeDate(p.DateUpdated || p.DateModified) || new Date().toISOString(),
          };

          // Upsert by SKU — always update existing to FIX bad imports
          let productId: string;
          const lookupSku = p.SKU || p.ParentSKU;
          if (lookupSku) {
            const { data: existing } = await supabase
              .from("products").select("id").eq("store_id", store_id).eq("sku", lookupSku).maybeSingle();
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
            // Also try slug-based dedup
            const { data: existingBySlug } = await supabase
              .from("products").select("id").eq("store_id", store_id).eq("slug", slug).maybeSingle();
            if (existingBySlug) {
              await supabase.from("products").update(productData).eq("id", existingBySlug.id);
              productId = existingBySlug.id;
            } else {
              const { data: inserted, error: insertErr } = await supabase
                .from("products").insert(productData).select("id").single();
              if (insertErr) throw insertErr;
              productId = inserted.id;
            }
          }

          // Shipping dimensions
          if (p.ShippingLength || p.ShippingWidth || p.ShippingHeight || p.ShippingWeight || p.ItemLength) {
            await safe(supabase.from("product_shipping").upsert({
              product_id: productId, store_id,
              shipping_length: toFloat(p.ShippingLength), shipping_width: toFloat(p.ShippingWidth),
              shipping_height: toFloat(p.ShippingHeight), shipping_weight: toFloat(p.ShippingWeight),
              shipping_cubic: toFloat(p.CubicWeight),
              actual_length: toFloat(p.ItemLength), actual_width: toFloat(p.ItemWidth),
              actual_height: toFloat(p.ItemHeight),
            } as any, { onConflict: "product_id" }));
          }

          // Pricing tiers — clear old then re-insert
          await safe(supabase.from("product_pricing_tiers").delete().eq("product_id", productId).eq("store_id", store_id));
          if (p.PriceGroups) {
            const pgRoot = Array.isArray(p.PriceGroups) ? p.PriceGroups : [p.PriceGroups];
            for (const pgItem of pgRoot) {
              const groups = pgItem?.PriceGroup ? (Array.isArray(pgItem.PriceGroup) ? pgItem.PriceGroup : [pgItem.PriceGroup]) : [];
              for (const pg of groups) {
                if (toFloat(pg.Price)! > 0) {
                  await safe(supabase.from("product_pricing_tiers").insert({
                    product_id: productId, store_id,
                    tier_name: pg.Group || "Default",
                    min_quantity: toInt(pg.MinimumQuantity) || 1,
                    price: toFloat(pg.Price) || 0,
                    user_group: pg.Group || null,
                  } as any));
                }
              }
            }
          }

          // Variants — upsert by SKU
          if (p.VariantInventory) {
            const variants = Array.isArray(p.VariantInventory) ? p.VariantInventory : [p.VariantInventory];
            for (const v of variants) {
              if (v && v.SKU) {
                const variantData: Record<string, any> = {
                  product_id: productId, store_id,
                  sku: v.SKU, name: v.VariationName || v.SKU || "Variant",
                  price: toFloat(v.DefaultPrice), stock: toInt(v.Quantity) || 0,
                };
                if (!dry_run) {
                  const { data: existingVar } = await supabase
                    .from("product_variants").select("id").eq("store_id", store_id).eq("sku", v.SKU).maybeSingle();
                  if (existingVar) {
                    await safe(supabase.from("product_variants").update(variantData as any).eq("id", existingVar.id));
                  } else {
                    await safe(supabase.from("product_variants").insert(variantData as any));
                  }
                }
              }
            }
          }

          // Warehouse stock levels — Maropost returns WarehouseQuantity as {WarehouseID, Quantity}
          if (p.WarehouseQuantity || p.WarehouseLocations) {
            const whData = p.WarehouseQuantity || p.WarehouseLocations;
            const warehouses = Array.isArray(whData) ? whData : (whData && typeof whData === "object" && whData.WarehouseID ? [whData] : []);
            for (const wh of warehouses) {
              if (!wh || typeof wh !== "object") continue;
              const whId = wh?.WarehouseID;
              const whName = wh?.WarehouseName || wh?.Name || (whId ? `Warehouse ${whId}` : "Default");
              const qty = toInt(wh?.Quantity || wh?.AvailableQuantity) || 0;
              // Try by name first, then create if needed
              let loc: any = null;
              const { data: existingLoc } = await supabase
                .from("inventory_locations").select("id").eq("store_id", store_id).eq("name", whName).maybeSingle();
              if (existingLoc) {
                loc = existingLoc;
              } else {
                // Auto-create the warehouse location
                const { data: newLoc } = await supabase
                  .from("inventory_locations").insert({ store_id, name: whName, type: "warehouse" }).select("id").single();
                loc = newLoc;
              }
              if (loc?.id) {
                await safe(supabase.from("inventory_stock").upsert({
                  store_id, product_id: productId, location_id: loc.id,
                  quantity: qty, bin_location: wh?.BinLocation || p.PickZone || null,
                } as any, { onConflict: "product_id,location_id" }));
              }
            }
          }

          // Item specifics — clear old then re-insert
          await safe(supabase.from("product_specifics").delete().eq("product_id", productId).eq("store_id", store_id));
          if (p.ItemSpecifics) {
            const specsRoot = Array.isArray(p.ItemSpecifics) ? p.ItemSpecifics : [p.ItemSpecifics];
            for (const specItem of specsRoot) {
              const spec = specItem?.ItemSpecific || specItem;
              if (spec && typeof spec === "object" && spec.Name && spec.Value) {
                await safe(supabase.from("product_specifics").insert({
                  product_id: productId, store_id,
                  name: spec.Name || spec.Label || "Spec", value: spec.Value || "",
                } as any));
              }
            }
          }

          // Link to categories — try multiple matching strategies
          if (p.Categories) {
            const cats = Array.isArray(p.Categories) ? p.Categories : [p.Categories];
            for (const catItem of cats) {
              const catName = catItem?.CategoryName || catItem?.Category?.CategoryName || (typeof catItem === "string" ? catItem : null);
              const catRef = catItem?.CategoryReference || catItem?.Category?.CategoryReference;
              if (catName || catRef) {
                let foundCat: any = null;

                // 1. Try slug from CategoryReference (matches how categories are imported)
                if (catRef && !foundCat) {
                  const refSlug = catRef.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  const { data } = await supabase
                    .from("categories").select("id").eq("store_id", store_id).eq("slug", refSlug).maybeSingle();
                  foundCat = data;
                }

                // 2. Try slug from CategoryName
                if (catName && !foundCat) {
                  const nameSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  const { data } = await supabase
                    .from("categories").select("id").eq("store_id", store_id).eq("slug", nameSlug).maybeSingle();
                  foundCat = data;
                }

                // 3. Try exact name match
                if (catName && !foundCat) {
                  const { data } = await supabase
                    .from("categories").select("id").eq("store_id", store_id).eq("name", catName).maybeSingle();
                  foundCat = data;
                }

                // 4. Try case-insensitive name match (ilike)
                if (catName && !foundCat) {
                  const { data } = await supabase
                    .from("categories").select("id").eq("store_id", store_id).ilike("name", catName).maybeSingle();
                  foundCat = data;
                }

                if (foundCat) {
                  await safe(supabase.from("products").update({ category_id: foundCat.id }).eq("id", productId));
                  break; // Use first matched category as primary
                }
              }
            }
          }

          // Product relations — clear old then re-insert
          await safe(supabase.from("product_relations").delete().eq("product_id", productId).eq("store_id", store_id));
          for (const rel of [
            { field: "CrossSellProducts", type: "cross_sell" },
            { field: "UpsellProducts", type: "upsell" },
            { field: "FreeGifts", type: "free_gift" },
          ]) {
            if (p[rel.field]) {
              const relItems = Array.isArray(p[rel.field]) ? p[rel.field] : [p[rel.field]];
              for (const relItem of relItems) {
                const relSku = typeof relItem === "string" ? relItem : relItem?.SKU || relItem?.ParentSKU;
                if (relSku) {
                  const { data: relProduct } = await supabase
                    .from("products").select("id").eq("store_id", store_id).eq("sku", relSku).maybeSingle();
                  if (relProduct) {
                    await safe(supabase.from("product_relations").insert({
                      product_id: productId, related_product_id: relProduct.id,
                      store_id, relation_type: rel.type,
                    }));
                  }
                }
              }
            }
          }

          await logEntity("product", p.ID || p.SKU || p.ParentSKU || slug, productId);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Product ${p.Name || p.SKU || p.ParentSKU}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT CATEGORIES ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_categories") {
      const items = source_data?.Category || source_data || [];
      const categories = Array.isArray(items) ? items : [items];

      const idMap: Record<string, string> = {};
      for (const c of categories) {
        try {
          const slug = (c.CategoryReference || c.CategoryName || `cat-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now()}`;

          const { data: existing } = await supabase
            .from("categories").select("id").eq("store_id", store_id).eq("slug", slug).maybeSingle();

          const catData: Record<string, any> = {
            store_id,
            name: c.CategoryName || "Untitled",
            slug,
            description: c.Description || c.ShortDescription || null,
            sort_order: toInt(c.SortOrder) || 0,
            seo_title: c.SEOPageTitle || null,
            seo_description: c.SEOMetaDescription || null,
            image_url: c.CategoryImage || c.Thumbnail || null,
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

    // ══════════════════════════════════════════════════════════
    // ── IMPORT CUSTOMERS (full fidelity + upsert to fix bad data) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_customers") {
      const items = source_data?.Customer || source_data || [];
      const customers = Array.isArray(items) ? items : [items];

      // Pre-create customer groups
      const groupMap: Record<string, string> = {};
      const uniqueGroups = [...new Set(customers.map((c: any) => c.UserGroup).filter(Boolean))];
      for (const groupName of uniqueGroups) {
        try {
          const { data: existing } = await supabase
            .from("customer_groups").select("id").eq("store_id", store_id).eq("name", groupName as string).maybeSingle();
          if (existing) {
            groupMap[groupName as string] = existing.id;
          } else {
            const { data: created } = await supabase
              .from("customer_groups").insert({ store_id, name: groupName as string }).select("id").single();
            if (created) groupMap[groupName as string] = created.id;
          }
        } catch { /* ignore */ }
      }

      for (const c of customers) {
        try {
          const custEmail = c.EmailAddress || c.Email || null;
          
          // ⚠ CRITICAL FIX: Maropost does NOT return Name/Surname/Phone as top-level fields!
          // Customer name MUST be extracted from BillingAddress.BillFirstName + BillLastName
          const billing = c.BillingAddress || {};
          const shipping = c.ShippingAddress || {};
          
          const firstName = c.Name || c.FirstName || billing.BillFirstName || shipping.ShipFirstName || "";
          const lastName = c.Surname || c.LastName || billing.BillLastName || shipping.ShipLastName || "";
          const custName = `${firstName} ${lastName}`.trim() || c.Username || "Unknown";
          const custPhone = c.Phone || c.Mobile || c.PhoneNumber || billing.BillPhone || shipping.ShipPhone || null;
          const custCompany = c.CompanyName || billing.BillCompany || shipping.ShipCompany || null;

          const custData: Record<string, any> = {
            store_id,
            name: custName,
            email: custEmail,
            phone: custPhone,
            abn_vat_number: c.ABN || c.VATNumber || c.CompanyTaxNumber || null,
            segment: normalizeSegment(c),
            notes: c.IdentificationDetails || c.Notes || null,
            credit_limit: toFloat(c.CreditLimit),
            payment_terms: c.PaymentTerms || c.DefaultPaymentTerms || null,
            birthday: sanitizeDate(c.DateOfBirth || c.Birthday),
            sales_rep: c.SalesRep || c.SalesRepresentative || null,
            referral_code: c.ReferralCode || null,
            referred_by: c.ReferredBy || null,
            tags: c.UserGroup ? [c.UserGroup] : [],
            total_orders: toInt(c.TotalOrders || c.OrderCount) || 0,
            total_spent: toFloat(c.TotalSpent || c.TotalValue) || 0,
            is_approved: c.Active !== "False" && c.Approved !== "False",
            requires_approval: toBool(c.RequiresApproval),
            logo_url: c.Logo || c.CompanyLogo || null,
            created_at: sanitizeDate(c.DateAdded || c.DateCreated || c.DateRegistered) || new Date().toISOString(),
            updated_at: sanitizeDate(c.DateUpdated || c.DateModified) || new Date().toISOString(),
          };

          if (c.UserGroup && groupMap[c.UserGroup]) {
            custData.customer_group_id = groupMap[c.UserGroup];
          }

          // UPSERT: Always update existing by email OR username-based name match
          let custId: string;
          let existingCust: any = null;
          if (custEmail) {
            const { data } = await supabase
              .from("customers").select("id").eq("store_id", store_id).eq("email", custEmail).maybeSingle();
            existingCust = data;
          }
          if (!existingCust && custName !== "Unknown") {
            const { data } = await supabase
              .from("customers").select("id").eq("store_id", store_id).eq("name", custName).maybeSingle();
            existingCust = data;
          }

          if (existingCust) {
            await supabase.from("customers").update(custData).eq("id", existingCust.id);
            custId = existingCust.id;
          } else {
            const { data: newCust, error } = await supabase
              .from("customers").insert(custData).select("id").single();
            if (error) throw error;
            custId = newCust.id;
          }

          // Addresses — delete old for this customer then re-insert (fixes duplicates from bad imports)
          await safe(supabase.from("customer_addresses").delete().eq("customer_id", custId).eq("store_id", store_id));

          // ⚠ CRITICAL FIX: Maropost returns BillStreetLine1, BillCity, etc. NOT StreetAddress1
          for (const addrType of ["BillingAddress", "ShippingAddress"]) {
            const addr = c[addrType];
            if (addr) {
              const addresses = Array.isArray(addr) ? addr : [addr];
              const isBilling = addrType === "BillingAddress";
              for (const a of addresses) {
                // Maropost billing uses BillStreetLine1, shipping uses ShipStreetLine1
                const street1 = isBilling
                  ? (a.BillStreetLine1 || a.StreetAddress1 || a.Address1 || "")
                  : (a.ShipStreetLine1 || a.StreetAddress1 || a.Address1 || "");
                const street2 = isBilling
                  ? (a.BillStreetLine2 || a.StreetAddress2 || a.Address2 || null)
                  : (a.ShipStreetLine2 || a.StreetAddress2 || a.Address2 || null);
                const city = isBilling ? (a.BillCity || a.City || "") : (a.ShipCity || a.City || "");
                const state = isBilling ? (a.BillState || a.State || "") : (a.ShipState || a.State || "");
                const postcode = isBilling
                  ? (a.BillPostCode || a.PostCode || a.Postcode || "")
                  : (a.ShipPostCode || a.PostCode || a.Postcode || "");
                const country = isBilling
                  ? (a.BillCountry || a.Country || "AU")
                  : (a.ShipCountry || a.Country || "AU");
                const addrFirstName = isBilling ? (a.BillFirstName || firstName) : (a.ShipFirstName || firstName);
                const addrLastName = isBilling ? (a.BillLastName || lastName) : (a.ShipLastName || lastName);
                const addrCompany = isBilling ? (a.BillCompany || custCompany) : (a.ShipCompany || custCompany);
                const addrPhone = isBilling ? (a.BillPhone || custPhone) : (a.ShipPhone || custPhone);

                if (street1 || city) {
                  await safe(supabase.from("customer_addresses").insert({
                    customer_id: custId, store_id,
                    address_type: isBilling ? "billing" : "shipping",
                    first_name: addrFirstName || "",
                    last_name: addrLastName || "",
                    company: addrCompany || null,
                    address_1: street1,
                    address_2: street2,
                    city,
                    state,
                    postcode,
                    country,
                    phone: addrPhone || null,
                    is_default: true,
                  }));
                }
              }
            }
          }

          // Communication logs — Maropost returns "CustomerLogs" (plural)
          const custLogs = c.CustomerLogs || c.CustomerLog;
          if (custLogs && custLogs !== "") {
            const logs = Array.isArray(custLogs) ? custLogs : [custLogs];
            for (const log of logs) {
              if (log && typeof log === "object" && (log.Notes || log.Description || log.Subject)) {
                await safe(supabase.from("customer_communications").insert({
                  customer_id: custId, store_id,
                  channel: log.Type || "note", direction: "inbound",
                  subject: log.Subject || log.Type || "Log Entry",
                  body: log.Notes || log.Description || "",
                  status: "delivered",
                  created_at: sanitizeDate(log.DateCreated || log.Date) || new Date().toISOString(),
                }));
              }
            }
          }

          // Newsletter
          if (toBool(c.NewsletterSubscriber) && custEmail) {
            await safe(supabase.from("newsletter_subscribers").upsert({
              store_id, email: custEmail, is_active: true,
            } as any, { onConflict: "store_id,email" }));
          }

          await logEntity("customer", c.Username || custEmail || custName, custId);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Customer ${c.Username || c.EmailAddress}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT ORDERS (exact order numbers, full field mapping) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_orders") {
      const items = source_data?.Order || source_data || [];
      const orders = Array.isArray(items) ? items : [items];

      // DB constraint: pending, processing, shipped, delivered, cancelled
      const statusMap: Record<string, string> = {
        "New": "pending", "New Backorder": "pending", "Pending": "pending",
        "Pick": "processing", "Pack": "processing", "Processing": "processing",
        "On Hold": "pending", "Dispatched": "shipped", "Shipped": "shipped",
        "Cancelled": "cancelled", "Completed": "delivered",
        "Awaiting Payment": "pending", "Back Order": "pending",
        "Delivered": "delivered",
      };

      // DB constraint: pending, paid, refunded
      const paymentStatusMap: Record<string, string> = {
        "Paid": "paid", "Partially Paid": "paid", "Unpaid": "pending",
        "Refunded": "refunded", "Pending": "pending",
      };

      const fulfillmentMap: Record<string, string> = {
        "Dispatched": "fulfilled", "Shipped": "fulfilled", "Completed": "fulfilled",
        "Delivered": "fulfilled",
        "Pick": "partial", "Pack": "partial", "Processing": "partial",
        "New": "unfulfilled", "Pending": "unfulfilled", "Cancelled": "unfulfilled",
      };

      for (const o of orders) {
        try {
          const grandTotal = toFloat(o.GrandTotal) || 0;
          const taxTotal = toFloat(o.TaxTotal) || 0;
          const shippingTotal = toFloat(o.ShippingTotal) || 0;
          const discountTotal = toFloat(o.DiscountTotal) || 0;

          // Use EXACT original order number — no "MP-" prefix
          const originalOrderNumber = String(o.OrderID || o.OrderNumber || o.InvoiceNumber || "");

          // Count line items for items_count
          const lineItems = o.OrderLine ? (Array.isArray(o.OrderLine) ? o.OrderLine : [o.OrderLine]) : [];

          // Validate against DB constraints — never let unknown values through
          const VALID_ORDER_STATUS = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);
          const VALID_PAYMENT_STATUS = new Set(["pending", "paid", "refunded"]);
          
          const rawStatus = statusMap[o.Status] || statusMap[o.OrderStatus] || "pending";
          const rawPayStatus = paymentStatusMap[o.PaymentStatus] || (toBool(o.Paid) ? "paid" : (o.DatePaid ? "paid" : "pending"));
          
          // ⚠ CRITICAL: Maropost returns address fields as FLAT top-level fields
          // NOT nested under ShipAddress/BillAddress objects!
          const shipAddr = o.ShipAddress || {
            ShipFirstName: o.ShipFirstName, ShipLastName: o.ShipLastName,
            ShipStreetLine1: o.ShipStreetLine1, ShipStreetLine2: o.ShipStreetLine2,
            ShipCity: o.ShipCity, ShipState: o.ShipState,
            ShipPostCode: o.ShipPostCode, ShipCountry: o.ShipCountry,
            ShipPhone: o.ShipPhone, ShipCompany: o.ShipCompany,
          };
          const billAddr = o.BillAddress || {
            BillFirstName: o.BillFirstName, BillLastName: o.BillLastName,
            BillStreetLine1: o.BillStreetLine1, BillStreetLine2: o.BillStreetLine2,
            BillCity: o.BillCity, BillState: o.BillState,
            BillPostCode: o.BillPostCode, BillCountry: o.BillCountry,
            BillPhone: o.BillPhone, BillCompany: o.BillCompany,
          };

          const orderData: Record<string, any> = {
            store_id,
            order_number: originalOrderNumber,
            status: VALID_ORDER_STATUS.has(rawStatus) ? rawStatus : "pending",
            payment_status: VALID_PAYMENT_STATUS.has(rawPayStatus) ? rawPayStatus : "pending",
            fulfillment_status: fulfillmentMap[o.Status] || "unfulfilled",
            subtotal: toFloat(o.SubTotal) || (grandTotal - taxTotal - shippingTotal + discountTotal),
            tax: taxTotal,
            shipping: shippingTotal,
            discount: discountTotal,
            total: grandTotal,
            items_count: lineItems.length,
            notes: o.InternalOrderNotes || o.CustomerOrderNotes || null,
            shipping_address: JSON.stringify(shipAddr),
            billing_address: JSON.stringify(billAddr),
            order_channel: o.SalesChannel || o.Channel || "web",
            tags: o.Labels ? (Array.isArray(o.Labels) ? o.Labels : String(o.Labels).split(",").map((t: string) => t.trim()).filter(Boolean)) : [],
            created_at: sanitizeDate(o.DatePlaced || o.DateCreated || o.OrderDate) || new Date().toISOString(),
            updated_at: sanitizeDate(o.DateUpdated || o.DateModified) || new Date().toISOString(),
          };

          // Link to customer — try email first, then Username as email, then Username as name
          const orderEmail = o.Email || o.EmailAddress || null;
          const orderUsername = o.Username || null;
          let linkedCustomer: any = null;

          // 1. Try exact email match
          if (orderEmail && !linkedCustomer) {
            const { data: cust } = await supabase
              .from("customers").select("id").eq("store_id", store_id).eq("email", orderEmail).maybeSingle();
            if (cust) linkedCustomer = cust;
          }

          // 2. Try Username as email (Maropost often uses email as username)
          if (orderUsername && !linkedCustomer) {
            const { data: cust } = await supabase
              .from("customers").select("id").eq("store_id", store_id).eq("email", orderUsername).maybeSingle();
            if (cust) linkedCustomer = cust;
          }

          // 3. Try Username as customer name match
          if (orderUsername && !linkedCustomer) {
            const { data: cust } = await supabase
              .from("customers").select("id").eq("store_id", store_id).eq("name", orderUsername).maybeSingle();
            if (cust) linkedCustomer = cust;
          }

          // 4. Try building name from FLAT bill address fields (Maropost returns these at top level)
          if (!linkedCustomer) {
            const baFirstName = o.BillFirstName || (o.BillAddress && o.BillAddress.FirstName) || "";
            const baLastName = o.BillLastName || (o.BillAddress && o.BillAddress.LastName) || "";
            const baName = `${baFirstName} ${baLastName}`.trim();
            if (baName) {
              const { data: cust } = await supabase
                .from("customers").select("id").eq("store_id", store_id).eq("name", baName).maybeSingle();
              if (cust) linkedCustomer = cust;
            }
          }

          if (linkedCustomer) orderData.customer_id = linkedCustomer.id;

          // UPSERT: Check for existing by BOTH old MP-prefixed AND exact number
          let orderId: string;
          const { data: existingExact } = await supabase
            .from("orders").select("id").eq("store_id", store_id).eq("order_number", originalOrderNumber).maybeSingle();
          const { data: existingOld } = !existingExact ? await supabase
            .from("orders").select("id").eq("store_id", store_id).eq("order_number", `MP-${o.OrderID}`).maybeSingle() : { data: null };

          const existingOrder = existingExact || existingOld;

          if (existingOrder) {
            if (!dry_run) {
              await supabase.from("orders").update(orderData).eq("id", existingOrder.id);
              // Delete old line items and payments to re-import fresh
              await safe(supabase.from("order_items").delete().eq("order_id", existingOrder.id));
              await safe(supabase.from("order_payments").delete().eq("order_id", existingOrder.id));
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

          // Order line items — link to actual products by SKU
          if (lineItems.length > 0 && !dry_run && orderId !== "dry-run") {
            for (const line of lineItems) {
              const lineSku = line.SKU || line.ProductSKU || null;
              let productId: string | null = null;
              let variantId: string | null = null;

              if (lineSku) {
                // Try to find the product by SKU
                const { data: prod } = await supabase
                  .from("products").select("id").eq("store_id", store_id).eq("sku", lineSku).maybeSingle();
                if (prod) {
                  productId = prod.id;
                } else {
                  // Try variant SKU
                  const { data: variant } = await supabase
                    .from("product_variants").select("id, product_id").eq("store_id", store_id).eq("sku", lineSku).maybeSingle();
                  if (variant) {
                    productId = variant.product_id;
                    variantId = variant.id;
                  }
                }
              }

              await safe(supabase.from("order_items").insert({
                order_id: orderId, store_id,
                product_id: productId,
                variant_id: variantId,
                title: line.ProductName || line.ItemDescription || line.Description || "Item",
                sku: lineSku,
                quantity: toInt(line.Quantity) || 1,
                unit_price: toFloat(line.UnitPrice) || 0,
                total: toFloat(line.LineTotal) || ((toFloat(line.UnitPrice) || 0) * (toInt(line.Quantity) || 1)),
              } as any));
            }
          }

          // Order payments — get store owner as recorded_by (required NOT NULL field)
          if (o.OrderPayment && !dry_run && orderId !== "dry-run") {
            // Get store owner for recorded_by
            const { data: storeOwner } = await supabase
              .from("stores").select("owner_id").eq("id", store_id).single();
            const recordedBy = storeOwner?.owner_id;
            
            if (recordedBy) {
              const payments = Array.isArray(o.OrderPayment) ? o.OrderPayment : [o.OrderPayment];
              for (const pay of payments) {
                await safe(supabase.from("order_payments").insert({
                  order_id: orderId, store_id,
                  amount: toFloat(pay.Amount) || 0,
                  payment_method: pay.PaymentMethod || pay.PaymentType || "unknown",
                  reference: pay.TransactionID || pay.PaymentID || null,
                  recorded_by: recordedBy,
                  created_at: sanitizeDate(pay.DatePaid || pay.DateCreated) || new Date().toISOString(),
                } as any));
              }
            }
          }

          await logEntity("order", originalOrderNumber, orderId);
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Order ${o.OrderID}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT CONTENT PAGES (full fidelity) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_content") {
      const items = source_data?.Content || source_data || [];
      const pages = Array.isArray(items) ? items : [items];

      for (const p of pages) {
        try {
          const slug = (p.ContentReference || p.ContentName || `page-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `page-${Date.now()}`;

          const { data: existing } = await supabase
            .from("content_pages").select("id").eq("store_id", store_id).eq("slug", slug).maybeSingle();

          const pageData: Record<string, any> = {
            store_id,
            title: p.ContentName || "Untitled Page",
            slug,
            content: p.Description || p.ShortDescription || p.Body || "",
            page_type: (p.ContentType === "blog" || p.ParentContentName === "Articles" || p.ParentContentName === "Blog") ? "blog" : "page",
            status: toBool(p.Active) ? "published" : "draft",
            is_published: toBool(p.Active),
            sort_order: toInt(p.SortOrder) || 0,
            seo_title: p.SEOPageTitle || null,
            seo_description: p.SEOMetaDescription || null,
            featured_image: p.Thumbnail || p.Image || p.HeaderImage || null,
            published_at: sanitizeDate(p.DatePosted || p.DatePublished),
            created_at: sanitizeDate(p.DateCreated || p.DateAdded) || new Date().toISOString(),
            updated_at: sanitizeDate(p.DateUpdated || p.DateModified) || new Date().toISOString(),
          };

          if (existing) {
            await supabase.from("content_pages").update(pageData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("content_pages").insert(pageData);
            if (error) throw error;
          }

          await logEntity("content", p.ContentID || slug, existing?.id || "new");
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Content ${p.ContentName}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT GIFT VOUCHERS (upsert by code) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_vouchers") {
      const items = source_data?.Voucher || source_data || [];
      const vouchers = Array.isArray(items) ? items : [items];

      for (const v of vouchers) {
        try {
          const code = v.VoucherCode || v.Code || `GV-${Date.now()}`;
          const vData: Record<string, any> = {
            store_id,
            code,
            initial_value: toFloat(v.Value) || 0,
            balance: toFloat(v.Balance) ?? toFloat(v.Value) ?? 0,
            is_active: v.Active !== "False",
            expires_at: sanitizeDate(v.ExpiryDate),
            recipient_email: v.RecipientEmail || null,
            recipient_name: v.RecipientName || null,
            sender_name: v.SenderName || null,
            message: v.Message || null,
            created_at: sanitizeDate(v.DateCreated) || new Date().toISOString(),
          };

          const { data: existing } = await supabase
            .from("gift_vouchers").select("id").eq("store_id", store_id).eq("code", code).maybeSingle();
          if (existing) {
            await supabase.from("gift_vouchers").update(vData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("gift_vouchers").insert(vData);
            if (error) throw error;
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Voucher ${v.VoucherCode}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT SUPPLIERS (upsert by name) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_suppliers") {
      const items = source_data?.Supplier || source_data || [];
      const suppliers = Array.isArray(items) ? items : [items];

      for (const s of suppliers) {
        try {
          const name = s.SupplierName || s.CompanyName || "Unknown Supplier";
          const sData: Record<string, any> = {
            store_id, name,
            email: s.Email || s.EmailAddress || null,
            phone: s.Phone || s.PhoneNumber || null,
            contact_name: s.ContactName || s.Contact || null,
            address: [s.Address1, s.Address2, s.City, s.State, s.PostCode, s.Country].filter(Boolean).join(", ") || null,
            lead_time_days: toInt(s.LeadTime),
            notes: s.Notes || null,
          };

          const { data: existing } = await supabase
            .from("suppliers").select("id").eq("store_id", store_id).eq("name", name).maybeSingle();
          if (existing) {
            await supabase.from("suppliers").update(sData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("suppliers").insert(sData);
            if (error) throw error;
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Supplier ${s.SupplierName}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT WAREHOUSES (upsert by name) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_warehouses") {
      const items = source_data?.Warehouse || source_data || [];
      const warehouses = Array.isArray(items) ? items : [items];

      for (const w of warehouses) {
        try {
          const name = w.WarehouseName || w.Name || "Warehouse";
          const wData: Record<string, any> = {
            store_id, name,
            address: [w.Address1, w.Address2, w.City, w.State, w.PostCode, w.Country].filter(Boolean).join(", ") || null,
            type: "warehouse",
          };

          const { data: existing } = await supabase
            .from("inventory_locations").select("id").eq("store_id", store_id).eq("name", name).maybeSingle();
          if (existing) {
            await supabase.from("inventory_locations").update(wData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("inventory_locations").insert(wData);
            if (error) throw error;
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Warehouse ${w.WarehouseName}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT SHIPPING METHODS (upsert by name) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_shipping") {
      const items = source_data?.ShippingMethod || source_data || [];
      const methods = Array.isArray(items) ? items : [items];

      for (const m of methods) {
        try {
          const name = m.ShippingMethodName || m.Name || "Shipping Method";
          const mData: Record<string, any> = {
            store_id, name,
            rate_type: m.Type || "flat_rate",
            flat_rate: toFloat(m.Rate) || 0,
          };

          const { data: existing } = await supabase
            .from("shipping_zones").select("id").eq("store_id", store_id).eq("name", name).maybeSingle();
          if (existing) {
            await supabase.from("shipping_zones").update(mData).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("shipping_zones").insert(mData);
            if (error) throw error;
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Shipping ${m.ShippingMethodName}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT RETURNS / RMA (link to orders) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_rma") {
      const items = source_data?.Rma || source_data || [];
      const rmas = Array.isArray(items) ? items : [items];

      for (const r of rmas) {
        try {
          // Find the linked order by original order ID
          const orderRef = r.OrderID || r.OrderNumber;
          let orderId: string | null = null;
          let customerId: string | null = null;

          if (orderRef) {
            const { data: order } = await supabase
              .from("orders").select("id, customer_id")
              .eq("store_id", store_id)
              .or(`order_number.eq.${orderRef},order_number.eq.MP-${orderRef}`)
              .maybeSingle();
            if (order) {
              orderId = order.id;
              customerId = order.customer_id;
            }
          }

          if (!orderId) {
            // RMA requires an order_id — find any order to link or skip
            const { data: anyOrder } = await supabase
              .from("orders").select("id").eq("store_id", store_id).limit(1).maybeSingle();
            orderId = anyOrder?.id || null;
          }

          if (orderId) {
            const rmaStatus = r.Status === "Approved" ? "approved" : r.Status === "Complete" || r.Status === "Completed" ? "completed" : r.Status === "Rejected" ? "rejected" : "requested";
            await supabase.from("returns").insert({
              store_id,
              order_id: orderId,
              customer_id: customerId,
              reason: r.Reason || r.ReturnReason || "Not specified",
              status: rmaStatus,
              notes: r.Notes || r.CustomerNotes || null,
              admin_notes: r.AdminNotes || r.StaffNotes || null,
              refund_amount: toFloat(r.RefundAmount) || 0,
              created_at: sanitizeDate(r.DateCreated || r.DateRequested) || new Date().toISOString(),
            });
            imported++;
          } else {
            failed++;
            errors.push(`RMA ${r.RmaID}: No order found to link`);
          }
        } catch (err: any) {
          failed++;
          errors.push(`RMA ${r.RmaID}: ${err.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // ── IMPORT PAYMENTS (standalone — link to orders by OrderID) ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_payments") {
      const items = source_data?.Payment || source_data || [];
      const payments = Array.isArray(items) ? items : [items];

      const { data: storeOwner } = await supabase
        .from("stores").select("owner_id").eq("id", store_id).single();
      const recordedBy = storeOwner?.owner_id;

      for (const pay of payments) {
        try {
          if (!recordedBy) { failed++; errors.push(`Payment: No store owner for recorded_by`); continue; }
          const orderRef = pay.OrderID || pay.OrderNumber;
          if (!orderRef) { failed++; errors.push(`Payment ${pay.PaymentID}: No OrderID`); continue; }

          const { data: order } = await supabase
            .from("orders").select("id").eq("store_id", store_id).eq("order_number", String(orderRef)).maybeSingle();
          if (!order) { failed++; errors.push(`Payment ${pay.PaymentID}: Order ${orderRef} not found`); continue; }

          const ref = String(pay.TransactionID || pay.PaymentID || pay.ReceiptNumber || `pay-${Date.now()}`);
          const { data: existingPay } = await supabase
            .from("order_payments").select("id").eq("order_id", order.id).eq("reference", ref).maybeSingle();

          const payData: Record<string, any> = {
            order_id: order.id, store_id,
            amount: toFloat(pay.Amount) || toFloat(pay.TotalAmount) || 0,
            payment_method: pay.PaymentMethod || pay.PaymentType || pay.Gateway || "unknown",
            reference: ref, recorded_by: recordedBy,
            created_at: sanitizeDate(pay.DatePaid || pay.DateCreated || pay.PaymentDate) || new Date().toISOString(),
          };

          if (existingPay) {
            await supabase.from("order_payments").update(payData).eq("id", existingPay.id);
          } else {
            const { error } = await supabase.from("order_payments").insert(payData);
            if (error) throw error;
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Payment ${pay.PaymentID || "unknown"}: ${err.message}`);
        }
      }
    }

    //
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

    // ══════════════════════════════════════════════════════════
    // ── IMPORT THEME / CSS ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_theme_css") {
      try {
        if (source_data.templates) {
          for (const tpl of source_data.templates) {
            const tplData = {
              store_id,
              slug: tpl.slug, name: tpl.name,
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

    // ══════════════════════════════════════════════════════════
    // ── IMPORT CURRENCIES ──
    // ══════════════════════════════════════════════════════════
    else if (action === "import_currencies") {
      const items = source_data?.Currency || source_data || [];
      const currencies = Array.isArray(items) ? items : [items];

      for (const c of currencies) {
        try {
          const currCode = c.CurrencyCode || c.Code || "AUD";
          const { data: existing } = await supabase
            .from("currencies").select("id").eq("store_id", store_id).eq("code", currCode).maybeSingle();

          const currData = {
            store_id, code: currCode,
            name: c.CurrencyName || c.Name || currCode,
            symbol: c.CurrencySymbol || c.Symbol || "$",
            exchange_rate: toFloat(c.ExchangeRate) || 1,
            is_default: toBool(c.IsDefault) || toBool(c.DefaultCurrency),
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
        progress: { imported, failed, errors: errors.slice(0, 100) },
      } as any).eq("id", migration_job_id));
    }

    return new Response(JSON.stringify({
      success: true, action, imported, failed,
      errors: errors.slice(0, 100),
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
