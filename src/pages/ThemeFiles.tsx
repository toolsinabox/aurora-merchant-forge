import { useState, useRef, useCallback, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen, FolderClosed, File, FileCode2, FileText, Upload, Plus, Save,
  Trash2, Eye, Code2, Download, Palette, ChevronRight, ChevronDown,
  Search, RefreshCw, Package, AlertCircle, Check, Copy, MoreVertical,
  Settings2, Star, Archive, FilePlus,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";
import JSZip from "jszip";

// ── Maropost-style folder structure ──
const THEME_FOLDERS = [
  { key: "templates", label: "Templates", icon: FileCode2, description: "HTML page templates" },
  { key: "headers", label: "Headers", icon: FileCode2, description: "Header partials" },
  { key: "footers", label: "Footers", icon: FileCode2, description: "Footer partials" },
  { key: "snippets", label: "Snippets", icon: Code2, description: "Reusable template partials" },
  { key: "css", label: "CSS", icon: Palette, description: "Stylesheets" },
  { key: "js", label: "JavaScript", icon: FileText, description: "Script files" },
  { key: "emails", label: "Emails", icon: FileText, description: "Email templates" },
  { key: "assets", label: "Assets", icon: File, description: "Images, fonts & other assets" },
] as const;

type FolderKey = typeof THEME_FOLDERS[number]["key"];

const FILE_TYPE_ICONS: Record<string, typeof FileCode2> = {
  html: FileCode2,
  css: Palette,
  js: FileText,
  json: FileText,
  xml: FileText,
  txt: FileText,
};

const MOCK_PREVIEW: TemplateContext = {
  product: { title: "Sample Product", price: 49.99, sku: "DEMO-001", description: "A demo product.", images: ["/placeholder.svg"], is_active: true, status: "active", slug: "sample" },
  variants: [], specifics: [], pricing_tiers: [], cross_sells: [],
  store: { name: "My Store", currency: "AUD", contact_email: "hello@store.com" },
};

// ── Hooks ──
function useThemePackages() {
  const { currentStore } = useAuth();
  return useQuery({
    queryKey: ["theme_packages", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("theme_packages" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!currentStore,
  });
}

function useThemeFiles(themeId: string | null) {
  return useQuery({
    queryKey: ["theme_files", themeId],
    queryFn: async () => {
      if (!themeId) return [];
      const { data, error } = await supabase
        .from("theme_files" as any)
        .select("*")
        .eq("theme_id", themeId)
        .order("folder")
        .order("file_name");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!themeId,
  });
}

// ── Detect folder from file path ──
function detectFolder(filePath: string): FolderKey {
  const lower = filePath.toLowerCase();
  if (lower.includes("/header") || lower.startsWith("header")) return "headers";
  if (lower.includes("/footer") || lower.startsWith("footer")) return "footers";
  if (lower.includes("/snippet") || lower.includes("/partial") || lower.includes("/include")) return "snippets";
  if (lower.includes("/email")) return "emails";
  if (lower.endsWith(".css") || lower.includes("/css")) return "css";
  if (lower.endsWith(".js") || lower.includes("/js")) return "js";
  if (lower.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) return "assets";
  return "templates";
}

function detectFileType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (["html", "htm", "template"].includes(ext)) return "html";
  if (ext === "css") return "css";
  if (ext === "js") return "js";
  if (ext === "json") return "json";
  return ext || "html";
}

export default function ThemeFiles() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const { data: themes = [], isLoading: themesLoading } = useThemePackages();
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const { data: files = [], isLoading: filesLoading } = useThemeFiles(activeThemeId);

  // UI state
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [editorTab, setEditorTab] = useState("code");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(THEME_FOLDERS.map(f => f.key)));
  const [searchQuery, setSearchQuery] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFileName, setEditFileName] = useState("");
  const [editFolder, setEditFolder] = useState<FolderKey>("templates");
  const [dirty, setDirty] = useState(false);

  // Dialogs
  const [newThemeDialog, setNewThemeDialog] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeDesc, setNewThemeDesc] = useState("");
  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileFolder, setNewFileFolder] = useState<FolderKey>("templates");
  const [importDialog, setImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{ path: string; folder: string }[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first theme
  useEffect(() => {
    if (themes.length > 0 && !activeThemeId) {
      setActiveThemeId(themes[0].id);
    }
  }, [themes, activeThemeId]);

  const activeTheme = themes.find((t: any) => t.id === activeThemeId);

  // ── Theme CRUD ──
  const createTheme = async () => {
    if (!currentStore || !newThemeName.trim()) return;
    const { data, error } = await supabase
      .from("theme_packages" as any)
      .insert({ store_id: currentStore.id, name: newThemeName.trim(), description: newThemeDesc.trim() || null })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success(`Theme "${newThemeName}" created`);
    setNewThemeDialog(false);
    setNewThemeName("");
    setNewThemeDesc("");
    qc.invalidateQueries({ queryKey: ["theme_packages"] });
    setActiveThemeId((data as any).id);
  };

  const deleteTheme = async (themeId: string) => {
    const { error } = await supabase.from("theme_packages" as any).delete().eq("id", themeId);
    if (error) { toast.error(error.message); return; }
    toast.success("Theme deleted");
    if (activeThemeId === themeId) { setActiveThemeId(null); setSelectedFile(null); }
    qc.invalidateQueries({ queryKey: ["theme_packages"] });
  };

  const setActiveTheme = async (themeId: string) => {
    if (!currentStore) return;
    // Deactivate all, activate selected
    await supabase.from("theme_packages" as any).update({ is_active: false }).eq("store_id", currentStore.id);
    await supabase.from("theme_packages" as any).update({ is_active: true }).eq("id", themeId);
    qc.invalidateQueries({ queryKey: ["theme_packages"] });
    toast.success("Active theme updated");
  };

  const duplicateTheme = async (theme: any) => {
    if (!currentStore) return;
    const { data: newTheme, error } = await supabase
      .from("theme_packages" as any)
      .insert({ store_id: currentStore.id, name: `${theme.name} (Copy)`, description: theme.description, version: theme.version })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }

    // Copy all files
    const { data: sourceFiles } = await supabase
      .from("theme_files" as any).select("*").eq("theme_id", theme.id);
    if (sourceFiles && sourceFiles.length > 0) {
      const copies = (sourceFiles as any[]).map((f: any) => ({
        theme_id: (newTheme as any).id,
        store_id: currentStore.id,
        file_path: f.file_path,
        file_name: f.file_name,
        folder: f.folder,
        file_type: f.file_type,
        content: f.content,
        file_size: f.file_size,
        is_active: f.is_active,
      }));
      await supabase.from("theme_files" as any).insert(copies);
    }
    qc.invalidateQueries({ queryKey: ["theme_packages"] });
    toast.success(`Theme duplicated as "${theme.name} (Copy)"`);
  };

  // ── File CRUD ──
  const openFile = (file: any) => {
    if (dirty && !confirm("You have unsaved changes. Discard?")) return;
    setSelectedFile(file);
    setEditContent(file.content || "");
    setEditFileName(file.file_name);
    setEditFolder(file.folder);
    setDirty(false);
    setEditorTab("code");
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    const { error } = await supabase
      .from("theme_files" as any)
      .update({ content: editContent, file_name: editFileName, folder: editFolder })
      .eq("id", selectedFile.id);
    if (error) { toast.error(error.message); return; }
    toast.success("File saved");
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["theme_files"] });
  };

  const createFile = async () => {
    if (!activeThemeId || !currentStore || !newFileName.trim()) return;
    const fileName = newFileName.trim();
    const filePath = `${newFileFolder}/${fileName}`;
    const { data, error } = await supabase
      .from("theme_files" as any)
      .insert({
        theme_id: activeThemeId,
        store_id: currentStore.id,
        file_path: filePath,
        file_name: fileName,
        folder: newFileFolder,
        file_type: detectFileType(fileName),
        content: "",
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success(`File "${fileName}" created`);
    setNewFileDialog(false);
    setNewFileName("");
    qc.invalidateQueries({ queryKey: ["theme_files"] });
    openFile(data);
  };

  const deleteFile = async (fileId: string) => {
    const { error } = await supabase.from("theme_files" as any).delete().eq("id", fileId);
    if (error) { toast.error(error.message); return; }
    toast.success("File deleted");
    if (selectedFile?.id === fileId) setSelectedFile(null);
    qc.invalidateQueries({ queryKey: ["theme_files"] });
  };

  // ── ZIP Import ──
  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFile(file);
    try {
      const zip = await JSZip.loadAsync(file);
      const preview: { path: string; folder: string }[] = [];
      zip.forEach((path, entry) => {
        if (!entry.dir && !path.startsWith("__MACOSX") && !path.startsWith(".")) {
          // Strip the top-level theme folder name if present
          const cleanPath = path.includes("/") ? path : path;
          preview.push({ path: cleanPath, folder: detectFolder(cleanPath) });
        }
      });
      setImportPreview(preview);
      setImportDialog(true);
    } catch (err: any) {
      toast.error("Failed to read ZIP: " + err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importThemeFromZip = async (createNew: boolean) => {
    if (!zipFile || !currentStore) return;
    setImporting(true);

    try {
      const zip = await JSZip.loadAsync(zipFile);
      let themeId = activeThemeId;

      // Optionally create a new theme from the ZIP name
      if (createNew || !themeId) {
        const themeName = zipFile.name.replace(/\.zip$/i, "").replace(/[-_]/g, " ");
        const { data, error } = await supabase
          .from("theme_packages" as any)
          .insert({ store_id: currentStore.id, name: themeName })
          .select()
          .single();
        if (error) throw error;
        themeId = (data as any).id;
        setActiveThemeId(themeId);
      }

      const entries: { path: string; content: string }[] = [];
      const promises: Promise<void>[] = [];
      zip.forEach((path, entry) => {
        if (entry.dir || path.startsWith("__MACOSX") || path.startsWith(".")) return;
        // Skip binary files
        if (path.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|pdf)$/i)) return;
        promises.push(entry.async("string").then(content => { entries.push({ path, content }); }));
      });
      await Promise.all(promises);

      let imported = 0;
      for (const { path, content } of entries) {
        const fileName = path.split("/").pop() || path;
        const folder = detectFolder(path);
        const fileType = detectFileType(path);
        // Strip top-level folder from path for cleaner display
        const parts = path.split("/");
        const cleanPath = parts.length > 1 ? parts.slice(1).join("/") : path;
        const finalPath = `${folder}/${fileName}`;

        const { error } = await supabase
          .from("theme_files" as any)
          .upsert({
            theme_id: themeId,
            store_id: currentStore.id,
            file_path: finalPath,
            file_name: fileName,
            folder,
            file_type: fileType,
            content,
            file_size: new Blob([content]).size,
          }, { onConflict: "theme_id,file_path" });

        if (!error) imported++;
      }

      toast.success(`Imported ${imported} files into theme`);
      setImportDialog(false);
      setZipFile(null);
      setImportPreview([]);
      qc.invalidateQueries({ queryKey: ["theme_packages", "theme_files"] });
    } catch (err: any) {
      toast.error("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // ── Export theme as ZIP ──
  const exportTheme = async () => {
    if (!activeTheme || files.length === 0) return;
    const zip = new JSZip();
    const themeFolder = zip.folder(activeTheme.name.replace(/\s+/g, "-").toLowerCase());
    for (const f of files) {
      themeFolder?.file(f.file_path || f.file_name, f.content || "");
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTheme.name.replace(/\s+/g, "-").toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Theme exported");
  };

  // ── File tree ──
  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const groupedFiles: Record<string, any[]> = {};
  for (const f of THEME_FOLDERS) groupedFiles[f.key] = [];
  for (const f of files) {
    const folder = f.folder || "templates";
    if (!groupedFiles[folder]) groupedFiles[folder] = [];
    groupedFiles[folder].push(f);
  }

  const filteredFolders = THEME_FOLDERS.filter(f => {
    if (!searchQuery) return groupedFiles[f.key]?.length > 0 || true; // show all folders
    return groupedFiles[f.key]?.some((file: any) =>
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const previewHtml = editContent ? renderTemplate(editContent, MOCK_PREVIEW) : "";

  return (
    <AdminLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Theme Files</h1>
            <p className="text-xs text-muted-foreground">Manage your store themes — edit templates, CSS, snippets, and assets</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleZipSelect} />
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Import Theme ZIP
            </Button>
            <Button size="sm" className="text-xs gap-1" onClick={() => setNewThemeDialog(true)}>
              <Plus className="h-3.5 w-3.5" /> New Theme
            </Button>
          </div>
        </div>

        {/* Theme Tabs */}
        {themesLoading ? (
          <div className="flex gap-2"><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-32" /></div>
        ) : themes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-medium">No themes yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create a new theme or import one from a ZIP file. Each theme contains its own templates, CSS, snippets, and assets — just like Maropost.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Import from ZIP
                </Button>
                <Button size="sm" className="text-xs gap-1" onClick={() => setNewThemeDialog(true)}>
                  <Plus className="h-3.5 w-3.5" /> Create Theme
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Theme selector bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {themes.map((theme: any) => (
                <div key={theme.id} className="flex items-center">
                  <Button
                    variant={activeThemeId === theme.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs gap-1.5 rounded-r-none"
                    onClick={() => { setActiveThemeId(theme.id); setSelectedFile(null); }}
                  >
                    <Palette className="h-3.5 w-3.5" />
                    {theme.name}
                    {theme.is_active && <Badge variant="secondary" className="text-[8px] h-4 px-1 ml-1 bg-primary/20 text-primary">Active</Badge>}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={activeThemeId === theme.id ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-7 p-0 rounded-l-none border-l-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => setActiveTheme(theme.id)} className="text-xs gap-2">
                        <Star className="h-3 w-3" /> Set as Active Theme
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateTheme(theme)} className="text-xs gap-2">
                        <Copy className="h-3 w-3" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportTheme} className="text-xs gap-2">
                        <Download className="h-3 w-3" /> Export as ZIP
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteTheme(theme.id)} className="text-xs gap-2 text-destructive">
                        <Trash2 className="h-3 w-3" /> Delete Theme
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {/* Main layout: File Tree + Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" style={{ minHeight: "calc(100vh - 220px)" }}>
              {/* File Tree */}
              <Card className="lg:col-span-3">
                <CardHeader className="py-2 px-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{activeTheme?.name || "Theme"}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setNewFileFolder("templates"); setNewFileDialog(true); }}>
                      <FilePlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="h-7 text-xs pl-8" placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="px-1 pb-2">
                      {filesLoading ? (
                        <div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
                      ) : (
                        filteredFolders.map(folder => {
                          const folderFiles = (groupedFiles[folder.key] || []).filter((f: any) =>
                            !searchQuery || f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
                          );
                          const isExpanded = expandedFolders.has(folder.key);
                          const Icon = folder.icon;

                          return (
                            <div key={folder.key}>
                              <button
                                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium hover:bg-muted/50 rounded-sm group"
                                onClick={() => toggleFolder(folder.key)}
                              >
                                {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                                {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" /> : <FolderClosed className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                <span>{folder.label}</span>
                                <Badge variant="secondary" className="text-[9px] ml-auto h-4 px-1">{folderFiles.length}</Badge>
                                <button
                                  className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center hover:bg-muted rounded"
                                  onClick={(e) => { e.stopPropagation(); setNewFileFolder(folder.key); setNewFileDialog(true); }}
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                              </button>
                              {isExpanded && (
                                <div className="ml-4 border-l border-border/40 pl-1">
                                  {folderFiles.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground px-3 py-1 italic">Empty folder</p>
                                  ) : (
                                    folderFiles.map((file: any) => {
                                      const FIcon = FILE_TYPE_ICONS[file.file_type] || File;
                                      return (
                                        <button
                                          key={file.id}
                                          className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-muted/50 rounded-sm truncate group ${
                                            selectedFile?.id === file.id ? "bg-accent text-accent-foreground" : ""
                                          }`}
                                          onClick={() => openFile(file)}
                                        >
                                          <FIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          <span className="truncate">{file.file_name}</span>
                                          <button
                                            className="opacity-0 group-hover:opacity-100 ml-auto h-4 w-4 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
                                            onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                          </button>
                                        </button>
                                      );
                                    })
                                  )}
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

              {/* Editor */}
              <Card className="lg:col-span-9 flex flex-col">
                {!selectedFile ? (
                  <CardContent className="flex flex-col items-center justify-center flex-1 min-h-[400px] text-center">
                    <FileCode2 className="h-12 w-12 text-muted-foreground/20 mb-3" />
                    <h3 className="text-sm font-medium text-muted-foreground">Select a file to edit</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Choose a template file from the folder tree, or create a new file in any folder.
                    </p>
                  </CardContent>
                ) : (
                  <>
                    {/* File header bar */}
                    <CardHeader className="py-2 px-4 border-b flex-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-[9px] shrink-0">{editFolder}</Badge>
                          <span className="text-xs font-mono font-medium truncate">{editFileName}</span>
                          {dirty && <Badge variant="secondary" className="text-[8px] h-4 px-1">Modified</Badge>}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedFile(null); setDirty(false); }}>
                            Close
                          </Button>
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={saveFile} disabled={!dirty}>
                            <Save className="h-3 w-3" /> Save
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Tabs */}
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <Tabs value={editorTab} onValueChange={setEditorTab} className="flex-1 flex flex-col">
                        <div className="border-b px-4 py-1.5 flex-none">
                          <TabsList className="h-7">
                            <TabsTrigger value="code" className="text-xs h-6 px-3 gap-1"><Code2 className="h-3 w-3" /> Code</TabsTrigger>
                            <TabsTrigger value="preview" className="text-xs h-6 px-3 gap-1"><Eye className="h-3 w-3" /> Preview</TabsTrigger>
                            <TabsTrigger value="settings" className="text-xs h-6 px-3 gap-1"><Settings2 className="h-3 w-3" /> Settings</TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="code" className="m-0 p-0 flex-1">
                          <Textarea
                            className="min-h-[500px] h-full border-0 rounded-none font-mono text-xs leading-relaxed resize-none focus-visible:ring-0"
                            value={editContent}
                            onChange={(e) => { setEditContent(e.target.value); setDirty(true); }}
                            placeholder="Enter file content..."
                          />
                        </TabsContent>

                        <TabsContent value="preview" className="m-0 p-4 flex-1 overflow-auto">
                          {previewHtml ? (
                            <div className="prose prose-sm max-w-none border rounded-md p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-12">Enter content to preview.</p>
                          )}
                        </TabsContent>

                        <TabsContent value="settings" className="m-0 p-4 flex-1">
                          <div className="max-w-md space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">File Name</Label>
                              <Input className="h-8 text-xs" value={editFileName} onChange={(e) => { setEditFileName(e.target.value); setDirty(true); }} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Folder</Label>
                              <select
                                className="w-full h-8 text-xs border rounded px-2 bg-background"
                                value={editFolder}
                                onChange={(e) => { setEditFolder(e.target.value as FolderKey); setDirty(true); }}
                              >
                                {THEME_FOLDERS.map(f => (
                                  <option key={f.key} value={f.key}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">File Type</Label>
                              <Input className="h-8 text-xs" value={selectedFile?.file_type || ""} disabled />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">File Path</Label>
                              <Input className="h-8 text-xs font-mono" value={selectedFile?.file_path || ""} disabled />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </>
        )}

        {/* New Theme Dialog */}
        <Dialog open={newThemeDialog} onOpenChange={setNewThemeDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-base">Create New Theme</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Theme Name</Label>
                <Input className="h-8 text-xs" placeholder="e.g. My Custom Theme" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Input className="h-8 text-xs" placeholder="Brief description" value={newThemeDesc} onChange={(e) => setNewThemeDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setNewThemeDialog(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={createTheme} disabled={!newThemeName.trim()}>Create Theme</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New File Dialog */}
        <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-base">Create New File</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">File Name</Label>
                <Input className="h-8 text-xs font-mono" placeholder="e.g. product-detail.template.html" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Folder</Label>
                <select
                  className="w-full h-8 text-xs border rounded px-2 bg-background"
                  value={newFileFolder}
                  onChange={(e) => setNewFileFolder(e.target.value as FolderKey)}
                >
                  {THEME_FOLDERS.map(f => (
                    <option key={f.key} value={f.key}>{f.label} — {f.description}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setNewFileDialog(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={createFile} disabled={!newFileName.trim()}>Create File</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import ZIP Dialog */}
        <Dialog open={importDialog} onOpenChange={setImportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" /> Import Theme from ZIP
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Archive className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium">{zipFile?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{importPreview.length} files found</p>
                </div>
              </div>

              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-0.5">
                  {importPreview.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted/50 rounded">
                      <FileCode2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate font-mono text-[10px] flex-1">{f.path}</span>
                      <Badge variant="outline" className="text-[8px] shrink-0">{f.folder}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-start gap-2 p-2 border border-muted bg-muted/30 rounded-md">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">
                  Files are auto-categorized into folders (templates, css, snippets, etc.) based on their path and extension.
                  Existing files with matching paths will be overwritten.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setImportDialog(false); setZipFile(null); }}>Cancel</Button>
                {activeThemeId && (
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => importThemeFromZip(false)} disabled={importing}>
                    {importing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Import into "{activeTheme?.name}"
                  </Button>
                )}
                <Button size="sm" className="text-xs gap-1" onClick={() => importThemeFromZip(true)} disabled={importing}>
                  {importing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Import as New Theme
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
