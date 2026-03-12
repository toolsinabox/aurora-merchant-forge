import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { mockStore, mockLocations } from "@/lib/mock-data";
import { Save, Plus, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

const mockTeam = [
  { id: "u1", name: "Admin User", email: "admin@acme.com", role: "owner" },
  { id: "u2", name: "Jane Doe", email: "jane@acme.com", role: "admin" },
  { id: "u3", name: "Bob Smith", email: "bob@acme.com", role: "staff" },
];

const mockTaxRates = [
  { id: "t1", name: "US - Standard", region: "United States", rate: 8.875 },
  { id: "t2", name: "CA - GST", region: "Canada", rate: 5.0 },
  { id: "t3", name: "EU - VAT", region: "European Union", rate: 20.0 },
];

const mockShippingZones = [
  { id: "sz1", name: "Domestic", regions: "United States", flatRate: 5.99, freeAbove: 50.0 },
  { id: "sz2", name: "Canada", regions: "Canada", flatRate: 12.99, freeAbove: 100.0 },
  { id: "sz3", name: "International", regions: "Rest of World", flatRate: 24.99, freeAbove: null },
];

export default function SettingsPage() {
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
                    <Input className="h-8 text-xs" defaultValue={mockStore.name} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Email</Label>
                    <Input className="h-8 text-xs" defaultValue="admin@acme.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Currency</Label>
                    <Select defaultValue={mockStore.currency}>
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
                    <Select defaultValue={mockStore.timezone}>
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
                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => toast.success("Settings saved")}>
                  <Save className="h-3.5 w-3.5" /> Save Changes
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
                      <TableHead className="text-xs h-8">Email</TableHead>
                      <TableHead className="text-xs h-8">Role</TableHead>
                      <TableHead className="text-xs h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTeam.map((m) => (
                      <TableRow key={m.id} className="text-xs">
                        <TableCell className="py-2 font-medium">{m.name}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{m.email}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-2xs capitalize">{m.role}</Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          {m.role !== "owner" && (
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Tax Rates</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add Rate</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Region</TableHead>
                      <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                      <TableHead className="text-xs h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTaxRates.map((t) => (
                      <TableRow key={t.id} className="text-xs">
                        <TableCell className="py-2 font-medium">{t.name}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{t.region}</TableCell>
                        <TableCell className="py-2 text-right">{t.rate}%</TableCell>
                        <TableCell className="py-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Shipping Zones</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add Zone</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Zone</TableHead>
                      <TableHead className="text-xs h-8">Regions</TableHead>
                      <TableHead className="text-xs h-8 text-right">Flat Rate</TableHead>
                      <TableHead className="text-xs h-8 text-right">Free Above</TableHead>
                      <TableHead className="text-xs h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockShippingZones.map((sz) => (
                      <TableRow key={sz.id} className="text-xs">
                        <TableCell className="py-2 font-medium">{sz.name}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{sz.regions}</TableCell>
                        <TableCell className="py-2 text-right">${sz.flatRate.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-right">{sz.freeAbove ? `$${sz.freeAbove.toFixed(2)}` : "—"}</TableCell>
                        <TableCell className="py-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
