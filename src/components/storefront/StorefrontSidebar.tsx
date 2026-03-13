import { Link } from "react-router-dom";
import { ChevronRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface StorefrontSidebarProps {
  basePath: string;
  categories: Category[];
  activeSlug?: string;
  recentlyViewed?: { slug: string; name: string; image?: string; price?: number }[];
  tags?: string[];
}

export function StorefrontSidebar({ basePath, categories, activeSlug, recentlyViewed, tags }: StorefrontSidebarProps) {
  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <aside className="space-y-6">
      {/* Category Navigation */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Categories</h3>
        <nav className="space-y-0.5">
          <Link
            to={`${basePath}/products`}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              !activeSlug ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Products
          </Link>
          {parentCategories.map(cat => {
            const children = getChildren(cat.id);
            const isActive = activeSlug === cat.slug;
            return (
              <div key={cat.id}>
                <Link
                  to={`${basePath}/products?category=${cat.slug}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.name}</span>
                  {children.length > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                </Link>
                {children.length > 0 && (
                  <div className="ml-4 space-y-0.5">
                    {children.map(child => (
                      <Link
                        key={child.id}
                        to={`${basePath}/products?category=${child.slug}`}
                        className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
                          activeSlug === child.slug ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Tags Cloud */}
      {tags && tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Popular Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <Link key={tag} to={`${basePath}/products?tag=${tag}`}>
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Recently Viewed</h3>
          <div className="space-y-2">
            {recentlyViewed.slice(0, 5).map(product => (
              <Link
                key={product.slug}
                to={`${basePath}/product/${product.slug}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors group"
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">?</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{product.name}</p>
                  {product.price != null && (
                    <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
