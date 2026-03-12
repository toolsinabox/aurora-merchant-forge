import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockCategories, type Category } from "@/lib/mock-data";
import { Plus, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function CategoryItem({ category, depth = 0 }: { category: Category; depth?: number }) {
  const hasChildren = category.children && category.children.length > 0;

  if (!hasChildren) {
    return (
      <div
        className="flex items-center justify-between py-2 px-3 text-xs hover:bg-muted/50 rounded-md cursor-pointer"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2">
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{category.name}</span>
        </div>
        <span className="text-muted-foreground text-2xs">{category.productCount} products</span>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full">
        <div
          className="flex items-center justify-between py-2 px-3 text-xs hover:bg-muted/50 rounded-md cursor-pointer"
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform data-[state=open]:rotate-90" />
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{category.name}</span>
          </div>
          <span className="text-muted-foreground text-2xs">{category.productCount} products</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {category.children!.map((child) => (
          <CategoryItem key={child.id} category={child} depth={depth + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Categories() {
  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Categories</h1>
            <p className="text-xs text-muted-foreground">Organize products into categories</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Category</Button>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Category Tree</CardTitle></CardHeader>
          <CardContent className="p-2">
            {mockCategories.map((cat) => (
              <CategoryItem key={cat.id} category={cat} />
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
