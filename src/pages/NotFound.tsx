import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center animate-fade-in max-w-md">
        {/* Large 404 number */}
        <div className="relative mb-6">
          <span className="text-[120px] sm:text-[160px] font-black leading-none text-gradient opacity-80 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-float">
              <Home className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Go Back
          </Button>
          <Button size="sm" asChild className="gap-1.5">
            <Link to="/">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
