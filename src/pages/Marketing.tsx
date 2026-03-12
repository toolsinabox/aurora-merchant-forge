import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Marketing() {
  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Marketing</h1>
          <p className="text-xs text-muted-foreground">Campaigns, discounts, and promotions</p>
        </div>
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Campaigns</CardTitle></CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-xs text-muted-foreground">No campaigns yet. Create your first email campaign or promotion.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
