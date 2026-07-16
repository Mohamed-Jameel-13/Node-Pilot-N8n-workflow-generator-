import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { encrypt, decrypt } from './utils/encryption.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { supabaseAdmin } from './utils/supabase.js'
import { aiChatLimiter, apiLimiter, authLimiter, readLimiter } from './middleware/rateLimit.js'

const app = new Hono()

// SECURITY: Whitelist specific origins instead of allowing all
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return allowedOrigins[0]
    // Check if origin is in whitelist
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

app.get('/', (c) => {
  return c.text('Hello from n8n Control Plane API')
})

// Authentication (strict rate limiting)
app.post('/api/auth/signup', authLimiter, (c) => c.json({ message: 'stub signup' }))
app.post('/api/auth/login', authLimiter, (c) => c.json({ message: 'stub login' }))
app.get('/api/auth/user', readLimiter, (c) => c.json({ message: 'stub get user' }))

// Organizations & Workspaces
app.get('/api/organizations', (c) => c.json({ message: 'stub get orgs' }))
app.post('/api/organizations', (c) => c.json({ message: 'stub create org' }))
app.get('/api/organizations/:orgId/workspaces', (c) => c.json({ message: 'stub get workspaces' }))
app.post('/api/organizations/:orgId/workspaces', (c) => c.json({ message: 'stub create workspace' }))

// Workspace Config
app.post('/api/workspaces/:workspaceId/config', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    const workspaceId = c.req.param('workspaceId')
    const { endpointUrl, apiToken } = await c.req.json()

    // Encrypt the token before saving
    const encryptedToken = apiToken ? encrypt(apiToken) : null

    // For MVP testing, if the user is still on the 'workspace-1' mock URL, skip DB update
    if (workspaceId === 'workspace-1') {
      return c.json({ message: 'Mock configuration saved successfully' })
    }
    
    // Update the workspace in the database
    const { error: updateError } = await supabaseAdmin
      .from('workspaces')
      .update({ n8n_endpoint_url: endpointUrl })
      .eq('id', workspaceId)

    if (updateError) {
      console.error('Supabase Error:', updateError)
      // If it's a UUID syntax error (because they manually navigated to a bad URL), return a better message
      if (updateError.code === '22P02') {
         return c.json({ error: 'Invalid Workspace ID format. Please go back to Dashboard and select a valid workspace.' }, 400)
      }
      return c.json({ error: 'Failed to update workspace details in the database.' }, 500)
    }

    // We will save it in user_profiles.encryption_key_versions as a stub for this MVP.
    return c.json({ message: 'Configuration saved successfully' })
  } catch (error) {
    console.error('Workspace config error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Workflow Operations
app.post('/api/workflows/:workspaceId/compile', apiLimiter, (c) => c.json({ message: 'stub compile' }))
app.post('/api/workflows/:workspaceId/deploy', apiLimiter, async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    const workspaceId = c.req.param('workspaceId')
    const { workflowId, name, nodes, edges, n8nEndpointUrl, n8nApiToken } = await c.req.json()

    // Validate we have n8n credentials (passed from frontend localStorage)
    if (!n8nEndpointUrl || !n8nApiToken) {
      return c.json({ error: 'Missing n8n credentials. Please configure them in Workspace Config.' }, 400)
    }

    // Map node types to n8n node types
    const mapNodeType = (label: string): string => {
      const l = label.toLowerCase()
      if (l.includes('webhook')) return 'n8n-nodes-base.webhook'
      if (l.includes('cron') || l.includes('schedule')) return 'n8n-nodes-base.scheduleTrigger'
      if (l.includes('http')) return 'n8n-nodes-base.httpRequest'
      if (l.includes('set')) return 'n8n-nodes-base.set'
      if (l.includes('email') || l.includes('mail')) return 'n8n-nodes-base.emailSend'
      if (l.includes('postgres') || l.includes('sql')) return 'n8n-nodes-base.postgres'
      if (l.includes('slack')) return 'n8n-nodes-base.slack'
      if (l.includes('function') || l.includes('code')) return 'n8n-nodes-base.code'
      if (l.includes('if') || l.includes('condition')) return 'n8n-nodes-base.if'
      return 'n8n-nodes-base.httpRequest'
    }

    // Compile React Flow to n8n workflow format
    // When updating (workflowId exists), fetch existing workflow to preserve node parameters
    let existingNodes: any[] = [];
    if (workflowId && n8nEndpointUrl && n8nApiToken) {
      try {
        const existingRes = await fetch(`${n8nEndpointUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`, {
          headers: { 'X-N8N-API-KEY': n8nApiToken, 'Accept': 'application/json' }
        });
        if (existingRes.ok) {
          const existingData = await existingRes.json();
          existingNodes = existingData.nodes || [];
          console.log(`[Deploy] Fetched existing workflow with ${existingNodes.length} nodes to preserve parameters`);
        }
      } catch (e) {
        console.warn('[Deploy] Failed to fetch existing workflow, will create with empty parameters:', e);
      }
    }

    const n8nNodes = nodes.map((n: any, index: number) => {
      // Find matching node in existing workflow by name or originalId
      const existingNode = existingNodes.find((en: any) => 
        en.name === n.data.label || 
        (n.data.originalId && (en.id === n.data.originalId || en.name === n.data.originalId))
      );
      
      // Preserve parameters from existing node, or use empty object for new nodes
      const nodeParams = existingNode?.parameters || n.data.parameters || {};
      
      return {
        parameters: nodeParams,
        id: n.data.originalId || n.id,
        name: n.data.label,
        type: mapNodeType(n.data.label),
        typeVersion: existingNode?.typeVersion || 1,
        position: [
          Math.round(n.position?.x ?? index * 250),
          Math.round(n.position?.y ?? 100)
        ]
      };
    })

    const connections: any = {}
    edges.forEach((e: any) => {
      const sourceNode = nodes.find((n: any) => n.id === e.source)
      const targetNode = nodes.find((n: any) => n.id === e.target)
      if (sourceNode && targetNode) {
        if (!connections[sourceNode.data.label]) {
          connections[sourceNode.data.label] = { main: [[]] }
        }
        connections[sourceNode.data.label].main[0].push({
          node: targetNode.data.label,
          type: 'main',
          index: 0
        })
      }
    })

    const n8nWorkflow = {
      name: name || `Control Plane Workflow - ${new Date().toLocaleString()}`,
      nodes: n8nNodes,
      connections: connections,
      settings: { executionOrder: 'v1' }
    }

    const n8nBase = n8nEndpointUrl.replace(/\/$/, '')
    const endpoint = workflowId 
      ? `${n8nBase}/api/v1/workflows/${workflowId}`
      : `${n8nBase}/api/v1/workflows`
      
    const method = workflowId ? 'PUT' : 'POST'

    // Make the real REST API call to n8n
    const n8nResponse = await fetch(endpoint, {
      method,
      headers: {
        'X-N8N-API-KEY': n8nApiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nWorkflow)
    })

    const n8nData = await n8nResponse.json()
    console.log(`[Deploy] n8n response status: ${n8nResponse.status}`)
    console.log(`[Deploy] n8n response:`, JSON.stringify(n8nData, null, 2))

    if (!n8nResponse.ok) {
      return c.json({ 
        error: `n8n returned error: ${n8nData.message || JSON.stringify(n8nData)}`,
        status: n8nResponse.status
      }, 502)
    }

    return c.json({ 
      message: `Workflow "${n8nWorkflow.name}" deployed successfully to n8n! Workflow ID: ${n8nData.id}`,
      workflowId: n8nData.id,
      workflow: n8nData
    })
  } catch (error: any) {
    console.error('Deploy error:', error)
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      return c.json({ error: 'Cannot connect to n8n instance. Make sure it is running and the URL is correct.' }, 502)
    }
    return c.json({ error: `Internal server error: ${error.message}` }, 500)
  }
})
// n8n REST API Proxy (moderate rate limiting)
app.post('/api/workflows/:workspaceId/n8n-proxy', apiLimiter, async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    const { n8nEndpointUrl, n8nApiToken, method = 'GET', path, body } = await c.req.json()

    if (!n8nEndpointUrl || !n8nApiToken || !path) {
      return c.json({ error: 'Missing required proxy parameters (URL, Token, Path)' }, 400)
    }

    const baseUrl = n8nEndpointUrl.replace(/\/$/, '')
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

    console.log(`[n8n-proxy] ${method} ${url}`)

    const options: RequestInit = {
      method,
      headers: {
        'X-N8N-API-KEY': n8nApiToken,
        'Accept': 'application/json'
      }
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.headers = { ...options.headers, 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }

    const proxyRes = await fetch(url, options)
    const data = await proxyRes.json().catch(() => ({}))
    
    return c.json({ status: proxyRes.status, data })
  } catch (error: any) {
    console.error('[n8n-proxy] Error:', error)
    return c.json({ error: `Proxy error: ${error.message}` }, 500)
  }
})

app.get('/api/workflows/:workspaceId/audit', (c) => c.json({ message: 'stub audit' }))
app.post('/api/workflows/:workspaceId/rollback', (c) => c.json({ message: 'stub rollback' }))

// Workspace Chat Persistence
app.get('/api/workflows/:workspaceId/chat', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    const workspaceId = c.req.param('workspaceId')
    
    const { data, error } = await supabaseAdmin
      .from('workspace_chats')
      .select('messages, canvas_state')
      .eq('workspace_id', workspaceId)
      .single()
      
    if (error && error.code !== 'PGRST116') { // Ignore row not found error
      console.error('[Chat Fetch] Database error:', error)
      return c.json({ error: 'Failed to fetch chat history' }, 500)
    }

    return c.json({ messages: data?.messages || [], canvasState: data?.canvas_state || null })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/workflows/:workspaceId/chat', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    const workspaceId = c.req.param('workspaceId')
    const { messages, canvasState } = await c.req.json()
    
    const { error } = await supabaseAdmin
      .from('workspace_chats')
      .upsert({
        workspace_id: workspaceId,
        messages: messages,
        canvas_state: canvasState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'workspace_id' })
      
    if (error) {
      console.error('[Chat Save] Database error:', error)
      return c.json({ error: 'Failed to save chat history' }, 500)
    }

    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// AI Chat (most expensive endpoint - strict rate limit)
app.post('/api/ai/chat', aiChatLimiter, async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    const { messages, canvasState, n8nConfig } = await c.req.json()

    // Strip any system-role messages injected by the frontend (they break multi-turn)
    const cleanMessages = (messages || []).filter((m: any) => m.role !== 'system')

    // --- INTENT DETECTION: Handle n8n management requests server-side ---
    const lastUserMessage = cleanMessages.filter((m: any) => m.role === 'user').pop()
    const userText: string = lastUserMessage?.content || ''
    const userTextLower = userText.toLowerCase()

    // --- PRIORITY 1: Detect explicit workflow ID in user message ---
    // Pattern: "ID: xX9zyquTM55AUIcm" or "(ID: xX9zyquTM55AUIcm)" etc.
    const idMatch = userText.match(/\bID[:\s]+([A-Za-z0-9_-]{10,})\b/i)
    const explicitWorkflowId = idMatch ? idMatch[1] : null

    if (explicitWorkflowId && n8nConfig?.endpointUrl && n8nConfig?.apiToken) {
      console.log(`[Intent Detection] Detected explicit workflow ID: ${explicitWorkflowId}. Fetching and injecting into canvas context.`)
      const n8nBase = n8nConfig.endpointUrl.replace(/\/$/, '')
      try {
        const wfRes = await fetch(`${n8nBase}/api/v1/workflows/${explicitWorkflowId}`, {
          headers: { 'X-N8N-API-KEY': n8nConfig.apiToken, 'Accept': 'application/json' }
        })
        if (wfRes.ok) {
          const wfData = await wfRes.json()
          // Strip large nested data to save tokens, keep node names and positions
          const nodesSummary = (wfData.nodes || []).map((n: any) => ({
            name: n.name, type: n.type, position: n.position
          }))
          // Inject workflow state as a user context message before LLM call
          // (using 'user' role as most LLM APIs only accept 'system' at position 0)
          cleanMessages.push({
            role: 'user',
            content: `[CONTEXT] Workflow "${wfData.name}" (ID: ${wfData.id}) has been fetched and loaded. Nodes: ${JSON.stringify(nodesSummary)}. Now please: ${userText}`
          })
          console.log(`[Intent Detection] Injected workflow context for "${wfData.name}"`)
        }
      } catch (e: any) {
        console.warn('[Intent Detection] Failed to pre-fetch workflow by ID:', e.message)
      }
      // Fall through to LLM — do NOT list workflows
    } else {
      // --- PRIORITY 2: Detect list/manage intent (only when no explicit ID and explicit request) ---
      // STRICT: Only list if user explicitly asks with list/show command + workflows
      const isListIntent = /^(list|show|get|fetch|display)(\s+me)?(\s+(all|my|the|n8n))?\s*workflows?/i.test(userTextLower.trim()) ||
                          /workflows?\s+(list|available)/i.test(userTextLower.trim());
      const isActivateIntent = /activate|enable|turn on/.test(userTextLower) && /workflow/.test(userTextLower);
      const isDeactivateIntent = /deactivate|disable|turn off/.test(userTextLower) && /workflow/.test(userTextLower);
      const isDeleteIntent = /delete|remove/.test(userTextLower) && /workflow/.test(userTextLower);

      if ((isListIntent || isActivateIntent || isDeactivateIntent || isDeleteIntent) && n8nConfig?.endpointUrl && n8nConfig?.apiToken) {
        const n8nBase = n8nConfig.endpointUrl.replace(/\/$/, '')

        if (isListIntent) {
          console.log('[Intent Detection] Detected list workflows intent - calling n8n directly')
          try {
            const n8nRes = await fetch(`${n8nBase}/api/v1/workflows`, {
              headers: { 'X-N8N-API-KEY': n8nConfig.apiToken, 'Accept': 'application/json' }
            })
            const n8nData = await n8nRes.json()
            const workflows = (n8nData.data || []).map((wf: any) => ({
              id: wf.id, name: wf.name, active: wf.active,
              tags: wf.tags || [],
              updatedAt: wf.updatedAt
            }))
            const count = workflows.length
            const listText = count === 0
              ? 'You have no workflows in your n8n instance.'
              : `You have **${count} workflow${count > 1 ? 's' : ''}** in your n8n instance:\n\n${workflows.map((wf: any, i: number) => {
                  const statusIcon = wf.active ? '🟢 Active' : '⚫ Inactive';
                  const tagsList = wf.tags && wf.tags.length > 0 ? ` [Tags: ${wf.tags.map((t: any) => t.name).join(', ')}]` : '';
                  return `${i + 1}. **${wf.name}** (ID: \`${wf.id}\`) — ${statusIcon}${tagsList}`;
                }).join('\n')}`
            
            return c.json({
              choices: [{
                message: { role: 'assistant', content: listText, tool_calls: null },
                finish_reason: 'stop'
              }]
            })
          } catch (e: any) {
            return c.json({
              choices: [{
                message: { role: 'assistant', content: `❌ Failed to fetch workflows from n8n: ${e.message}`, tool_calls: null },
                finish_reason: 'stop'
              }]
            })
          }
        }
      }
    }

    // --- CANVAS OPERATIONS: Use LLM with function calling ---

    // 1. Fetch User Config
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('llm_base_url, llm_model, encrypted_llm_api_key')
      .eq('email', user.email)
      .single()

    let baseUrl = process.env.OMNIROUTE_API_URL || 'https://api.openai.com/v1'
    let apiKey = process.env.OPENAI_API_KEY || ''
    let model = 'gpt-3.5-turbo'

    // 2. Use BYOK if configured
    if (profile && profile.llm_base_url && profile.encrypted_llm_api_key) {
      baseUrl = profile.llm_base_url.endsWith('/') ? profile.llm_base_url.slice(0, -1) : profile.llm_base_url
      model = profile.llm_model || model
      apiKey = decrypt(profile.encrypted_llm_api_key)
    }

    // 3. System Prompt (single unified prompt, canvas state embedded here)
    const canvasContext = canvasState
      ? `\n\nCURRENT CANVAS STATE:\nNodes: ${JSON.stringify(canvasState.nodes)}\nEdges: ${JSON.stringify(canvasState.edges)}\nIMPORTANT: Use these existing node IDs when connecting or updating. Do NOT create duplicate nodes.`
      : ''

    const systemPrompt = {
      role: 'system',
      content: `You are an expert n8n Orchestration Specialist. Users will ask you to build automation workflows using natural language.

Your job is to translate high-level intents into n8n node pipelines on the visual canvas.
Common node types:
- 'Webhook Trigger' (incoming data)
- 'Cron Schedule' (time-based triggers)
- 'HTTP Request' (calling external APIs)
- 'Postgres' (database operations)
- 'Email Send' (sending emails)
- 'Set' (data mapping/transformation)
- 'If' (conditional branching)
- 'Code' (custom JavaScript logic)

When asked to build a workflow:
1. Plan which nodes are needed
2. Use add_node tool calls to add EACH node (one call per node)
3. Use connect_nodes to link them in order
4. **IMMEDIATELY call \`deploy_workflow_to_n8n\` to save to n8n**
5. Keep explanations brief

**CRITICAL**: EVERY canvas change (add_node, update_node, delete_node, connect_nodes) is ONLY LOCAL until you call \`deploy_workflow_to_n8n\`. You MUST deploy after changes to save them to n8n.

**RECONNECTION LOGIC**: When removing a node from a chain:
- If node has incoming connection from node A
- And node has outgoing connection to node C
- You MUST first connect A→C (using connect_nodes)
- Then delete the middle node
- This preserves workflow continuity
- Example: Workflow is Trigger→Transform→Email. User says "remove Transform". You should: (1) connect Trigger→Email, (2) delete Transform, (3) deploy.

CRITICAL RULES FOR WORKFLOW MANAGEMENT:
1. **VALIDATE BEFORE DEPLOY**: Before calling \`deploy_workflow_to_n8n\`, ALWAYS call \`validate_workflow\` first to check for errors. If validation fails, fix the issues before deploying.

2. **ALWAYS DEPLOY AFTER CHANGES**: After ANY canvas operation (add_node, update_node, delete_node, connect_nodes), you MUST immediately call \`validate_workflow\` and then \`deploy_workflow_to_n8n\` to save changes to the actual n8n instance. Canvas-only changes are NOT persisted to n8n.

3. IF THE USER PROVIDES A WORKFLOW ID (e.g., 'ID: xX9zyquTM55AUIcm'), YOU MUST CALL \`get_n8n_workflow\` WITH THAT EXACT ID IMMEDIATELY. DO NOT CALL \`list_n8n_workflows\` UNDER ANY CIRCUMSTANCES IF AN ID IS PROVIDED!

3. IF \`get_n8n_workflow\` FAILS WITH AN ARCHIVED ERROR, the workflow is archived in n8n. You CANNOT fetch or modify archived workflows directly. You must:
   a) Inform the user the workflow is archived
   b) Ask them to unarchive it in n8n first, OR
   c) Suggest creating a new workflow with similar structure

4. NEVER call \`list_n8n_workflows\` unless the user EXPLICITLY asks to "list workflows" or "show me all workflows". DO NOT list workflows when they ask about creating, updating, or working with workflows.

5. When updating node parameters (like email addresses, credentials, etc.), you MUST:
   a) Use \`update_node\` tool with the node ID and new parameters
   b) **Immediately call \`deploy_workflow_to_n8n\`** to save to n8n

6. When user asks to remove/delete a node, you MUST:
   a) Identify which node to delete
   b) **Check if node has incoming and outgoing connections**
   c) **If yes, reconnect the predecessor node directly to the successor node** using connect_nodes
   d) Use \`delete_node\` tool with the node ID
   e) **Immediately call \`deploy_workflow_to_n8n\`** to save to n8n
   Example: If deleting node B in chain A→B→C, first connect A→C, then delete B, then deploy.

7. DO NOT apologize for an inability to control layout or spacing. The system automatically auto-layouts nodes beautifully behind the scenes.

8. When asked to activate/deactivate workflows, use \`activate_n8n_workflow\` tool with the appropriate boolean value.

9. When asked to delete workflows, use \`delete_n8n_workflow\` tool (confirm with user first if not explicitly requested).

10. **WORKFLOW EXECUTION**: When user asks to test or run a workflow:
    a) Use \`execute_workflow\` with the workflow ID
    b) It returns an execution ID immediately
    c) Use \`get_execution\` with the execution ID to check results
    d) For execution history, use \`search_executions\`

11. **CREDENTIAL MANAGEMENT**: When configuring nodes that need authentication (e.g., Gmail, Slack, database):
    a) Use \`list_credentials\` to show available credentials
    b) Inform user which credentials are available
    c) If no credentials exist, tell user to create them in n8n first

Keep text responses concise.${canvasContext}`
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "deploy_workflow_to_n8n",
          description: "**CRITICAL**: Deploy the current canvas state directly to the user's n8n instance. This creates a new workflow or updates an existing one if a workflow ID is already loaded. YOU MUST CALL THIS AFTER EVERY CANVAS CHANGE (add/update/delete/connect nodes) to persist changes to n8n. Canvas changes are TEMPORARY until deployed.",
          parameters: {
            type: "object",
            properties: {
              workflow_name: { type: "string", description: "The name of the workflow to set when deploying, if the user specifies a name." }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_new_workflow",
          description: "Clear the canvas and start a new workflow from scratch. Use this when the user explicitly wants to create a brand new workflow.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Optional name for the new workflow." }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_n8n_workflows",
          description: "Fetch a list of all existing workflows in the user's n8n instance to find a specific workflow ID.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_n8n_workflow",
          description: "Fetch the exact JSON schema of a specific n8n workflow by its ID. This automatically populates the canvas with its nodes and connections.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the workflow to fetch (e.g., 'xX9zyquTM55AUIcm')." }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "activate_n8n_workflow",
          description: "Activate or deactivate a workflow in the user's n8n instance. This starts or stops the workflow execution.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The workflow ID to activate/deactivate." },
              active: { type: "boolean", description: "Set to true to activate, false to deactivate." }
            },
            required: ["id", "active"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_n8n_workflow",
          description: "Permanently delete a workflow from the user's n8n instance.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The workflow ID to delete." }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_node",
          description: "Add a new node to the n8n workflow canvas. NOTE: This only updates the LOCAL canvas. You MUST call deploy_workflow_to_n8n immediately after to save the change to n8n.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "A unique string ID for this node (e.g., 'node1', 'node2')." },
              type: { type: "string", description: "The type of node." },
              label: { type: "string", description: "A friendly display label for the node." },
            },
            required: ["id", "type", "label"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_node",
          description: "Update an existing node on the canvas, including its label and/or parameters (configuration). NOTE: This only updates the LOCAL canvas. You MUST call deploy_workflow_to_n8n immediately after to save the change to n8n.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the node to update." },
              label: { type: "string", description: "The new label for the node (optional)." },
              parameters: { type: "object", description: "The node parameters/configuration object (e.g., {fromEmail: 'test@test.com', toEmail: 'recipient@test.com'}) (optional)." }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_node",
          description: "Delete a node from the workflow canvas. IMPORTANT: If the node has both incoming and outgoing connections (it's in the middle of a chain), you should FIRST reconnect its predecessor to its successor using connect_nodes BEFORE deleting it to maintain workflow continuity. Then call deploy_workflow_to_n8n to save. NOTE: This only updates the LOCAL canvas. You MUST call deploy_workflow_to_n8n immediately after to save the change to n8n.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the node to delete." }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "connect_nodes",
          description: "Draw a connection/edge between two nodes on the canvas. NOTE: This only updates the LOCAL canvas. You MUST call deploy_workflow_to_n8n immediately after to save the change to n8n.",
          parameters: {
            type: "object",
            properties: {
              source_id: { type: "string", description: "ID of the source node." },
              target_id: { type: "string", description: "ID of the target node." }
            },
            required: ["source_id", "target_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "execute_workflow",
          description: "Execute a workflow in n8n and return the execution ID immediately. Use this to test or run workflows. The execution happens asynchronously - use get_execution to check results.",
          parameters: {
            type: "object",
            properties: {
              workflow_id: { type: "string", description: "The ID of the workflow to execute." },
              execution_mode: { 
                type: "string", 
                enum: ["production", "manual"],
                description: "Execution mode: 'production' for active workflows with triggers, 'manual' for testing with Manual Trigger nodes." 
              },
              input_data: { 
                type: "object", 
                description: "Optional input data for webhook or manual trigger workflows." 
              }
            },
            required: ["workflow_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_execution",
          description: "Get details of a workflow execution by execution ID. Use this to check if a workflow execution succeeded and view its results.",
          parameters: {
            type: "object",
            properties: {
              execution_id: { type: "string", description: "The execution ID returned from execute_workflow." },
              workflow_id: { type: "string", description: "The workflow ID." },
              include_data: { 
                type: "boolean", 
                description: "Whether to include full execution data (default: false for metadata only)." 
              }
            },
            required: ["execution_id", "workflow_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_executions",
          description: "Search for workflow executions with optional filters. Use this to view execution history or find failed executions.",
          parameters: {
            type: "object",
            properties: {
              workflow_id: { type: "string", description: "Filter by workflow ID (optional)." },
              status: { 
                type: "string", 
                enum: ["success", "error", "waiting", "running"],
                description: "Filter by execution status (optional)." 
              },
              limit: { type: "number", description: "Max number of results (default: 20, max: 100)." }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "validate_workflow",
          description: "Validate the current canvas workflow before deploying. Checks for disconnected nodes, missing required parameters, and invalid connections. ALWAYS call this before deploy_workflow_to_n8n.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_credentials",
          description: "List all credentials available in the user's n8n instance. Use this to find credential IDs when configuring nodes that require authentication.",
          parameters: {
            type: "object",
            properties: {
              type: { type: "string", description: "Filter by credential type (e.g., 'googleApi', 'slackApi') (optional)." }
            },
            required: []
          }
        }
      }
    ];

    // 4. Send request to LLM with model fallback
    const chatEndpoint = baseUrl.toLowerCase().includes('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`

    const modelsEndpoint = baseUrl.toLowerCase().includes('/v1')
      ? `${baseUrl}/models`
      : `${baseUrl}/v1/models`

    let modelsToTry = [model];
    let response;
    let errTxt = '';
    let success = false;

    console.log(`[Backend AI Chat] Starting request to ${chatEndpoint}`)

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      console.log(`[Backend AI Chat] Trying model: ${currentModel} (Attempt ${i + 1}/${modelsToTry.length})`)

      const payload = {
        model: currentModel,
        messages: [systemPrompt, ...cleanMessages],
        temperature: 0.7,
        tools,
        tool_choice: "auto"
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout per model

      try {
        response = await fetch(chatEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        })

        clearTimeout(timeoutId);

        if (response.ok) {
          success = true;
          break;
        } else {
          errTxt = await response.text();
          console.error(`[Backend AI Chat] Model ${currentModel} failed: ${response.status} ${errTxt}`)
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        errTxt = fetchError.message || 'Timeout/Network Error';
        console.error(`[Backend AI Chat] Model ${currentModel} error: ${errTxt}`)
      }

      // If we failed and we haven't fetched fallback models yet, fetch them now
      if (!success && i === 0) {
        console.log(`[Backend AI Chat] Primary model failed. Fetching fallback models from ${modelsEndpoint}...`)
        try {
          const modelsRes = await fetch(modelsEndpoint, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            if (modelsData.data && Array.isArray(modelsData.data)) {
              const fallbackModels = modelsData.data
                .map((mdl: any) => mdl.id)
                .filter((id: string) => id !== model)
                .slice(0, 3);
              
              if (fallbackModels.length > 0) {
                modelsToTry = [...modelsToTry, ...fallbackModels];
                console.log(`[Backend AI Chat] Found fallback models to try:`, fallbackModels);
              }
            }
          }
        } catch (e) {
          console.error(`[Backend AI Chat] Failed to fetch fallback models:`, e);
        }
      }
    }

    if (!success || !response) {
      return c.json({ error: 'All models failed or timed out', details: errTxt }, 502)
    }

    const data = await response.json()
    console.log(`[Backend AI Chat] Success Response Data:`, JSON.stringify(data, null, 2))
    return c.json(data)
  } catch (error) {
    console.error('Chat error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Key Management
app.get('/api/keys', (c) => c.json({ message: 'stub list keys' }))
app.post('/api/keys', (c) => c.json({ message: 'stub add key' }))

// Billing (Razorpay)
app.post('/api/billing/create-order', async (c) => {
  try {
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    })
    
    // Create an order for a generic amount (e.g. 50000 paise = 500 INR)
    const order = await rzp.orders.create({
      amount: 50000,
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7)
    })
    
    return c.json(order)
  } catch (error) {
    return c.json({ error: 'Failed to create order' }, 500)
  }
})

app.post('/api/billing/verify-payment', async (c) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await c.req.json()
    
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex')
      
    if (expectedSignature === razorpay_signature) {
      // TODO: Update database to mark subscription_status as 'active' for the organization
      return c.json({ message: 'Payment verified successfully', success: true })
    } else {
      return c.json({ error: 'Invalid signature', success: false }, 400)
    }
  } catch (error) {
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Custom LLM Configuration
app.post('/api/llm/test', async (c) => {
  try {
    const body = await c.req.json()
    const { baseUrl, apiKey } = body
    
    // Normalize URL
    const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    
    // Determine the correct endpoint to fetch models
    const endpoint = normalizedUrl.toLowerCase().includes('/v1') 
      ? `${normalizedUrl}/models` 
      : `${normalizedUrl}/v1/models`
    
    // Fetch models from standard OpenAI compatible endpoint
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      return c.json({ error: 'Failed to connect to LLM provider' }, 400)
    }
    
    const data = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Invalid request or connection failed' }, 500)
  }
})
app.get('/api/user/llm-config', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user || !user.email) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: existingProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('llm_base_url, llm_model, encrypted_llm_api_key')
      .eq('email', user.email)

    if (existingProfiles && existingProfiles.length > 0) {
      const profile = existingProfiles[0]
      let apiKey = ''
      if (profile && profile.encrypted_llm_api_key) {
        try {
          apiKey = decrypt(profile.encrypted_llm_api_key)
        } catch (e) {
          console.error("Failed to decrypt API key")
        }
      }
      return c.json({
        baseUrl: profile?.llm_base_url || '',
        model: profile?.llm_model || '',
        apiKey: apiKey
      })
    }
    
    return c.json({ baseUrl: '', model: '', apiKey: '' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/user/llm-config', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user || !user.email) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()
    const { baseUrl, model, apiKey } = body
    
    // Encrypt the API key before saving
    const encryptedKey = apiKey ? encrypt(apiKey) : null
    
    // Ensure profile exists or update it
    const { data: existingProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', user.email)

    if (existingProfiles && existingProfiles.length > 0) {
      await supabaseAdmin.from('user_profiles').update({ 
        llm_base_url: baseUrl, 
        llm_model: model, 
        encrypted_llm_api_key: encryptedKey 
      }).eq('email', user.email)
    } else {
      await supabaseAdmin.from('user_profiles').insert({ 
        email: user.email, 
        role: 'admin',
        llm_base_url: baseUrl, 
        llm_model: model, 
        encrypted_llm_api_key: encryptedKey 
      })
    }
    
    return c.json({ message: 'LLM configuration saved successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Rollback Endpoint
app.post('/api/workflows/:workspaceId/rollback', async (c) => {
  try {
    const workspaceId = c.req.param('workspaceId')
    const { snapshotId, workflowId, n8nEndpointUrl, n8nApiToken } = await c.req.json()

    if (!snapshotId || !workflowId || !n8nEndpointUrl || !n8nApiToken) {
      return c.json({ error: 'Missing required parameters' }, 400)
    }

    // 1. Fetch the historical snapshot from Supabase
    const { data: snapshotData, error: dbError } = await supabaseAdmin
      .from('workflow_audit_trail')
      .select('raw_n8n_json')
      .eq('id', snapshotId)
      .eq('workspace_id', workspaceId)
      .single()

    if (dbError || !snapshotData) {
      return c.json({ error: 'Snapshot not found' }, 404)
    }

    // 2. Perform direct REST PUT to n8n to bypass AI
    const n8nBase = n8nEndpointUrl.replace(/\/$/, '')
    const n8nResponse = await fetch(`${n8nBase}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': n8nApiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(snapshotData.raw_n8n_json)
    })

    if (!n8nResponse.ok) {
      const errData = await n8nResponse.text()
      return c.json({ error: `n8n API Error: ${errData}` }, 500)
    }

    // 3. Log the rollback as a new snapshot
    await supabaseAdmin.from('workflow_audit_trail').insert({
      workspace_id: workspaceId,
      raw_n8n_json: snapshotData.raw_n8n_json,
      change_summary: `Rolled back to snapshot ${snapshotId}`
    })

    return c.json({ message: 'Rollback successful', data: snapshotData.raw_n8n_json })
  } catch (error: any) {
    console.error('[Rollback Error]', error)
    return c.json({ error: error.message || 'Internal server error' }, 500)
  }
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
