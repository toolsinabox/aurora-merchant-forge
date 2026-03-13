import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, action, order_ids, date_from, date_to } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get accounting config
    const { data: addon } = await supabase.from("store_addons").select("addon_key, config, is_active")
      .eq("store_id", store_id).in("addon_key", ["xero", "myob", "quickbooks"]).eq("is_active", true).limit(1).single();

    if (!addon?.is_active) {
      return new Response(JSON.stringify({ error: "No active accounting integration" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = addon.config as Record<string, any>;
    const provider = addon.addon_key;

    // ─── Xero ───
    if (provider === "xero") {
      const { client_id, client_secret, access_token, tenant_id } = config;
      if (!access_token || !tenant_id) throw new Error("Xero OAuth credentials incomplete. Please re-authorize.");

      const xeroHeaders = {
        Authorization: `Bearer ${access_token}`,
        "xero-tenant-id": tenant_id,
        "Content-Type": "application/json",
      };

      if (action === "sync_invoices") {
        // Fetch completed orders to sync
        let query = supabase.from("orders").select("*, order_items(*)").eq("store_id", store_id).eq("payment_status", "paid");
        if (order_ids?.length) query = query.in("id", order_ids);
        if (date_from) query = query.gte("created_at", date_from);
        if (date_to) query = query.lte("created_at", date_to);
        const { data: orders } = await query.limit(100);

        if (!orders?.length) {
          return new Response(JSON.stringify({ synced: 0, message: "No orders to sync" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let synced = 0;
        let errors = 0;

        for (const order of orders) {
          try {
            const lineItems = ((order as any).order_items || []).map((item: any) => ({
              Description: item.title,
              Quantity: item.quantity,
              UnitAmount: item.unit_price,
              AccountCode: "200", // Sales revenue account
              TaxType: "OUTPUT",
            }));

            const invoice = {
              Type: "ACCREC",
              Contact: { Name: (order as any).shipping_name || `Order ${(order as any).order_number}` },
              Date: (order as any).created_at?.split("T")[0],
              DueDate: (order as any).created_at?.split("T")[0],
              Reference: (order as any).order_number,
              Status: "AUTHORISED",
              LineItems: lineItems,
              CurrencyCode: (order as any).currency || "AUD",
            };

            const res = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
              method: "POST",
              headers: xeroHeaders,
              body: JSON.stringify({ Invoices: [invoice] }),
            });

            if (res.ok) synced++;
            else errors++;
          } catch { errors++; }
        }

        return new Response(JSON.stringify({ synced, errors, total: orders.length, provider: "xero" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "sync_payments") {
        const { data: payments } = await supabase.from("order_payments").select("*, orders!inner(order_number, store_id)")
          .eq("orders.store_id", store_id).limit(100);

        let synced = 0;
        for (const payment of payments || []) {
          try {
            const res = await fetch("https://api.xero.com/api.xro/2.0/Payments", {
              method: "PUT",
              headers: xeroHeaders,
              body: JSON.stringify({
                Payments: [{
                  Invoice: { InvoiceNumber: (payment as any).orders?.order_number },
                  Account: { Code: "090" },
                  Date: (payment as any).created_at?.split("T")[0],
                  Amount: (payment as any).amount,
                  Reference: (payment as any).reference || (payment as any).payment_method,
                }],
              }),
            });
            if (res.ok) synced++;
          } catch {}
        }

        return new Response(JSON.stringify({ synced, total: payments?.length || 0, provider: "xero" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "get_accounts") {
        const res = await fetch("https://api.xero.com/api.xro/2.0/Accounts", { headers: xeroHeaders });
        if (res.ok) {
          const data = await res.json();
          return new Response(JSON.stringify({ accounts: data.Accounts?.map((a: any) => ({ code: a.Code, name: a.Name, type: a.Type })) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Xero API error: ${res.status}`);
      }
    }

    // ─── MYOB ───
    else if (provider === "myob") {
      const { api_key, company_file_uri, access_token } = config;
      if (!access_token || !company_file_uri) throw new Error("MYOB credentials incomplete");

      if (action === "sync_invoices") {
        let query = supabase.from("orders").select("*, order_items(*)").eq("store_id", store_id).eq("payment_status", "paid");
        if (order_ids?.length) query = query.in("id", order_ids);
        const { data: orders } = await query.limit(100);

        let synced = 0;
        for (const order of orders || []) {
          try {
            const res = await fetch(`${company_file_uri}/Sale/Invoice/Item`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${access_token}`,
                "x-myobapi-key": api_key,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                Number: (order as any).order_number,
                Date: (order as any).created_at,
                Customer: { DisplayID: (order as any).customer_id },
                Lines: ((order as any).order_items || []).map((item: any) => ({
                  Description: item.title,
                  ShipQuantity: item.quantity,
                  UnitPrice: item.unit_price,
                  Total: item.total,
                })),
              }),
            });
            if (res.ok) synced++;
          } catch {}
        }

        return new Response(JSON.stringify({ synced, total: orders?.length || 0, provider: "myob" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── QuickBooks Online ───
    else if (provider === "quickbooks") {
      const { access_token, realm_id } = config;
      if (!access_token || !realm_id) throw new Error("QuickBooks credentials incomplete");

      const qbHeaders = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const baseUrl = `https://quickbooks.api.intuit.com/v3/company/${realm_id}`;

      if (action === "sync_invoices") {
        let query = supabase.from("orders").select("*, order_items(*)").eq("store_id", store_id).eq("payment_status", "paid");
        if (order_ids?.length) query = query.in("id", order_ids);
        const { data: orders } = await query.limit(100);

        let synced = 0;
        for (const order of orders || []) {
          try {
            const res = await fetch(`${baseUrl}/invoice?minorversion=65`, {
              method: "POST",
              headers: qbHeaders,
              body: JSON.stringify({
                DocNumber: (order as any).order_number,
                TxnDate: (order as any).created_at?.split("T")[0],
                Line: ((order as any).order_items || []).map((item: any, i: number) => ({
                  LineNum: i + 1,
                  Amount: item.total,
                  DetailType: "SalesItemLineDetail",
                  Description: item.title,
                  SalesItemLineDetail: {
                    Qty: item.quantity,
                    UnitPrice: item.unit_price,
                  },
                })),
                CustomerRef: { value: "1" },
                CurrencyRef: { value: (order as any).currency || "AUD" },
              }),
            });
            if (res.ok) synced++;
          } catch {}
        }

        return new Response(JSON.stringify({ synced, total: orders?.length || 0, provider: "quickbooks" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: sync_invoices, sync_payments, get_accounts" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
