import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Save, Users, UserPlus, Mail, Trash2, Clock, CheckCircle, XCircle, Key, Search, Copy } from "lucide-react";

const ROLES = ["owner", "admin", "manager", "staff", "warehouse", "readonly"];
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary text-primary-foreground",
  admin: "bg-destructive text-destructive-foreground",
  manager: "bg-warning text-warning-foreground",
  staff: "bg-secondary text-secondary-foreground",
  warehouse: "bg-accent text-accent-foreground",
  readonly: "bg-muted text-muted-foreground",
};

const RESOURCES = [
  "products", "orders", "customers", "inventory", "categories",
  "coupons", "gift_vouchers", "returns", "shipping", "tax",
  "content_pages", "media", "reviews", "marketing", "reports",
  "settings", "webhooks", "api_keys", "staff", "price_lists",
  "purchase_orders", "suppliers", "loyalty",
];

const RESOURCE_GROUPS: Record<string, string[]> = {
  "Catalog": ["products", "categories", "price_lists"],
  "Sales": ["orders", "customers", "coupons", "gift_vouchers", "returns", "loyalty"],
  "Inventory": ["inventory", "purchase_orders", "suppliers"],
  "Shipping & Tax": ["shipping", "tax"],
  "Content": ["content_pages", "media", "reviews"],
  "Marketing": ["marketing"],
  "System": ["reports", "settings", "webhooks", "api_keys", "staff"],
};

type Permission = { resource: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };

const DEFAULT_PERMS: Record<string, (r: string) => Permission> = {
  owner: (r) => ({ resource: r, can_view: true, can_create: true, can_edit: true, can_delete: true }),
  admin: (r) => ({ resource: r, can_view: true, can_create: true, can_edit: true, can_delete: r !== "staff" && r !== "settings" }),
  manager: (r) => ({ resource: r, can_view: true, can_create: !["settings", "webhooks", "api_keys", "staff"].includes(r), can_edit: !["settings", "webhooks", "api_keys", "staff"].includes(r), can_delete: false }),
  staff: (r) => ({ resource: r, can_view: !["settings", "webhooks", "api_keys", "staff"].includes(r), can_create: ["orders", "customers"].includes(r), can_edit: ["orders"].includes(r), can_delete: false }),
  warehouse: (r) => ({ resource: r, can_view: ["products", "inventory", "orders", "purchase_orders", "suppliers", "shipping"].includes(r), can_create: ["inventory"].includes(r), can_edit: ["inventory", "orders"].includes(r), can_delete: false }),
  readonly: (r) => ({ resource: r, can_view: true, can_create: false, can_edit: false, can_delete: false }),
};

export default function RolePermissions() {
  const { currentStore, user } = useAuth();
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState("staff");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [search, setSearch] = useState("");

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

  const { data: members = [] } = useQuery({
    queryKey: ["store_members", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase.from("store_members" as any).select("*").eq("store_id", currentStore.id);
      return data || [];
    },
    enabled: !!currentStore,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles_lookup"],
    queryFn: async () => {
      const ids = (members as any[]).map((m: any) => m.user_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
      return data || [];
    },
    enabled: (members as any[]).length > 0,
  });

  const profileMap = new Map((profiles as any[]).map((p: any) => [p.user_id, p]));

  const matrix: Permission[] = RESOURCES.map(resource => {
    const saved = (permissions as any[]).find((p: any) => p.resource === resource);
    if (saved) return { resource, can_view: saved.can_view, can_create: saved.can_create, can_edit: saved.can_edit, can_delete: saved.can_delete };
    return (DEFAULT_PERMS[selectedRole] || DEFAULT_PERMS.staff)(resource);
  });

  const [local, setLocal] = useState<Permission[]>(matrix);

  useEffect(() => {
    setLocal(matrix);
  }, [permissions, selectedRole]);

  const togglePerm = (resource: string, field: keyof Permission) => {
    setLocal(prev => prev.map(p => p.resource === resource ? { ...p, [field]: !p[field] } : p));
  };

  const toggleGroupAll = (resources: string[], field: "can_view" | "can_create" | "can_edit" | "can_delete", value: boolean) => {
    setLocal(prev => prev.map(p => resources.includes(p.resource) ? { ...p, [field]: value } : p));
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!currentStore) return;
      const rows = local.map(p => ({
        store_id: currentStore.id, role: selectedRole, resource: p.resource,
        can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("role_permissions" as any).delete().eq("store_id", currentStore.id).eq("role", selectedRole);
      const { error } = await supabase.from("role_permissions" as any).insert(rows);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["role_permissions"] }); toast.success("Permissions saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleInvite = async () => {
    if (!inviteEmail || !currentStore) return;
    toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
    setShowInvite(false); setInviteEmail("");
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    await supabase.from("store_members" as any).delete().eq("id", memberId);
    qc.invalidateQueries({ queryKey: ["store_members"] });
    toast.success("Member removed");
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    await supabase.from("store_members" as any).update({ role: newRole }).eq("id", memberId);
    qc.invalidateQueries({ queryKey: ["store_members"] });
    toast.success("Role updated");
  };

  const filteredResources = search
    ? RESOURCES.filter(r => r.includes(search.toLowerCase()))
    : RESOURCES;

  const roleStats = ROLES.map(r => ({
    role: r,
    count: (members as any[]).filter((m: any) => m.role === r).length,
  }));

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Staff & Permissions</h1>
            <p className="text-xs text-muted-foreground">Manage team members and configure role-based access control</p>
          </div>
        </div>

        <Tabs defaultValue="members">
          <TabsList className="h-8">
            <TabsTrigger value="members" className="text-xs h-7">Team ({(members as any[]).length})</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs h-7">Permissions</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs h-7">Role Overview</TabsTrigger>
          </TabsList>

          {/* Team Members Tab */}
          <TabsContent value="members" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Manage who has access to your store admin panel</p>
              <Button size="sm" className="gap-1" onClick={() => setShowInvite(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Invite Member
              </Button>
            </div>

            {/* Role Stats */}
            <div className="flex gap-2">
              {roleStats.filter(r => r.count > 0).map(r => (
                <Badge key={r.role} variant="outline" className="text-[10px] gap-1 capitalize">
                  {r.role}: {r.count}
                </Badge>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                {(members as any[]).length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No team members yet. Invite your first member.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Member</TableHead>
                        <TableHead className="text-xs h-8">Role</TableHead>
                        <TableHead className="text-xs h-8">Joined</TableHead>
                        <TableHead className="text-xs h-8">Status</TableHead>
                        <TableHead className="text-xs h-8 w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(members as any[]).map((m: any) => {
                        const profile = profileMap.get(m.user_id);
                        const isCurrentUser = m.user_id === user?.id;
                        return (
                          <TableRow key={m.id} className="text-xs">
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {(profile?.display_name || m.user_id)?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="font-medium">{profile?.display_name || m.user_id?.slice(0, 8)}</p>
                                  {isCurrentUser && <Badge variant="outline" className="text-[9px] ml-1">You</Badge>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              {isCurrentUser ? (
                                <Badge className={`text-[10px] capitalize ${ROLE_COLORS[m.role] || ""}`}>{m.role}</Badge>
                              ) : (
                                <Select value={m.role} onValueChange={v => updateMemberRole(m.id, v)}>
                                  <SelectTrigger className="h-6 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {ROLES.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-muted-foreground">
                              <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(m.created_at).toLocaleDateString()}</div>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <CheckCircle className="h-2.5 w-2.5 text-success" /> Active
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              {!isCurrentUser && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeMember(m.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-xs">Role:</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedRole === "owner" && <Badge variant="secondary" className="text-[10px]">Full access — cannot be restricted</Badge>}
                <div className="relative ml-4">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-8 h-8 text-xs w-40" placeholder="Filter resources..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={() => save.mutate()} disabled={save.isPending || selectedRole === "owner"}>
                <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving..." : "Save Permissions"}
              </Button>
            </div>

            {Object.entries(RESOURCE_GROUPS).map(([group, resources]) => {
              const groupResources = resources.filter(r => filteredResources.includes(r));
              if (groupResources.length === 0) return null;
              const groupPerms = local.filter(p => groupResources.includes(p.resource));

              return (
                <Card key={group}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group}</CardTitle>
                      {selectedRole !== "owner" && (
                        <div className="flex gap-3 text-[10px] text-muted-foreground">
                          {(["can_view", "can_create", "can_edit", "can_delete"] as const).map(f => {
                            const allChecked = groupPerms.every(p => p[f]);
                            return (
                              <button key={f} className="hover:text-foreground transition-colors" onClick={() => toggleGroupAll(groupResources, f, !allChecked)}>
                                {allChecked ? "✓" : "○"} {f.replace("can_", "")}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs h-7 w-40 pl-4">Resource</TableHead>
                          <TableHead className="text-xs h-7 text-center w-16">View</TableHead>
                          <TableHead className="text-xs h-7 text-center w-16">Create</TableHead>
                          <TableHead className="text-xs h-7 text-center w-16">Edit</TableHead>
                          <TableHead className="text-xs h-7 text-center w-16">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupPerms.map(p => (
                          <TableRow key={p.resource} className="text-xs">
                            <TableCell className="py-1.5 capitalize font-medium pl-4">{p.resource.replace(/_/g, " ")}</TableCell>
                            {(["can_view", "can_create", "can_edit", "can_delete"] as const).map(f => (
                              <TableCell key={f} className="py-1.5 text-center">
                                <Checkbox checked={p[f]} onCheckedChange={() => togglePerm(p.resource, f)} disabled={selectedRole === "owner"} />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Role Overview Tab */}
          <TabsContent value="roles" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Compare default permissions across all roles at a glance</p>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(role => {
                const perms = RESOURCES.map(r => (DEFAULT_PERMS[role] || DEFAULT_PERMS.staff)(r));
                const viewCount = perms.filter(p => p.can_view).length;
                const createCount = perms.filter(p => p.can_create).length;
                const editCount = perms.filter(p => p.can_edit).length;
                const deleteCount = perms.filter(p => p.can_delete).length;
                const memberCount = (members as any[]).filter((m: any) => m.role === role).length;

                return (
                  <Card key={role} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${ROLE_COLORS[role]}`} />
                    <CardContent className="p-4 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold capitalize text-sm">{role}</h3>
                        <Badge variant="outline" className="text-[10px]">{memberCount} member{memberCount !== 1 ? "s" : ""}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-success" /> View: {viewCount}/{RESOURCES.length}</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary" /> Create: {createCount}/{RESOURCES.length}</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-warning" /> Edit: {editCount}/{RESOURCES.length}</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-destructive" /> Delete: {deleteCount}/{RESOURCES.length}</div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-[10px] text-muted-foreground">
                          {role === "owner" && "Full unrestricted access to everything"}
                          {role === "admin" && "Full access except staff/settings deletion"}
                          {role === "manager" && "View all, create/edit most, no system access"}
                          {role === "staff" && "View most, create orders & customers only"}
                          {role === "warehouse" && "Inventory, orders, shipping, and suppliers only"}
                          {role === "readonly" && "View-only access across all resources"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Email Address</Label>
              <Input className="h-8 text-xs mt-1" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="team@example.com" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.filter(r => r !== "owner").map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground">An invitation email will be sent. The member must accept to gain access.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button size="sm" onClick={handleInvite} className="gap-1"><Mail className="h-3 w-3" /> Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
