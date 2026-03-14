import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, GripVertical, Package, Users, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type FieldType = "text" | "number" | "date" | "select" | "boolean" | "textarea" | "color";
type EntityType = "product" | "customer" | "order";

interface CustomField {
  id: string;
  entity_type: EntityType;
  field_name: string;
  field_key: string;
  field_type: FieldType;
  options: string[];
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  show_on_storefront: boolean;
  sort_order: number;
  placeholder: string;
  default_value: string;
}

const mockFields: CustomField[] = [
  { id: "1", entity_type: "product", field_name: "Material", field_key: "material", field_type: "select", options: ["Cotton", "Polyester", "Silk", "Wool"], is_required: false, is_searchable: true, is_filterable: true, show_on_storefront: true, sort_order: 0, placeholder: "Select material", default_value: "" },
  { id: "2", entity_type: "product", field_name: "Country of Origin", field_key: "country_of_origin", field_type: "text", options: [], is_required: false, is_searchable: false, is_filterable: true, show_on_storefront: true, sort_order: 1, placeholder: "e.g. Australia", default_value: "" },
  { id: "3", entity_type: "customer", field_name: "Company Size", field_key: "company_size", field_type: "select", options: ["1-10", "11-50", "51-200", "200+"], is_required: false, is_searchable: false, is_filterable: true, show_on_storefront: false, sort_order: 0, placeholder: "", default_value: "" },
  { id: "4", entity_type: "customer", field_name: "Account Manager", field_key: "account_manager", field_type: "text", options: [], is_required: false, is_searchable: true, is_filterable: false, show_on_storefront: false, sort_order: 1, placeholder: "", default_value: "" },
  { id: "5", entity_type: "order", field_name: "PO Number", field_key: "po_number", field_type: "text", options: [], is_required: false, is_searchable: true, is_filterable: false, show_on_storefront: false, sort_order: 0, placeholder: "Customer PO #", default_value: "" },
  { id: "6", entity_type: "order", field_name: "Delivery Instructions", field_key: "delivery_instructions", field_type: "textarea", options: [], is_required: false, is_searchable: false, is_filterable: false, show_on_storefront: false, sort_order: 1, placeholder: "Special delivery instructions", default_value: "" },
];

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text", number: "Number", date: "Date", select: "Dropdown",
  boolean: "Checkbox", textarea: "Text Area", color: "Color Picker",
};

const entityIcons: Record<EntityType, React.ReactNode> = {
  product: <Package className="h-4 w-4" />,
  customer: <Users className="h-4 w-4" />,
  order: <ShoppingCart className="h-4 w-4" />,
};

export default function CustomFields() {
  const [fields, setFields] = useState<CustomField[]>(mockFields);
  const [activeTab, setActiveTab] = useState<EntityType>("product");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [form, setForm] = useState({ field_name: "", field_key: "", field_type: "text" as FieldType, options: "", is_required: false, is_searchable: false, is_filterable: false, show_on_storefront: false, placeholder: "", default_value: "" });

  const filteredFields = fields.filter(f => f.entity_type === activeTab);

  const openCreate = () => {
    setEditingField(null);
    setForm({ field_name: "", field_key: "", field_type: "text", options: "", is_required: false, is_searchable: false, is_filterable: false, show_on_storefront: false, placeholder: "", default_value: "" });
    setDialogOpen(true);
  };

  const openEdit = (field: CustomField) => {
    setEditingField(field);
    setForm({ field_name: field.field_name, field_key: field.field_key, field_type: field.field_type, options: field.options.join(", "), is_required: field.is_required, is_searchable: field.is_searchable, is_filterable: field.is_filterable, show_on_storefront: field.show_on_storefront, placeholder: field.placeholder, default_value: field.default_value });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.field_name || !form.field_key) { toast.error("Name and key are required"); return; }
    const opts = form.options ? form.options.split(",").map(o => o.trim()).filter(Boolean) : [];
    if (editingField) {
      setFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...form, options: opts } : f));
      toast.success("Field updated");
    } else {
      setFields(prev => [...prev, { id: crypto.randomUUID(), entity_type: activeTab, ...form, options: opts, sort_order: filteredFields.length }]);
      toast.success("Field created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    toast.success("Field deleted");
  };

  const autoKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Custom Fields</h1>
            <p className="text-sm text-muted-foreground">Define additional fields for products, customers, and orders</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Field</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingField ? "Edit" : "New"} Custom Field</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field Name</Label>
                    <Input value={form.field_name} onChange={e => { setForm(f => ({ ...f, field_name: e.target.value, field_key: editingField ? f.field_key : autoKey(e.target.value) })); }} placeholder="e.g. Material" />
                  </div>
                  <div>
                    <Label>Field Key</Label>
                    <Input value={form.field_key} onChange={e => setForm(f => ({ ...f, field_key: e.target.value }))} placeholder="e.g. material" className="font-mono text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field Type</Label>
                    <Select value={form.field_type} onValueChange={(v: FieldType) => setForm(f => ({ ...f, field_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(fieldTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Placeholder</Label>
                    <Input value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))} />
                  </div>
                </div>
                {form.field_type === "select" && (
                  <div>
                    <Label>Options (comma-separated)</Label>
                    <Input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" />
                  </div>
                )}
                <div>
                  <Label>Default Value</Label>
                  <Input value={form.default_value} onChange={e => setForm(f => ({ ...f, default_value: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Required</Label>
                    <Switch checked={form.is_required} onCheckedChange={v => setForm(f => ({ ...f, is_required: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Searchable</Label>
                    <Switch checked={form.is_searchable} onCheckedChange={v => setForm(f => ({ ...f, is_searchable: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Filterable</Label>
                    <Switch checked={form.is_filterable} onCheckedChange={v => setForm(f => ({ ...f, is_filterable: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show on Storefront</Label>
                    <Switch checked={form.show_on_storefront} onCheckedChange={v => setForm(f => ({ ...f, show_on_storefront: v }))} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">{editingField ? "Update" : "Create"} Field</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as EntityType)}>
          <TabsList>
            <TabsTrigger value="product" className="gap-2">{entityIcons.product} Products ({fields.filter(f => f.entity_type === "product").length})</TabsTrigger>
            <TabsTrigger value="customer" className="gap-2">{entityIcons.customer} Customers ({fields.filter(f => f.entity_type === "customer").length})</TabsTrigger>
            <TabsTrigger value="order" className="gap-2">{entityIcons.order} Orders ({fields.filter(f => f.entity_type === "order").length})</TabsTrigger>
          </TabsList>

          {(["product", "customer", "order"] as EntityType[]).map(entity => (
            <TabsContent key={entity} value={entity}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{entity} Custom Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredFields.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No custom fields defined for {entity}s yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Flags</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFields.map(field => (
                          <TableRow key={field.id}>
                            <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                            <TableCell className="font-medium">{field.field_name}</TableCell>
                            <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{field.field_key}</code></TableCell>
                            <TableCell><Badge variant="outline">{fieldTypeLabels[field.field_type]}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {field.is_required && <Badge variant="secondary" className="text-2xs">Required</Badge>}
                                {field.is_searchable && <Badge variant="secondary" className="text-2xs">Searchable</Badge>}
                                {field.is_filterable && <Badge variant="secondary" className="text-2xs">Filterable</Badge>}
                                {field.show_on_storefront && <Badge variant="secondary" className="text-2xs">Storefront</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => openEdit(field)}><Pencil className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(field.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
