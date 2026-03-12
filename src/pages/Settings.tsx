import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUpdateStore, useTaxRates, useCreateTaxRate, useDeleteTaxRate,
  useShippingZones, useCreateShippingZone, useDeleteShippingZone, useTeamMembers,
} from "@/hooks/use-data";
import { Save, Plus, Trash2, Mail, Palette, Type, Layout, Paintbrush } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { currentStore, user } = useAuth();
  const updateStore = useUpdateStore();
  const { data: taxRates = [], isLoading: loadingTax } = useTaxRates();
  const createTaxRate = useCreateTaxRate();
  const deleteTaxRate = useDeleteTaxRate();
  const { data: shippingZones = [], isLoading: loadingShipping } = useShippingZones();
  const createShippingZone = useCreateShippingZone();
  const deleteShippingZone = useDeleteShippingZone();
  const { data: team = [], isLoading: loadingTeam } = useTeamMembers();

  const [storeForm, setStoreForm] = useState({
    name: currentStore?.name || "",
    contact_email: user?.email || "",
    currency: currentStore?.currency || "USD",
    timezone: currentStore?.timezone || "America/New_York",
  });

  // Branding state
  const [brandForm, setBrandForm] = useState({
    primary_color: "#2563eb",
    banner_text: "",
    description: "",
    logo_url: "",
  });
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);

  // Theme builder state
  const [themeForm, setThemeForm] = useState({
    primary_color: "#2563eb",
    secondary_color: "#64748b",
    accent_color: "#f59e0b",
    background_color: "#ffffff",
    text_color: "#0f172a",
    heading_font: "Inter",
    body_font: "Inter",
    button_radius: "md",
    layout_style: "standard",
    hero_style: "banner",
    product_card_style: "minimal",
    footer_style: "standard",
    custom_css: "",
  });
  const [themeSaving, setThemeSaving] = useState(false);

  // Load branding + theme data
  useEffect(() => {
    if (!currentStore) return;
    supabase
      .from("stores")
      .select("primary_color, banner_text, description, logo_url")
      .eq("id", currentStore.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBrandForm({
            primary_color: (data as any).primary_color || "#2563eb",
            banner_text: (data as any).banner_text || "",
            description: (data as any).description || "",
            logo_url: (data as any).logo_url || "",
          });
        }
      });

    supabase
      .from("store_themes")
      .select("*")
      .eq("store_id", currentStore.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setThemeForm({
            primary_color: (data as any).primary_color || "#2563eb",
            secondary_color: (data as any).secondary_color || "#64748b",
            accent_color: (data as any).accent_color || "#f59e0b",
            background_color: (data as any).background_color || "#ffffff",
            text_color: (data as any).text_color || "#0f172a",
            heading_font: (data as any).heading_font || "Inter",
            body_font: (data as any).body_font || "Inter",
            button_radius: (data as any).button_radius || "md",
            layout_style: (data as any).layout_style || "standard",
            hero_style: (data as any).hero_style || "banner",
            product_card_style: (data as any).product_card_style || "minimal",
            footer_style: (data as any).footer_style || "standard",
            custom_css: (data as any).custom_css || "",
          });
        }
      });
  }, [currentStore]);

  const handleSaveBranding = async () => {
    if (!currentStore) return;
    setBrandSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        primary_color: brandForm.primary_color,
        banner_text: brandForm.banner_text || null,
        description: brandForm.description || null,
        logo_url: brandForm.logo_url || null,
      } as any)
      .eq("id", currentStore.id);
    setBrandSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Branding saved");
  };

  const [taxOpen, setTaxOpen] = useState(false);
  const [newTax, setNewTax] = useState({ name: "", region: "", rate: "" });
  const [shipOpen, setShipOpen] = useState(false);
  const [newShip, setNewShip] = useState({ name: "", regions: "", flat_rate: "", free_above: "" });

  const handleSaveStore = () => {
    updateStore.mutate(storeForm);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your store configuration</p>
        </div>

        <Tabs defaultValue="store">
          <TabsList className="h-8">
            <TabsTrigger value="store" className="text-xs h-7">Store</TabsTrigger>
            <TabsTrigger value="branding" className="text-xs h-7">Branding</TabsTrigger>
            <TabsTrigger value="team" className="text-xs h-7">Team</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs h-7">Tax</TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs h-7">Shipping</TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Store Details</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Store Name</Label>
                    <Input className="h-8 text-xs" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Email</Label>
                    <Input className="h-8 text-xs" value={storeForm.contact_email} onChange={(e) => setStoreForm({ ...storeForm, contact_email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Currency</Label>
                    <Select value={storeForm.currency} onValueChange={(v) => setStoreForm({ ...storeForm, currency: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD" className="text-xs">USD</SelectItem>
                        <SelectItem value="EUR" className="text-xs">EUR</SelectItem>
                        <SelectItem value="GBP" className="text-xs">GBP</SelectItem>
                        <SelectItem value="CAD" className="text-xs">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Timezone</Label>
                    <Select value={storeForm.timezone} onValueChange={(v) => setStoreForm({ ...storeForm, timezone: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York" className="text-xs">Eastern</SelectItem>
                        <SelectItem value="America/Chicago" className="text-xs">Central</SelectItem>
                        <SelectItem value="America/Denver" className="text-xs">Mountain</SelectItem>
                        <SelectItem value="America/Los_Angeles" className="text-xs">Pacific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveStore} disabled={updateStore.isPending}>
                  <Save className="h-3.5 w-3.5" /> {updateStore.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Store Branding</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={brandForm.primary_color}
                        onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                        className="h-8 w-12 rounded border cursor-pointer"
                      />
                      <Input className="h-8 text-xs flex-1" value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Logo URL</Label>
                    <Input className="h-8 text-xs" value={brandForm.logo_url} onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Banner Text</Label>
                  <Input className="h-8 text-xs" value={brandForm.banner_text} onChange={(e) => setBrandForm({ ...brandForm, banner_text: e.target.value })} placeholder="Free shipping on orders over $50!" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Store Description</Label>
                  <Input className="h-8 text-xs" value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} placeholder="A short description of your store..." />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                  <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: brandForm.primary_color }} />
                  <div>
                    <p className="text-xs font-medium">Preview</p>
                    <p className="text-2xs text-muted-foreground">This color will be used as your store's accent color</p>
                  </div>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveBranding} disabled={brandSaving}>
                  <Palette className="h-3.5 w-3.5" /> {brandSaving ? "Saving..." : "Save Branding"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Team Members</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Mail className="h-3 w-3" /> Invite</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTeam ? (
                      <TableRow><TableCell colSpan={2}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ) : team.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-6">No team members</TableCell></TableRow>
                    ) : (
                      team.map((m: any) => (
                        <TableRow key={m.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{m.profiles?.display_name || "Unknown"}</TableCell>
                          <TableCell className="py-2"><Badge variant="outline" className="text-2xs capitalize">{m.role}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Tax Rates</CardTitle>
                <Dialog open={taxOpen} onOpenChange={setTaxOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add Rate</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="text-sm">New Tax Rate</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} placeholder="US Standard" /></div>
                      <div className="space-y-1"><Label className="text-xs">Region</Label><Input className="h-8 text-xs" value={newTax.region} onChange={(e) => setNewTax({ ...newTax, region: e.target.value })} placeholder="United States" /></div>
                      <div className="space-y-1"><Label className="text-xs">Rate (%)</Label><Input className="h-8 text-xs" type="number" step="0.001" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} placeholder="8.875" /></div>
                      <Button size="sm" className="h-8 text-xs w-full" onClick={() => {
                        createTaxRate.mutate({ name: newTax.name, region: newTax.region, rate: parseFloat(newTax.rate) || 0 },
                          { onSuccess: () => { setTaxOpen(false); setNewTax({ name: "", region: "", rate: "" }); } });
                      }} disabled={createTaxRate.isPending}>{createTaxRate.isPending ? "Creating..." : "Create"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs h-8">Name</TableHead>
                    <TableHead className="text-xs h-8">Region</TableHead>
                    <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                    <TableHead className="text-xs h-8 w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loadingTax ? (
                      <TableRow><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ) : taxRates.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No tax rates configured</TableCell></TableRow>
                    ) : (
                      taxRates.map((t) => (
                        <TableRow key={t.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{t.name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{t.region}</TableCell>
                          <TableCell className="py-2 text-right">{Number(t.rate)}%</TableCell>
                          <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTaxRate.mutate(t.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Shipping Zones</CardTitle>
                <Dialog open={shipOpen} onOpenChange={setShipOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add Zone</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="text-sm">New Shipping Zone</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1"><Label className="text-xs">Zone Name</Label><Input className="h-8 text-xs" value={newShip.name} onChange={(e) => setNewShip({ ...newShip, name: e.target.value })} placeholder="Domestic" /></div>
                      <div className="space-y-1"><Label className="text-xs">Regions</Label><Input className="h-8 text-xs" value={newShip.regions} onChange={(e) => setNewShip({ ...newShip, regions: e.target.value })} placeholder="United States" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-xs">Flat Rate</Label><Input className="h-8 text-xs" type="number" step="0.01" value={newShip.flat_rate} onChange={(e) => setNewShip({ ...newShip, flat_rate: e.target.value })} placeholder="5.99" /></div>
                        <div className="space-y-1"><Label className="text-xs">Free Above</Label><Input className="h-8 text-xs" type="number" step="0.01" value={newShip.free_above} onChange={(e) => setNewShip({ ...newShip, free_above: e.target.value })} placeholder="50.00" /></div>
                      </div>
                      <Button size="sm" className="h-8 text-xs w-full" onClick={() => {
                        createShippingZone.mutate(
                          { name: newShip.name, regions: newShip.regions, flat_rate: parseFloat(newShip.flat_rate) || 0, free_above: newShip.free_above ? parseFloat(newShip.free_above) : null },
                          { onSuccess: () => { setShipOpen(false); setNewShip({ name: "", regions: "", flat_rate: "", free_above: "" }); } }
                        );
                      }} disabled={createShippingZone.isPending}>{createShippingZone.isPending ? "Creating..." : "Create"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs h-8">Zone</TableHead>
                    <TableHead className="text-xs h-8">Regions</TableHead>
                    <TableHead className="text-xs h-8 text-right">Flat Rate</TableHead>
                    <TableHead className="text-xs h-8 text-right">Free Above</TableHead>
                    <TableHead className="text-xs h-8 w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loadingShipping ? (
                      <TableRow><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ) : shippingZones.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No shipping zones configured</TableCell></TableRow>
                    ) : (
                      shippingZones.map((sz) => (
                        <TableRow key={sz.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{sz.name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{sz.regions}</TableCell>
                          <TableCell className="py-2 text-right">${Number(sz.flat_rate).toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-right">{sz.free_above ? `$${Number(sz.free_above).toFixed(2)}` : "—"}</TableCell>
                          <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteShippingZone.mutate(sz.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
