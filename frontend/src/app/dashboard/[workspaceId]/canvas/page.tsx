"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useState, use, useEffect, useRef, useCallback } from "react";
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap, applyNodeChanges, NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWorkflowStore } from "@/store/useWorkflowStore";
import { BaseNode } from "@/components/BaseNode";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { secureStorage } from "@/lib/secureStorage";
import { useTheme } from "next-themes";
import { getLayoutedElements } from "@/lib/layout";
import { jsonrepair } from "jsonrepair";

type Message = { role: "user" | "assistant" | "system" | "tool"; content: string; tool_calls?: any; tool_call_id?: string; _id?: string };

function fixMojibake(text: string): string {
  if (!text) return text;
  return text
    .replace(/â€”/g, '—')
    .replace(/ðŸŸ¢/g, '🟢')
    .replace(/âš«/g, '⚫')
    .replace(/âœ…/g, '✅')
    .replace(/âš ï§/g, '⚠️')
    .replace(/ðŸš🚀/g, '🚀');
}

let _msgCounter = 0;
const makeMsg = (m: Omit<Message, '_id'>): Message => ({ ...m, _id: `msg_${Date.now()}_${_msgCounter++}` });

const nodeTypes = { custom: BaseNode };

// Default initial canvas state
const DEFAULT_INITIAL_NODES: any[] = [];
const DEFAULT_INITIAL_EDGES: any[] = [];

const generateNodeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const robustParseJSON = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      // 1. Try to repair the entire string
      return JSON.parse(jsonrepair(str));
    } catch (repairErr) {
      // 2. If it still fails, it might have garbage text around the JSON block
      const firstBrace = str.indexOf('{');
      const lastBrace = str.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = str.substring(firstBrace, lastBrace + 1);
        try {
          // 3. Repair the extracted JSON block
          return JSON.parse(jsonrepair(candidate));
        } catch (inner) {
          // 4. Ultimate fallback: try parsing as a raw JS object
          try {
            return new Function('return ' + candidate)();
          } catch (evalErr) {
            throw inner; // throw the original repair error
          }
        }
      }
      throw e;
    }
  }
};

export default function CanvasPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  
  // SECURITY: Auth guard - redirect to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireAuth();
  
  const { nodes, edges, loadedWorkflowId, workflowName, setNodes, setEdges, setLoadedWorkflowId, setWorkflowName } = useWorkflowStore();
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{ id: string; name: string; timestamp: string }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);
  const [compilerScore, setCompilerScore] = useState<{ score: number; warnings: string[]; nodeCount: number } | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Undo/Redo State
  const [history, setHistory] = useState<{ index: number; states: { nodes: any[]; edges: any[] }[] }>({ index: -1, states: [] });

  // Initialize history
  useEffect(() => {
    if (history.states.length === 0 && !isLoadingChat) {
      setHistory({
        index: 0,
        states: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]
      });
    }
  }, [isLoadingChat, nodes, edges, history.states.length]);

  const pushToHistory = useCallback((newNodes: any[], newEdges: any[]) => {
    setHistory(prev => {
      const newStates = prev.states.slice(0, prev.index + 1);
      newStates.push({ nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) });
      if (newStates.length > 50) newStates.shift();
      return { index: newStates.length - 1, states: newStates };
    });
  }, []);

  const undo = () => {
    if (history.index > 0) {
      const newIndex = history.index - 1;
      setHistory({ ...history, index: newIndex });
      setNodes(JSON.parse(JSON.stringify(history.states[newIndex].nodes)));
      setEdges(JSON.parse(JSON.stringify(history.states[newIndex].edges)));
    }
  };

  const redo = () => {
    if (history.index < history.states.length - 1) {
      const newIndex = history.index + 1;
      setHistory({ ...history, index: newIndex });
      setNodes(JSON.parse(JSON.stringify(history.states[newIndex].nodes)));
      setEdges(JSON.parse(JSON.stringify(history.states[newIndex].edges)));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [prompt]);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/chat`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((m: any) => m._id ? m : makeMsg(m)));
          }
          if (data.canvasState) {
            if (data.canvasState.nodes) setNodes(data.canvasState.nodes);
            if (data.canvasState.edges) setEdges(data.canvasState.edges);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsLoadingChat(false);
      }
    };
    
    const loadChatSessions = () => {
      const saved = localStorage.getItem(`chat_sessions_${workspaceId}`);
      if (saved) {
        setChatSessions(JSON.parse(saved));
      }
    };
    
    loadChatHistory();
    loadChatSessions();
  }, [workspaceId]);

  const saveChatHistory = async (newMessages: Message[], cNodes: any[], cEdges: any[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          messages: newMessages,
          canvasState: { nodes: cNodes, edges: cEdges }
        })
      });
      
      // Save chat session to localStorage
      let activeChatId = currentChatId;
      if (newMessages.length > 0 && !currentChatId) {
        activeChatId = Date.now().toString();
        const firstUserMsg = newMessages.find(m => m.role === 'user')?.content || 'New Chat';
        const chatName = firstUserMsg.substring(0, 50) + (firstUserMsg.length > 50 ? '...' : '');
        const newSession = {
          id: activeChatId,
          name: chatName,
          timestamp: new Date().toISOString()
        };
        const updatedSessions = [newSession, ...chatSessions];
        setChatSessions(updatedSessions);
        setCurrentChatId(activeChatId);
        localStorage.setItem(`chat_sessions_${workspaceId}`, JSON.stringify(updatedSessions));
      }
      if (activeChatId) {
        localStorage.setItem(`chat_data_${activeChatId}`, JSON.stringify({
          messages: newMessages,
          nodes: cNodes,
          edges: cEdges,
          loadedWorkflowId: useWorkflowStore.getState().loadedWorkflowId,
          workflowName: useWorkflowStore.getState().workflowName
        }));
      }
    } catch (err) {
      console.error("Failed to save chat history:", err);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setNodes(DEFAULT_INITIAL_NODES);
    setEdges(DEFAULT_INITIAL_EDGES);
    setLoadedWorkflowId(null);
    setWorkflowName("My n8n Workflow");
    setCurrentChatId(null);
    setPrompt("");
    setHistory({ index: 0, states: [{ nodes: DEFAULT_INITIAL_NODES, edges: DEFAULT_INITIAL_EDGES }] });
  };

  const loadChatSession = (sessionId: string) => {
    const savedData = localStorage.getItem(`chat_data_${sessionId}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setMessages(data.messages || []);
        setNodes(data.nodes || DEFAULT_INITIAL_NODES);
        setEdges(data.edges || DEFAULT_INITIAL_EDGES);
        setLoadedWorkflowId(data.loadedWorkflowId || null);
        setWorkflowName(data.workflowName || "My n8n Workflow");
        setCurrentChatId(sessionId);
      } catch (e) {
        console.error("Failed to parse chat data", e);
        startNewChat();
      }
    } else {
      startNewChat();
    }
    setIsChatHistoryOpen(false);
  };

  const deleteChatSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    localStorage.setItem(`chat_sessions_${workspaceId}`, JSON.stringify(updatedSessions));
  };


  const handleDeploy = async () => {
    // Read n8n credentials from secure encrypted storage
    const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);

    if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "❌ No n8n credentials found. Please go to Workspace Config and save your n8n Endpoint URL and API Token first." 
      }]);
      return;
    }

    setIsDeploying(true);
    setIsCompiling(true);
    console.log(`[Canvas] Deploying to n8n. Endpoint: ${n8nConfig.endpointUrl}, Token length: ${n8nConfig.apiToken.length}, Token prefix: ${n8nConfig.apiToken.substring(0, 4)}...`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/deploy`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          workflowId: loadedWorkflowId,
          name: workflowName,
          nodes, 
          edges,
          n8nEndpointUrl: n8nConfig.endpointUrl,
          n8nApiToken: n8nConfig.apiToken
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.compiler) {
          setCompilerScore({ score: data.compiler.score, warnings: data.compiler.warnings || [], nodeCount: data.compiler.nodeCount });
        }
        setMessages(prev => [...prev, { role: "assistant", content: `✅ ${data.message}${data.compiler ? ` (Compiler score: ${data.compiler.score}/100, ${data.compiler.nodeCount} nodes)` : ''}` }]);
      } else {
        let cleanError = data.error;
        try {
          const parsed = JSON.parse(data.error);
          cleanError = parsed.errors.join('\\n- ');
        } catch (e) {
          cleanError = data.error.split('SYSTEM ACTION REQUIRED')[0].trim();
        }
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Deployment Failed:\n- ${cleanError}\n\nYou can ask me to "fix the deployment errors" and I will automatically correct the parameters and connections!` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Network error during deployment." }]);
    } finally {
      setIsDeploying(false);
      setIsCompiling(false);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim() || isTyping) return;
    
    console.log("[handleSend] User Prompt:", prompt);
    const userMessage: Message = makeMsg({ role: "user", content: prompt });
    let currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setPrompt("");
    setIsTyping(true);

    let localNodes = [...nodes];
    let localEdges = [...edges];
    let localLoadedWorkflowId = loadedWorkflowId; // track across setLoadedWorkflowId calls

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // ─── DETERMINISTIC WORKFLOW ID DETECTION ─────────────────────────────────
      // If the user's message contains a workflow ID pattern, auto-fetch it NOW
      // before the AI agent even runs, so the AI always operates on a loaded canvas.
      const idMatch = prompt.match(/\bID[:\s]+([A-Za-z0-9_-]{10,})\b/i) ||
                      prompt.match(/workflow[:\s(#]+([A-Za-z0-9_-]{10,})\b/i);
      if (idMatch) {
        const detectedId = idMatch[1];
        const n8nConfigPre = secureStorage.get(`n8n_config_${workspaceId}`);
        if (n8nConfigPre?.endpointUrl && n8nConfigPre?.apiToken && detectedId !== loadedWorkflowId) {
          console.log(`[Pre-fetch] Detected workflow ID: ${detectedId}. Auto-fetching...`);
          try {
            const proxyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/n8n-proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                n8nEndpointUrl: n8nConfigPre.endpointUrl,
                n8nApiToken: n8nConfigPre.apiToken,
                method: 'GET',
                path: `/api/v1/workflows/${detectedId}`
              })
            });
            const proxyData = await proxyRes.json();
            if (proxyData?.data?.id) {
              const wf = proxyData.data;
              setLoadedWorkflowId(wf.id);
              localLoadedWorkflowId = wf.id;
              setWorkflowName(wf.name);
              const fetchedNodes: any[] = [];
              const fetchedEdges: any[] = [];
              if (wf.nodes) {
                wf.nodes.forEach((n: any) => {
                  fetchedNodes.push({
                    id: generateNodeId(),
                    position: { x: n.position?.[0] || 250, y: n.position?.[1] || 100 },
                    data: { 
                      label: n.name, 
                      originalId: n.id || n.name,
                      parameters: n.parameters || {}
                    },
                    type: 'custom'
                  });
                });
              }
              if (wf.connections) {
                Object.entries(wf.connections).forEach(([srcName, connData]: [string, any]) => {
                  const srcNode = fetchedNodes.find(n => n.data.label === srcName);
                  if (srcNode && connData.main) {
                    connData.main.forEach((targets: any[], outputIdx: number) => {
                      targets?.forEach((t: any, targetIdx: number) => {
                        const tgtNode = fetchedNodes.find(n => n.data.label === t.node);
                        if (tgtNode) {
                          fetchedEdges.push({ id: `e-${srcNode.id}-${tgtNode.id}-${outputIdx}-${targetIdx}`, source: srcNode.id, target: tgtNode.id });
                        }
                      });
                    });
                  }
                });
              }
              setNodes(fetchedNodes);
              setEdges(fetchedEdges);
              localNodes = fetchedNodes;
              localEdges = fetchedEdges;
              // Inject a system message so the AI knows the workflow is loaded
              const sysMsg: Message = makeMsg({
                role: 'system' as any,
                content: `[System] Workflow "${wf.name}" (ID: ${wf.id}) has been loaded onto the canvas with ${fetchedNodes.length} nodes. The user wants to modify it. Proceed directly with their request using add_node, update_node, connect_nodes, or delete_node tools.`
              });
              currentMessages = [...currentMessages, sysMsg];
              console.log(`[Pre-fetch] Loaded workflow "${wf.name}" onto canvas.`);
            }
          } catch (e) {
            console.warn('[Pre-fetch] Failed to auto-fetch workflow:', e);
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────────

      let isDone = false;
      let iterations = 0;
      const MAX_ITERATIONS = 15;

      while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;
        console.log(`[Agent Loop] Starting iteration ${iterations}...`);
        
        // Only send user/assistant/tool messages, no system messages (backend handles system prompt)
        // Also strip internal properties like _id to prevent strict providers (like Anthropic) from rejecting the payload
        const payloadMessages = currentMessages
          .filter((m: any) => m.role !== 'system')
          .map((m: any) => {
            const cleanMsg: any = { role: m.role };
            if (m.content !== undefined) cleanMsg.content = m.content;
            if (m.tool_calls !== undefined) cleanMsg.tool_calls = m.tool_calls;
            if (m.tool_call_id !== undefined) cleanMsg.tool_call_id = m.tool_call_id;
            return cleanMsg;
          });

        console.log("[Agent Loop] Sending messages payload:", payloadMessages);

        const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
        const aiProviders = secureStorage.get("ai_providers_default");

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            messages: payloadMessages,
            canvasState: { nodes: localNodes, edges: localEdges },
            aiProviders: aiProviders || null,
            n8nConfig: n8nConfig ? { endpointUrl: n8nConfig.endpointUrl, apiToken: n8nConfig.apiToken } : null
          })
        });

        console.log(`[Agent Loop] Iteration ${iterations} response status:`, res.status);
        let data;
        try {
          data = await res.json();
        } catch (parseErr) {
          console.warn("[Agent Loop] Failed to parse JSON response");
          data = { error: `Invalid JSON response from server (HTTP ${res.status})` };
        }
        
        if (!res.ok) {
          console.warn(`[Agent Loop] Iteration ${iterations} failed with non-200 status`);
          const errMsg = data.error || (typeof data === 'string' ? data : JSON.stringify(data)) || "Failed to get response";
          currentMessages = [...currentMessages, { role: "assistant", content: `Error: ${errMsg} (Status ${res.status})` }];
          setMessages(currentMessages);
          break;
        }

        console.log(`[Agent Loop] Iteration ${iterations} payload response:`, data);

        if (data.choices && data.choices.length > 0) {
          const choice = data.choices[0];
          const aiMessage = makeMsg(choice.message);
          
          currentMessages = [...currentMessages, aiMessage];
          setMessages(currentMessages);
          
          if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            console.log(`[Agent Loop] LLM requested ${aiMessage.tool_calls.length} tool call(s):`, aiMessage.tool_calls);
            const toolResponses: Message[] = [];
            let newSysMessages = [];

            for (const toolCall of aiMessage.tool_calls) {
              let resultMessage = "Success";
              try {
                
                const args = robustParseJSON(toolCall.function.arguments || '{}');
                console.log(`[Agent Loop] Executing tool '${toolCall.function.name}' with args:`, args);
                
                if (toolCall.function.name === "generate_workflow") {
                  // SINGLE-SHOT: Generate entire workflow at once
                  const wfName = args.name || "Generated Workflow";
                  
                  // Clear canvas for new workflow
                  localNodes = [];
                  localEdges = [];
                  setLoadedWorkflowId(null);
                  localLoadedWorkflowId = null;
                  setWorkflowName(wfName);

                  // Add ALL nodes at once
                  if (args.nodes && Array.isArray(args.nodes)) {
                    args.nodes.forEach((n: any, index: number) => {
                      localNodes.push({
                        id: n.id || `node${index + 1}`,
                        position: { x: 250 + (index % 4) * 300, y: 100 + Math.floor(index / 4) * 200 },
                        data: { label: n.label, parameters: n.parameters || {}, diffState: 'added' },
                        type: 'custom'
                      });
                    });
                  }

                  // Add ALL connections at once
                  if (args.connections && Array.isArray(args.connections)) {
                    args.connections.forEach((conn: any, index: number) => {
                      localEdges.push({
                        id: `e-${conn.source}-${conn.target}-${index}`,
                        source: conn.source,
                        target: conn.target
                      });
                    });
                  }

                  // Auto-layout with dagre if available
                  try {
                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(localNodes, localEdges);
                    localNodes = layoutedNodes;
                    localEdges = layoutedEdges;
                  } catch (layoutErr) {
                    console.warn('[generate_workflow] Auto-layout failed, using grid layout:', layoutErr);
                  }

                  resultMessage = `Workflow "${wfName}" generated with ${localNodes.length} nodes and ${localEdges.length} connections.`;
                  newSysMessages.push(`Generated complete workflow: ${wfName} (${localNodes.length} nodes, ${localEdges.length} connections)`);
                  
                } else if (toolCall.function.name === "add_node") {
                  const newNodeId = args.id || generateNodeId();
                  if (localNodes.some(n => n.id === newNodeId)) {
                    resultMessage = `Error: Node with id '${newNodeId}' already exists. Use a unique id.`;
                    newSysMessages.push(`Failed to add node ${args.label} (duplicate id)`);
                  } else {
                    const lastNode = localNodes[localNodes.length - 1];
                    const newX = lastNode ? lastNode.position.x + 250 : 250;
                    const newY = lastNode ? lastNode.position.y : 100;
                    const newNode = {
                      id: newNodeId,
                      position: { x: newX, y: newY },
                      data: { label: args.label, parameters: args.parameters || {}, diffState: 'added' },
                      type: 'custom'
                    };
                    localNodes.push(newNode);
                    newSysMessages.push(`Added node: ${args.label} (${newNodeId})`);
                    resultMessage = `Node added with id ${newNodeId}`;
                  }
                } else if (toolCall.function.name === "create_new_workflow") {
                  localNodes = [];
                  localEdges = [];
                  setLoadedWorkflowId(null);
                  localLoadedWorkflowId = null;
                  const newName = args.name || "New Workflow";
                  setWorkflowName(newName);
                  newSysMessages.push(`Cleared canvas for new workflow: ${newName}`);
                  resultMessage = `Canvas cleared. Ready to build "${newName}"`;
                } else if (toolCall.function.name === "update_node") {
                  localNodes = localNodes.map(n => {
                    if (n.id === args.id) {
                      const updatedData = { ...n.data };
                      if (args.label) updatedData.label = args.label;
                      if (args.parameters) updatedData.parameters = args.parameters;
                      updatedData.diffState = 'modified';
                      return { ...n, data: updatedData };
                    }
                    return n;
                  });
                  newSysMessages.push(`Updated node: ${args.id}`);
                  resultMessage = `Node updated`;
                } else if (toolCall.function.name === "delete_node") {
                  // Find edges and nodes connected to this node before deletion
                  const incomingEdges = localEdges.filter(e => e.target === args.id);
                  const outgoingEdges = localEdges.filter(e => e.source === args.id);
                  
                  // Get node info before deletion for better reporting
                  const sources = incomingEdges.map(e => {
                    const sourceNode = localNodes.find(n => n.id === e.source);
                    return { id: e.source, label: sourceNode?.data.label || e.source };
                  });
                  const targets = outgoingEdges.map(e => {
                    const targetNode = localNodes.find(n => n.id === e.target);
                    return { id: e.target, label: targetNode?.data.label || e.target };
                  });
                  
                  // Remove node and its edges
                  localNodes = localNodes.filter(n => n.id !== args.id);
                  localEdges = localEdges.filter(e => e.source !== args.id && e.target !== args.id);
                  
                  // Build helpful message about disconnections
                  let disconnectionInfo = '';
                  if (sources.length > 0 && targets.length > 0) {
                    const sourceLabels = sources.map(s => s.label).join(', ');
                    const targetLabels = targets.map(t => t.label).join(', ');
                    disconnectionInfo = ` WARNING: This node was connecting ${sourceLabels} to ${targetLabels}. Consider reconnecting: ${sources.map(s => `connect_nodes(source_id="${s.id}", target_id="${targets[0].id}")`).join(' or ')}`;
                  }
                  
                  newSysMessages.push(`Deleted node: ${args.id}${disconnectionInfo}`);
                  resultMessage = `Node deleted${disconnectionInfo}`;
                } else if (toolCall.function.name === "connect_nodes") {
                  const newEdge = {
                    id: `e-${args.source_id}-${args.target_id}-${Date.now()}`,
                    source: args.source_id,
                    target: args.target_id
                  };
                  localEdges.push(newEdge);
                  
                  const sourceNode = localNodes.find(n => n.id === args.source_id);
                  const targetNode = localNodes.find(n => n.id === args.target_id);
                  const sourceName = sourceNode?.data?.label || args.source_id;
                  const targetName = targetNode?.data?.label || args.target_id;
                  
                  newSysMessages.push(`Connected ${sourceName} to ${targetName}`);
                  resultMessage = `Nodes connected`;
                } else if (toolCall.function.name === "review_workflow_architecture") {
                  newSysMessages.push(`Architecture Review Score: ${args.score}/100. ${args.feedback}`);
                  resultMessage = `Architecture reviewed successfully with score ${args.score}.`;
                } else if (toolCall.function.name === "deploy_workflow_to_n8n") {
                  const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
                  
                  let activeWorkflowName = workflowName;
                  if (args.workflow_name) {
                    activeWorkflowName = args.workflow_name;
                    setWorkflowName(args.workflow_name);
                  }
                  
                  if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
                    resultMessage = "Error: Missing n8n credentials.";
                  } else {
                    const deployRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/deploy`, {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({ 
                        workflowId: useWorkflowStore.getState().loadedWorkflowId,
                        name: activeWorkflowName,
                        nodes: localNodes, 
                        edges: localEdges,
                        n8nEndpointUrl: n8nConfig.endpointUrl,
                        n8nApiToken: n8nConfig.apiToken
                      })
                    });
                    const deployData = await deployRes.json();
                    if (deployRes.ok) {
                      newSysMessages.push(`Deployed workflow directly to n8n (ID: ${deployData.workflowId})`);
                      resultMessage = `Workflow successfully deployed. ID: ${deployData.workflowId}`;
                      if (deployData.workflowId && !useWorkflowStore.getState().loadedWorkflowId) {
                        setLoadedWorkflowId(deployData.workflowId);
                        localLoadedWorkflowId = deployData.workflowId;
                      }
                    } else {
                      resultMessage = `Error deploying: ${deployData.error}`;
                    }
                  }
                } else if (toolCall.function.name === "list_n8n_workflows" || toolCall.function.name === "get_n8n_workflow" || toolCall.function.name === "activate_n8n_workflow" || toolCall.function.name === "delete_n8n_workflow") {
                  // Handle MCP n8n tool calls
                  const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
                  
                  if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
                    resultMessage = "Error: Missing n8n credentials. User needs to configure them in Workspace Config first.";
                  } else {
                    let proxyMethod = 'GET';
                    let proxyPath = '/api/v1/workflows';
                    let proxyBody = undefined;

                    if (toolCall.function.name === "list_n8n_workflows") {
                      proxyPath = '/api/v1/workflows';
                      newSysMessages.push(`Fetching workflow list from n8n`);
                    } else if (toolCall.function.name === "get_n8n_workflow") {
                      proxyPath = `/api/v1/workflows/${args.id}`;
                      newSysMessages.push(`Fetching workflow ${args.id} from n8n`);
                    } else if (toolCall.function.name === "activate_n8n_workflow") {
                      proxyMethod = 'POST';
                      proxyPath = `/api/v1/workflows/${args.id}/activate`;
                      proxyBody = { active: args.active };
                      newSysMessages.push(`Setting workflow ${args.id} active=${args.active}`);
                    } else if (toolCall.function.name === "delete_n8n_workflow") {
                      proxyMethod = 'DELETE';
                      proxyPath = `/api/v1/workflows/${args.id}`;
                      newSysMessages.push(`Deleting workflow ${args.id}`);
                    }

                    const proxyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/n8n-proxy`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        n8nEndpointUrl: n8nConfig.endpointUrl,
                        n8nApiToken: n8nConfig.apiToken,
                        method: proxyMethod,
                        path: proxyPath,
                        body: proxyBody
                      })
                    });
                    
                    const proxyData = await proxyRes.json();
                    
                    // Check for errors - n8n returns error messages in various formats
                    if (proxyData.error || proxyData.status >= 400 || (proxyData.data && proxyData.data.message && proxyData.status !== 200)) {
                      const errorMsg = proxyData.error || proxyData.data?.message || `HTTP ${proxyData.status}`;
                      resultMessage = `Error: ${errorMsg}`;
                      
                      // Special handling for archived workflows
                      if (errorMsg.toLowerCase().includes('archived') || errorMsg.toLowerCase().includes('not found')) {
                        resultMessage = `Error: The workflow appears to be archived or not found in n8n. Please check the workflow status in your n8n instance. You may need to unarchive it first.`;
                      }
                    } else {
                      if (toolCall.function.name === "list_n8n_workflows" && proxyData.data && Array.isArray(proxyData.data.data)) {
                        // Simplify workflows list to avoid sending massive nodes/connections JSON arrays to LLM
                        const simplified = proxyData.data.data.map((wf: any) => ({
                          id: wf.id,
                          name: wf.name,
                          active: wf.active,
                          tags: wf.tags || [],
                          createdAt: wf.createdAt,
                          updatedAt: wf.updatedAt
                        }));
                        resultMessage = JSON.stringify({ data: simplified });
                      } else {
                        if (toolCall.function.name === "get_n8n_workflow" && proxyData.data && proxyData.data.id) {
                          setLoadedWorkflowId(proxyData.data.id);
                          localLoadedWorkflowId = proxyData.data.id;
                          setWorkflowName(proxyData.data.name || "My n8n Workflow");
                          
                          // Auto-populate canvas with n8n workflow data
                          if (proxyData.data.nodes && Array.isArray(proxyData.data.nodes)) {
                            localNodes = [];
                            localEdges = [];
                            
                            proxyData.data.nodes.forEach((n: any) => {
                              localNodes.push({
                                id: generateNodeId(),
                                position: { x: n.position?.[0] || 250, y: n.position?.[1] || 100 },
                                data: { 
                                  label: n.name, 
                                  originalId: n.id || n.name,
                                  parameters: n.parameters || {}
                                },
                                type: 'custom'
                              });
                            });

                            if (proxyData.data.connections) {
                              Object.keys(proxyData.data.connections).forEach(sourceName => {
                                const sourceNode = localNodes.find(n => n.data.label === sourceName);
                                if (sourceNode) {
                                  const mainOutputs = proxyData.data.connections[sourceName].main || [];
                                  mainOutputs.forEach((conns: any[], outputIdx: number) => {
                                    (conns || []).forEach((c: any, connIdx: number) => {
                                      const targetNode = localNodes.find(n => n.data.label === c.node);
                                      if (targetNode) {
                                        localEdges.push({
                                          id: `e-${sourceNode.id}-${targetNode.id}-${outputIdx}-${connIdx}`,
                                          source: sourceNode.id,
                                          target: targetNode.id
                                        });
                                      }
                                    });
                                  });
                                }
                              });
                            }
                            newSysMessages.push(`Loaded workflow into canvas`);
                          }
                        }
                        resultMessage = JSON.stringify(proxyData.data);
                      }
                    }
                  }
                } else if (toolCall.function.name === "execute_workflow") {
                  // Execute workflow
                  const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
                  if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
                    resultMessage = "Error: n8n not configured. Please set your n8n endpoint and API key in Settings.";
                  } else {
                    const args = toolCall.function.arguments ? robustParseJSON(toolCall.function.arguments) : {};
                    const execution_mode = args.execution_mode || "production";
                    
                    const proxyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/n8n-proxy`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        n8nEndpointUrl: n8nConfig.endpointUrl,
                        n8nApiToken: n8nConfig.apiToken,
                        method: 'POST',
                        path: `/api/v1/workflows/${args.workflow_id}/${execution_mode === "manual" ? "run" : "execute"}`,
                        body: args.input_data || {}
                      })
                    });
                    
                    const proxyData = await proxyRes.json();
                    
                    if (proxyData.error || proxyData.status >= 400) {
                      resultMessage = `Error executing workflow: ${proxyData.error || proxyData.data?.message || 'Unknown error'}`;
                    } else {
                      const executionId = proxyData.data?.id || proxyData.data?.executionId;
                      resultMessage = JSON.stringify({
                        success: true,
                        executionId: executionId,
                        message: `Workflow execution started. Execution ID: ${executionId}`
                      });
                      newSysMessages.push(`Workflow execution started (ID: ${executionId})`);
                    }
                  }
                } else if (toolCall.function.name === "get_execution") {
                  // Get execution details
                  const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
                  if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
                    resultMessage = "Error: n8n not configured.";
                  } else {
                    const args = toolCall.function.arguments ? robustParseJSON(toolCall.function.arguments) : {};
                    const includeData = args.include_data || false;
                    
                    const proxyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/n8n-proxy`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        n8nEndpointUrl: n8nConfig.endpointUrl,
                        n8nApiToken: n8nConfig.apiToken,
                        method: 'GET',
                        path: `/api/v1/executions/${args.execution_id}?includeData=${includeData}`
                      })
                    });
                    
                    const proxyData = await proxyRes.json();
                    
                    if (proxyData.error || proxyData.status >= 400) {
                      resultMessage = `Error: ${proxyData.error || 'Failed to get execution'}`;
                    } else {
                      const exec = proxyData.data;
                      resultMessage = JSON.stringify({
                        id: exec.id,
                        status: exec.status || exec.finished ? (exec.status === 'success' || exec.finished === true ? 'success' : 'error') : 'running',
                        startedAt: exec.startedAt,
                        stoppedAt: exec.stoppedAt,
                        data: includeData ? exec.data : undefined
                      });
                    }
                  }
                } else if (toolCall.function.name === "search_executions") {
                  // Search executions
                  const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
                  if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
                    resultMessage = "Error: n8n not configured.";
                  } else {
                    const args = toolCall.function.arguments ? robustParseJSON(toolCall.function.arguments) : {};
                    const limit = args.limit || 20;
                    let queryParams = `limit=${limit}`;
                    if (args.workflow_id) queryParams += `&workflowId=${args.workflow_id}`;
                    if (args.status) queryParams += `&status=${args.status}`;
                    
                    const proxyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/n8n-proxy`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        n8nEndpointUrl: n8nConfig.endpointUrl,
                        n8nApiToken: n8nConfig.apiToken,
                        method: 'GET',
                        path: `/api/v1/executions?${queryParams}`
                      })
                    });
                    
                    const proxyData = await proxyRes.json();
                    
                    if (proxyData.error || proxyData.status >= 400) {
                      resultMessage = `Error: ${proxyData.error || 'Failed to search executions'}`;
                    } else {
                      const executions = proxyData.data?.data || proxyData.data || [];
                      resultMessage = JSON.stringify({
                        count: executions.length,
                        executions: executions.map((e: any) => ({
                          id: e.id,
                          workflowId: e.workflowId,
                          status: e.status || (e.finished ? 'success' : 'running'),
                          startedAt: e.startedAt,
                          stoppedAt: e.stoppedAt
                        }))
                      });
                    }
                  }
                } else if (toolCall.function.name === "validate_workflow") {
                  // Validate workflow
                  const errors: string[] = [];
                  const warnings: string[] = [];
                  
                  // Check for disconnected nodes
                  if (localNodes.length > 1) {
                    const connectedNodeIds = new Set([
                      ...localEdges.map(e => e.source),
                      ...localEdges.map(e => e.target)
                    ]);
                    
                    localNodes.forEach(node => {
                      if (!connectedNodeIds.has(node.id)) {
                        errors.push(`Node "${node.data.label}" is not connected to any other nodes`);
                      }
                    });
                  }
                  
                  // Check for required parameters (basic check)
                  localNodes.forEach(node => {
                    const label = String(node.data.label || '').toLowerCase();
                    const params = (node.data.parameters || {}) as any;
                    if (label.includes('email')) {
                      if (!params.fromEmail) {
                        warnings.push(`Email node "${node.data.label}" might need fromEmail parameter`);
                      }
                      if (!params.toEmail) {
                        warnings.push(`Email node "${node.data.label}" might need toEmail parameter`);
                      }
                    }
                    if (label.includes('http')) {
                      if (!params.url) {
                        warnings.push(`HTTP node "${node.data.label}" might need url parameter`);
                      }
                    }
                  });
                  
                  // Check for at least one trigger node
                  const hasTrigger = localNodes.some(n => {
                    const label = String(n.data.label || '').toLowerCase();
                    return label.includes('trigger') || label.includes('webhook') || label.includes('schedule');
                  });
                  
                  if (!hasTrigger && localNodes.length > 0) {
                    warnings.push("Workflow might need a trigger node (Webhook, Schedule, etc.)");
                  }
                  
                  resultMessage = JSON.stringify({
                    valid: errors.length === 0,
                    errors,
                    warnings,
                    message: errors.length === 0 ? "Workflow validation passed" : "Workflow has validation errors"
                  });
                  
                  if (errors.length > 0) {
                    newSysMessages.push(`Validation failed: ${errors.join('; ')}`);
                  } else {
                    newSysMessages.push("Workflow validated successfully");
                  }
                } else if (toolCall.function.name === "list_credentials") {
                  // List credentials
                  const n8nConfig = secureStorage.get(`n8n_config_${workspaceId}`);
                  if (!n8nConfig?.endpointUrl || !n8nConfig?.apiToken) {
                    resultMessage = "Error: n8n not configured.";
                  } else {
                    const args = toolCall.function.arguments ? robustParseJSON(toolCall.function.arguments) : {};
                    let path = '/api/v1/credentials';
                    if (args.type) path += `?filter=${encodeURIComponent(JSON.stringify({ type: args.type }))}`;
                    
                    const proxyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/n8n-proxy`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        n8nEndpointUrl: n8nConfig.endpointUrl,
                        n8nApiToken: n8nConfig.apiToken,
                        method: 'GET',
                        path: path
                      })
                    });
                    
                    const proxyData = await proxyRes.json();
                    
                    if (proxyData.error || proxyData.status >= 400) {
                      resultMessage = `Error: ${proxyData.error || 'Failed to list credentials'}`;
                    } else {
                      const credentials = proxyData.data?.data || proxyData.data || [];
                      resultMessage = JSON.stringify({
                        count: credentials.length,
                        credentials: credentials.map((c: any) => ({
                          id: c.id,
                          name: c.name,
                          type: c.type
                        }))
                      });
                    }
                  }
                }
              } catch (err: any) {
                console.error("[Agent Loop] Failed to parse/execute tool call:", err);
                resultMessage = `Error parsing tool call arguments: ${err.message}. Your JSON is completely invalid. Check for unescaped double quotes inside "jsCode" strings and ensure commas separate properties.`;
                newSysMessages.push(`Failed to parse tool call: ${toolCall.function.name}`);
              }

              toolResponses.push(makeMsg({
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: resultMessage
              }));
            }

            // Sync visual react state mid-loop
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(localNodes, localEdges, 'LR');
            localNodes = layoutedNodes;
            localEdges = layoutedEdges;
            setNodes([...localNodes]);
            setEdges([...localEdges]);

            // Also show user what happened visually — only for canvas-mutating actions
            // (Not shown to user to keep chat clean; only logged internally)
            if (newSysMessages.length > 0) {
              console.log('[Agent Loop] Tool actions:', newSysMessages.join(', '));
            }

            currentMessages = [...currentMessages, ...toolResponses];
            setMessages(currentMessages);
          } else {
            console.log("[Agent Loop] No tool calls returned. Ending loop.");
            isDone = true;
          }
        } else {
          console.log("[Agent Loop] No choices returned. Ending loop.");
          isDone = true;
        }
      }
      
      // Final sync of react state with auto-layout
      const { nodes: finalNodes, edges: finalEdges } = getLayoutedElements(localNodes, localEdges, 'LR');
      setNodes([...finalNodes]);
      setEdges([...finalEdges]);
      pushToHistory(finalNodes, finalEdges);
      
      console.log("[Agent Loop] Finished loop. Iterations completed:", iterations);
      if (iterations >= MAX_ITERATIONS) {
        currentMessages = [...currentMessages, makeMsg({ role: "assistant", content: "⚠️ Reached maximum action limit. If the task isn't complete, please send a follow-up message." })];
        setMessages(currentMessages);
      }
    } catch (err) {
      console.error("[handleSend] Error in chat handler:", err);
      currentMessages = [...currentMessages, { role: "assistant", content: "Network error occurred." }];
      setMessages(currentMessages);
    } finally {
      setIsTyping(false);
      // Save the final state of the conversation to DB
      await saveChatHistory(currentMessages, localNodes, localEdges);
    }
  };



  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Only apply position/select/dim changes — never let ReactFlow delete nodes itself
    const safeChanges = changes.filter((c: NodeChange) => c.type !== 'remove');
    setNodes((nds: any) => applyNodeChanges(safeChanges, nds));
  }, [setNodes]);

  const onNodeClick = (_event: any, node: any) => {
    setSelectedNode(node);
    setIsNodeConfigOpen(true);
  };

  const updateSelectedNodeParams = (newParams: any) => {
    if (!selectedNode) return;
    const merged = { ...selectedNode.data.parameters, ...newParams };
    setNodes(nodes.map(n =>
      n.id === selectedNode.id
        ? { ...n, data: { ...n.data, parameters: merged } }
        : n
    ));
    setSelectedNode((prev: any) => ({
      ...prev,
      data: { ...prev.data, parameters: merged }
    }));
  };

  // SECURITY: Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-foreground h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center justify-between pl-14 pr-4 md:px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Toggle AI Sidebar"
          >
            {isSidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            )}
          </button>
          {/* Workspace ID hidden for cleaner UI */}
          <input 
            type="text" 
            value={workflowName} 
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-background border border-border/50 rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-24 sm:w-48 md:w-64"
            placeholder="Workflow Name"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border-r border-border pr-2 mr-2">
            <button
              onClick={undo}
              disabled={history.index <= 0}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 015 5v2M3 10l5 5M3 10l5-5"/></svg>
            </button>
            <button
              onClick={redo}
              disabled={history.index >= history.states.length - 1}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 00-5 5v2m15-7l-5 5m5-5l-5-5"/></svg>
            </button>
          </div>
          <button 
            onClick={async () => {
              setNodes(DEFAULT_INITIAL_NODES);
              setEdges(DEFAULT_INITIAL_EDGES);
              setLoadedWorkflowId(null);
              setWorkflowName("My n8n Workflow");
              // Clear on backend too (silently)
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nodepilot-backend.nodepilot-app.workers.dev'}/api/workflows/${workspaceId}/chat`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                  body: JSON.stringify({ messages: [], canvasState: { nodes: DEFAULT_INITIAL_NODES, edges: DEFAULT_INITIAL_EDGES } })
                }).catch(() => {});
              }
            }}
            className="hidden sm:block text-sm font-medium text-secondary-foreground bg-secondary px-4 py-1.5 rounded-md hover:bg-secondary/80 transition-colors"
          >
            Clear Canvas
          </button>
          <button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className="px-2.5 py-1.5 md:px-4 md:py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs md:text-sm font-medium shadow-sm transition-all"
          >
            {isDeploying ? (
              "Deploying..."
            ) : (
              <>
                <span className="sm:hidden">Deploy</span>
                <span className="hidden sm:inline">Deploy to n8n</span>
              </>
            )}
          </button>
          {/* WorkflowCompiler v2 Score Badge */}
          {isCompiling ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-primary/10 text-primary border border-primary/20 animate-pulse">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Compiling...
            </div>
          ) : compilerScore ? (
            <div
              title={compilerScore.warnings.length > 0 ? `Warnings:\n${compilerScore.warnings.join('\n')}` : 'Workflow passed all compiler checks'}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border cursor-help transition-all ${
                compilerScore.score >= 95
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                  : compilerScore.score >= 70
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
                  : 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {compilerScore.score >= 95
                  ? <path d="M20 6L9 17l-5-5"/>
                  : compilerScore.score >= 70
                  ? <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                  : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                }
              </svg>
              v2 · {compilerScore.score}/100
              {compilerScore.warnings.length > 0 && <span className="opacity-60">· {compilerScore.warnings.length}w</span>}
            </div>
          ) : null}
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* React Flow Canvas */}
        <div className={`${isSidebarOpen ? 'hidden md:block' : 'block'} flex-1 relative bg-muted/5`}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange}
            onNodeDragStop={() => pushToHistory(nodes, edges)}
            onNodeClick={onNodeClick}
            nodesDraggable={true}
            nodesConnectable={false}
            nodesFocusable={true}
            fitView 
            colorMode={theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'system'}
            nodeTypes={nodeTypes}
            className="cursor-crosshair"
          >
            <Background 
              color={theme === 'dark' ? '#444' : '#cbd5e1'} 
              variant={BackgroundVariant.Dots}
              gap={24}
              size={2} 
            />
            <Controls />
            <MiniMap />
          </ReactFlow>
          
          {/* Node Configuration Panel */}
          {isNodeConfigOpen && selectedNode && (
            <div className="absolute top-0 right-0 w-96 h-full bg-background border-l border-border flex flex-col z-20 shadow-2xl">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold tracking-tight">Node Configuration</h3>
                <button
                  onClick={() => setIsNodeConfigOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Node Name */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Node Name</label>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      setNodes(nodes.map(n =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      ));
                      setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, label: e.target.value } }));
                    }}
                    className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                  />
                </div>

                {/* Node ID */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Node ID</label>
                  <input
                    type="text"
                    value={selectedNode.id}
                    disabled
                    className="w-full bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed shadow-sm"
                  />
                </div>

                {/* Parameters Section */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Parameters</label>
                  <div className="space-y-3">
                    {/* Common email node parameters */}
                    {selectedNode.data.label?.toLowerCase().includes('email') && (
                      <>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">From Email</label>
                          <input
                            type="email"
                            value={selectedNode.data.parameters?.fromEmail || ''}
                            onChange={(e) => updateSelectedNodeParams({ fromEmail: e.target.value })}
                            placeholder="sender@example.com"
                            className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">To Email</label>
                          <input
                            type="email"
                            value={selectedNode.data.parameters?.toEmail || ''}
                            onChange={(e) => updateSelectedNodeParams({ toEmail: e.target.value })}
                            placeholder="recipient@example.com"
                            className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Subject</label>
                          <input
                            type="text"
                            value={selectedNode.data.parameters?.subject || ''}
                            onChange={(e) => updateSelectedNodeParams({ subject: e.target.value })}
                            placeholder="Email subject"
                            className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Message</label>
                          <textarea
                            value={selectedNode.data.parameters?.text || ''}
                            onChange={(e) => updateSelectedNodeParams({ text: e.target.value })}
                            placeholder="Email body"
                            rows={4}
                            className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                          />
                        </div>
                      </>
                    )}

                    {/* HTTP Request parameters */}
                    {selectedNode.data.label?.toLowerCase().includes('http') && (
                      <>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">URL</label>
                          <input
                            type="url"
                            value={selectedNode.data.parameters?.url || ''}
                            onChange={(e) => updateSelectedNodeParams({ url: e.target.value })}
                            placeholder="https://api.example.com"
                            className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Method</label>
                          <select
                            value={selectedNode.data.parameters?.method || 'GET'}
                            onChange={(e) => updateSelectedNodeParams({ method: e.target.value })}
                            className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                          >
                            <option>GET</option>
                            <option>POST</option>
                            <option>PUT</option>
                            <option>PATCH</option>
                            <option>DELETE</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Generic JSON editor for other parameters */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">All Parameters (JSON)</label>
                      <textarea
                        value={JSON.stringify(selectedNode.data.parameters || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateSelectedNodeParams(parsed);
                          } catch (err) {
                            // Invalid JSON, don't update
                          }
                        }}
                        rows={8}
                        className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={async () => {
                    // Save changes and deploy
                    await handleDeploy();
                    setIsNodeConfigOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium shadow-sm transition-all"
                >
                  Save & Deploy to n8n
                </button>
              </div>
            </div>
          )}
        </div>
{/* Chat History Sidebar */}
        {isChatHistoryOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-64 border-l border-border flex flex-col bg-sidebar shadow-2xl md:relative md:top-auto md:bottom-auto md:right-auto md:z-0 md:shadow-none">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-sidebar-foreground">Chat History</h3>
              <button
                onClick={() => setIsChatHistoryOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <button
              onClick={startNewChat}
              className="m-3 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Chat
            </button>
            <div className="flex-1 overflow-y-auto px-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className="group mb-1 p-2 rounded hover:bg-sidebar-accent cursor-pointer flex items-start justify-between"
                  onClick={() => loadChatSession(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-sidebar-foreground truncate">{session.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChatSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No chat history yet
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Chat Pane */}
        {isSidebarOpen && (
          <div className="w-full md:w-80 md:border-l border-border flex flex-col bg-background z-10">
            <div className="p-4 font-semibold border-b border-border flex items-center justify-between shadow-sm">
              <span>n8n Orchestration Specialist</span>
              <button
                onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                title="Chat History"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-sm text-foreground space-y-4 bg-muted/10">
              {isLoadingChat ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="animate-spin w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full mr-2"></div>
                  Loading chat history...
                </div>
              ) : messages.filter(m => m.role !== 'tool' && m.role !== 'system').length === 0 ? (
                <div className="bg-card p-3 rounded-lg border border-border/50 text-muted-foreground shadow-sm">
                  Hello! Describe what you want to build or modify in your n8n workflow.
                </div>
              ) : (
                messages
                  .filter(msg => msg.role !== 'tool' && msg.role !== 'system' && (msg.role !== 'assistant' || msg.content))
                  .map((msg, idx) => (
                    <div key={(msg as any)._id || (msg as any).id || idx} className={`p-3 rounded-lg border shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground border-primary/20 ml-4' : 'bg-card border-border/50 mr-4'} prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {fixMojibake(msg.content || "")}
                      </ReactMarkdown>
                    </div>
                  ))
              )}
              {isTyping && (
                <div className="bg-card p-3 rounded-lg border border-border/50 mr-4 animate-pulse text-muted-foreground shadow-sm">
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask anything..." 
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none overflow-y-auto shadow-sm"
                    style={{ minHeight: '40px', maxHeight: '200px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {prompt.length > 0 && `${prompt.length} chars`}
                  </div>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={isTyping || !prompt.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium h-10 flex-shrink-0 shadow-sm transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </div>
        )}
        
              </div>
    </div>
  );
}
