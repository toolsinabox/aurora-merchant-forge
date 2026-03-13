import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const { store_id, gateway, action, amount, currency, order_id, payment_method_id, customer_email, return_url, card_token, refund_id } = body;

    if (!store_id || !gateway || !action) {
      return new Response(JSON.stringify({ error: "store_id, gateway, and action required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get gateway config
    const { data: gw } = await supabase.from("payment_gateways").select("config, is_enabled, test_mode")
      .eq("store_id", store_id).eq("gateway_type", gateway).single();

    if (!gw?.is_enabled) {
      return new Response(JSON.stringify({ error: `${gateway} gateway not enabled` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = gw.config as Record<string, any>;
    const testMode = gw.test_mode;

    // ─── STRIPE ───
    if (gateway === "stripe") {
      const secretKey = testMode ? config.test_secret_key : config.secret_key;
      if (!secretKey) throw new Error("Stripe secret key not configured");

      const stripeUrl = "https://api.stripe.com/v1";
      const stripeHeaders = {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      };

      if (action === "create_payment_intent") {
        const params = new URLSearchParams({
          amount: String(Math.round((amount || 0) * 100)),
          currency: (currency || "aud").toLowerCase(),
          metadata: JSON.stringify({ order_id, store_id }),
        });
        if (payment_method_id) params.set("payment_method", payment_method_id);
        if (customer_email) params.set("receipt_email", customer_email);

        const res = await fetch(`${stripeUrl}/payment_intents`, {
          method: "POST", headers: stripeHeaders, body: params.toString(),
        });
        const data = await res.json();

        return new Response(JSON.stringify({
          client_secret: data.client_secret,
          payment_intent_id: data.id,
          status: data.status,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "confirm_payment") {
        const { payment_intent_id } = body;
        const res = await fetch(`${stripeUrl}/payment_intents/${payment_intent_id}/confirm`, {
          method: "POST", headers: stripeHeaders, body: "",
        });
        const data = await res.json();

        if (data.status === "succeeded" && order_id) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order_id);
          await supabase.from("order_payments").insert({
            order_id, store_id, amount, payment_method: "stripe",
            reference: payment_intent_id, recorded_by: "system",
          });
        }

        return new Response(JSON.stringify({ status: data.status, id: data.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "refund") {
        const { payment_intent_id, refund_amount } = body;
        const params = new URLSearchParams({ payment_intent: payment_intent_id });
        if (refund_amount) params.set("amount", String(Math.round(refund_amount * 100)));

        const res = await fetch(`${stripeUrl}/refunds`, {
          method: "POST", headers: stripeHeaders, body: params.toString(),
        });
        const data = await res.json();

        return new Response(JSON.stringify({ refund_id: data.id, status: data.status, amount: data.amount / 100 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "save_card") {
        // Create SetupIntent for saving card
        const params = new URLSearchParams({ usage: "off_session" });
        if (customer_email) {
          // Find or create Stripe customer
          const searchRes = await fetch(`${stripeUrl}/customers/search?query=email:'${customer_email}'`, { headers: stripeHeaders });
          const searchData = await searchRes.json();
          let customerId = searchData.data?.[0]?.id;
          if (!customerId) {
            const createRes = await fetch(`${stripeUrl}/customers`, {
              method: "POST", headers: stripeHeaders, body: new URLSearchParams({ email: customer_email }).toString(),
            });
            const createData = await createRes.json();
            customerId = createData.id;
          }
          params.set("customer", customerId);
        }

        const res = await fetch(`${stripeUrl}/setup_intents`, {
          method: "POST", headers: stripeHeaders, body: params.toString(),
        });
        const data = await res.json();

        return new Response(JSON.stringify({ client_secret: data.client_secret, setup_intent_id: data.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── PAYPAL ───
    if (gateway === "paypal") {
      const clientId = config.client_id;
      const clientSecret = config.client_secret;
      if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");

      const baseUrl = testMode ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

      // Get access token
      const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const authData = await authRes.json();
      const accessToken = authData.access_token;

      const ppHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

      if (action === "create_order") {
        const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
          method: "POST", headers: ppHeaders,
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
              amount: { currency_code: (currency || "AUD").toUpperCase(), value: String(amount) },
              reference_id: order_id,
            }],
            application_context: {
              return_url: return_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway`,
              cancel_url: return_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway`,
            },
          }),
        });
        const data = await res.json();
        const approveUrl = data.links?.find((l: any) => l.rel === "approve")?.href;

        return new Response(JSON.stringify({ paypal_order_id: data.id, approve_url: approveUrl, status: data.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "capture_order") {
        const { paypal_order_id } = body;
        const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypal_order_id}/capture`, {
          method: "POST", headers: ppHeaders,
        });
        const data = await res.json();

        if (data.status === "COMPLETED" && order_id) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order_id);
          await supabase.from("order_payments").insert({
            order_id, store_id, amount, payment_method: "paypal",
            reference: paypal_order_id, recorded_by: "system",
          });
        }

        return new Response(JSON.stringify({ status: data.status, id: data.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── SQUARE ───
    if (gateway === "square") {
      const accessToken = config.access_token;
      const locationId = config.location_id;
      if (!accessToken) throw new Error("Square access token not configured");

      const baseUrl = testMode ? "https://connect.squareupsandbox.com/v2" : "https://connect.squareup.com/v2";
      const sqHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

      if (action === "create_payment") {
        const res = await fetch(`${baseUrl}/payments`, {
          method: "POST", headers: sqHeaders,
          body: JSON.stringify({
            source_id: card_token || "cnon:card-nonce-ok",
            idempotency_key: crypto.randomUUID(),
            amount_money: { amount: Math.round((amount || 0) * 100), currency: (currency || "AUD").toUpperCase() },
            location_id: locationId,
            reference_id: order_id,
          }),
        });
        const data = await res.json();

        if (data.payment?.status === "COMPLETED" && order_id) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order_id);
          await supabase.from("order_payments").insert({
            order_id, store_id, amount, payment_method: "square",
            reference: data.payment.id, recorded_by: "system",
          });
        }

        return new Response(JSON.stringify({ payment_id: data.payment?.id, status: data.payment?.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── eWAY ───
    if (gateway === "eway") {
      const apiKey = config.api_key;
      const apiPassword = config.api_password;
      if (!apiKey || !apiPassword) throw new Error("eWAY credentials not configured");

      const baseUrl = testMode ? "https://api.sandbox.ewaypayments.com" : "https://api.ewaypayments.com";
      const ewayAuth = `Basic ${btoa(`${apiKey}:${apiPassword}`)}`;

      if (action === "create_payment") {
        const res = await fetch(`${baseUrl}/Transaction`, {
          method: "POST",
          headers: { Authorization: ewayAuth, "Content-Type": "application/json" },
          body: JSON.stringify({
            Payment: { TotalAmount: Math.round((amount || 0) * 100), CurrencyCode: currency || "AUD" },
            TransactionType: "Purchase",
            Method: "ProcessPayment",
            Customer: { Email: customer_email },
            RedirectUrl: return_url || "",
          }),
        });
        const data = await res.json();

        if (data.TransactionStatus && order_id) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order_id);
          await supabase.from("order_payments").insert({
            order_id, store_id, amount, payment_method: "eway",
            reference: data.TransactionID, recorded_by: "system",
          });
        }

        return new Response(JSON.stringify({
          transaction_id: data.TransactionID,
          status: data.TransactionStatus ? "completed" : "failed",
          redirect_url: data.SharedPaymentUrl,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── BRAINTREE ───
    if (gateway === "braintree") {
      const { merchant_id, public_key, private_key } = config;
      if (!merchant_id || !private_key) throw new Error("Braintree credentials not configured");

      const baseUrl = testMode
        ? `https://api.sandbox.braintreegateway.com/merchants/${merchant_id}`
        : `https://api.braintreegateway.com/merchants/${merchant_id}`;
      const btAuth = `Basic ${btoa(`${public_key}:${private_key}`)}`;

      if (action === "client_token") {
        const res = await fetch(`${baseUrl}/client_token`, {
          method: "POST",
          headers: { Authorization: btAuth, "Content-Type": "application/xml" },
          body: "<client-token><version>2</version></client-token>",
        });
        const text = await res.text();
        const tokenMatch = text.match(/<value>(.*?)<\/value>/);

        return new Response(JSON.stringify({ client_token: tokenMatch?.[1] || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "create_transaction") {
        const { nonce } = body;
        const xml = `<transaction>
          <type>sale</type>
          <amount>${amount}</amount>
          <payment-method-nonce>${nonce || "fake-valid-nonce"}</payment-method-nonce>
          <order-id>${order_id || ""}</order-id>
          <options><submit-for-settlement>true</submit-for-settlement></options>
        </transaction>`;

        const res = await fetch(`${baseUrl}/transactions`, {
          method: "POST",
          headers: { Authorization: btAuth, "Content-Type": "application/xml" },
          body: xml,
        });
        const text = await res.text();
        const idMatch = text.match(/<id>(.*?)<\/id>/);
        const statusMatch = text.match(/<status>(.*?)<\/status>/);

        if (statusMatch?.[1] === "submitted_for_settlement" && order_id) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order_id);
          await supabase.from("order_payments").insert({
            order_id, store_id, amount, payment_method: "braintree",
            reference: idMatch?.[1], recorded_by: "system",
          });
        }

        return new Response(JSON.stringify({ transaction_id: idMatch?.[1], status: statusMatch?.[1] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── AFTERPAY ───
    if (gateway === "afterpay") {
      const { merchant_id, secret_key: merchantSecret } = config;
      if (!merchant_id || !merchantSecret) throw new Error("Afterpay credentials not configured");

      const baseUrl = testMode ? "https://global-api-sandbox.afterpay.com/v2" : "https://global-api.afterpay.com/v2";
      const apAuth = `Basic ${btoa(`${merchant_id}:${merchantSecret}`)}`;

      if (action === "create_checkout") {
        const res = await fetch(`${baseUrl}/checkouts`, {
          method: "POST",
          headers: { Authorization: apAuth, "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: { amount: String(amount), currency: currency || "AUD" },
            consumer: { email: customer_email },
            merchant: {
              redirectConfirmUrl: return_url || "",
              redirectCancelUrl: return_url || "",
            },
            merchantReference: order_id,
          }),
        });
        const data = await res.json();

        return new Response(JSON.stringify({ token: data.token, redirectCheckoutUrl: data.redirectCheckoutUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "capture") {
        const { afterpay_token } = body;
        const res = await fetch(`${baseUrl}/payments/capture`, {
          method: "POST",
          headers: { Authorization: apAuth, "Content-Type": "application/json" },
          body: JSON.stringify({ token: afterpay_token }),
        });
        const data = await res.json();

        if (data.status === "APPROVED" && order_id) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order_id);
          await supabase.from("order_payments").insert({
            order_id, store_id, amount, payment_method: "afterpay",
            reference: data.id, recorded_by: "system",
          });
        }

        return new Response(JSON.stringify({ payment_id: data.id, status: data.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: `Unknown gateway '${gateway}' or action '${action}'` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
