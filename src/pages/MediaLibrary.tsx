import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Image, Upload, Search, Copy, FileImage, Film, FileText as FileIcon } from "lucide-react";
import { format } from "date-fns";

const FOLDERS = ["general", "products", "banners", "blog", "icons"];

export default function MediaLibrary() {
  const { currentStore, user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("all");
  const [uploading, setUploading] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["media_assets", currentStore?.id, folder],
    queryFn: async () => {
      if (!currentStore) return [];
      let q = supabase.from("media_assets" as any).select("*").eq("store_id", currentStore.id).order("created_at", { ascending: false });
      if (folder !== "all") q = q.eq("folder", folder);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentStore || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${currentStore.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, file);
      if (uploadErr) { toast.error(`Upload failed: ${uploadErr.message}`); continue; }

      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);

      const isImage = file.type.startsWith("image/");
      await supabase.from("media_assets" as any).insert({
        store_id: currentStore.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        folder: folder === "all" ? "general" : folder,
        uploaded_by: user.id,
      });
    }

    qc.invalidateQueries({ queryKey: ["media_assets"] });
    setUploading(false);
    toast.success(`${files.length} file(s) uploaded`);
    e.target.value = "";
  };

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media_assets" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media_assets"] });
      toast.success("Asset deleted");
    },
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const filtered = (assets as any[]).filter((a: any) =>
    !search || a.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIcon = (type: string) => {
    if (type?.startsWith("image/")) return <FileImage className="h-4 w-4" />;
    if (type?.startsWith("video/")) return <Film className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Media Library</h1>
            <p className="text-xs text-muted-foreground">Manage images, files, and media assets</p>
          </div>
          <div className="flex items-center gap-2">
            <label>
              <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,video/*,.pdf,.doc,.docx" />
              <Button size="sm" className="h-8 text-xs gap-1" asChild disabled={uploading}>
                <span><Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload"}</span>
              </Button>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="h-8 text-xs pl-7" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={folder} onValueChange={setFolder}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Folders</SelectItem>
              {FOLDERS.map(f => <SelectItem key={f} value={f} className="text-xs capitalize">{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No media assets yet. Upload files to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((asset: any) => (
              <Card key={asset.id} className="overflow-hidden group relative">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {asset.file_type?.startsWith("image/") ? (
                    <img src={asset.file_url} alt={asset.alt_text || asset.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      {getIcon(asset.file_type)}
                      <span className="text-[10px] uppercase">{asset.file_type?.split("/")[1] || "file"}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{asset.file_name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{formatSize(asset.file_size)}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">{asset.folder}</Badge>
                  </div>
                </CardContent>
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => copyUrl(asset.file_url)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => remove.mutate(asset.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
