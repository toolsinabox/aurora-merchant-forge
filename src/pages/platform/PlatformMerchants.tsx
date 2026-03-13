import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Store, ExternalLink, Ban, CheckCircle2, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const PLAN_DEFAULTS: Record<string, any> = {
  free: { products: 50, orders_per_month: 100, staff: 2, storage_mb: 500 },
  basic: { products: 500, orders_per_month: 1000, staff: 5, storage_mb: 2000 },
  pro: { products: 5000, orders_per_month: 10000, staff: 20, storage_mb: 10000 },
  enterprise: { products: -1, orders_per_month: -1, staff: -1, storage_mb: 50000 },
};

const TIERS = ["free", "basic", "pro", "enterprise"] as const;

function useAllStores() {
  return useQuery({
    queryKey: ["platform-all-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function PlatformMerchants() {
  const { data: stores = [], isLoading } = useAllStores();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const updateStore = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("stores").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-all-stores"] });
      toast.success("Store updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = stores.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.slug || "").toLowerCase().includes(search.toLowerCase())
  );

  const [planStore, setPlanStore] = useState<any>(null);
  const [planLimits, setPlanLimits] = useState<any>({});

  const openPlanEditor = (store: any) => {
    setPlanStore(store);
    setPlanLimits(store.plan_limits || PLAN_DEFAULTS[store.plan || "free"] || PLAN_DEFAULTS.free);
  };

  const savePlanLimits = () => {
    if (!planStore) return;
    updateStore.mutate({ id: planStore.id, updates: { plan_limits: planLimits } });
    setPlanStore(null);
  };

  return (
    <PlatformLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Merchant Management</h1>
          <p className="text-xs text-muted-foreground">{stores.length} registered stores</p>
        </div>

        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or slug…"
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-2xs">
                    <TableHead>Store</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        No merchants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s: any) => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={s.logo_url || undefined} />
                              <AvatarFallback className="text-2xs">{s.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              {s.contact_email && <p className="text-2xs text-muted-foreground">{s.contact_email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.slug ? (
                            <Badge variant="secondary" className="text-2xs font-mono">{s.slug}</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={s.subscription_tier || "free"}
                            onValueChange={(val) => updateStore.mutate({ id: s.id, updates: { subscription_tier: val } })}
                          >
                            <SelectTrigger className="h-7 w-24 text-2xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIERS.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {s.is_suspended ? (
                            <Badge variant="destructive" className="text-2xs">Suspended</Badge>
                          ) : (
                            <Badge variant="default" className="text-2xs bg-chart-2 hover:bg-chart-2/90">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.currency}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(s.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {s.slug && (
                              <Link to={`/store/${s.slug}`} target="_blank">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="View Storefront">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={s.is_suspended ? "Reactivate" : "Suspend"}
                              onClick={() => updateStore.mutate({
                                id: s.id,
                                updates: {
                                  is_suspended: !s.is_suspended,
                                  suspended_reason: s.is_suspended ? null : "Suspended by platform admin",
                                },
                              })}
                            >
                              {s.is_suspended ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                              ) : (
                                <Ban className="h-3.5 w-3.5 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
