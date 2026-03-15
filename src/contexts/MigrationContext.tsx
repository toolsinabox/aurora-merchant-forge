import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MigrationEntity {
  entity: string;
  label: string;
  count: number;
  selected: boolean;
  status: "pending" | "importing" | "success" | "failed" | "skipped" | "paused";
  imported: number;
  failed: number;
  errors: string[];
  pages: number;
  batchProgress?: number;
  sampleFields?: string[];
}

interface MigrationState {
  isRunning: boolean;
  isPaused: boolean;
  entities: MigrationEntity[];
  overallProgress: number;
  logs: string[];
  storeDomain: string;
  apiKey: string;
  currentEntity: string | null;
}

interface MigrationContextType {
  state: MigrationState;
  startBackgroundImport: (params: {
    entities: MigrationEntity[];
    storeDomain: string;
    apiKey: string;
    storeId: string;
    dryRun?: boolean;
  }) => void;
  retryEntity: (entityName: string, storeId: string) => void;
  togglePause: () => void;
  dismiss: () => void;
  addLog: (msg: string) => void;
  setEntities: React.Dispatch<React.SetStateAction<MigrationEntity[]>>;
}

const MigrationContext = createContext<MigrationContextType | null>(null);

export const useMigration = () => {
  const ctx = useContext(MigrationContext);
  if (!ctx) throw new Error("useMigration must be used within MigrationProvider");
  return ctx;
};

const FETCH_ACTION_MAP: Record<string, string> = {
  products: "get_products", categories: "get_categories",
  customers: "get_customers", orders: "get_orders",
  content: "get_content", templates: "get_content",
  shipping: "get_shipping", vouchers: "get_vouchers",
  suppliers: "get_suppliers", payments: "get_payments",
  rma: "get_rma", warehouses: "get_warehouses",
  currency: "get_currency",
};

const IMPORT_ACTION_MAP: Record<string, string> = {
  products: "import_products", categories: "import_categories",
  customers: "import_customers", orders: "import_orders",
  content: "import_content", vouchers: "import_vouchers",
  suppliers: "import_suppliers", warehouses: "import_warehouses",
  shipping: "import_shipping", rma: "import_rma",
  templates: "import_theme_css", payments: "import_orders",
  currency: "import_currencies", redirects: "import_redirects",
};

const ITEMS_PER_PAGE = 20;

export function MigrationProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<MigrationEntity[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [storeDomain, setStoreDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [currentEntity, setCurrentEntity] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pauseRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  }, []);

  const fetchAllPages = async (entity: string, domain: string, key: string): Promise<any[]> => {
    let allItems: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      while (pauseRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }

      const { data, error } = await supabase.functions.invoke("maropost-migration", {
        body: {
          action: FETCH_ACTION_MAP[entity] || "test_connection",
          store_domain: domain, api_key: key,
          page, limit: ITEMS_PER_PAGE,
        },
      });

      if (error) throw error;

      const responseData = data?.data;
      if (responseData) {
        const keys = Object.keys(responseData).filter(k => k !== "Messages" && k !== "CurrentTime" && k !== "Ack");
        if (keys.length > 0) {
          const items = responseData[keys[0]];
          if (Array.isArray(items) && items.length > 0) {
            allItems = [...allItems, ...items];
            addLog(`  Fetched page ${page + 1}: ${items.length} ${entity}`);
            if (items.length < ITEMS_PER_PAGE) hasMore = false;
          } else { hasMore = false; }
        } else { hasMore = false; }
      } else { hasMore = false; }
      page++;
      if (page >= 200) { addLog(`  ⚠ Reached 200-page limit for ${entity}`); break; }
    }

    return allItems;
  };

  const importEntityBatches = async (
    entity: MigrationEntity,
    sourceItems: any[],
    storeId: string,
    migrationJobId: string | null,
    dryRun: boolean,
  ) => {
    const batchSize = entity.entity === "products" ? 5 : entity.entity === "orders" ? 20 : 50;
    let totalImported = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < sourceItems.length; i += batchSize) {
      while (pauseRef.current) {
        setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, status: "paused" } : e));
        await new Promise(r => setTimeout(r, 500));
      }
      setEntities(prev => prev.map(e => e.entity === entity.entity && e.status === "paused" ? { ...e, status: "importing" } : e));

      const batch = sourceItems.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(sourceItems.length / batchSize);
      const batchPct = Math.round((batchNum / totalBatches) * 100);
      addLog(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

      setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, batchProgress: batchPct } : e));

      const importAction = IMPORT_ACTION_MAP[entity.entity];
      const dataKey = entity.entity === "products" ? "Item" : entity.entity === "categories" ? "Category" :
        entity.entity === "customers" ? "Customer" : entity.entity === "orders" ? "Order" :
        entity.entity === "content" ? "Content" : entity.entity === "vouchers" ? "Voucher" :
        entity.entity === "suppliers" ? "Supplier" : entity.entity === "warehouses" ? "Warehouse" :
        entity.entity === "shipping" ? "ShippingMethod" : entity.entity === "rma" ? "Rma" : "Item";

      let result: any = null;
      let lastError: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase.functions.invoke("maropost-import", {
          body: {
            action: importAction,
            store_id: storeId,
            source_data: { [dataKey]: batch },
            migration_job_id: migrationJobId,
            dry_run: dryRun,
          },
        });
        if (!error) { result = data; lastError = null; break; }
        lastError = error;
        addLog(`  ⚠ Batch ${batchNum} attempt ${attempt + 1} failed, retrying...`);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
      if (lastError) throw lastError;

      totalImported += result?.imported || 0;
      totalFailed += result?.failed || 0;
      if (result?.errors) allErrors.push(...result.errors);
    }

    return { totalImported, totalFailed, allErrors };
  };

  const startBackgroundImport = useCallback(({ entities: ents, storeDomain: domain, apiKey: key, storeId, dryRun = false }: {
    entities: MigrationEntity[];
    storeDomain: string;
    apiKey: string;
    storeId: string;
    dryRun?: boolean;
  }) => {
    const selected = ents.filter(e => e.selected);
    if (selected.length === 0) { toast.error("Select at least one entity to import"); return; }

    setEntities(ents);
    setStoreDomain(domain);
    setApiKey(key);
    setIsRunning(true);
    setIsPaused(false);
    setDismissed(false);
    pauseRef.current = false;
    setOverallProgress(0);
    addLog("═══ Starting Migration (Background) ═══");

    // Run the import in the background (not awaited)
    (async () => {
      let migrationJobId: string | null = null;
      try {
        const { data: job } = await (supabase.from("migration_jobs" as any).insert({
          store_id: storeId,
          source_platform: "maropost",
          source_domain: domain,
          status: "running",
          entities_selected: selected.map(e => e.entity),
          progress: {},
        } as any).select("id").single() as any);
        migrationJobId = job?.id || null;
      } catch { /* migration_jobs table may not exist */ }

      let completed = 0;
      const total = selected.length;

      for (const entity of selected) {
        while (pauseRef.current) {
          await new Promise(r => setTimeout(r, 500));
        }

        addLog(`▶ Importing ${entity.label}...`);
        setCurrentEntity(entity.entity);
        setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, status: "importing" } : e));

        try {
          const sourceItems = await fetchAllPages(entity.entity, domain, key);
          addLog(`  Fetched ${sourceItems.length} total ${entity.entity} from Maropost`);

          if (sourceItems.length === 0) {
            setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, status: "success", imported: 0 } : e));
            addLog(`  No ${entity.entity} to import, skipping`);
            completed++;
            setOverallProgress(Math.round((completed / total) * 100));
            continue;
          }

          const { totalImported, totalFailed, allErrors } = await importEntityBatches(entity, sourceItems, storeId, migrationJobId, dryRun);

          setEntities(prev => prev.map(e =>
            e.entity === entity.entity ? { ...e, status: totalFailed > 0 && totalImported === 0 ? "failed" : "success", imported: totalImported, failed: totalFailed, errors: allErrors } : e
          ));
          addLog(`  ✓ ${entity.label}: ${totalImported} imported, ${totalFailed} failed`);
        } catch (err: any) {
          setEntities(prev => prev.map(e =>
            e.entity === entity.entity ? { ...e, status: "failed", errors: [err.message] } : e
          ));
          addLog(`  ✗ ${entity.label} FAILED: ${err.message}`);
        }

        completed++;
        setOverallProgress(Math.round((completed / total) * 100));
      }

      if (migrationJobId) {
        await supabase.from("migration_jobs" as any).update({
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", migrationJobId);
      }

      setIsRunning(false);
      setCurrentEntity(null);
      addLog("═══ Migration Complete ═══");
      toast.success("Migration complete! All data has been imported.");
    })();
  }, [addLog]);

  const retryEntityFn = useCallback((entityName: string, storeId: string) => {
    const entity = entities.find(e => e.entity === entityName);
    if (!entity) return;

    setIsRunning(true);
    setDismissed(false);
    setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, status: "importing", imported: 0, failed: 0, errors: [] } : e));
    addLog(`▶ Retrying ${entity.label}...`);

    (async () => {
      try {
        const sourceItems = await fetchAllPages(entity.entity, storeDomain, apiKey);
        addLog(`  Fetched ${sourceItems.length} total ${entity.entity} from Maropost`);

        if (sourceItems.length === 0) {
          setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, status: "success", imported: 0 } : e));
          setIsRunning(false);
          return;
        }

        const { totalImported, totalFailed, allErrors } = await importEntityBatches(entity, sourceItems, storeId, null, false);

        setEntities(prev => prev.map(e =>
          e.entity === entityName ? { ...e, status: totalFailed > 0 && totalImported === 0 ? "failed" : "success", imported: totalImported, failed: totalFailed, errors: allErrors } : e
        ));
        addLog(`  ✓ ${entity.label}: ${totalImported} imported, ${totalFailed} failed`);
      } catch (err: any) {
        setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, status: "failed", errors: [err.message] } : e));
        addLog(`  ✗ ${entity.label} FAILED: ${err.message}`);
      }
      setIsRunning(false);
    })();
  }, [entities, storeDomain, apiKey, addLog]);

  const togglePause = useCallback(() => {
    const newPaused = !pauseRef.current;
    pauseRef.current = newPaused;
    setIsPaused(newPaused);
    addLog(newPaused ? "⏸ Migration paused" : "▶ Migration resumed");
    toast(newPaused ? "Migration paused" : "Migration resumed");
  }, [addLog]);

  const dismiss = useCallback(() => setDismissed(true), []);

  const state: MigrationState = {
    isRunning: isRunning && !dismissed,
    isPaused,
    entities,
    overallProgress,
    logs,
    storeDomain,
    apiKey,
    currentEntity,
  };

  return (
    <MigrationContext.Provider value={{ state, startBackgroundImport, retryEntity: retryEntityFn, togglePause, dismiss, addLog, setEntities }}>
      {children}
    </MigrationContext.Provider>
  );
}
