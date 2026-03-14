import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, RefreshCw, ExternalLink, Settings2, Unplug, Plug, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MARKETPLACES = [
  { key: "ebay", name: "eBay", logo: "🏷️", description: "List and sell on eBay with automated sync", fields: ["app_id", "cert_id", "dev_id", "auth_token"] },
  { key: "amazon", name: "Amazon", logo: "📦", description: "Sell on Amazon with product and order sync", fields: ["seller_id", "mws_auth_token", "marketplace_id"] },
  { key: "catch", name: "Catch", logo: "🛒", description: "Australia's leading online marketplace", fields: ["api_key", "api_secret", "seller_id"] },
  { key: "google_shopping", name: "Google Shopping", logo: "🔍", description: "Product listings on Google Shopping", fields: ["merchant_id", "api_key"] },
  { key: "facebook_shop", name: "Facebook Shop", logo: "📘", description: "Sell directly on Facebook and Instagram", fields: ["page_id", "access_token", "catalog_id"] },
  { key: "trade_me", name: "Trade Me", logo: "🇳🇿", description: "New Zealand's largest online marketplace", fields: ["consumer_key", "consumer_secret", "oauth_token", "oauth_secret"] },
];

export default function Marketplaces() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [configDialog, setConfigDialog] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["marketplace_connections", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_connections" as any)
        .select("*")
        .eq("store_id", storeId!);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["marketplace_listings", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_listings" as any)
        .select("*, products:product_id(title, sku, price)")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const connectMutation = useMutation({
    mutationFn: async ({ marketplace, creds }: { marketplace: string; creds: Record<string, string> }) => {
      const existing = connections.find((c: any) => c.marketplace === marketplace);
      if (existing) {
        const { error } = await supabase.from("marketplace_connections" as any)
          .update({ credentials: creds, is_active: true, sync_status: "connected" })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const mp = MARKETPLACES.find(m => m.key === marketplace);
        const { error } = await supabase.from("marketplace_connections" as any)
          .insert({ store_id: storeId, marketplace, account_name: mp?.name, credentials: creds, is_active: true, sync_status: "connected" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace_connections"] });
      setConfigDialog(null);
      setCredentials({});
      toast.success("Marketplace connected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketplace_connections" as any)
        .update({ is_active: false, sync_status: "disconnected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace_connections"] });
      toast.success("Marketplace disconnected");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase.from("marketplace_connections" as any)
        .update({ sync_status: "syncing", last_sync_at: new Date().toISOString() }).eq("id", connectionId);
      if (error) throw error;
      // In production, this would trigger the marketplace-sync edge function
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace_connections"] });
      toast.success("Sync initiated");
    },
  });

  const getConnection = (key: string) => connections.find((c: any) => c.marketplace === key);

  const statusBadge = (status: string) => {
    switch (status) {
      case "connected": return <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case "syncing": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px]"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      case "error": return <Badge variant="destructive" className="text-[10px]"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default: return <Badge variant="outline" className="text-[10px]"><Unplug className="h-3 w-3 mr-1" />Disconnected</Badge>;
    }
  };

  const currentMp = MARKETPLACES.find(m => m.key === configDialog);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Marketplaces</h1>
          <p className="text-xs text-muted-foreground">Connect and sync products to external sales channels</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Connected</p>
            <p className="text-xl font-bold text-primary">{connections.filter((c: any) => c.is_active).length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Total Listings</p>
            <p className="text-xl font-bold">{connections.reduce((s: number, c: any) => s + (c.total_listings || 0), 0)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Active Listings</p>
            <p className="text-xl font-bold">{listings.filter((l: any) => l.status === "active").length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Sync Errors</p>
            <p className="text-xl font-bold text-destructive">{listings.filter((l: any) => l.sync_error).length}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="channels">
          <TabsList>
            <TabsTrigger value="channels">Sales Channels</TabsTrigger>
            <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-3 mt-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MARKETPLACES.map(mp => {
                const conn = getConnection(mp.key);
                const isConnected = conn?.is_active;
                return (
                  <Card key={mp.key} className={isConnected ? "border-primary/30" : ""}>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{mp.logo}</span>
                          <div>
                            <p className="text-sm font-medium">{mp.name}</p>
                            <p className="text-[10px] text-muted-foreground">{mp.description}</p>
                          </div>
                        </div>
                        {conn && statusBadge(conn.sync_status)}
                      </div>
                      {conn?.last_sync_at && (
                        <p className="text-[10px] text-muted-foreground">Last sync: {new Date(conn.last_sync_at).toLocaleString()}</p>
                      )}
                      {conn?.error_message && (
                        <p className="text-[10px] text-destructive">{conn.error_message}</p>
                      )}
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => syncMutation.mutate(conn.id)}>
                              <RefreshCw className="h-3 w-3 mr-1" />Sync
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setConfigDialog(mp.key); setCredentials(conn.credentials || {}); }}>
                              <Settings2 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => disconnectMutation.mutate(conn.id)}>
                              <Unplug className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" className="text-xs flex-1" onClick={() => { setConfigDialog(mp.key); setCredentials(conn?.credentials || {}); }}>
                            <Plug className="h-3 w-3 mr-1" />Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-3">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">SKU</TableHead>
                      <TableHead className="text-xs">Marketplace</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">External ID</TableHead>
                      <TableHead className="text-xs">Last Synced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No marketplace listings yet. Connect a marketplace and sync products.</TableCell></TableRow>
                    ) : listings.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs font-medium">{l.products?.title || "—"}</TableCell>
                        <TableCell className="text-xs">{l.products?.sku || "—"}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">{MARKETPLACES.find(m => {
                            const conn = connections.find((c: any) => c.id === l.connection_id);
                            return conn?.marketplace === m.key;
                          })?.name || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={l.status === "active" ? "default" : l.status === "error" ? "destructive" : "outline"} className="text-[10px]">{l.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {l.external_listing_id ? (
                            <span className="flex items-center gap-1">
                              {l.external_listing_id.substring(0, 12)}...
                              {l.external_url && <a href={l.external_url} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3" /></a>}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.last_synced_at ? new Date(l.last_synced_at).toLocaleString() : "Never"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Config Dialog */}
      <Dialog open={!!configDialog} onOpenChange={o => { if (!o) { setConfigDialog(null); setCredentials({}); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{currentMp?.logo}</span> Configure {currentMp?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {currentMp?.fields.map(field => (
              <div key={field}>
                <Label className="text-xs capitalize">{field.replace(/_/g, " ")}</Label>
                <Input
                  type={field.includes("token") || field.includes("secret") || field.includes("key") ? "password" : "text"}
                  value={credentials[field] || ""}
                  onChange={e => setCredentials(c => ({ ...c, [field]: e.target.value }))}
                  placeholder={`Enter ${field.replace(/_/g, " ")}`}
                />
              </div>
            ))}
            <Button
              className="w-full"
              onClick={() => configDialog && connectMutation.mutate({ marketplace: configDialog, creds: credentials })}
              disabled={connectMutation.isPending}
            >
              {getConnection(configDialog || "")?.is_active ? "Update Configuration" : "Connect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
