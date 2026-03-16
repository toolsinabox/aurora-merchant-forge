import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2, Tag, X, MapPin, Truck, Store, Gift, Calendar, Sparkles, Timer, AlertTriangle } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { addBusinessDays, format } from "date-fns";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  discountAmount: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StorefrontCheckout() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath, storeSlug } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutStore, setCheckoutStore] = useState<any>(null);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => { if (s) setCheckoutStore(s); });
  }, [storeSlug]);

  const { data: activeTheme } = useActiveTheme(checkoutStore?.id);

  const themeHtml = useMemo(() => {
    if (!activeTheme || !checkoutStore) return null;
    const templateFile = findMainThemeFile(activeTheme, "checkout") || findMainThemeFile(activeTheme, "check-out");
    if (!templateFile?.content) return null;
    const themeFilesMap: Record<string, string> = {};
    activeTheme.files.forEach(f => { themeFilesMap[f.file_path] = f.content || ""; });
    const themeAssetBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${checkoutStore.id}`;
    const ctx: TemplateContext = {
      store: checkoutStore, basePath, pageType: "checkout",
      cart: { items, totalPrice },
      cart_items: items,
      themeFiles: themeFilesMap, themeAssetBaseUrl,
      includes: buildIncludesMap(activeTheme),
      content: { title: "Checkout" },
    };
    let html = renderTemplate(templateFile.content, ctx);
    html = html.replace(/(src|href)="(?!https?:\/\/|\/\/|\/|#|data:)([^"]+)"/gi, (_, attr, path) => `${attr}="${themeAssetBaseUrl}/${path}"`);
    return html;
  }, [activeTheme, checkoutStore, basePath, items, totalPrice]);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Gift voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: string; code: string; balance: number; amountUsed: number } | null>(null);

  // Gift message
  const [giftMessage, setGiftMessage] = useState("");

  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
  const [splitShipping, setSplitShipping] = useState(false);
  const [itemAddresses, setItemAddresses] = useState<Record<string, { address: string; city: string; zip: string; country: string }>>({}); 

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "",
    billing_same: true,
    billing_address: "", billing_city: "", billing_zip: "", billing_country: "",
    notes: "",
    delivery_instructions: "",
    company: "",
    po_number: "",
    custom_field_1: "",
  });

  // Capture UTM params from URL
  const [utmParams] = useState(() => {
    const sp = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(k => {
      const v = sp.get(k);
      if (v) params[k] = v;
    });
    return Object.keys(params).length > 0 ? params : null;
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [shippingCost, setShippingCost] = useState(0);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [taxMode, setTaxMode] = useState("standard");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [upsellProducts, setUpsellProducts] = useState<any[]>([]);
  const [shippingServices, setShippingServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [pickupLocations, setPickupLocations] = useState<any[]>([]);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<string>("");
  const [autoAppliedCoupon, setAutoAppliedCoupon] = useState(false);
  const [storeCreditBalance, setStoreCreditBalance] = useState(0);
  const [useStoreCredit, setUseStoreCredit] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [canPayOnAccount, setCanPayOnAccount] = useState(false);
  const [payOnAccount, setPayOnAccount] = useState(false);
  const [creditTerms, setCreditTerms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | "bank_transfer">("card");
  const [allTaxRates, setAllTaxRates] = useState<any[]>([]);
  const [ageVerified, setAgeVerified] = useState(false);
  const [hasRestrictedItems] = useState(() => false);
  const [expressCheckout, setExpressCheckout] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderGiftMessage, setOrderGiftMessage] = useState("");
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [authorityToLeave, setAuthorityToLeave] = useState(false);

  // Same-day delivery
  const [sameDayAvailable, setSameDayAvailable] = useState(false);
  const [sameDaySelected, setSameDaySelected] = useState(false);
  const SAME_DAY_CUTOFF_HOUR = 14; // 2 PM local time
  const SAME_DAY_FEE = 14.95;

  // Shipping insurance
  const [shippingInsurance, setShippingInsurance] = useState(false);
  const INSURANCE_RATE = 0.03; // 3% of subtotal
  
  // Cart reservation timer (15 min)
  const RESERVATION_MINUTES = 15;
  const [reservationEnd] = useState(() => Date.now() + RESERVATION_MINUTES * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState(RESERVATION_MINUTES * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((reservationEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        toast.error("Your cart reservation has expired. Please re-add items.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [reservationEnd]);

  useEffect(() => {
    async function loadData() {
      if (!checkoutStore?.id) return;
      const sid = checkoutStore.id;

      // Load shipping zones for this store
      const { data: zones } = await supabase.from("shipping_zones").select("*").eq("store_id", sid).order("name");
      if (zones && zones.length > 0) setShippingZones(zones);

      // Load shipping services for this store
      const { data: svcData } = await supabase.from("shipping_services").select("*").eq("store_id", sid).eq("is_active", true).order("sort_order");
      if (svcData) setShippingServices(svcData);

      // Load pickup locations for this store
      const { data: locData } = await supabase.from("inventory_locations").select("id, name, address, type").eq("store_id", sid).order("name");
      if (locData) setPickupLocations(locData);

      const { data: taxRates } = await supabase.from("tax_rates" as any).select("rate, region, country, is_default, is_compound, is_inclusive, priority, applies_to").eq("store_id", sid).order("priority", { ascending: false });
      if (taxRates && taxRates.length > 0) {
        setAllTaxRates(taxRates as any[]);
        const defaultRate = (taxRates as any[]).find((r: any) => r.is_default) || taxRates[0];
        setTaxRate(Number((defaultRate as any).rate) / 100);
      }
      const { data: storeData } = await supabase.from("stores").select("tax_mode").eq("id", sid).maybeSingle();
      if (storeData && (storeData as any).tax_mode) setTaxMode((storeData as any).tax_mode);

      if (!user) return;
      const { data: custs } = await supabase.from("customers").select("*").eq("user_id", user!.id).limit(1);
      const c = custs?.[0];
      if (c) {
        setCustomerId(c.id);
        setForm((prev) => ({
          ...prev,
          name: c.name || prev.name,
          email: c.email || user!.email || prev.email,
          phone: c.phone || prev.phone,
        }));
        // Load store credit balance
        const { data: credits } = await supabase.from("store_credit_transactions" as any).select("amount, type").eq("customer_id", c.id);
        if (credits) {
          const bal = (credits as any[]).reduce((s: number, t: any) => s + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);
          setStoreCreditBalance(Math.max(0, bal));
        }
        // Check if customer group is tax exempt and has credit terms
        if ((c as any).customer_group_id) {
          const { data: grp } = await supabase
            .from("customer_groups" as any)
            .select("is_tax_exempt, credit_terms, credit_limit")
            .eq("id", (c as any).customer_group_id)
            .maybeSingle();
          if (grp && (grp as any).is_tax_exempt) setIsTaxExempt(true);
          if (grp && (grp as any).credit_terms) {
            setCanPayOnAccount(true);
            setCreditTerms((grp as any).credit_terms);
          }
        }
        const { data: addrs } = await supabase
          .from("customer_addresses" as any)
          .select("*")
          .eq("customer_id", c.id)
          .order("is_default_shipping", { ascending: false });
        if (addrs && addrs.length > 0) {
          setSavedAddresses(addrs);
          const def = addrs.find((a: any) => a.is_default_shipping) || addrs[0];
          applyAddress(def);
          // Enable express checkout if user has saved address + email
          if (c.email && def) {
            setHasSavedDetails(true);
          }
        }
      } else {
        setForm((prev) => ({ ...prev, email: user!.email || prev.email }));
      }
    }
    loadData();
  }, [user, checkoutStore]);

  const applyAddress = (addr: any) => {
    setForm((prev) => ({
      ...prev,
      address: [addr.address_line1, addr.address_line2].filter(Boolean).join(", "),
      city: addr.city || "",
      zip: addr.postal_code || "",
      country: addr.country || "",
      phone: addr.phone || prev.phone,
    }));
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-calculate tax by address region/country
    if ((field === "city" || field === "country" || field === "zip") && allTaxRates.length > 1) {
      const newForm = { ...form, [field]: value };
      const regionMatch = allTaxRates.find((r: any) =>
        (r.region && newForm.city && newForm.city.toLowerCase().includes(r.region.toLowerCase())) ||
        (r.country && newForm.country && newForm.country.toLowerCase() === r.country.toLowerCase())
      );
      if (regionMatch) {
        setTaxRate(Number(regionMatch.rate) / 100);
      }
    }
  };

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const subtotalAfterDiscount = Math.max(0, totalPrice - discountAmount);
  const insurancePremium = Math.max(2.95, Math.round(subtotalAfterDiscount * INSURANCE_RATE * 100) / 100);
  const sameDayFee = sameDaySelected ? SAME_DAY_FEE : 0;
  const insuranceFee = shippingInsurance ? insurancePremium : 0;
  const actualShipping = deliveryMethod === "pickup" ? 0 : shippingCost + sameDayFee;

  // Check same-day availability based on cutoff hour
  useEffect(() => {
    const now = new Date();
    setSameDayAvailable(now.getHours() < SAME_DAY_CUTOFF_HOUR && deliveryMethod === "shipping");
    if (now.getHours() >= SAME_DAY_CUTOFF_HOUR) setSameDaySelected(false);
  }, [deliveryMethod]);

  // Compound tax calculation: apply taxes in priority order, compound taxes use accumulated base
  const taxAmount = (() => {
    if (isTaxExempt) return 0;
    const matchedRates = allTaxRates.filter((r: any) => {
      if (r.region && form.country) {
        return (r.region && form.city && form.city.toLowerCase().includes(r.region.toLowerCase())) ||
          (r.country && form.country.toLowerCase() === r.country.toLowerCase());
      }
      return r.is_default;
    });
    const ratesToApply = matchedRates.length > 0 ? matchedRates : allTaxRates.filter((r: any) => r.is_default);
    if (ratesToApply.length === 0) return Math.round(subtotalAfterDiscount * taxRate * 100) / 100;

    const sorted = [...ratesToApply].sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
    let totalTax = 0;
    let runningBase = subtotalAfterDiscount;
    for (const rate of sorted) {
      const appliesTo = rate.applies_to || "all";
      let base = 0;
      if (appliesTo === "products") base = rate.is_compound ? runningBase : subtotalAfterDiscount;
      else if (appliesTo === "shipping") base = actualShipping;
      else base = rate.is_compound ? runningBase + actualShipping : subtotalAfterDiscount + actualShipping;
      
      const tax = base * (Number(rate.rate) / 100);
      totalTax += tax;
      if (rate.is_compound) runningBase += tax;
    }
    return Math.round(totalTax * 100) / 100;
  })();

  const totalBeforeVoucher = subtotalAfterDiscount + actualShipping + insuranceFee + taxAmount;
  const voucherAmount = appliedVoucher?.amountUsed ?? 0;
  const storeCreditAmount = useStoreCredit ? Math.min(storeCreditBalance, totalBeforeVoucher - voucherAmount) : 0;
  const finalTotal = Math.max(0, totalBeforeVoucher - voucherAmount - storeCreditAmount);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    setSelectedServiceId("");
    const zone = shippingZones.find((z) => z.id === zoneId);
    if (zone) {
      const isFree = zone.free_above && subtotalAfterDiscount >= Number(zone.free_above);
      // Check if zone has services
      const zoneSvcs = shippingServices.filter((s: any) => s.zone_id === zoneId);
      if (zoneSvcs.length > 0) {
        // Default to first service, user can pick
        setSelectedServiceId(zoneSvcs[0].id);
        setShippingCost(isFree ? 0 : Number(zone.flat_rate));
        const svc = zoneSvcs[0];
        const minDate = addBusinessDays(new Date(), svc.estimated_days_min || 3);
        const maxDate = addBusinessDays(new Date(), svc.estimated_days_max || 7);
        setEstimatedDelivery(`${format(minDate, "MMM d")} – ${format(maxDate, "MMM d")}`);
      } else {
        setShippingCost(isFree ? 0 : Number(zone.flat_rate));
        const minDate = addBusinessDays(new Date(), 3);
        const maxDate = addBusinessDays(new Date(), 7);
        setEstimatedDelivery(`${format(minDate, "MMM d")} – ${format(maxDate, "MMM d")}`);
      }
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const svc = shippingServices.find((s: any) => s.id === serviceId);
    if (svc) {
      const zone = shippingZones.find((z) => z.id === svc.zone_id);
      const isFree = zone?.free_above && subtotalAfterDiscount >= Number(zone.free_above);
      setShippingCost(isFree ? 0 : Number(zone?.flat_rate || 0));
      const minDate = addBusinessDays(new Date(), svc.estimated_days_min || 3);
      const maxDate = addBusinessDays(new Date(), svc.estimated_days_max || 7);
      setEstimatedDelivery(`${format(minDate, "MMM d")} – ${format(maxDate, "MMM d")}`);
    }
  };

  // Auto-apply coupons on load
  useEffect(() => {
    if (autoAppliedCoupon || appliedCoupon || totalPrice <= 0 || !checkoutStore?.id) return;
    const tryAutoApply = async () => {
      const { data: coupons } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", checkoutStore.id)
        .eq("is_active", true)
        .order("discount_value", { ascending: false });
      if (!coupons) return;
      for (const coupon of coupons as any[]) {
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) continue;
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) continue;
        if (coupon.min_order_amount && totalPrice < Number(coupon.min_order_amount)) continue;
        // Only auto-apply coupons with no product/category restriction (site-wide)
        if (coupon.product_ids?.length > 0 || coupon.category_ids?.length > 0) continue;
        const amt = coupon.discount_type === "percentage"
          ? totalPrice * (Number(coupon.discount_value) / 100)
          : Math.min(Number(coupon.discount_value), totalPrice);
        setAppliedCoupon({
          id: coupon.id, code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: Number(coupon.discount_value),
          discountAmount: Math.round(amt * 100) / 100,
        });
        setAutoAppliedCoupon(true);
        toast.success(`Coupon ${coupon.code} auto-applied!`);
        break;
      }
    };
    tryAutoApply();
  }, [totalPrice, autoAppliedCoupon, appliedCoupon, checkoutStore]);

  // Load upsell products
  useEffect(() => {
    if (items.length === 0) return;
    const productIds = items.map(i => i.product_id).filter(Boolean);
    const loadUpsells = async () => {
      // Get related products
      const { data: relations } = await supabase
        .from("product_relations")
        .select("related_product_id")
        .in("product_id", productIds)
        .in("relation_type", ["upsell", "cross_sell"])
        .limit(4);
      if (relations && relations.length > 0) {
        const relIds = relations.map((r: any) => r.related_product_id).filter((id: string) => !productIds.includes(id));
        if (relIds.length > 0) {
          const { data: prods } = await supabase
            .from("products")
            .select("id, title, price, images, slug")
            .in("id", relIds)
            .eq("status", "active")
            .limit(4);
          setUpsellProducts(prods || []);
          return;
        }
      }
      // Fallback: random active products not in cart
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, price, images, slug")
        .eq("status", "active")
        .not("id", "in", `(${productIds.join(",")})`)
        .limit(4);
      setUpsellProducts(prods || []);
    };
    loadUpsells();
  }, [items]);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("store_id", checkoutStore?.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error("Invalid coupon code"); return; }

      const coupon = data as any;
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("This coupon has expired"); return;
      }
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error("This coupon has reached its usage limit"); return;
      }
      if (coupon.min_order_amount && totalPrice < Number(coupon.min_order_amount)) {
        toast.error(`Minimum order amount is $${Number(coupon.min_order_amount).toFixed(2)}`); return;
      }

      const amt = coupon.discount_type === "percentage"
        ? totalPrice * (Number(coupon.discount_value) / 100)
        : Math.min(Number(coupon.discount_value), totalPrice);

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discountAmount: Math.round(amt * 100) / 100,
      });
      toast.success("Coupon applied!");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setVoucherLoading(true);
    try {
      const { data, error } = await supabase
        .from("gift_vouchers")
        .select("id, code, balance, is_active, expires_at")
        .eq("code", code)
        .eq("store_id", checkoutStore?.id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) { toast.error("Invalid voucher code"); return; }
      const v = data as any;
      if (v.expires_at && new Date(v.expires_at) < new Date()) { toast.error("This voucher has expired"); return; }
      if (Number(v.balance) <= 0) { toast.error("This voucher has no remaining balance"); return; }
      const amountUsed = Math.min(Number(v.balance), totalBeforeVoucher);
      setAppliedVoucher({ id: v.id, code: v.code, balance: Number(v.balance), amountUsed });
      toast.success(`Voucher applied! $${amountUsed.toFixed(2)} credit`);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply voucher");
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    if (!form.address || !form.city) { toast.error("Shipping address is required"); return; }
    if (!form.billing_same && (!form.billing_address || !form.billing_city)) { toast.error("Billing address is required"); return; }

    // Check guest checkout allowed
    if (!user) {
      const guestAllowed = (checkoutStore as any)?.guest_checkout_enabled;
      if (guestAllowed === false) {
        toast.error("Please log in to complete your order");
        return;
      }
    }

    // Check minimum order amount (store-wide)
    const minOrder = Number((checkoutStore as any)?.min_order_amount) || 0;
    if (minOrder > 0 && totalPrice < minOrder) {
      toast.error(`Minimum order amount is $${minOrder.toFixed(2)}`);
      return;
    }

    // Check wholesale group min order amount
    if (user) {
      const { data: cust } = await supabase.from("customers").select("customer_group_id").eq("user_id", user.id).maybeSingle();
      if (cust && (cust as any).customer_group_id) {
        const { data: grp } = await supabase.from("customer_groups" as any).select("min_order_amount, name").eq("id", (cust as any).customer_group_id).maybeSingle();
        const groupMin = Number((grp as any)?.min_order_amount) || 0;
        if (groupMin > 0 && totalPrice < groupMin) {
          toast.error(`Minimum order for ${(grp as any)?.name || "your group"} is $${groupMin.toFixed(2)}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (!checkoutStore?.id) throw new Error("Store not found");
      const storeId = checkoutStore.id;
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const shippingAddr = `${form.address}, ${form.city} ${form.zip}, ${form.country}`;

      let customerId: string | null = null;
      if (user) {
        const { data: userCust } = await supabase
          .from("customers").select("id").eq("user_id", user.id).eq("store_id", storeId).maybeSingle();
        if (userCust) customerId = userCust.id;
      }
      if (!customerId) {
        const { data: emailCust } = await supabase
          .from("customers").select("id").eq("store_id", storeId).eq("email", form.email).maybeSingle();
        if (emailCust) customerId = emailCust.id;
      }
      // Auto-create customer record if none found
      if (!customerId) {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            store_id: storeId,
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            user_id: user?.id || null,
            segment: "new",
          } as any)
          .select("id")
          .single();
        if (newCust) customerId = newCust.id;
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          order_number: orderNum,
          customer_id: customerId,
          items_count: items.reduce((s, i) => s + i.quantity, 0),
          subtotal: totalPrice,
          discount: discountAmount,
          tax: taxAmount,
          shipping: actualShipping,
          total: finalTotal,
          status: deliveryMethod === "pickup" ? "processing" : "pending",
          payment_status: payOnAccount ? "pending" : paymentMethod === "cod" ? "pending" : "pending",
          notes: [
            paymentMethod === "cod" ? "[Payment: Cash on Delivery]" : paymentMethod === "bank_transfer" ? "[Payment: Bank Transfer — Awaiting Payment]" : null,
            payOnAccount ? `Pay on Account - ${creditTerms}` : null,
            deliveryMethod === "pickup" ? `[Click & Collect: ${pickupLocations.find(l => l.id === selectedPickupLocation)?.name || "Store pickup"}${pickupLocations.find(l => l.id === selectedPickupLocation)?.address ? ` — ${pickupLocations.find(l => l.id === selectedPickupLocation)?.address}` : ""}]` : null,
            form.delivery_instructions ? `[Delivery: ${form.delivery_instructions}]` : null,
            signatureRequired ? "[Signature Required]" : null,
            authorityToLeave ? "[Authority to Leave]" : null,
            form.company ? `[Company: ${form.company}]` : null,
            form.po_number ? `[PO#: ${form.po_number}]` : null,
            form.custom_field_1 ? `[Custom: ${form.custom_field_1}]` : null,
            utmParams ? `[UTM: ${Object.entries(utmParams).map(([k,v]) => `${k}=${v}`).join("&")}]` : null,
            orderGiftMessage ? `[Gift Message: ${orderGiftMessage}]` : null,
            form.notes,
          ].filter(Boolean).join(" ") || null,
          shipping_address: shippingAddr,
          billing_address: form.billing_same ? shippingAddr : `${form.billing_address}, ${form.billing_city} ${form.billing_zip}, ${form.billing_country}`,
          coupon_id: appliedCoupon?.id || null,
          metadata: utmParams ? utmParams : undefined,
        } as any)
        .select()
        .single();

      if (orderErr) throw orderErr;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        store_id: storeId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        title: item.title,
        sku: item.sku || null,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // Increment coupon used_count
      if (appliedCoupon) {
        const { data: couponData } = await supabase.from("coupons").select("used_count").eq("id", appliedCoupon.id).single();
        if (couponData) {
          await supabase.from("coupons").update({ used_count: (couponData as any).used_count + 1 } as any).eq("id", appliedCoupon.id);
        }
      }

      // Deduct gift voucher balance
      if (appliedVoucher) {
        const newBalance = Math.max(0, appliedVoucher.balance - appliedVoucher.amountUsed);
        await supabase.from("gift_vouchers").update({
          balance: newBalance,
          redeemed_at: newBalance === 0 ? new Date().toISOString() : null,
        } as any).eq("id", appliedVoucher.id);
      }

      // Deduct store credit
      if (storeCreditAmount > 0 && customerId) {
        await supabase.from("store_credit_transactions" as any).insert({
          customer_id: customerId,
          store_id: storeId,
          amount: storeCreditAmount,
          type: "debit",
          description: `Order ${orderNum}`,
          order_id: order.id,
        });
      }

      // Trigger order confirmation + admin notification emails
      supabase.functions.invoke("order-email-trigger", {
        body: { order_id: order.id, store_id: storeId, trigger_type: "order_created" },
      }).catch(() => {});

      setOrderNumber(orderNum);
      setOrderTotal(finalTotal);
      setCompleted(true);
      clearCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!completed && themeHtml) {
    return (
      <StorefrontLayout storeName={checkoutStore?.name}>
        <div dangerouslySetInnerHTML={{ __html: themeHtml }} />
      </StorefrontLayout>
    );
  }

  if (completed) {
    return (
      <StorefrontLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-muted-foreground mb-1">Your order has been placed successfully.</p>
          <p className="text-sm font-medium mb-2">
            Order number: <span className="font-mono bg-muted px-2 py-0.5 rounded">{orderNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-1">Total: <span className="font-semibold text-foreground">${orderTotal.toFixed(2)}</span></p>
          {form.email && (
            <p className="text-xs text-muted-foreground mb-6">A confirmation will be sent to <span className="font-medium">{form.email}</span></p>
          )}
          <div className="flex gap-3 justify-center">
            {user && <Button variant="outline" onClick={() => navigate(`${basePath}/account`)}>View Orders</Button>}
            <Button onClick={() => navigate(basePath || "/")}>Continue Shopping</Button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (items.length === 0) {
    navigate(`${basePath}/cart`);
    return null;
  }

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        {/* Minimum order warning */}
        {totalPrice < 25 && (
          <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 mb-4 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Your cart total is ${totalPrice.toFixed(2)}. Some stores may require a minimum order amount.</span>
          </div>
        )}

        {/* Express Checkout for returning customers */}
        {hasSavedDetails && user && !expressCheckout && (
          <div className="border rounded-lg p-4 mb-6 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">⚡ Express Checkout</p>
              <p className="text-xs text-muted-foreground">Use your saved details to checkout in one click</p>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setExpressCheckout(true)}>
              <Sparkles className="h-3.5 w-3.5" /> One-Click Checkout
            </Button>
          </div>
        )}
        {expressCheckout && (
          <div className="border rounded-lg p-5 mb-6 bg-muted/20 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Express Checkout</h2>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Name:</span> {form.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {form.email}</p>
              <p><span className="text-muted-foreground">Ship to:</span> {form.address}, {form.city} {form.zip}</p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Placing Order...</> : "Place Order Now"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpressCheckout(false)}>Edit Details</Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form — One-Page Accordion Checkout (Maropost style) */}
            <div className="lg:col-span-2 space-y-0">
              {/* Section 1: Contact */}
              <div className="border rounded-t-lg overflow-hidden">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${checkoutStep === 1 ? "bg-primary/5" : "bg-muted/30 hover:bg-muted/50"}`}
                  onClick={() => setCheckoutStep(checkoutStep === 1 ? 0 : 1)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${form.name && form.email ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                      {form.name && form.email ? <Check className="h-3 w-3" /> : "1"}
                    </div>
                    <span className="font-semibold text-sm">Contact Information</span>
                  </div>
                  {form.name && form.email && checkoutStep !== 1 && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{form.name} · {form.email}</span>
                  )}
                </button>
                {checkoutStep === 1 && (
                  <div className="px-5 pb-5 pt-3 space-y-4 border-t">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Full Name *</Label>
                        <Input value={form.name} onChange={(e) => update("name", e.target.value)} required className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email *</Label>
                        <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className="h-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-10" />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" size="sm" onClick={() => setCheckoutStep(2)} disabled={!form.name || !form.email}>
                        Continue to Shipping
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Shipping Address */}
              <div className="border-x border-b overflow-hidden">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${checkoutStep === 2 ? "bg-primary/5" : "bg-muted/30 hover:bg-muted/50"}`}
                  onClick={() => setCheckoutStep(checkoutStep === 2 ? 0 : 2)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${form.address && form.city ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                      {form.address && form.city ? <Check className="h-3 w-3" /> : "2"}
                    </div>
                    <span className="font-semibold text-sm">Shipping Address</span>
                  </div>
                  {form.address && checkoutStep !== 2 && (
                    <span className="text-xs text-muted-foreground truncate max-w-[250px]">{form.address}, {form.city} {form.zip}</span>
                  )}
                </button>
                {checkoutStep === 2 && (
                  <div className="px-5 pb-5 pt-3 space-y-4 border-t">
                    <div className="flex items-center justify-between">
                      {savedAddresses.length > 0 && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <Select onValueChange={(id) => {
                            const addr = savedAddresses.find((a: any) => a.id === id);
                            if (addr) applyAddress(addr);
                          }}>
                            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Use saved address" /></SelectTrigger>
                            <SelectContent>
                              {savedAddresses.map((a: any) => (
                                <SelectItem key={a.id} value={a.id} className="text-xs">
                                  {a.label || `${a.address_line1}, ${a.city}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Address</Label>
                      <Input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-10" placeholder="Start typing your address..." />
                      {form.address.length > 0 && form.address.length < 10 && (
                        <p className="text-[10px] text-destructive flex items-center gap-1">⚠ Address seems too short — please enter full street address</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>City</Label>
                        <Input value={form.city} onChange={(e) => update("city", e.target.value)} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>ZIP / Postcode</Label>
                        <Input value={form.zip} onChange={(e) => update("zip", e.target.value)} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Country</Label>
                        <Select value={form.country} onValueChange={(v) => update("country", v)}>
                          <SelectTrigger className="h-10"><SelectValue placeholder="Select country" /></SelectTrigger>
                          <SelectContent>
                            {["Australia", "New Zealand", "United States", "United Kingdom", "Canada", "Singapore", "Hong Kong", "Japan", "Germany", "France", "Netherlands", "Ireland"].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" size="sm" onClick={() => setCheckoutStep(3)} disabled={!form.address || !form.city}>
                        Continue to Delivery
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Billing & Delivery */}
              <div className="border-x border-b overflow-hidden">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${checkoutStep === 3 ? "bg-primary/5" : "bg-muted/30 hover:bg-muted/50"}`}
                  onClick={() => setCheckoutStep(checkoutStep === 3 ? 0 : 3)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${deliveryMethod ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                      {deliveryMethod ? <Check className="h-3 w-3" /> : "3"}
                    </div>
                    <span className="font-semibold text-sm">Billing & Delivery</span>
                  </div>
                  {checkoutStep !== 3 && (
                    <span className="text-xs text-muted-foreground capitalize">{deliveryMethod === "pickup" ? "Click & Collect" : "Delivery"}</span>
                  )}
                </button>
                {checkoutStep === 3 && (
                  <div className="px-5 pb-5 pt-3 space-y-5 border-t">
                    {/* Billing */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Billing Address</h3>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="billing_same"
                          checked={form.billing_same}
                          onCheckedChange={(checked) => setForm(prev => ({ ...prev, billing_same: !!checked }))}
                        />
                        <label htmlFor="billing_same" className="text-sm cursor-pointer">Same as shipping address</label>
                      </div>
                      {!form.billing_same && (
                        <>
                          <div className="space-y-1.5">
                            <Label>Address</Label>
                            <Input value={form.billing_address} onChange={(e) => update("billing_address", e.target.value)} className="h-10" />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label>City</Label>
                              <Input value={form.billing_city} onChange={(e) => update("billing_city", e.target.value)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>ZIP Code</Label>
                              <Input value={form.billing_zip} onChange={(e) => update("billing_zip", e.target.value)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Country</Label>
                              <Input value={form.billing_country} onChange={(e) => update("billing_country", e.target.value)} className="h-10" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <Separator />

              {/* Delivery Method */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Delivery Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === "shipping" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <input type="radio" name="delivery" value="shipping" checked={deliveryMethod === "shipping"} onChange={() => setDeliveryMethod("shipping")} className="accent-primary" />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Delivery</p>
                      <p className="text-xs text-muted-foreground">Ship to your address</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <input type="radio" name="delivery" value="pickup" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} className="accent-primary" />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Click & Collect</p>
                      <p className="text-xs text-muted-foreground">Pick up in store — Free</p>
                    </div>
                  </label>

                  {/* Click & Collect Location Picker */}
                  {deliveryMethod === "pickup" && pickupLocations.length > 0 && (
                    <div className="col-span-2 mt-1 space-y-2">
                      <Label className="text-xs font-medium">Select Pickup Location</Label>
                      {pickupLocations.map((loc: any) => (
                        <label
                          key={loc.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            selectedPickupLocation === loc.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <input type="radio" name="pickup_location" value={loc.id} checked={selectedPickupLocation === loc.id} onChange={() => setSelectedPickupLocation(loc.id)} className="accent-primary" />
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> {loc.name}</p>
                            <p className="text-2xs text-muted-foreground">{loc.address || "Address not specified"} · <span className="capitalize">{loc.type}</span></p>
                          </div>
                        </label>
                      ))}
                      {selectedPickupLocation && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                          📍 You'll receive a notification when your order is ready for collection.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Split Shipping / Multi-Address */}
                {deliveryMethod === "shipping" && items.length > 1 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="split_shipping"
                      checked={splitShipping}
                      onCheckedChange={(checked) => setSplitShipping(!!checked)}
                    />
                    <label htmlFor="split_shipping" className="text-sm cursor-pointer flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Ship items to different addresses
                    </label>
                  </div>
                )}
                {splitShipping && deliveryMethod === "shipping" && (
                  <div className="space-y-3 mt-3 pl-4 border-l-2 border-primary/20">
                    {items.map((item, idx) => {
                      const key = `${item.product_id}-${item.variant_id || ""}`;
                      const addr = itemAddresses[key] || { address: "", city: "", zip: "", country: "" };
                      return (
                        <div key={key} className="border rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium">{item.title} × {item.quantity}</p>
                          <div className="space-y-1.5">
                            <Input placeholder="Address" value={addr.address} onChange={e => setItemAddresses(prev => ({ ...prev, [key]: { ...addr, address: e.target.value } }))} className="h-8 text-xs" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="City" value={addr.city} onChange={e => setItemAddresses(prev => ({ ...prev, [key]: { ...addr, city: e.target.value } }))} className="h-8 text-xs" />
                            <Input placeholder="ZIP" value={addr.zip} onChange={e => setItemAddresses(prev => ({ ...prev, [key]: { ...addr, zip: e.target.value } }))} className="h-8 text-xs" />
                            <Input placeholder="Country" value={addr.country} onChange={e => setItemAddresses(prev => ({ ...prev, [key]: { ...addr, country: e.target.value } }))} className="h-8 text-xs" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              {deliveryMethod === "shipping" && shippingZones.length > 0 && (
                <div className="border rounded-lg p-5 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Shipping Method</h2>
                  <div className="space-y-2">
                    {shippingZones.map((zone) => {
                      const isFree = zone.free_above && subtotalAfterDiscount >= Number(zone.free_above);
                      return (
                        <label
                          key={zone.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedZone === zone.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping_zone"
                              value={zone.id}
                              checked={selectedZone === zone.id}
                              onChange={() => handleZoneChange(zone.id)}
                              className="accent-primary"
                            />
                            <div>
                              <p className="text-sm font-medium">{zone.name}</p>
                              <p className="text-xs text-muted-foreground">{zone.regions}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isFree ? (
                              <div>
                                <span className="text-sm font-medium text-primary">Free</span>
                                <p className="text-2xs text-muted-foreground line-through">${Number(zone.flat_rate).toFixed(2)}</p>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">${Number(zone.flat_rate).toFixed(2)}</span>
                            )}
                            {zone.free_above && !isFree && (
                              <p className="text-2xs text-muted-foreground">Free over ${Number(zone.free_above).toFixed(0)}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Shipping Services for selected zone */}
                  {selectedZone && shippingServices.filter((s: any) => s.zone_id === selectedZone).length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs font-medium">Shipping Method</Label>
                      {shippingServices.filter((s: any) => s.zone_id === selectedZone).map((svc: any) => (
                        <label
                          key={svc.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            selectedServiceId === svc.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="shipping_service"
                              value={svc.id}
                              checked={selectedServiceId === svc.id}
                              onChange={() => handleServiceChange(svc.id)}
                              className="accent-primary"
                            />
                            <div>
                              <p className="text-sm font-medium">{svc.name}</p>
                              <p className="text-2xs text-muted-foreground">
                                {svc.carrier ? `${svc.carrier} · ` : ""}{svc.estimated_days_min}–{svc.estimated_days_max} business days
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Estimated Delivery */}
              {estimatedDelivery && deliveryMethod === "shipping" && (
                <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Estimated Delivery</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{estimatedDelivery}</p>
                </div>
              )}

              {/* Same-Day Delivery Option */}
              {sameDayAvailable && deliveryMethod === "shipping" && (
                <div className="border rounded-lg p-4 space-y-3">
                  <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${sameDaySelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={sameDaySelected} onCheckedChange={(v) => setSameDaySelected(!!v)} />
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-primary" /> Same-Day Delivery
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Order before {SAME_DAY_CUTOFF_HOUR > 12 ? SAME_DAY_CUTOFF_HOUR - 12 : SAME_DAY_CUTOFF_HOUR}:00 {SAME_DAY_CUTOFF_HOUR >= 12 ? "PM" : "AM"} for delivery today
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">+${SAME_DAY_FEE.toFixed(2)}</span>
                  </label>
                </div>
              )}

              {/* Shipping Insurance Option */}
              {deliveryMethod === "shipping" && (
                <div className="border rounded-lg p-4 space-y-3">
                  <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${shippingInsurance ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={shippingInsurance} onCheckedChange={(v) => setShippingInsurance(!!v)} />
                      <div>
                        <p className="text-sm font-medium">Shipping Insurance</p>
                        <p className="text-xs text-muted-foreground">Protect your order against loss, theft, or damage during shipping</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">+${insurancePremium.toFixed(2)}</span>
                  </label>
                </div>
              )}

              {upsellProducts.length > 0 && (
                <div className="border rounded-lg p-5 space-y-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> You might also like
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {upsellProducts.slice(0, 4).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{p.title}</p>
                          <p className="text-xs text-primary font-semibold">${Number(p.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Instructions */}
              {deliveryMethod === "shipping" && (
                <div className="border rounded-lg p-5 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery Instructions</h2>
                  <Textarea value={form.delivery_instructions} onChange={(e) => update("delivery_instructions", e.target.value)} placeholder="Leave at front door, ring doorbell, etc." className="min-h-[60px]" maxLength={300} />
                  <p className="text-xs text-muted-foreground">{form.delivery_instructions.length}/300 characters</p>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Signature Required</Label>
                      <p className="text-xs text-muted-foreground">Require signature on delivery</p>
                    </div>
                    <Checkbox checked={signatureRequired} onCheckedChange={(v) => { setSignatureRequired(!!v); if (v) setAuthorityToLeave(false); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Authority to Leave (ATL)</Label>
                      <p className="text-xs text-muted-foreground">Leave parcel without signature if no one is home</p>
                    </div>
                    <Checkbox checked={authorityToLeave} onCheckedChange={(v) => { setAuthorityToLeave(!!v); if (v) setSignatureRequired(false); }} />
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              <div className="border rounded-lg p-5 space-y-4">
                <h2 className="font-semibold">Additional Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Company Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <Input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Your company" />
                  </div>
                  <div>
                    <Label className="text-sm">PO Number <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <Input value={form.po_number} onChange={(e) => update("po_number", e.target.value)} placeholder="Purchase order #" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Special Requirements <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input value={form.custom_field_1} onChange={(e) => update("custom_field_1", e.target.value)} placeholder="Any special requirements..." />
                </div>
              </div>

              {/* Gift Message */}
              <div className="border rounded-lg p-5 space-y-4">
                <h2 className="font-semibold flex items-center gap-2"><Gift className="h-4 w-4" /> Gift Message</h2>
                <Textarea value={orderGiftMessage} onChange={(e) => setOrderGiftMessage(e.target.value)} placeholder="Add a personal gift message to include with your order..." className="min-h-[60px]" maxLength={500} />
                <p className="text-xs text-muted-foreground">{orderGiftMessage.length}/500 characters</p>
              </div>

              {/* Notes */}
              <div className="border rounded-lg p-5 space-y-4">
                <h2 className="font-semibold">Order Notes</h2>
                <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Special instructions or comments..." className="min-h-[80px]" />
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="border rounded-lg p-5 space-y-4 sticky top-20">
                {/* Cart Reservation Timer */}
                {timeLeft > 0 && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md ${timeLeft < 120 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <Timer className="h-3.5 w-3.5" />
                    <span>Cart reserved for {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
                  </div>
                )}
                {timeLeft <= 0 && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-destructive/10 text-destructive">
                    <Timer className="h-3.5 w-3.5" />
                    <span>Reservation expired — items may no longer be available</span>
                  </div>
                )}
                <h2 className="font-semibold">Order Summary</h2>
                <div className="space-y-3 divide-y">
                  {items.map((item) => (
                    <div key={`${item.product_id}-${item.variant_id}`} className="flex justify-between text-sm pt-2 first:pt-0">
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium ml-3">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono font-medium text-xs">{appliedCoupon.code}</span>
                      <span className="text-muted-foreground">
                        (-{appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value.toFixed(2)}`})
                      </span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-9 uppercase text-xs font-mono"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading} className="h-9 px-3 shrink-0">
                      {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Gift Voucher */}
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono font-medium text-xs">{appliedVoucher.code}</span>
                      <span className="text-muted-foreground">(-${appliedVoucher.amountUsed.toFixed(2)})</span>
                    </div>
                    <button type="button" onClick={removeVoucher} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Gift voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="h-9 uppercase text-xs font-mono"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyVoucher())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={applyVoucher} disabled={voucherLoading} className="h-9 px-3 shrink-0">
                      {voucherLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gift className="h-3 w-3" />}
                    </Button>
                  </div>
                )}

                {/* Gift Voucher Message */}
                {appliedVoucher && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1"><Gift className="h-3 w-3" /> Gift Message (optional)</Label>
                    <Textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Add a personal message to include with the gift voucher..."
                      className="min-h-[60px] text-xs"
                      maxLength={500}
                    />
                    <p className="text-2xs text-muted-foreground">{giftMessage.length}/500 characters</p>
                  </div>
                )}

                {/* Store Credit */}
                {storeCreditBalance > 0 && (
                  <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id="use_credit"
                        checked={useStoreCredit}
                        onCheckedChange={(checked) => setUseStoreCredit(!!checked)}
                      />
                      <label htmlFor="use_credit" className="text-xs cursor-pointer">
                        Use store credit (${storeCreditBalance.toFixed(2)})
                      </label>
                    </div>
                    {useStoreCredit && <span className="text-xs font-medium text-primary">-${storeCreditAmount.toFixed(2)}</span>}
                  </div>
                 )}

                 {/* Pay on Account (B2B) */}
                 {canPayOnAccount && (
                   <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                     <div className="flex items-center gap-2 text-sm">
                       <Checkbox
                         id="pay_on_account"
                         checked={payOnAccount}
                         onCheckedChange={(checked) => setPayOnAccount(!!checked)}
                       />
                       <label htmlFor="pay_on_account" className="text-xs cursor-pointer">
                         Pay on Account ({creditTerms})
                       </label>
                     </div>
                   </div>
                   )}

                   {/* Payment Method */}
                   <div className="space-y-2 bg-muted/50 rounded-md p-3">
                     <p className="text-xs font-medium">Payment Method</p>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name="payment_method" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="accent-primary" />
                          Credit/Debit Card
                        </label>
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name="payment_method" value="bank_transfer" checked={paymentMethod === "bank_transfer"} onChange={() => setPaymentMethod("bank_transfer")} className="accent-primary" />
                          Bank Transfer
                        </label>
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name="payment_method" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-primary" />
                          Cash on Delivery
                        </label>
                      </div>
                      {paymentMethod === "bank_transfer" && (
                        <div className="mt-2 p-3 bg-accent/50 rounded-md border border-border text-xs space-y-1.5">
                          <p className="font-medium text-foreground">Bank Transfer Details</p>
                          <p className="text-muted-foreground">Please transfer the total amount to:</p>
                          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                            <span>Bank:</span><span className="font-medium text-foreground">Commonwealth Bank</span>
                            <span>Account Name:</span><span className="font-medium text-foreground">Store Pty Ltd</span>
                            <span>BSB:</span><span className="font-medium text-foreground">062-000</span>
                            <span>Account No:</span><span className="font-medium text-foreground">1234 5678</span>
                            <span>Reference:</span><span className="font-medium text-foreground">Your Order Number</span>
                          </div>
                          <p className="text-muted-foreground italic">Your order will be processed once payment is confirmed (1-2 business days).</p>
                        </div>
                      )}
                    </div>

                    {/* Age Verification Gate */}
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                      <Checkbox
                        id="age_verify"
                        checked={ageVerified}
                        onCheckedChange={(checked) => setAgeVerified(!!checked)}
                      />
                      <label htmlFor="age_verify" className="text-xs cursor-pointer">
                        I confirm I am 18 years or older
                      </label>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                      <Checkbox
                        id="terms_accept"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                      />
                      <label htmlFor="terms_accept" className="text-xs cursor-pointer">
                        I agree to the <a href={`${basePath}/page/terms-of-service`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms & Conditions</a> and <a href={`${basePath}/page/privacy-policy`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>
                      </label>
                    </div>

                    <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{deliveryMethod === "pickup" ? "Pickup (Free)" : actualShipping > 0 ? `$${actualShipping.toFixed(2)}` : selectedZone ? "Free" : "Select method"}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {taxMode === "gst" ? "GST" : taxMode === "vat" ? "VAT" : "Tax"}
                      </span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {isTaxExempt && taxRate > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="text-xs">{taxMode === "gst" ? "GST" : taxMode === "vat" ? "VAT" : "Tax"} Exempt</span>
                      <span className="text-xs">-${(subtotalAfterDiscount * taxRate).toFixed(2)}</span>
                    </div>
                  )}
                  {voucherAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Gift Voucher</span>
                      <span>-${voucherAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {storeCreditAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Store Credit</span>
                      <span>-${storeCreditAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full h-11" disabled={submitting || !ageVerified || !termsAccepted}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Placing Order...</> : "Place Order"}
                </Button>
                {!ageVerified && <p className="text-[10px] text-muted-foreground text-center">Please confirm your age to proceed</p>}
                {!termsAccepted && ageVerified && <p className="text-[10px] text-muted-foreground text-center">Please accept the Terms & Conditions</p>}
              </div>
            </div>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  );
}
