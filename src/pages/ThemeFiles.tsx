import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen, File, FileCode2, FileText, Upload, Plus, Save,
  Trash2, Eye, Code2, Download, Palette, ChevronRight, ChevronDown,
  Search, RefreshCw, Package, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreTemplates, useCreateStoreTemplate, useUpdateStoreTemplate, useDeleteStoreTemplate } from "@/hooks/use-data";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";
import JSZip from "jszip";

// ── Categorize templates into a folder tree ──
interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  template?: any;
}

const THEME_FILE_CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
  layout: { label: "Layouts", icon: FileCode2, color: "text-blue-500" },
  page: { label: "Pages", icon: FileText, color: "text-green-500" },
  snippet: { label: "Snippets / Partials", icon: Code2, color: "text-amber-500" },
  content_block: { label: "Content Blocks", icon: FileCode2, color: "text-purple-500" },
  email: { label: "Email Templates", icon: FileText, color: "text-rose-500" },
  css: { label: "Stylesheets", icon: Palette, color: "text-cyan-500" },
  asset: { label: "Assets", icon: File, color: "text-muted-foreground" },
};

function buildTree(templates: any[]): TreeNode[] {
  const folders: Record<string, TreeNode> = {};
  for (const cat of Object.keys(THEME_FILE_CATEGORIES)) {
    folders[cat] = {
      name: THEME_FILE_CATEGORIES[cat].label,
      path: cat,
      isFolder: true,
      children: [],
    };
  }
  for (const t of templates) {
    const cat = t.template_type || "content_block";
    const folder = folders[cat] || folders["content_block"];
    folder.children.push({
      name: t.name || t.slug || "Untitled",
      path: `${cat}/${t.slug || t.id}`,
      isFolder: false,
      children: [],
      template: t,
    });
  }
  return Object.values(folders).filter(f => f.children.length > 0);
}

const MOCK_PREVIEW: TemplateContext = {
  product: { title: "Sample Product", price: 49.99, sku: "DEMO-001", description: "A demo product for preview.", images: ["/placeholder.svg"], is_active: true, status: "active", slug: "sample" },
  variants: [],
  specifics: [],
  pricing_tiers: [],
  cross_sells: [],
  store: { name: "My Store", currency: "AUD", contact_email: "hello@store.com" },
};

export default function ThemeFiles() {
  const { currentStore } = useAuth();
  const { data: templates = [], isLoading, refetch } = useStoreTemplates();
  const createTemplate = useCreateStoreTemplate();
  const updateTemplate = useUpdateStoreTemplate();
  const deleteTemplate = useDeleteStoreTemplate();

  const [selected, setSelected] = useState<any>(null);
  const [editorTab, setEditorTab] = useState("html");
  const [editForm, setEditForm] = useState({ name: "", slug: "", content: "", custom_css: "", template_type: "page", context_type: "product", is_active: true });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(Object.keys(THEME_FILE_CATEGORIES)));
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{ name: string; path: string; size: number }[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tree = buildTree(templates as any[]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openFile = (template: any) => {
    setSelected(template);
    setEditForm({
      name: template.name || "",
      slug: template.slug || "",
      content: template.content || "",
      custom_css: template.custom_css || "",
      template_type: template.template_type || "page",
      context_type: template.context_type || "product",
      is_active: template.is_active !== false,
    });
    setEditorTab("html");
  };

  const createNewFile = (templateType: string) => {
    setSelected("new");
    setEditForm({
      name: "",
      slug: "",
      content: "",
      custom_css: "",
      template_type: templateType,
      context_type: "product",
      is_active: true,
    });
    setEditorTab("html");
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) { toast.error("File name is required"); return; }
    try {
      if (selected && selected !== "new") {
        await updateTemplate.mutateAsync({ id: selected.id, ...editForm });
      } else {
        await createTemplate.mutateAsync(editForm);
      }
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── ZIP Import ──
  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFile(file);

    try {
      const zip = await JSZip.loadAsync(file);
      const files: { name: string; path: string; size: number }[] = [];
      zip.forEach((relativePath, entry) => {
        if (!entry.dir && !relativePath.startsWith("__MACOSX") && !relativePath.startsWith(".")) {
          files.push({ name: entry.name, path: relativePath, size: entry._data?.uncompressedSize || 0 });
        }
      });
      setImportPreview(files);
      setImportDialog(true);
    } catch (err: any) {
      toast.error("Failed to read ZIP file: " + err.message);
    }
  };

  const importThemeZip = async () => {
    if (!zipFile || !currentStore) return;
    setImporting(true);

    try {
      const zip = await JSZip.loadAsync(zipFile);
      let imported = 0;
      let skipped = 0;

      const entries: { path: string; content: string }[] = [];
      const promises: Promise<void>[] = [];

      zip.forEach((relativePath, entry) => {
        if (entry.dir || relativePath.startsWith("__MACOSX") || relativePath.startsWith(".")) return;
        promises.push(
          entry.async("string").then(content => {
            entries.push({ path: relativePath, content });
          })
        );
      });
      await Promise.all(promises);

      for (const { path, content } of entries) {
        const ext = path.split(".").pop()?.toLowerCase() || "";
        const fileName = path.split("/").pop() || path;
        const slug = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");

        let templateType = "page";
        let contextType = "product";
        let htmlContent = content;
        let cssContent = "";

        // Categorize by file extension and path
        if (ext === "css") {
          templateType = "css";
          cssContent = content;
          htmlContent = `<!-- CSS file: ${fileName} -->`;
        } else if (ext === "js") {
          templateType = "asset";
          htmlContent = `<script>\n${content}\n</script>`;
        } else if (path.includes("layout") || path.includes("master")) {
          templateType = "layout";
        } else if (path.includes("snippet") || path.includes("partial") || path.includes("include")) {
          templateType = "snippet";
        } else if (path.includes("email")) {
          templateType = "email";
        } else if (ext === "html" || ext === "template") {
          templateType = "page";
        }

        // Check for store/global context
        if (path.includes("header") || path.includes("footer") || path.includes("nav")) {
          contextType = "store";
        }

        // Upsert: check if slug already exists
        const existing = (templates as any[]).find(
          (t: any) => t.slug === slug && t.template_type === templateType
        );

        try {
          if (existing) {
            await supabase
              .from("store_templates" as any)
              .update({ content: htmlContent, custom_css: cssContent || existing.custom_css, name: fileName })
              .eq("id", existing.id);
            imported++;
          } else {
            await supabase
              .from("store_templates" as any)
              .insert({
                store_id: currentStore.id,
                name: fileName,
                slug,
                template_type: templateType,
                context_type: contextType,
                content: htmlContent,
                custom_css: cssContent || null,
                is_active: true,
              });
            imported++;
          }
        } catch {
          skipped++;
        }
      }

      toast.success(`Theme imported: ${imported} files processed, ${skipped} skipped`);
      setImportDialog(false);
      setZipFile(null);
      setImportPreview([]);
      refetch();
    } catch (err: any) {
      toast.error("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const previewHtml = editForm.content ? renderTemplate(editForm.content, MOCK_PREVIEW) : "";

  const filteredTree = searchQuery
    ? tree.map(folder => ({
        ...folder,
        children: folder.children.filter(f =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.template?.slug || "").toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(f => f.children.length > 0)
    : tree;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Theme Files</h1>
            <p className="text-xs text-muted-foreground">View, edit, and import your store theme templates, stylesheets, and assets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleZipSelect}
            />
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Import Theme ZIP
            </Button>
            <Button size="sm" className="text-xs gap-1" onClick={() => createNewFile("page")}>
              <Plus className="h-3.5 w-3.5" /> New File
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[600px]">
          {/* File Tree Sidebar */}
          <Card className="lg:col-span-3">
            <CardHeader className="py-2 px-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="h-7 text-xs pl-8"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                <div className="px-1 pb-2">
                  {isLoading ? (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                    </div>
                  ) : filteredTree.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">No theme files yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Import a theme ZIP or create files manually.</p>
                    </div>
                  ) : (
                    filteredTree.map(folder => {
                      const cat = THEME_FILE_CATEGORIES[folder.path] || THEME_FILE_CATEGORIES["content_block"];
                      const Icon = cat.icon;
                      const isExpanded = expandedFolders.has(folder.path);
                      return (
                        <div key={folder.path}>
                          <button
                            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium hover:bg-muted/50 rounded-sm"
                            onClick={() => toggleFolder(folder.path)}
                          >
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <FolderOpen className={`h-3.5 w-3.5 ${cat.color}`} />
                            <span>{folder.name}</span>
                            <Badge variant="secondary" className="text-[9px] ml-auto h-4 px-1">{folder.children.length}</Badge>
                          </button>
                          {isExpanded && (
                            <div className="ml-4 border-l border-border/50 pl-2">
                              {folder.children.map(file => (
                                <button
                                  key={file.template?.id}
                                  className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-muted/50 rounded-sm truncate ${
                                    selected?.id === file.template?.id ? "bg-accent text-accent-foreground" : ""
                                  }`}
                                  onClick={() => openFile(file.template)}
                                >
                                  <Icon className={`h-3 w-3 shrink-0 ${cat.color}`} />
                                  <span className="truncate">{file.name}</span>
                                  {!file.template?.is_active && (
                                    <Badge variant="secondary" className="text-[8px] ml-auto h-3.5 px-1">Draft</Badge>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Editor Panel */}
          <Card className="lg:col-span-9">
            {!selected ? (
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
                <FileCode2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-medium text-muted-foreground">Select a file to edit</h3>
                <p className="text-xs text-muted-foreground mt-1">Choose a theme file from the sidebar, or import a theme ZIP</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Import Theme
                  </Button>
                  <Button size="sm" className="text-xs gap-1" onClick={() => createNewFile("page")}>
                    <Plus className="h-3.5 w-3.5" /> New File
                  </Button>
                </div>
              </CardContent>
            ) : (
              <>
                {/* Editor Header */}
                <CardHeader className="py-2 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="space-y-0.5">
                        <Input
                          className="h-7 text-xs font-medium w-48"
                          value={editForm.name}
                          onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="File name"
                        />
                      </div>
                      <Input
                        className="h-7 text-xs w-32"
                        value={editForm.slug}
                        onChange={(e) => setEditForm(p => ({ ...p, slug: e.target.value }))}
                        placeholder="slug"
                      />
                      <select
                        className="h-7 text-xs border rounded px-2 bg-background"
                        value={editForm.template_type}
                        onChange={(e) => setEditForm(p => ({ ...p, template_type: e.target.value }))}
                      >
                        {Object.entries(THEME_FILE_CATEGORIES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={editForm.is_active}
                          onCheckedChange={(v) => setEditForm(p => ({ ...p, is_active: v }))}
                        />
                        <Label className="text-[10px] text-muted-foreground">Active</Label>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {selected !== "new" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1">
                              <Trash2 className="h-3 w-3" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                              <AlertDialogDescription>"{editForm.name}" will be permanently deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { deleteTemplate.mutate(selected.id); setSelected(null); }}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(null)}>
                        Close
                      </Button>
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
                        <Save className="h-3 w-3" /> {selected === "new" ? "Create" : "Save"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Editor Body */}
                <CardContent className="p-0">
                  <Tabs value={editorTab} onValueChange={setEditorTab}>
                    <div className="border-b px-4 py-1.5">
                      <TabsList className="h-7">
                        <TabsTrigger value="html" className="text-xs h-6 px-3 gap-1"><Code2 className="h-3 w-3" /> HTML</TabsTrigger>
                        <TabsTrigger value="css" className="text-xs h-6 px-3 gap-1"><Palette className="h-3 w-3" /> CSS</TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs h-6 px-3 gap-1"><Eye className="h-3 w-3" /> Preview</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="html" className="m-0 p-0">
                      <Textarea
                        className="min-h-[500px] border-0 rounded-none font-mono text-xs leading-relaxed resize-none focus-visible:ring-0"
                        placeholder="Enter HTML / B@SE template content..."
                        value={editForm.content}
                        onChange={(e) => setEditForm(p => ({ ...p, content: e.target.value }))}
                      />
                    </TabsContent>

                    <TabsContent value="css" className="m-0 p-0">
                      <Textarea
                        className="min-h-[500px] border-0 rounded-none font-mono text-xs leading-relaxed resize-none focus-visible:ring-0"
                        placeholder="Enter custom CSS for this template..."
                        value={editForm.custom_css}
                        onChange={(e) => setEditForm(p => ({ ...p, custom_css: e.target.value }))}
                      />
                    </TabsContent>

                    <TabsContent value="preview" className="m-0 p-4">
                      {previewHtml ? (
                        <>
                          {editForm.custom_css && <style dangerouslySetInnerHTML={{ __html: editForm.custom_css }} />}
                          <div className="prose prose-sm max-w-none border rounded-md p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-12">Enter template content to see a preview.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Import Theme ZIP Dialog */}
        <Dialog open={importDialog} onOpenChange={setImportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" /> Import Theme from ZIP
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Package className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium">{zipFile?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{importPreview.length} files found</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  Existing files with matching slugs will be overwritten. New files will be created. This cannot be undone.
                </p>
              </div>

              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-0.5">
                  {importPreview.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted/50 rounded">
                      <FileCode2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate font-mono text-[10px]">{f.path}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">{(f.size / 1024).toFixed(1)}KB</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setImportDialog(false); setZipFile(null); }}>
                  Cancel
                </Button>
                <Button size="sm" className="text-xs gap-1" onClick={importThemeZip} disabled={importing}>
                  {importing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {importing ? "Importing..." : `Import ${importPreview.length} Files`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
