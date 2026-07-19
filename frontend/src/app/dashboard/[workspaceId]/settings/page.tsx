"use client";

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

  // Load existing config from secure encrypted storage on mount
  useEffect(() => {
    const config = secureStorage.get(`n8n_config_${workspaceId}`);
    if (config) {
      setEndpointUrl(config.endpointUrl || "");
      setApiToken(config.apiToken || "");
    }
  }, [workspaceId]);

  const handleSaveConfig = async () => {
    if (!endpointUrl || !apiToken) {
      setMessage("Please fill all fields before saving.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      // SECURITY: Save to encrypted localStorage using AES encryption
      secureStorage.set(`n8n_config_${workspaceId}`, { endpointUrl, apiToken });

      // Also persist to backend (best-effort)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/config`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ endpointUrl, apiToken })
      });

      setMessage("✅ Configuration saved! You can now deploy workflows to your n8n instance.");
    } catch (err) {
      // Even if backend fails, localStorage save succeeded
      setMessage("⚠️ Saved locally. Backend not reachable — credentials will be used from browser storage.");
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
                onChange={(e) => setEndpointUrl(e.target.value)}
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
                onChange={(e) => setApiToken(e.target.value)}
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
            {endpointUrl && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                ● Endpoint configured
              </span>
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
