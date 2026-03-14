import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Globe, Smartphone, ShoppingBag, Store, Users, Share2, Package, DollarSign, Settings } from "lucide-react";
import { toast } from "sonner";

interface SalesChannel {
  id: string;
  name: string;
  channel_type: string;
  is_active: boolean;
  product_count: number;
  revenue: number;
  description: string;
}

const channelTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  online: { label: "Online Store", icon: <Globe className="h-5 w-5" />, color: "bg-blue-500/10 text-blue-500" },
  pos: { label: "Point of Sale", icon: <Store className="h-5 w-5" />, color: "bg-green-500/10 text-green-500" },
  marketplace: { label: "Marketplace", icon: <ShoppingBag className="h-5 w-5" />, color: "bg-purple-500/10 text-purple-500" },
  social: { label: "Social Commerce", icon: <Share2 className="h-5 w-5" />, color: "bg-pink-500/10 text-pink-500" },
  wholesale: { label: "Wholesale / B2B", icon: <Users className="h-5 w-5" />, color: "bg-amber-500/10 text-amber-500" },
  mobile_app: { label: "Mobile App", icon: <Smartphone className="h-5 w-5" />, color: "bg-cyan-500/10 text-cyan-500" },
};

const mockChannels: SalesChannel[] = [
  { id: "1", name: "Main Online Store", channel_type: "online", is_active: true, product_count: 1247, revenue: 89450.00, description: "Primary webstore at mystore.com" },
  { id: "2", name: "In-Store POS", channel_type: "pos", is_active: true, product_count: 856, revenue: 42300.00, description: "Physical retail locations" },
  { id: "3", name: "eBay Australia", channel_type: "marketplace", is_active: true, product_count: 320, revenue: 15600.00, description: "eBay AU marketplace integration" },
  { id: "4", name: "Amazon AU", channel_type: "marketplace", is_active: false, product_count: 0, revenue: 0, description: "Amazon Australia — setup pending" },
  { id: "5", name: "Instagram Shop", channel_type: "social", is_active: true, product_count: 150, revenue: 8900.00, description: "Instagram Shopping integration" },
  { id: "6", name: "Wholesale Portal", channel_type: "wholesale", is_active: true, product_count: 500, revenue: 125000.00, description: "B2B wholesale ordering portal" },
];

export default function SalesChannels() {
  const [channels, setChannels] = useState(mockChannels);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", channel_type: "online", description: "" });

  const totalRevenue = channels.filter(c => c.is_active).reduce((s, c) => s + c.revenue, 0);
  const totalProducts = channels.filter(c => c.is_active).reduce((s, c) => s + c.product_count, 0);
  const activeCount = channels.filter(c => c.is_active).length;

  const toggleActive = (id: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    toast.success("Channel updated");
  };

  const handleCreate = () => {
    if (!form.name) { toast.error("Channel name required"); return; }
    setChannels(prev => [...prev, { id: crypto.randomUUID(), ...form, is_active: true, product_count: 0, revenue: 0 }]);
    setDialogOpen(false);
    setForm({ name: "", channel_type: "online", description: "" });
    toast.success("Sales channel created");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales Channels</h1>
            <p className="text-sm text-muted-foreground">Manage where your products are sold</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Channel</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Sales Channel</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Channel Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Facebook Shop" /></div>
                <div>
                  <Label>Channel Type</Label>
                  <Select value={form.channel_type} onValueChange={v => setForm(f => ({ ...f, channel_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(channelTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Channel description" /></div>
                <Button onClick={handleCreate} className="w-full">Add Channel</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Share2 className="h-5 w-5 text-primary" /></div><div><p className="text-2xs text-muted-foreground">Active Channels</p><p className="text-lg font-semibold">{activeCount}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-500" /></div><div><p className="text-2xs text-muted-foreground">Total Revenue</p><p className="text-lg font-semibold">${totalRevenue.toLocaleString()}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xs text-muted-foreground">Products Listed</p><p className="text-lg font-semibold">{totalProducts.toLocaleString()}</p></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map(channel => {
            const config = channelTypeConfig[channel.channel_type] || channelTypeConfig.online;
            return (
              <Card key={channel.id} className={!channel.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{channel.name}</CardTitle>
                        <CardDescription className="text-2xs">{config.label}</CardDescription>
                      </div>
                    </div>
                    <Switch checked={channel.is_active} onCheckedChange={() => toggleActive(channel.id)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground text-2xs">Products</p>
                      <p className="font-semibold">{channel.product_count.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-2xs">Revenue</p>
                      <p className="font-semibold">${channel.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1"><Settings className="h-3 w-3" />Configure</Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1"><Package className="h-3 w-3" />Products</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
