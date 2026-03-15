import { useMigration } from "@/contexts/MigrationContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Pause, Play, Loader2, CheckCircle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MigrationProgressWidget() {
  const { state, togglePause, dismiss } = useMigration();
  const navigate = useNavigate();

  if (!state.isRunning && state.overallProgress === 0) return null;
  // Show completion briefly
  if (!state.isRunning && state.overallProgress >= 100) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Migration Complete
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={dismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {state.entities.filter(e => e.status === "success").length} entities imported successfully.
          {state.entities.filter(e => e.status === "failed").length > 0 && ` ${state.entities.filter(e => e.status === "failed").length} failed.`}
        </p>
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { navigate("/_cpanel/migration"); dismiss(); }}>
          View Details
        </Button>
      </div>
    );
  }

  if (!state.isRunning) return null;

  const currentEntityLabel = state.entities.find(e => e.entity === state.currentEntity)?.label || "...";
  const importingEntity = state.entities.find(e => e.status === "importing");
  const batchPct = importingEntity?.batchProgress || 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {state.isPaused ? (
            <Pause className="h-4 w-4 text-yellow-500" />
          ) : (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          Migration {state.isPaused ? "Paused" : "In Progress"}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={togglePause}>
            {state.isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={dismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Progress value={state.overallProgress} className="h-2 mb-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1 truncate">
          <Package className="h-3 w-3 shrink-0" />
          <span className="truncate">{currentEntityLabel}</span>
          {batchPct > 0 && <span className="text-foreground font-medium">({batchPct}%)</span>}
        </div>
        <span className="font-medium text-foreground">{state.overallProgress}%</span>
      </div>

      <div className="mt-2 flex gap-1 flex-wrap">
        {state.entities.filter(e => e.selected).map(e => (
          <span key={e.entity} className={`inline-block w-2 h-2 rounded-full ${
            e.status === "success" ? "bg-green-500" :
            e.status === "failed" ? "bg-destructive" :
            e.status === "importing" ? "bg-primary animate-pulse" :
            e.status === "paused" ? "bg-yellow-500" :
            "bg-muted-foreground/30"
          }`} title={`${e.label}: ${e.status}`} />
        ))}
      </div>

      <Button
        variant="link"
        size="sm"
        className="w-full text-xs mt-1 h-6 p-0"
        onClick={() => navigate("/_cpanel/migration")}
      >
        View full details →
      </Button>
    </div>
  );
}
