import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Save } from "lucide-react";

const ROLES = ["owner", "admin", "staff"];
const RESOURCES = [
  "products", "orders", "customers", "inventory", "categories",
  "coupons", "gift_vouchers", "returns", "shipping", "tax",
  "content_pages", "media", "reviews", "marketing", "reports",
  "settings", "webhooks", "api_keys", "staff",
];

type Permission = { resource: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };

export default function RolePermissions() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState("staff");

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role_permissions", currentStore?.id, selectedRole],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("role_permissions" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .eq("role", selectedRole);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  // Build matrix: all resources, with saved values or defaults
  const matrix: Permission[] = RESOURCES.map(resource => {
    const saved = (permissions as any[]).find((p: any) => p.resource === resource);
    if (saved) return { resource, can_view: saved.can_view, can_create: saved.can_create, can_edit: saved.can_edit, can_delete: saved.can_delete };
    // Defaults: owner gets everything, admin gets most, staff gets view only
    if (selectedRole === "owner") return { resource, can_view: true, can_create: true, can_edit: true, can_delete: true };
    if (selectedRole === "admin") return { resource, can_view: true, can_create: true, can_edit: true, can_delete: false };
    return { resource, can_view: true, can_create: false, can_edit: false, can_delete: false };
  });

  const [local, setLocal] = useState<Permission[]>(matrix);

  useEffect(() => {
    setLocal(matrix);
  }, [permissions, selectedRole]);

  const togglePerm = (resource: string, field: keyof Permission) => {
    setLocal(prev => prev.map(p => p.resource === resource ? { ...p, [field]: !p[field] } : p));
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!currentStore) return;
      // Upsert all permissions for this role
      const rows = local.map(p => ({
        store_id: currentStore.id,
        role: selectedRole,
        resource: p.resource,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
        updated_at: new Date().toISOString(),
      }));
      // Delete existing then insert (simpler than upsert with composite key)
      await supabase.from("role_permissions" as any).delete().eq("store_id", currentStore.id).eq("role", selectedRole);
      const { error } = await supabase.from("role_permissions" as any).insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
      toast.success("Permissions saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Role Permissions</h1>
            <p className="text-xs text-muted-foreground">Configure granular access control per role</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs">Role:</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedRole === "owner" && (
            <Badge variant="secondary" className="text-[10px]">Owners have full access by default</Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-40">Resource</TableHead>
                  <TableHead className="text-xs h-8 text-center w-20">View</TableHead>
                  <TableHead className="text-xs h-8 text-center w-20">Create</TableHead>
                  <TableHead className="text-xs h-8 text-center w-20">Edit</TableHead>
                  <TableHead className="text-xs h-8 text-center w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : (
                  local.map(p => (
                    <TableRow key={p.resource} className="text-xs">
                      <TableCell className="py-2 capitalize font-medium">{p.resource.replace(/_/g, " ")}</TableCell>
                      <TableCell className="py-2 text-center">
                        <Checkbox checked={p.can_view} onCheckedChange={() => togglePerm(p.resource, "can_view")} disabled={selectedRole === "owner"} />
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Checkbox checked={p.can_create} onCheckedChange={() => togglePerm(p.resource, "can_create")} disabled={selectedRole === "owner"} />
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Checkbox checked={p.can_edit} onCheckedChange={() => togglePerm(p.resource, "can_edit")} disabled={selectedRole === "owner"} />
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Checkbox checked={p.can_delete} onCheckedChange={() => togglePerm(p.resource, "can_delete")} disabled={selectedRole === "owner"} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
