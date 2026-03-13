import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export default function PrintBarcodeLabels() {
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    const load = async () => {
      let query = supabase.from("products").select("id, title, sku, barcode, price").eq("store_id", currentStore.id);
      if (ids.length > 0) {
        query = query.in("id", ids);
      } else {
        query = query.eq("status", "active").limit(50);
      }
      const { data } = await query;
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, [currentStore, searchParams]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Barcode Labels</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="p-4 print:p-0">
        <div className="grid grid-cols-3 gap-0 print:gap-0">
          {products.map(p => (
            <div key={p.id} className="border border-dashed p-3 text-center break-inside-avoid" style={{ minHeight: "100px" }}>
              <p className="text-xs font-medium truncate mb-1">{p.title}</p>
              {/* Barcode representation using CSS */}
              <div className="flex items-center justify-center gap-px my-2 h-10">
                {(p.barcode || p.sku || p.id.slice(0, 12)).split("").map((char: string, i: number) => (
                  <div
                    key={i}
                    className="bg-foreground"
                    style={{
                      width: `${(char.charCodeAt(0) % 3) + 1}px`,
                      height: "100%",
                      marginRight: `${(char.charCodeAt(0) % 2) + 1}px`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-mono tracking-wider">{p.barcode || p.sku || "—"}</p>
              <p className="text-xs font-semibold mt-0.5">${Number(p.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No products to generate labels for</p>
        )}
      </div>
    </div>
  );
}
