import { SidebarProvider } from "@/components/ui/sidebar";
import { PlatformSidebar } from "./PlatformSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PlatformSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 border-b flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">Platform Administration</span>
            </div>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </header>
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
