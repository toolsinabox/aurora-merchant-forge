import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Plus, Puzzle, Download, Trash2, Settings, Search, Zap } from "lucide-react";
import { toast } from "sonner";

interface Addon {
  id: string;
  addon_key: string;
  name: string;
  description: string;
  addon_type: string;
  version: string;
  author: string;
  icon_url: string | null;
  category?: string;
  is_free?: boolean;
  price?: number;
  install_count?: number;
  // installed state
  is_installed?: boolean;
  is_active?: boolean;
  config?: Record<string, any>;
}

const typeColors: Record<string, string> = {
  custom_panel: "bg-primary/10 text-primary",
  integration: "bg-blue-500/10 text-blue-600",
  shipping: "bg-amber-500/10 text-amber-600",
  pricing: "bg-emerald-500/10 text-emerald-600",
  accounting: "bg-purple-500/10 text-purple-600",
  data_feed: "bg-cyan-500/10 text-cyan-600",
};

export default function Addons() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"catalog" | "installed">("catalog");
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);

  // Catalog (available add-ons)
  const { data: catalog = [] } = useQuery({
    queryKey: ["addon_catalog"],
    queryFn: async () => {
      const { data } = await supabase.from("addon_catalog" as any).select("*").order("name");
      return (data || []) as unknown as Addon[];
    },
  });

  // Installed add-ons
  const { data: installed = [] } = useQuery({
    queryKey: ["store_addons", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("store_addons" as any).select("*").eq("store_id", storeId).order("name");
      return (data || []) as unknown as Addon[];
    },
    enabled: !!storeId,
  });

  const installedKeys = new Set(installed.map(a => a.addon_key));

  const installAddon = useMutation({
    mutationFn: async (addon: Addon) => {
      if (!storeId) throw new Error("No store");
      const { error } = await supabase.from("store_addons" as any).insert({
        store_id: storeId,
        addon_key: addon.addon_key,
        name: addon.name,
        description: addon.description,
        addon_type: addon.addon_type,
        version: addon.version,
        author: addon.author,
        icon_url: addon.icon_url,
        is_installed: true,
        is_active: true,
        installed_at: new Date().toISOString(),
      });
      if (error) throw error;
      // Increment install count
      await supabase.from("addon_catalog" as any).update({ install_count: (addon.install_count || 0) + 1 }).eq("id", addon.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_addons"] });
      qc.invalidateQueries({ queryKey: ["addon_catalog"] });
      toast.success("Add-on installed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const uninstallAddon = useMutation({
    mutationFn: async (addonId: string) => {
      const { error } = await supabase.from("store_addons" as any).delete().eq("id", addonId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_addons"] });
      toast.success("Add-on uninstalled");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = async (addon: Addon) => {
    await supabase.from("store_addons" as any).update({ is_active: !addon.is_active }).eq("id", addon.id);
    qc.invalidateQueries({ queryKey: ["store_addons"] });
    toast.success(addon.is_active ? "Add-on disabled" : "Add-on enabled");
  };

  const filteredCatalog = catalog.filter(a =>
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.description || "").toLowerCase().includes(search.toLowerCase()))
  );

  const filteredInstalled = installed.filter(a =>
    (!search || a.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add-Ons</h1>
            <p className="text-muted-foreground">Extend your store with plugins and integrations</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{installed.length} installed</Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search add-ons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1 border rounded-md p-0.5">
            <Button size="sm" variant={tab === "catalog" ? "default" : "ghost"} onClick={() => setTab("catalog")} className="text-xs h-8">
              <Package className="h-3.5 w-3.5 mr-1" /> Marketplace ({catalog.length})
            </Button>
            <Button size="sm" variant={tab === "installed" ? "default" : "ghost"} onClick={() => setTab("installed")} className="text-xs h-8">
              <Puzzle className="h-3.5 w-3.5 mr-1" /> Installed ({installed.length})
            </Button>
          </div>
        </div>

        {tab === "catalog" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(addon => (
              <Card key={addon.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{addon.name}</CardTitle>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${typeColors[addon.addon_type] || "bg-muted text-muted-foreground"}`}>
                        {addon.addon_type.replace("_", " ")}
                      </span>
                    </div>
                    {addon.is_free ? (
                      <Badge variant="secondary" className="text-[10px]">Free</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">${(addon.price || 0).toFixed(2)}/mo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground mb-3">{addon.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{addon.author} · v{addon.version} · {addon.install_count || 0} installs</span>
                    {installedKeys.has(addon.addon_key) ? (
                      <Badge variant="default" className="text-[10px]">Installed ✓</Badge>
                    ) : (
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => installAddon.mutate(addon)}>
                        <Download className="h-3 w-3" /> Install
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "installed" && (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Add-On</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstalled.map(addon => (
                    <TableRow key={addon.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{addon.name}</p>
                          <p className="text-xs text-muted-foreground">{addon.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[addon.addon_type] || "bg-muted"}`}>
                          {addon.addon_type.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{addon.version}</TableCell>
                      <TableCell>
                        <Switch checked={addon.is_active} onCheckedChange={() => toggleActive(addon)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedAddon(addon); setConfigOpen(true); }}>
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => uninstallAddon.mutate(addon.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInstalled.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No add-ons installed. Browse the Marketplace to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Config Dialog */}
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure: {selectedAddon?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <p><span className="text-muted-foreground">Key:</span> {selectedAddon?.addon_key}</p>
                <p><span className="text-muted-foreground">Version:</span> {selectedAddon?.version}</p>
                <p><span className="text-muted-foreground">Author:</span> {selectedAddon?.author}</p>
                <p><span className="text-muted-foreground">Type:</span> {selectedAddon?.addon_type}</p>
              </div>
              <p className="text-xs text-muted-foreground">Configuration options for this add-on will appear here when the integration is fully connected.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
