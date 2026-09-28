"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { secureStorage } from "@/lib/secureStorage";
import { getBackendApiUrl } from "@/lib/apiConfig";
import { Trash2, Plus, Key, Copy, Trash, Settings2, Sparkles, Sliders, Shield } from "lucide-react";

export default function ApiKeysAndSettingsPage() {
  const [activeTab, setActiveTab] = useState<"n8n" | "ai">("n8n");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "info" | "error">("info");
  const [isPro, setIsPro] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // --- n8n Connection States ---
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSavingN8n, setIsSavingN8n] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<"idle" | "testing" | "connected" | "failed">("idle");

  // --- AI Config States ---
  const [providers, setProviders] = useState([{ baseUrl: "", apiKey: "", model: "" }]);
  const [modelsCache, setModelsCache] = useState<{ [index: number]: any[] }>({});
  const [isFetchingModels, setIsFetchingModels] = useState<{ [index: number]: boolean }>({});
  const [isSavingAi, setIsSavingAi] = useState(false);



  // Load Configurations on Mount
  useEffect(() => {
    // Load n8n Connection
    const n8nConfig = secureStorage.get("n8n_config_default");
    if (n8nConfig) {
      setEndpointUrl(n8nConfig.endpointUrl || "");
      setApiToken(n8nConfig.apiToken || "");
      if (n8nConfig.endpointUrl && n8nConfig.apiToken) {
        setN8nStatus("connected");
      }
    }

    // Load AI Provider Configurations & Subscription Status
    const loadConfigAndStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        
        // Check subscription status
        try {
          const subRes = await fetch(`${getBackendApiUrl()}/api/billing/subscription-status`, {
            headers: { "Authorization": `Bearer ${session.access_token}` }
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setIsPro(!!subData.active);
          }
        } catch (e) {
          console.error("Failed to fetch subscription status:", e);
        } finally {
          setIsLoadingStatus(false);
        }
        
        // Load local encrypted AI providers if present
        const savedAiConfig = secureStorage.get("ai_providers_default");
        if (savedAiConfig && Array.isArray(savedAiConfig) && savedAiConfig.length > 0) {
          setProviders(savedAiConfig);
          const initialCache: any = {};
          savedAiConfig.forEach((p: any, idx: number) => {
            if (p.model) initialCache[idx] = [{ id: p.model }];
          });
          setModelsCache(initialCache);
        } else {
          try {
            const res = await fetch(`${getBackendApiUrl()}/api/user/llm-config`, {
              headers: { "Authorization": `Bearer ${session.access_token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.providers && data.providers.length > 0) {
                setProviders(data.providers);
                const initialCache: any = {};
                data.providers.forEach((p: any, idx: number) => {
                  if (p.model) initialCache[idx] = [{ id: p.model }];
                });
                setModelsCache(initialCache);
              }
            }
          } catch (e) {
            // Ignore backend config fetch error if local storage is empty
          }
        }
      } catch (err) {
        console.error("Failed to load AI config:", err);
      }
    };

    loadConfigAndStatus();
  }, []);

  const showMessage = (text: string, type: "success" | "info" | "error" = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  // --- Save n8n Connection ---
  const handleSaveN8n = async () => {
    if (!endpointUrl || !apiToken) {
      showMessage("Please fill all fields before saving.", "error");
      return;
    }

    setIsSavingN8n(true);
    setN8nStatus("testing");
    setMessage("");

    try {
      // Test the connection
      const testRes = await fetch('/api/test-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl, apiToken })
      });
      
      const testData = await testRes.json();
      if (!testData.success) {
         setN8nStatus("failed");
         showMessage(testData.error || "Failed to connect to n8n instance. Check your URL and API Key.", "error");
         setIsSavingN8n(false);
         return; 
      }
      
      setN8nStatus("connected");
      secureStorage.set("n8n_config_default", { endpointUrl, apiToken });

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch(`${getBackendApiUrl()}/api/workspaces/default/config`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ endpointUrl, apiToken })
      });

      showMessage("✅ n8n connection verified, saved locally and synced!", "success");
    } catch (err) {
      setN8nStatus("failed");
      showMessage("⚠️ Failed to verify n8n connection. Please check your network.", "error");
    } finally {
      setIsSavingN8n(false);
    }
  };

  // --- AI config handlers ---
  const handleProviderChange = (index: number, field: string, value: string) => {
    const newProviders = [...providers];
    newProviders[index] = { ...newProviders[index], [field]: value };
    setProviders(newProviders);
  };

  const addProvider = () => {
    setProviders([...providers, { baseUrl: "", apiKey: "", model: "" }]);
  };

  const removeProvider = (index: number) => {
    if (providers.length > 1) {
      const newProviders = providers.filter((_, i) => i !== index);
      setProviders(newProviders);
      const newCache = { ...modelsCache };
      delete newCache[index];
      setModelsCache(newCache);
    }
  };

  const handleFetchModels = async (index: number) => {
    const provider = providers[index];
    if (!provider.baseUrl || !provider.apiKey) {
      showMessage(`Please provide both Base URL and API Key for provider ${index + 1}.`, "error");
      return;
    }
    
    setIsFetchingModels({ ...isFetchingModels, [index]: true });
    setMessage("");
    
    try {
      const res = await fetch('/api/test-llm', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: provider.baseUrl, apiKey: provider.apiKey })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success && data.data) {
        setModelsCache({ ...modelsCache, [index]: data.data });
        showMessage(`Successfully fetched ${data.data.length} models for provider ${index + 1}.`, "success");
        if (data.data.length > 0 && !provider.model) {
          handleProviderChange(index, "model", data.data[0].id);
        }
      } else {
        showMessage(data.error || `Failed to fetch models for provider ${index + 1}.`, "error");
        setModelsCache({ ...modelsCache, [index]: [] });
      }
    } catch (err) {
      showMessage("Network error while testing LLM connection.", "error");
      setModelsCache({ ...modelsCache, [index]: [] });
    } finally {
      setIsFetchingModels({ ...isFetchingModels, [index]: false });
    }
  };

  const handleSaveAiConfig = async () => {
    for (let i = 0; i < providers.length; i++) {
      if (!providers[i].baseUrl || !providers[i].apiKey || !providers[i].model) {
        showMessage(`Please fill all fields for provider ${i + 1} before saving.`, "error");
        return;
      }
    }

    setIsSavingAi(true);
    setMessage("");

    try {
      // SECURITY: Store credentials in client-side AES-encrypted local storage
      secureStorage.set("ai_providers_default", providers);

      // Best-effort sync with backend if available
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          await fetch(`${getBackendApiUrl()}/api/user/llm-config`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ providers })
          });
        }
      } catch (backendErr) {
        // Ignore backend unreachable error since local encrypted storage succeeded
      }

      showMessage("✅ AI Configurations saved securely in encrypted storage!", "success");
    } catch (err) {
      showMessage("Failed to save AI configuration.", "error");
    } finally {
      setIsSavingAi(false);
    }
  };



  return (
    <div className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto bg-background text-foreground h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API & Configuration Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your n8n connections, setup custom AI providers (BYOK), and manage Control Plane API Keys.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab("n8n"); setMessage(""); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "n8n"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings2 className="w-4 h-4" /> n8n Connection
          </button>
          <button
            onClick={() => { setActiveTab("ai"); setMessage(""); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "ai"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Configuration (BYOK)
          </button>
        </div>

        {/* Status Message Display */}
        {message && (
          <div className={`text-sm font-medium p-3 rounded-md border ${
            messageType === "success" 
              ? "text-emerald-600 bg-emerald-50/50 border-emerald-200" 
              : messageType === "error" 
                ? "text-destructive bg-destructive/10 border-destructive/20"
                : "text-muted-foreground bg-muted/50 border-border"
          }`}>
            {message}
          </div>
        )}

        {!isLoadingStatus && !isPro && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 p-4 rounded-md flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2"><Shield className="w-5 h-5" /> Pro Feature</h3>
              <p className="text-sm mt-1">You must have an active Pro subscription to configure your own n8n instance and AI providers (BYOK).</p>
            </div>
            <a href="/dashboard/billing">
              <Button variant="outline" className="border-yellow-500/50 text-yellow-700 hover:bg-yellow-500/20">Upgrade to Pro</Button>
            </a>
          </div>
        )}

        {/* Tab Contents */}
        {activeTab === "n8n" && (
          <div className="space-y-6">
            <Card className="bg-card border-border/50 text-card-foreground shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" /> n8n Instance Connection
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Connect FlowForge to your self-hosted n8n instance. These credentials will be used to deploy and sync your AI workflows.
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
                    disabled={!isPro}
                    className="bg-background border-border/50 focus-visible:ring-primary/50"
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
                    disabled={!isPro}
                    className="bg-background border-border/50 focus-visible:ring-primary/50"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a new key under: n8n → Settings → API
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-6 flex items-center justify-between">
                <Button 
                  onClick={handleSaveN8n} 
                  disabled={isSavingN8n || !isPro}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  {isSavingN8n ? "Saving..." : "Save Connection Details"}
                </Button>
                {n8nStatus === "connected" && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                    ● Connected
                  </Badge>
                )}
                {n8nStatus === "failed" && (
                  <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
                    ● Failed
                  </Badge>
                )}
                {n8nStatus === "testing" && (
                  <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
                    ● Testing
                  </Badge>
                )}
              </CardFooter>
            </Card>

            <Card className="bg-card border-border/50 text-card-foreground shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">How to get your n8n API Key</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open your self-hosted n8n instance</li>
                  <li>Click <strong className="text-foreground">Settings</strong> on the left-side navigation</li>
                  <li>Go to <strong className="text-foreground">API</strong></li>
                  <li>Select <strong className="text-foreground">Create API Key</strong></li>
                  <li>Copy and paste the generated key here</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "ai" && (
          <Card className="bg-card border-border/50 text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Providers (BYOK)
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Set up custom OpenAI-compatible endpoints (OpenAI, Groq, OpenRouter, or Ollama) to power your control plane's workflow modifications and patching engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {providers.map((provider, index) => (
                <div key={index} className="p-6 border border-border rounded-lg bg-card/50 space-y-6 relative group">
                  <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
                    <h3 className="font-semibold text-base">
                      Provider {index + 1} {index === 0 && <span className="text-xs ml-2 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-normal">Primary</span>}
                    </h3>
                    {providers.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeProvider(index)}
                        disabled={!isPro}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`baseUrl-${index}`}>Base URL</Label>
                      <Input 
                        id={`baseUrl-${index}`}
                        placeholder="https://api.openai.com/v1" 
                        value={provider.baseUrl}
                        onChange={(e) => handleProviderChange(index, "baseUrl", e.target.value)}
                        disabled={!isPro}
                        className="bg-background border-border/50 focus-visible:ring-primary/50"
                        autoComplete="off"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`apiKey-${index}`}>API Key</Label>
                      <Input 
                        id={`apiKey-${index}`}
                        type="password" 
                        placeholder="sk-..." 
                        value={provider.apiKey}
                        onChange={(e) => handleProviderChange(index, "apiKey", e.target.value)}
                        disabled={!isPro}
                        className="bg-background border-border/50 focus-visible:ring-primary/50"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleFetchModels(index)} 
                      disabled={isFetchingModels[index] || !isPro}
                      className="bg-secondary border-border/50 hover:bg-secondary/80 text-secondary-foreground shadow-sm transition-colors whitespace-nowrap"
                    >
                      {isFetchingModels[index] ? "Fetching..." : "Test Connection & Load Models"}
                    </Button>

                    {modelsCache[index] && modelsCache[index].length > 0 && (
                      <div className="space-y-2 flex-1">
                        <Label htmlFor={`model-${index}`}>Selected Model</Label>
                        <select 
                          id={`model-${index}`}
                          value={provider.model}
                          onChange={(e) => handleProviderChange(index, "model", e.target.value)}
                          disabled={!isPro}
                          className="flex h-10 w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                        >
                          <option value="" disabled>Select a model...</option>
                          {modelsCache[index].map((m) => (
                            <option key={m.id} value={m.id}>{m.id}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button 
                variant="outline" 
                onClick={addProvider}
                disabled={!isPro}
                className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Fallback AI Provider
              </Button>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-6">
              <Button 
                onClick={handleSaveAiConfig} 
                disabled={isSavingAi || !isPro}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
              >
                {isSavingAi ? "Saving AI Config..." : "Save AI Providers"}
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  );
}
