import { useParams, Link } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import { useStoreSlug } from "@/lib/subdomain";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontCompare() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const { items, removeItem, clearAll } = useCompare();

  const rows = [
    { label: "Price", render: (p: any) => `$${Number(p.price).toFixed(2)}` },
    { label: "Original Price", render: (p: any) => p.compare_at_price ? `$${Number(p.compare_at_price).toFixed(2)}` : "—" },
    { label: "SKU", render: (p: any) => p.sku || "—" },
    { label: "Description", render: (p: any) => p.description ? (p.description.length > 120 ? p.description.slice(0, 120) + "..." : p.description) : "—" },
  ];

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={`${basePath}/products`}>
              <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-2xl font-bold">Compare Products</h1>
            <span className="text-sm text-muted-foreground">({items.length}/4)</span>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No products selected for comparison.</p>
            <Link to={`${basePath}/products`}>
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground p-3 w-32 border-b" />
                  {items.map((p) => (
                    <th key={p.id} className="p-3 border-b min-w-[200px]">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-6 w-6"
                          onClick={() => removeItem(p.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Link to={`${basePath}/product/${p.id}`}>
                          <div className="aspect-square w-full max-w-[160px] mx-auto rounded-lg overflow-hidden bg-muted border mb-3">
                            {p.images?.[0] ? (
                              <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-center hover:text-primary transition-colors line-clamp-2">{p.title}</p>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b">
                    <td className="p-3 text-sm font-medium text-muted-foreground">{row.label}</td>
                    {items.map((p) => (
                      <td key={p.id} className="p-3 text-sm">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
