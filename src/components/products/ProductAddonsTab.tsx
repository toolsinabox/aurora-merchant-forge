import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Settings2 } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "color", label: "Color Picker" },
  { value: "file", label: "File Upload" },
];

interface ProductAddonsTabProps {
  productId: string;
  isEdit: boolean;
}

export function ProductAddonsTab({ productId, isEdit }: ProductAddonsTabProps) {
  const { currentStore } = useAuth();
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    field_type: "text",
    is_required: false,
    price_adjustment: "0",
    options: "",
    sort_order: "0",
  });

  const fetchAddons = async () => {
    if (!productId || !isEdit) return;
    setLoading(true);
    const { data } = await supabase
      .from("product_addons" as any)
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    setAddons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddons(); }, [productId, isEdit]);

  const handleSave = async () => {
    if (!currentStore || !productId) return;
    const optionsArray = form.options
      ? form.options.split(",").map((o) => o.trim()).filter(Boolean)
      : [];

    const payload: any = {
      store_id: currentStore.id,
      product_id: productId,
      name: form.name,
      field_type: form.field_type,
      is_required: form.is_required,
      price_adjustment: Number(form.price_adjustment) || 0,
      options: optionsArray,
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      if (editingAddon) {
        await supabase.from("product_addons" as any).update(payload).eq("id", editingAddon.id);
        toast.success("Addon updated");
      } else {
        await supabase.from("product_addons" as any).insert(payload);
        toast.success("Addon created");
      }
      setDialogOpen(false);
      resetForm();
      fetchAddons();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("product_addons" as any).delete().eq("id", id);
    toast.success("Addon removed");
    fetchAddons();
  };

  const resetForm = () => {
    setForm({ name: "", field_type: "text", is_required: false, price_adjustment: "0", options: "", sort_order: "0" });
    setEditingAddon(null);
  };

  const openEdit = (addon: any) => {
    setEditingAddon(addon);
    setForm({
      name: addon.name,
      field_type: addon.field_type,
      is_required: addon.is_required,
      price_adjustment: String(addon.price_adjustment),
      options: Array.isArray(addon.options) ? addon.options.join(", ") : "",
      sort_order: String(addon.sort_order),
    });
    setDialogOpen(true);
  };

  if (!isEdit) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <Settings2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          Save the product first to add custom options/addons.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Custom Options / Addons</CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-3 w-3" /> Add Option
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">Name</TableHead>
                <TableHead className="text-xs h-8">Type</TableHead>
                <TableHead className="text-xs h-8">Required</TableHead>
                <TableHead className="text-xs h-8">Price +/-</TableHead>
                <TableHead className="text-xs h-8">Options</TableHead>
                <TableHead className="text-xs h-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                    No custom options yet. Add options like text engraving, color selection, etc.
                  </TableCell>
                </TableRow>
              ) : (
                addons.map((addon: any) => (
                  <TableRow key={addon.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => openEdit(addon)}>
                    <TableCell className="py-2 font-medium">{addon.name}</TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{addon.field_type}</Badge>
                    </TableCell>
                    <TableCell className="py-2">{addon.is_required ? "Yes" : "No"}</TableCell>
                    <TableCell className="py-2">{Number(addon.price_adjustment) !== 0 ? `$${Number(addon.price_adjustment).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="py-2 max-w-[150px] truncate text-muted-foreground">
                      {Array.isArray(addon.options) && addon.options.length > 0 ? addon.options.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="py-2">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(addon.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingAddon ? "Edit" : "Add"} Custom Option</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Option Name</Label>
              <Input className="h-8 text-xs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engraving Text, Color, Size" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Field Type</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm({ ...form, field_type: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(form.field_type === "select") && (
              <div className="space-y-1">
                <Label className="text-xs">Options (comma separated)</Label>
                <Input className="h-8 text-xs" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="Small, Medium, Large" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Price Adjustment ($)</Label>
              <Input type="number" step="0.01" className="h-8 text-xs w-32" value={form.price_adjustment} onChange={(e) => setForm({ ...form, price_adjustment: e.target.value })} />
              <p className="text-2xs text-muted-foreground">Extra charge when this option is selected (0 for no charge)</p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Required</Label>
              <Switch checked={form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sort Order</Label>
              <Input type="number" className="h-8 text-xs w-20" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <Button size="sm" className="w-full h-8 text-xs" onClick={handleSave} disabled={!form.name}>
              {editingAddon ? "Update Option" : "Add Option"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
