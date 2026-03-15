import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeFile {
  id: string;
  file_name: string;
  file_path: string;
  folder: string;
  file_type: string;
  content: string;
}

export interface ActiveTheme {
  id: string;
  name: string;
  files: ThemeFile[];
  cssFiles: ThemeFile[];
  jsFiles: ThemeFile[];
}

/**
 * Fetch the active theme package + all its files for a store.
 * Returns header, footer, CSS, and page templates ready to render.
 */
export function useActiveTheme(storeId: string | undefined) {
  return useQuery({
    queryKey: ["active_theme", storeId],
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ActiveTheme | null> => {
      if (!storeId) return null;

      // 1. Find active theme package
      const { data: pkg, error: pkgErr } = await supabase
        .from("theme_packages" as any)
        .select("id, name")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (pkgErr || !pkg) return null;

      // 2. Fetch all files for this theme, ordered by folder then file_path
      const { data: files, error: filesErr } = await supabase
        .from("theme_files" as any)
        .select("id, file_name, file_path, folder, file_type, content")
        .eq("theme_id", (pkg as any).id)
        .eq("store_id", storeId)
        .order("folder")
        .order("file_path");

      if (filesErr || !files) return null;

      const allFiles = files as any as ThemeFile[];

      // Match CSS/JS files by folder OR by file_path containing the directory
      const isCssFile = (f: ThemeFile) =>
        f.folder === "css" || f.file_path.match(/(?:^|\/)(css|styles|stylesheets)\//i) || f.file_name.endsWith(".css");
      const isJsFile = (f: ThemeFile) =>
        f.folder === "js" || f.file_path.match(/(?:^|\/)(js|javascript|scripts)\//i) || f.file_name.endsWith(".js");

      return {
        id: (pkg as any).id,
        name: (pkg as any).name,
        files: allFiles,
        cssFiles: allFiles.filter(f => isCssFile(f) && f.file_name.endsWith(".css")),
        jsFiles: allFiles.filter(f => isJsFile(f) && f.file_name.endsWith(".js")),
      };
    },
  });
}

/** Find a theme file by folder + partial name match */
export function findThemeFile(
  theme: ActiveTheme | null | undefined,
  folder: string,
  nameMatch: string | RegExp
): ThemeFile | undefined {
  if (!theme) return undefined;
  return theme.files.find(f => {
    // Match by folder field OR by file_path containing the folder directory
    const folderMatch = f.folder === folder || f.file_path.match(new RegExp(`(?:^|/)${folder}s?/`, "i"));
    if (!folderMatch) return false;
    if (typeof nameMatch === "string") {
      return f.file_name.toLowerCase().includes(nameMatch.toLowerCase());
    }
    return nameMatch.test(f.file_name);
  });
}

/**
 * Find the main template file in a Maropost theme folder.
 * Maropost convention: the main file is typically `template.html` in headers/footers,
 * and `default.template.html` for the homepage.
 */
export function findMainThemeFile(
  theme: ActiveTheme | null | undefined,
  folder: string
): ThemeFile | undefined {
  if (!theme) return undefined;
  
  // Match files by folder field OR by file_path containing the folder directory
  const folderFiles = theme.files.filter(f =>
    f.folder === folder || f.file_path.match(new RegExp(`(?:^|/)${folder}/`, "i"))
  );
  
  // Exclude files inside sub-directories like "includes" — we want the top-level template
  const topLevelFiles = folderFiles.filter(f => {
    const pathAfterFolder = f.file_path.replace(new RegExp(`^.*?${folder}/`, "i"), "");
    return !pathAfterFolder.includes("/"); // No further nesting
  });
  
  // Priority order for main template detection
  const priorities = [
    "template.html",
    "default.template.html",
    "index.template.html",
    "index.html",
    "home.template.html",
    "homepage.template.html",
  ];
  
  // Search top-level files first, then all folder files as fallback
  for (const candidates of [topLevelFiles, folderFiles]) {
    for (const name of priorities) {
      const found = candidates.find(f => f.file_name.toLowerCase() === name);
      if (found) return found;
    }
  }
  
  // Fallback: first HTML file at top level
  return topLevelFiles.find(f => f.file_name.endsWith(".html"))
    || folderFiles.find(f => f.file_name.endsWith(".html"));
}

/** Find all theme files in a folder */
export function findThemeFiles(
  theme: ActiveTheme | null | undefined,
  folder: string
): ThemeFile[] {
  if (!theme) return [];
  return theme.files.filter(f =>
    f.folder === folder || f.file_path.match(new RegExp(`(?:^|/)${folder}/`, "i"))
  );
}

/** Build an includes map from snippets for the B@SE engine */
export function buildIncludesMap(theme: ActiveTheme | null | undefined): Record<string, string> {
  if (!theme) return {};
  const map: Record<string, string> = {};
  for (const f of theme.files) {
    // Map by filename (without extension)
    const slug = f.file_name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    map[slug] = f.content || "";
    // Map by full file_path (with and without extension)
    map[f.file_path] = f.content || "";
    map[f.file_path.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_/]/g, "-")] = f.content || "";
    // Map by folder/filename for legacy includes
    const folderPath = `${f.folder}/${f.file_name}`;
    map[folderPath] = f.content || "";
    map[folderPath.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-_/]/g, "-")] = f.content || "";
  }
  return map;
}
