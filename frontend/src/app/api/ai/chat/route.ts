import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const BASE_SYSTEM_PROMPT = `You are NodePilot, an AI-powered control plane assistant for n8n workflow automation.
You help users inspect, debug, create, and modify n8n workflows visually on the interactive canvas.

CRITICAL INSTRUCTIONS:
1. When a user asks to fix, create, optimize, or build a workflow (e.g. "Lead Generation Workflow", "fix workflow"), DO NOT JUST WRITE A TEXT EXPLANATION. 
2. You MUST call the "generate_workflow" function to build or update the complete, fixed workflow structure directly on the visual canvas.
3. Ensure every node has a unique ID, descriptive label (e.g. Webhook, Code, Filter, Google Sheets, Slack, OpenAI), and proper parameters.
4. Ensure all nodes are connected sequentially in the "connections" array.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_workflow",
      description: "Generate or replace a complete n8n workflow directly on the visual canvas with specified nodes and connections.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the workflow" },
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string", description: "Node type/label, e.g. Webhook, Code, Filter, Google Sheets, Slack, OpenAI" },
                parameters: { type: "object", description: "Node configuration parameters" }
              },
              required: ["id", "label"]
            }
          },
          connections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source: { type: "string", description: "ID of source node" },
                target: { type: "string", description: "ID of target node" }
              },
              required: ["source", "target"]
            }
          }
        },
        required: ["name", "nodes", "connections"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deploy_workflow_to_n8n",
      description: "Deploy the current canvas workflow directly to the connected n8n instance.",
      parameters: {
        type: "object",
        properties: {
          workflowName: { type: "string" }
        }
      }
    }
  }
];

export async function POST(request: Request) {
  try {
    const { messages, canvasState, aiProviders, n8nConfig } = await request.json();

    // Check if user has configured BYOK providers
    let apiKey = process.env.OPENROUTER_API_KEY || "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";
    let baseUrl = "https://openrouter.ai/api/v1";
    let model = "openrouter/auto";

    if (aiProviders && Array.isArray(aiProviders) && aiProviders.length > 0) {
      const activeProvider = aiProviders[0];
      if (activeProvider.apiKey) apiKey = activeProvider.apiKey;
      if (activeProvider.baseUrl) baseUrl = activeProvider.baseUrl;
      if (activeProvider.model) model = activeProvider.model;
    }

    let dynamicContext = "";

    // If n8n credentials are provided, attempt auto-fetching workflow details
    if (n8nConfig && n8nConfig.endpointUrl && n8nConfig.apiToken) {
      try {
        const cleanUrl = n8nConfig.endpointUrl.endsWith('/') ? n8nConfig.endpointUrl.slice(0, -1) : n8nConfig.endpointUrl;
        const listRes = await fetch(`${cleanUrl}/api/v1/workflows?limit=100`, {
          headers: {
            'X-N8N-API-KEY': n8nConfig.apiToken,
            'Accept': 'application/json',
            'User-Agent': 'NodePilot-ControlPlane/1.0'
          }
        });

        if (listRes.ok) {
          const listData = await listRes.json();
          const workflows: any[] = listData.data || [];
          const lastUserMsg = Array.isArray(messages) ? [...messages].reverse().find(m => m.role === 'user')?.content || "" : "";
          
          const matchedWf = workflows.find(w => 
            lastUserMsg.toLowerCase().includes(w.name.toLowerCase()) || 
            lastUserMsg.includes(w.id)
          );

          if (matchedWf) {
            const detailRes = await fetch(`${cleanUrl}/api/v1/workflows/${matchedWf.id}`, {
              headers: {
                'X-N8N-API-KEY': n8nConfig.apiToken,
                'Accept': 'application/json',
                'User-Agent': 'NodePilot-ControlPlane/1.0'
              }
            });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              dynamicContext += `\n\n[Auto-Fetched n8n Workflow Context from User Instance]:\nName: ${detailData.name} (ID: ${detailData.id})\nActive Status: ${detailData.active ? "Active" : "Inactive"}\nNodes: ${JSON.stringify(detailData.nodes || [])}\nConnections: ${JSON.stringify(detailData.connections || {})}`;
            }
          }
        }
      } catch (e) {
        console.warn("[AI Chat] Failed to auto-fetch n8n workflow context:", e);
      }
    }

    // Attach canvas nodes context if present
    if (canvasState && canvasState.nodes && canvasState.nodes.length > 0) {
      dynamicContext += `\n\n[Current Canvas Nodes]:\n${JSON.stringify(canvasState.nodes)}`;
    }

    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!url.endsWith('/v1') && !url.includes('/api/v1') && !url.includes('openrouter.ai')) {
      url = `${url}/v1`;
    }
    const endpoint = `${url}/chat/completions`;

    // Filter out previous error messages
    const cleanedMessages = Array.isArray(messages) 
      ? messages.filter(m => !(m.role === 'assistant' && typeof m.content === 'string' && m.content.includes('Error:'))) 
      : [];

    const fullMessages = [
      { role: 'system', content: BASE_SYSTEM_PROMPT + dynamicContext },
      ...cleanedMessages
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nodepilot.pages.dev',
        'X-Title': 'NodePilot Control Plane'
      },
      body: JSON.stringify({
        model: model,
        messages: fullMessages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `AI Provider Error (HTTP ${response.status}): ${errorText.slice(0, 150)}` 
      }, { status: response.status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: `Internal AI Chat Error: ${error.message}` }, { status: 500 });
  }
}
