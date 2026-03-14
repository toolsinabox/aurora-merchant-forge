import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Monitor, Smartphone, Globe, LogOut, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TwoFactorSetup } from "@/components/admin/TwoFactorSetup";

export default function Sessions() {
  const { user, signOut } = useAuth();
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);

  const load = async () => {
    const { data } = await supabase.auth.getSession();
    setCurrentSession(data.session);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSignOutAll = async () => {
    if (!confirm("Sign out of all sessions? You will be logged out.")) return;
    await supabase.auth.signOut({ scope: "global" });
    toast.success("All sessions revoked");
    window.location.href = "/login";
  };

  const handleRefreshToken = async () => {
    const { error } = await supabase.auth.refreshSession();
    if (error) { toast.error(error.message); return; }
    toast.success("Session refreshed");
    load();
  };

  const parseUserAgent = () => {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone/i.test(ua);
    const browser = /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : /Edge/i.test(ua) ? "Edge" : "Unknown";
    const os = /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : "Unknown";
    return { isMobile, browser, os };
  };

  const { isMobile, browser, os } = parseUserAgent();

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Session Management</h1>
            <p className="text-xs text-muted-foreground">View and manage your active sessions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefreshToken}>
              <RefreshCw className="h-4 w-4" /> Refresh Token
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={handleSignOutAll}>
              <LogOut className="h-4 w-4" /> Sign Out All
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Shield className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Current Session</p>
              <p className="text-xs text-muted-foreground mt-1">Active & Authenticated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              {isMobile ? <Smartphone className="h-8 w-8 mx-auto text-primary mb-2" /> : <Monitor className="h-8 w-8 mx-auto text-primary mb-2" />}
              <p className="text-sm font-medium">{browser} on {os}</p>
              <p className="text-xs text-muted-foreground mt-1">{isMobile ? "Mobile Device" : "Desktop"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Globe className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Logged in user</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading session data...</p>
            ) : currentSession ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Property</TableHead>
                    <TableHead className="text-xs h-8">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-sm">User ID</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{currentSession.user?.id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Email</TableCell>
                    <TableCell className="text-sm">{currentSession.user?.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Session Status</TableCell>
                    <TableCell><Badge variant="default" className="text-xs">Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Token Expires</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Provider</TableCell>
                    <TableCell className="text-sm">{currentSession.user?.app_metadata?.provider || "email"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Last Sign In</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {currentSession.user?.last_sign_in_at ? new Date(currentSession.user.last_sign_in_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Browser / OS</TableCell>
                    <TableCell className="text-sm">{browser} / {os}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Device Type</TableCell>
                    <TableCell className="text-sm">{isMobile ? "Mobile" : "Desktop"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Access Token (prefix)</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{currentSession.access_token?.slice(0, 20)}...</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No active session found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Refresh Session Token</p>
                <p className="text-xs text-muted-foreground">Extend your current session without re-logging in</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshToken}>Refresh</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Sign Out All Devices</p>
                <p className="text-xs text-muted-foreground">Revoke all active sessions across all devices</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleSignOutAll}>Sign Out All</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Sign Out This Device</p>
                <p className="text-xs text-muted-foreground">End your current session only</p>
              </div>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); window.location.href = "/login"; }}>Sign Out</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-muted-foreground">Add TOTP authenticator app for extra security</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShow2FA(true)}>Configure</Button>
            </div>
          </CardContent>
        </Card>

        <TwoFactorSetup open={show2FA} onOpenChange={setShow2FA} />
      </div>
    </AdminLayout>
  );
}
