"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useState, use, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { secureStorage } from "@/lib/secureStorage";

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  
  // SECURITY: Auth guard - redirect to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated } = useRequireAuth();
  
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [n8nStatus, setN8nStatus] = useState<"idle" | "testing" | "connected" | "failed">("idle");

  // Load existing config from secure encrypted storage on mount
  useEffect(() => {
    const config = secureStorage.get(`n8n_config_${workspaceId}`);
    if (config) {
      setEndpointUrl(config.endpointUrl || "");
      setApiToken(config.apiToken || "");
      if (config.endpointUrl && config.apiToken) {
        setN8nStatus("connected");
      }
    }
  }, [workspaceId]);

  const handleSaveConfig = async () => {
    if (!endpointUrl || !apiToken) {
      setMessage("Please fill all fields before saving.");
      return;
    }

    setIsSaving(true);
    setN8nStatus("testing");
    setMessage("");

    try {
      const testRes = await fetch('/api/test-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl, apiToken })
      });
      
      const testData = await testRes.json();
      if (!testData.success) {
         setN8nStatus("failed");
         setMessage(testData.error || "Failed to connect to n8n instance. Check your URL and API Key.");
         setIsSaving(false);
         return; 
      }
      
      setN8nStatus("connected");
      // SECURITY: Save to encrypted localStorage using AES encryption
      secureStorage.set(`n8n_config_${workspaceId}`, { endpointUrl, apiToken });

      // Also persist to backend (best-effort)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workspaces/${workspaceId}/config`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ endpointUrl, apiToken })
      });

      setMessage("✅ Connection verified & configuration saved!");
    } catch (err) {
      setN8nStatus("failed");
      setMessage("⚠️ Failed to verify n8n connection. Please check your credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  // SECURITY: Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-zinc-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-background text-foreground h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        
        <Card className="bg-card border-border/50 text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>n8n Instance Connection</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure the connection to your self-hosted n8n instance for this workspace. 
              These credentials are used when you click &quot;Deploy to n8n&quot; on the canvas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="endpointUrl">n8n Endpoint URL</Label>
              <Input 
                id="endpointUrl" 
                placeholder="https://n8n.yourdomain.com" 
                value={endpointUrl}
                onChange={(e) => { setEndpointUrl(e.target.value); setN8nStatus("idle"); }}
                className="bg-background border-border/50 focus-visible:ring-primary/50 shadow-sm"
              />
              <p className="text-xs text-muted-foreground">
                Example: <code>https://n8n.myserver.com</code> or <code>http://localhost:5678</code>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiToken">n8n API Key</Label>
              <Input 
                id="apiToken" 
                type="password" 
                placeholder="n8n_api_xxxxxxxxxxxxxxxxxxxx" 
                value={apiToken}
                onChange={(e) => { setApiToken(e.target.value); setN8nStatus("idle"); }}
                className="bg-background border-border/50 focus-visible:ring-primary/50 shadow-sm"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Find it in n8n → Settings → API → Create API Key
              </p>
            </div>

            {message && (
              <div className={`text-sm font-medium p-3 rounded-md border ${message.includes('saved') || message.includes('✅') ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-primary bg-muted/50 border-border/50'}`}>
                {message}
              </div>
            )}

          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6 flex gap-3">
            <Button 
              onClick={handleSaveConfig} 
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm transition-all"
            >
              {isSaving ? "Saving..." : "Save Connection Details"}
            </Button>
            {n8nStatus === "connected" && (
              <div className="flex items-center text-sm text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                Connected
              </div>
            )}
            {n8nStatus === "failed" && (
              <div className="flex items-center text-sm text-destructive font-medium bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
                <span className="w-2 h-2 rounded-full bg-destructive mr-2"></span>
                Failed
              </div>
            )}
            {n8nStatus === "testing" && (
              <div className="flex items-center text-sm text-yellow-500 font-medium bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
                Testing
              </div>
            )}
          </CardFooter>
        </Card>

        <Card className="bg-card border-border/50 text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>How to Get Your n8n API Key</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Open your n8n instance in the browser</li>
              <li>Go to <strong className="text-foreground">Settings</strong> in the left sidebar</li>
              <li>Click <strong className="text-foreground">API</strong></li>
              <li>Click <strong className="text-foreground">Create an API key</strong></li>
              <li>Copy the key and paste it above</li>
            </ol>
            <p className="pt-2 text-amber-600 font-medium">⚠️ Make sure the n8n Public API is enabled in n8n Settings → API.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
