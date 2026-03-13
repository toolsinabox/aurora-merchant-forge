import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { getSubdomainSlug } from "@/lib/subdomain";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const isSubdomain = !!getSubdomainSlug();
    return <Navigate to={isSubdomain ? "/_cpanel" : "/login"} replace />;
  }
  return <>{children}</>;
}
