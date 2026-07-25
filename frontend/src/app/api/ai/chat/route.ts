import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const BASE_SYSTEM_PROMPT = `You are NodePilot, an AI-powered control plane assistant for n8n workflow automation.

OPERATIONAL RULES:
1. Work ONLY on the specific workflow explicitly requested by the user in their prompt.
2. When the user asks to ANALYZE, REVIEW, or EXPLAIN a workflow — respond with a detailed text analysis and call "review_workflow_architecture".
3. When the user asks to CREATE a totally new workflow: call "create_new_workflow" or "generate_workflow".
4. CRITICAL FOR PERFORMANCE: When the user asks to UPDATE, MODIFY, ADD, or DELETE nodes in an *existing* workflow, DO NOT regenerate the entire workflow. Instead, use the incremental CRUD tools: "add_node", "update_node", "delete_node", and "connect_nodes". Regenerating the whole workflow will cause timeouts!
5. When the user asks to VALIDATE a workflow — call the "validate_workflow" function.
6. NEVER ask the user to provide workflow JSON. You already have access to the full workflow details in the [Current Active Canvas State] context below.
7. Be concise, direct, and focused solely on the user's requested workflow.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_workflow",
      description: "Generate or update an n8n workflow on the visual canvas. Call this when the user asks to create, fix, build, or update a workflow. NOT for analysis or explanation tasks.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the workflow" },
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique node ID, e.g. node1, webhook_trigger, code_filter" },
                label: { type: "string", description: "Node type/label, e.g. Webhook Trigger, Code, Filter, Google Sheets, Slack, OpenAI, HTTP Request" },
                parameters: { type: "object", description: "Node configuration parameters relevant to the node type" }
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
      name: "create_new_workflow",
      description: "Clear the canvas and start a new workflow.",
      parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] }
    }
  },
  {
    type: "function",
    function: {
      name: "add_node",
      description: "Add a single new node to the canvas.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique node ID" },
          label: { type: "string", description: "Node type/label" },
          parameters: { type: "object", description: "Node configuration parameters" }
        },
        required: ["id", "label"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_node",
      description: "Update an existing node's label or parameters.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Node ID to update" },
          label: { type: "string", description: "New node type/label" },
          parameters: { type: "object", description: "New configuration parameters" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_node",
      description: "Delete a node from the canvas by ID.",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "Node ID to delete" } },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "connect_nodes",
      description: "Create an edge/connection between two nodes.",
      parameters: {
        type: "object",
        properties: {
          source_id: { type: "string", description: "Source node ID" },
          target_id: { type: "string", description: "Target node ID" }
        },
        required: ["source_id", "target_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "review_workflow_architecture",
      description: "Review the workflow and provide a score and feedback.",
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "Score from 0 to 100" },
          feedback: { type: "string", description: "Constructive feedback" }
        },
        required: ["score", "feedback"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "validate_workflow",
      description: "Validate the current canvas workflow for errors, disconnected nodes, and missing parameters.",
      parameters: {
        type: "object",
        properties: {}
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
          workflowName: { type: "string", description: "Name to deploy the workflow as" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_n8n_workflows",
      description: "List all workflows in the connected n8n instance.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_n8n_workflow",
      description: "Fetch and load a specific n8n workflow by ID onto the canvas.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The n8n workflow ID" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "activate_n8n_workflow",
      description: "Activate or deactivate an n8n workflow.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The n8n workflow ID" },
          active: { type: "boolean", description: "true to activate, false to deactivate" }
        },
        required: ["id", "active"]
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

    // STRICT MATCH: Only fetch if the user explicitly asks for a specific workflow by name or ID
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
          
          // Get the latest user prompt text
          const lastUserMsg = Array.isArray(messages) 
            ? [...messages].reverse().find(m => m.role === 'user')?.content || ""
            : "";

          // Match ONLY the workflow explicitly named or referenced by ID in the prompt
          const targetWorkflow = workflows.find(w => 
            lastUserMsg.toLowerCase().includes(w.name.toLowerCase()) || 
            (w.id && lastUserMsg.includes(w.id))
          );

          if (targetWorkflow) {
            // Fetch ONLY this specific workflow's details
            const detailRes = await fetch(`${cleanUrl}/api/v1/workflows/${targetWorkflow.id}`, {
              headers: {
                'X-N8N-API-KEY': n8nConfig.apiToken,
                'Accept': 'application/json',
                'User-Agent': 'NodePilot-ControlPlane/1.0'
              }
            });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              dynamicContext += `\n\n[User Explicitly Requested Workflow: "${detailData.name}"]:\nID: ${detailData.id}\nStatus: ${detailData.active ? "Active" : "Inactive"}\nNodes: ${JSON.stringify(detailData.nodes || [])}\nConnections: ${JSON.stringify(detailData.connections || {})}`;
            }
          }
        }
      } catch (e) {
        console.warn("[AI Chat] Failed to fetch target n8n workflow:", e);
      }
    }

    // Attach current active canvas state if present
    if (canvasState && canvasState.nodes && canvasState.nodes.length > 0) {
      dynamicContext += `\n\n[Current Active Canvas State]:\nNodes: ${JSON.stringify(canvasState.nodes)}\nEdges: ${JSON.stringify(canvasState.edges || [])}`;
    }

    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!url.endsWith('/v1') && !url.includes('/api/v1') && !url.includes('openrouter.ai')) {
      url = `${url}/v1`;
    }
    const endpoint = `${url}/chat/completions`;

    // Filter out previous error loop messages
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
        temperature: 0.3,
        max_tokens: 4000
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
