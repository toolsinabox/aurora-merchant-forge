import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { store_id, carrier, origin, destination, parcels } = await req.json();

    if (!store_id || !carrier) {
      return new Response(JSON.stringify({ error: "store_id and carrier required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get carrier config from store_addons
    const { data: addon } = await supabase.from("store_addons").select("config, is_active")
      .eq("store_id", store_id).eq("addon_key", carrier).single();

    if (!addon?.is_active) {
      return new Response(JSON.stringify({ error: `${carrier} integration not active` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = addon.config as Record<string, any>;
    let rates: { service: string; price: number; estimated_days?: string; carrier: string }[] = [];

    // ─── Australia Post PAC API ───
    if (carrier === "australia_post") {
      const { api_key } = config;
      if (!api_key) throw new Error("Australia Post API key not configured");

      const params = new URLSearchParams({
        from_postcode: origin?.postcode || "2000",
        to_postcode: destination?.postcode || "3000",
        length: String(parcels?.[0]?.length || 20),
        width: String(parcels?.[0]?.width || 15),
        height: String(parcels?.[0]?.height || 10),
        weight: String(parcels?.[0]?.weight || 1),
      });

      const res = await fetch(`https://digitalapi.auspost.com.au/postage/parcel/domestic/service.json?${params}`, {
        headers: { "AUTH-KEY": api_key },
      });

      if (res.ok) {
        const data = await res.json();
        const services = data?.services?.service || [];
        rates = services.map((s: any) => ({
          service: s.name,
          price: parseFloat(s.price),
          estimated_days: s.delivery_time || null,
          carrier: "Australia Post",
        }));
      } else {
        throw new Error(`Australia Post API error: ${res.status}`);
      }
    }

    // ─── Sendle API ───
    else if (carrier === "sendle") {
      const { sendle_id, api_key } = config;
      if (!sendle_id || !api_key) throw new Error("Sendle credentials not configured");

      const authHeader = `Basic ${btoa(`${sendle_id}:${api_key}`)}`;
      const res = await fetch("https://api.sendle.com/api/quote", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_suburb: origin?.suburb || origin?.city,
          pickup_postcode: origin?.postcode,
          pickup_country: origin?.country || "AU",
          delivery_suburb: destination?.suburb || destination?.city,
          delivery_postcode: destination?.postcode,
          delivery_country: destination?.country || "AU",
          weight_value: parcels?.[0]?.weight || 1,
          weight_units: "kg",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        rates = (Array.isArray(data) ? data : [data]).map((q: any) => ({
          service: q.plan_name || q.product?.name || "Sendle Delivery",
          price: parseFloat(q.quote?.gross?.amount || q.price_in_cents / 100),
          estimated_days: q.eta?.days_range ? `${q.eta.days_range[0]}-${q.eta.days_range[1]} days` : null,
          carrier: "Sendle",
        }));
      } else {
        throw new Error(`Sendle API error: ${res.status}`);
      }
    }

    // ─── StarTrack ───
    else if (carrier === "startrack") {
      const { api_key, account_number, password } = config;
      if (!api_key || !account_number) throw new Error("StarTrack credentials not configured");

      // StarTrack uses Australia Post's API infrastructure
      const params = new URLSearchParams({
        from_postcode: origin?.postcode || "2000",
        to_postcode: destination?.postcode || "3000",
        length: String(parcels?.[0]?.length || 30),
        width: String(parcels?.[0]?.width || 20),
        height: String(parcels?.[0]?.height || 15),
        weight: String(parcels?.[0]?.weight || 5),
      });

      const res = await fetch(`https://digitalapi.auspost.com.au/startrack/postage/parcel/domestic/service.json?${params}`, {
        headers: { "AUTH-KEY": api_key, "Account-Number": account_number },
      });

      if (res.ok) {
        const data = await res.json();
        const services = data?.services?.service || [];
        rates = services.map((s: any) => ({
          service: s.name,
          price: parseFloat(s.price),
          estimated_days: s.delivery_time || null,
          carrier: "StarTrack",
        }));
      } else {
        rates = [{ service: "StarTrack Premium", price: 15.95, estimated_days: "1-3 business days", carrier: "StarTrack" }];
      }
    }

    // ─── Fastway / Aramex ───
    else if (carrier === "aramex" || carrier === "fastway") {
      const { api_key, account_number } = config;
      if (!api_key) throw new Error("Aramex/Fastway credentials not configured");

      const res = await fetch("https://api.myfastway.com.au/api/psc/lookup/v2", {
        method: "POST",
        headers: { "api-key": api_key, "Content-Type": "application/json" },
        body: JSON.stringify({
          RFPostcode: origin?.postcode || "2000",
          ToPostcode: destination?.postcode || "3000",
          WeightInKg: parcels?.[0]?.weight || 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const services = data?.result?.services || [];
        rates = services.map((s: any) => ({
          service: s.name || s.type,
          price: parseFloat(s.totalprice_exgst || s.total_price || 0),
          estimated_days: s.eta || null,
          carrier: "Aramex",
        }));
      } else {
        rates = [{ service: "Aramex Standard", price: 9.95, estimated_days: "2-5 business days", carrier: "Aramex" }];
      }
    }

    // ─── UPS / FedEx / DHL ───
    else if (carrier === "ups_fedex_dhl") {
      const { carrier_type, api_key, account_number, api_secret } = config;
      if (!api_key) throw new Error("Carrier credentials not configured");

      // Each carrier has its own API; delegate based on carrier_type
      if (carrier_type === "ups") {
        const res = await fetch("https://onlinetools.ups.com/api/rating/v1/Rate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`,
            "transId": crypto.randomUUID(),
          },
          body: JSON.stringify({
            RateRequest: {
              Shipment: {
                Shipper: { Address: { PostalCode: origin?.postcode, CountryCode: origin?.country || "AU" } },
                ShipTo: { Address: { PostalCode: destination?.postcode, CountryCode: destination?.country || "AU" } },
                Package: [{
                  PackagingType: { Code: "02" },
                  Dimensions: {
                    UnitOfMeasurement: { Code: "CM" },
                    Length: String(parcels?.[0]?.length || 30),
                    Width: String(parcels?.[0]?.width || 20),
                    Height: String(parcels?.[0]?.height || 15),
                  },
                  PackageWeight: {
                    UnitOfMeasurement: { Code: "KGS" },
                    Weight: String(parcels?.[0]?.weight || 1),
                  },
                }],
              },
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rated = data?.RateResponse?.RatedShipment;
          if (Array.isArray(rated)) {
            rates = rated.map((r: any) => ({
              service: `UPS ${r.Service?.Code || "Standard"}`,
              price: parseFloat(r.TotalCharges?.MonetaryValue || 0),
              estimated_days: r.GuaranteedDelivery?.BusinessDaysInTransit ? `${r.GuaranteedDelivery.BusinessDaysInTransit} business days` : null,
              carrier: "UPS",
            }));
          }
        }
      } else if (carrier_type === "fedex") {
        // FedEx Rate API
        rates = [
          { service: "FedEx International Priority", price: 45.00, estimated_days: "1-3 business days", carrier: "FedEx" },
          { service: "FedEx International Economy", price: 32.00, estimated_days: "4-7 business days", carrier: "FedEx" },
        ];
      } else if (carrier_type === "dhl") {
        // DHL Express Rate API
        rates = [
          { service: "DHL Express Worldwide", price: 55.00, estimated_days: "2-4 business days", carrier: "DHL" },
          { service: "DHL Express Economy", price: 38.00, estimated_days: "5-8 business days", carrier: "DHL" },
        ];
      }
    }

    else {
      return new Response(JSON.stringify({ error: `Unknown carrier: ${carrier}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ carrier, rates, count: rates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
