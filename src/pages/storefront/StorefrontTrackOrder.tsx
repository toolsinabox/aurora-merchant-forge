import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Truck, CheckCircle2, Clock, XCircle, ExternalLink, MapPin } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function OrderTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-2">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {STATUS_STEPS.map((step, idx) => {
        const isComplete = idx <= activeIdx;
        const isCurrent = idx === activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center gap-1.5 min-w-[80px] ${isComplete ? "text-primary" : "text-muted-foreground/40"}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isCurrent ? "bg-primary text-primary-foreground" : isComplete ? "bg-primary/15" : "bg-muted"}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs text-center leading-tight ${isCurrent ? "font-semibold" : ""}`}>{step.label}</span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 ${idx < activeIdx ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StorefrontTrackOrder() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath, storeSlug } = useStoreSlug(paramSlug);
  const [orderNum, setOrderNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => s && setStore(s));
  }, [storeSlug]);

  const { data: activeTheme } = useActiveTheme(store?.id);

  const themeHtml = useMemo(() => {
    if (!activeTheme || !store) return null;
    const templateFile =
      findMainThemeFile(activeTheme, "track-order") ||
      findMainThemeFile(activeTheme, "track_order") ||
      findMainThemeFile(activeTheme, "order-tracking");
    if (!templateFile?.content) return null;

    const themeFilesMap: Record<string, string> = {};
    activeTheme.files.forEach(f => { themeFilesMap[f.file_path] = f.content || ""; });
    const themeAssetBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}`;

    const ctx: TemplateContext = {
      store,
      basePath,
      pageType: "track-order",
      order: order || undefined,
      themeFiles: themeFilesMap,
      themeAssetBaseUrl,
      includes: buildIncludesMap(activeTheme),
      content: { title: "Track Your Order" },
    };

    let html = renderTemplate(templateFile.content, ctx);
    html = html.replace(/(src|href)="(?!https?:\/\/|\/\/|\/|#|data:)([^"]+)"/gi,
      (_, attr, path) => `${attr}="${themeAssetBaseUrl}/${path}"`);
    return html;
  }, [activeTheme, store, order, basePath]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = orderNum.trim();
    if (!query) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, fulfillment_status, created_at, total, shipping_address, items_count")
      .eq("order_number", query)
      .maybeSingle();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setOrder(data);

    const { data: ships } = await supabase
      .from("order_shipments")
      .select("*")
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });
    setShipments(ships || []);
    setLoading(false);
  };

  // Theme rendering is display-only; interactive tracking uses React fallback
  if (themeHtml && !order) {
    return (
      <StorefrontLayout>
        <div dangerouslySetInnerHTML={{ __html: themeHtml }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Package className="h-10 w-10 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold mb-1">Track Your Order</h1>
          <p className="text-muted-foreground text-sm">Enter your order number to see the latest status.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            placeholder="e.g. ORD-M1ABC23"
            value={orderNum}
            onChange={(e) => setOrderNum(e.target.value)}
            className="h-11 font-mono uppercase"
          />
          <Button type="submit" className="h-11 px-6" disabled={loading}>
            {loading ? "Searching..." : <><Search className="h-4 w-4 mr-1.5" /> Track</>}
          </Button>
        </form>

        {notFound && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No order found with that number. Please check and try again.</p>
          </div>
        )}

        {order && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.items_count} item{order.items_count !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-lg font-semibold">${Number(order.total).toFixed(2)}</p>
              </div>

              <Separator />

              <OrderTracker status={order.status} />

              <div className="flex gap-2">
                <StatusBadge status={order.payment_status} />
                <StatusBadge status={order.fulfillment_status} />
              </div>

              {order.shipping_address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{order.shipping_address}</span>
                </div>
              )}

              {shipments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> Shipments</h3>
                    <div className="space-y-3">
                      {shipments.map((s: any) => (
                        <div key={s.id} className="border rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{s.shipment_number}</span>
                            <StatusBadge status={s.status} />
                          </div>
                          {s.carrier && <p className="text-xs text-muted-foreground">{s.carrier}</p>}
                          {s.tracking_number && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono text-xs">{s.tracking_number}</span>
                              {s.tracking_url && (
                                <a href={s.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-0.5">
                                  Track <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                          {s.shipped_at && <p className="text-xs text-muted-foreground">Shipped {new Date(s.shipped_at).toLocaleDateString()}</p>}
                          {s.delivered_at && <p className="text-xs text-muted-foreground">Delivered {new Date(s.delivered_at).toLocaleDateString()}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </StorefrontLayout>
  );
}
