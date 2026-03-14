import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MaropostRequest {
  action: string;
  store_domain: string;
  api_key: string;
  filter?: Record<string, unknown>;
  page?: number;
  limit?: number;
  scan_mode?: boolean; // Use minimal output selectors for fast counting
}

const ACTION_MAP: Record<string, string> = {
  test_connection: 'GetItem',
  get_products: 'GetItem',
  get_categories: 'GetCategory',
  get_orders: 'GetOrder',
  get_customers: 'GetCustomer',
  get_content: 'GetContent',
  get_currency: 'GetCurrency',
  get_shipping: 'GetShippingMethods',
  get_suppliers: 'GetSupplier',
  get_vouchers: 'GetVoucher',
  get_rma: 'GetRma',
  get_payments: 'GetPayment',
  get_warehouses: 'GetWarehouse',
};

// Minimal selectors for scanning/counting (fast, small response)
const SCAN_SELECTORS: Record<string, string[]> = {
  get_products: ["ID", "Name", "ParentSKU"],
  get_categories: ["CategoryID", "CategoryName"],
  get_customers: ["Username", "EmailAddress"],
  get_orders: ["OrderID", "GrandTotal"],
  get_content: ["ContentID", "ContentName"],
  test_connection: ["ID", "Name", "Model"],
};

// Full selectors for actual data import
const OUTPUT_SELECTORS: Record<string, string[]> = {
  get_products: [
    "ParentSKU", "ID", "Brand", "Model", "Name", "PrimarySupplier",
    "Approved", "IsActive", "FreeGifts", "CrossSellProducts", "UpsellProducts",
    "PriceGroups", "ItemLength", "ItemWidth", "ItemHeight", "ShippingLength",
    "ShippingWidth", "ShippingHeight", "ShippingWeight", "CubicWeight",
    "WarehouseQuantity", "WarehouseLocations", "CommittedQuantity",
    "AvailableSellQuantity", "ItemSpecifics", "Categories", "AccountingCode",
    "Images", "VariantInventory", "DefaultPrice", "PromotionPrice",
    "DateAdded", "DateUpdated", "Description", "Features",
    "Specifications", "Warranty", "TermsAndConditions", "SEOPageTitle",
    "SEOMetaDescription", "SEOPageHeading", "ProductURL", "AutomaticURL",
    "SortOrder", "RRP", "CostPrice", "UnitOfMeasure", "BaseUnitOfMeasure",
    "BaseUnitQuantity", "QuantityPerScan", "BuyUnitQuantity", "SellUnitQuantity",
    "PreorderQuantity", "PickPriority", "PickZone", "TaxCategory", "TaxFreeItem",
    "TaxInclusive", "SearchKeywords", "ShortDescription", "Tags",
    "Type", "SubType", "CustomLabel", "CustomContent",
    "ContentFileIdentifier", "eBayProductIDs"
  ],
  get_categories: [
    "CategoryID", "CategoryName", "ParentCategoryID", "Active",
    "SortOrder", "OnSiteMap", "OnMenu", "AllowFiltering",
    "ExternalSource", "ExternalReference1", "ExternalReference2", "ExternalReference3",
    "CategoryReference", "ShortDescription", "Description",
    "ContentFileIdentifier", "SEOPageTitle", "SEOPageHeading",
    "SEOMetaDescription", "SEOMetaKeywords"
  ],
  get_orders: [
    "OrderID", "ShippingOption", "DeliveryInstruction", "Username",
    "Email", "ShipAddress", "BillAddress", "CustomerRef1", "CustomerRef2",
    "SalesChannel", "GrandTotal", "TaxTotal", "SurchargeTotal",
    "ShippingTotal", "DiscountTotal", "CashPayments", "ChequePayments",
    "Status", "InternalOrderNotes", "OrderLine", "OrderPayment",
    "DateRequired", "DateInvoiced", "DatePaid", "DateCompleted",
    "DatePosted", "DatePlaced", "DateUpdated"
  ],
  get_customers: [
    "Username", "Email", "EmailAddress", "Name", "Surname", "CompanyName",
    "Phone", "Fax", "Mobile", "ABN", "Active",
    "DateAdded", "DateUpdated", "Type", "IdentificationType",
    "IdentificationDetails", "NewsletterSubscriber", "BillingAddress",
    "ShippingAddress", "CustomerLog", "UserGroup", "AccountBalance",
    "AvailableCredit", "OnCreditHold", "CreditLimit"
  ],
  get_content: [
    "ContentID", "ContentName", "ContentReference", "ContentType",
    "Active", "SortOrder", "OnSiteMap", "OnMenu",
    "ParentContentID", "ShortDescription", "Description",
    "Author", "ContentFileIdentifier", "SEOPageTitle",
    "SEOPageHeading", "SEOMetaDescription", "SEOMetaKeywords",
    "DatePosted", "DateUpdated"
  ],
  test_connection: ["ID", "Name", "Model"],
};

// Max page sizes per entity (Maropost has response size limits with large OutputSelectors)
const MAX_PAGE_SIZE: Record<string, number> = {
  get_products: 20,    // Products have 60+ fields, must keep small
  get_categories: 200,
  get_customers: 100,
  get_orders: 50,      // Orders include line items, medium size
  get_content: 100,
  get_vouchers: 100,
  get_suppliers: 100,
  get_rma: 100,
  get_payments: 100,
  get_warehouses: 100,
  get_shipping: 100,
  get_currency: 100,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, store_domain, api_key, filter, page = 0, limit = 100 }: MaropostRequest = await req.json();

    if (!store_domain || !api_key) {
      return new Response(JSON.stringify({ error: "store_domain and api_key are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const netoAction = ACTION_MAP[action];
    if (!netoAction) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the Maropost API request
    const outputSelector = OUTPUT_SELECTORS[action] || OUTPUT_SELECTORS.test_connection;
    
    // Maropost API requires specific filter keys per entity type to return data
    // Without these, the API returns empty arrays
    const DEFAULT_FILTERS: Record<string, Record<string, unknown>> = {
      get_products: { IsActive: ["True"] },
      get_categories: { Active: ["True"] },
      get_customers: { DateAddedFrom: "2000-01-01 00:00:00", DateAddedTo: "2030-01-01 00:00:00" },
      get_orders: { DatePlacedFrom: "2000-01-01 00:00:00", DatePlacedTo: "2030-01-01 00:00:00" },
      get_content: { Active: ["True"] },
      get_vouchers: { DateAddedFrom: "2000-01-01 00:00:00", DateAddedTo: "2030-01-01 00:00:00" },
      get_suppliers: { DateAddedFrom: "2000-01-01 00:00:00", DateAddedTo: "2030-01-01 00:00:00" },
      get_rma: { DateIssuedFrom: "2000-01-01 00:00:00", DateIssuedTo: "2030-01-01 00:00:00" },
      get_payments: { DatePaidFrom: "2000-01-01 00:00:00", DatePaidTo: "2030-01-01 00:00:00" },
      get_warehouses: { WarehouseID: ["1","2","3","4","5","6","7","8","9","10"] },
      get_shipping: {},
      get_currency: {},
    };

    const defaultFilter = DEFAULT_FILTERS[action] || {};
    const mergedFilter = { ...defaultFilter, ...filter };

    const requestBody: Record<string, unknown> = {
      Filter: {
        ...mergedFilter,
        Page: String(page),
        Limit: String(limit),
        OutputSelector: outputSelector,
      },
    };

    // For test_connection, just get 1 product to verify credentials
    if (action === 'test_connection') {
      requestBody.Filter = {
        Limit: "1",
        Page: "0",
        IsActive: ["True"],
        OutputSelector: ["ID", "Name", "Model"],
      };
    }

    // Ensure domain has protocol
    const domain = store_domain.startsWith('http') ? store_domain : `https://${store_domain}`;
    const apiUrl = `${domain}/do/WS/NetoAPI`;

    console.log(`Maropost API call: ${netoAction} to ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'NETOAPI_ACTION': netoAction,
        'NETOAPI_KEY': api_key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Maropost API returned ${response.status}`,
        details: data,
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For test_connection, return a simplified response
    if (action === 'test_connection') {
      const isConnected = !data.Messages || data.Messages.Error === undefined;
      return new Response(JSON.stringify({
        connected: isConnected,
        store_domain,
        data: isConnected ? data : null,
        error: isConnected ? null : data.Messages,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Maropost migration error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
