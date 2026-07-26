// Dotenv removed for Cloudflare Worker compatibility ('fs' module unsupported)
// @hono/node-server imported lazily below (Node.js only — Cloudflare Workers don't support it)
import crypto from 'node:crypto'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { encrypt, decrypt } from './utils/encryption.js'
import { razorpay } from './utils/razorpay.js'
import { supabaseAdmin } from './utils/supabase.js'
import { aiChatLimiter, apiLimiter, authLimiter, readLimiter } from './middleware/rateLimit.js'
import { validateWorkflow, nodeRegistry, resolveNodeType } from './validators/nodeRegistry.js'
import type { NodeSchema } from './validators/nodeRegistry.js'

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

    // WorkflowCompiler v2: resolve node type AND typeVersion from registry
    const mapNodeTypeV2 = (label: string): { nodeType: string; typeVersion: number } => {
      return resolveNodeType(label);
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

    const nameCounts: Record<string, number> = {};
    const n8nNodes = nodes.map((n: any, index: number) => {
      // Find matching node in existing workflow by name or originalId
      const existingNode = existingNodes.find((en: any) => 
        en.name === n.data.label || 
        (n.data.originalId && (en.id === n.data.originalId || en.name === n.data.originalId))
      );
      
      // Preserve parameters: existing n8n node > canvas data.parameters > empty
      const nodeParams = existingNode?.parameters || n.data.parameters || {};
      
      // Preserve type resolution order: existing n8n node type > canvas data.nodeType > label-resolved
      const resolved = mapNodeTypeV2(n.data.label);
      const finalNodeType = existingNode?.type || n.data.nodeType || resolved.nodeType;
      const finalTypeVersion = existingNode?.typeVersion || n.data.typeVersion || resolved.typeVersion;

      let uniqueName = n.data.label;
      if (nameCounts[uniqueName]) {
        nameCounts[uniqueName] = nameCounts[uniqueName]! + 1;
        uniqueName = `${uniqueName} ${nameCounts[uniqueName]}`;
      } else {
        nameCounts[uniqueName] = 1;
      }
      n._uniqueName = uniqueName; // Save for connections block
      
      return {
        parameters: nodeParams,
        id: n.data.originalId || n.id,
        name: uniqueName,
        type: finalNodeType,
        typeVersion: finalTypeVersion,
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
        const sourceName = sourceNode._uniqueName || sourceNode.data.label;
        const targetName = targetNode._uniqueName || targetNode.data.label;
        
        if (!connections[sourceName]) {
          connections[sourceName] = { main: [[]] }
        }
        connections[sourceName].main[0].push({
          node: targetName,
          type: 'main',
          index: 0
        })
      }
    })

    const validationResult = validateWorkflow(nodes, edges);
    console.log(`[WorkflowCompiler v2] Validation score: ${validationResult.score}/100, errors: ${validationResult.errors.length}, warnings: ${(validationResult as any).warnings?.length || 0}`);

    if (!validationResult.valid) {
      console.warn('[WorkflowCompiler v2] Validation BLOCKED deploy:', validationResult.errors);
      return c.json({ 
        error: JSON.stringify({
          system_directive: "DO_NOT_REPLY_TO_USER",
          action_required: "AUTONOMOUS_FIX",
          compiler: "WorkflowCompiler v2",
          score: validationResult.score,
          message: `Workflow Validation Failed (score: ${validationResult.score}/100). Fix the following errors autonomously using update_node, connect_nodes before retrying deploy.`,
          errors: validationResult.errors,
          warnings: (validationResult as any).warnings || []
        }),
        validationErrors: validationResult.errors,
        score: validationResult.score,
        warnings: (validationResult as any).warnings || []
      }, 400);
    }

    const n8nWorkflow = {
      name: name || `Control Plane Workflow - ${new Date().toLocaleString()}`,
      nodes: n8nNodes,
      connections: connections,
      settings: { executionOrder: 'v1', saveManualExecutions: true, saveExecutionProgress: true }
    }

    let n8nBase = n8nEndpointUrl.replace(/\/$/, '').trim()
    if (n8nBase.endsWith('/api/v1')) {
      n8nBase = n8nBase.slice(0, -7);
    }
    let endpoint = workflowId 
      ? `${n8nBase}/api/v1/workflows/${workflowId}`
      : `${n8nBase}/api/v1/workflows`
      
    let method = workflowId ? 'PUT' : 'POST'
    const cleanApiToken = n8nApiToken.trim();

    console.log(`[Deploy] Attempting to deploy to n8n...`);
    console.log(`[Deploy] Endpoint: ${endpoint}`);
    console.log(`[Deploy] Method: ${method}`);
    console.log(`[Deploy] Token Length: ${cleanApiToken.length}`);
    console.log(`[Deploy] Token Starts with: ${cleanApiToken.substring(0, 5)}...`);
    console.log(`[Deploy] Token Ends with: ...${cleanApiToken.substring(cleanApiToken.length - 5)}`);

    // Make the real REST API call to n8n
    let n8nResponse = await fetch(endpoint, {
      method,
      headers: {
        'X-N8N-API-KEY': cleanApiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nWorkflow)
    })

    let n8nData = await n8nResponse.json()
    console.log(`[Deploy] n8n response status: ${n8nResponse.status}, token starts with: ${cleanApiToken.substring(0, 4)}...`)
    
    // Fallback: If we tried to update (PUT) but got 403 Forbidden, create it as a new workflow instead.
    if (workflowId && n8nResponse.status === 403) {
      console.log(`[Deploy] Got 403 Forbidden on update. Falling back to POST to create a new workflow.`);
      endpoint = `${n8nBase}/api/v1/workflows`;
      method = 'POST';
      n8nResponse = await fetch(endpoint, {
        method,
        headers: {
          'X-N8N-API-KEY': cleanApiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nWorkflow)
      });
      n8nData = await n8nResponse.json();
      console.log(`[Deploy] n8n fallback response status: ${n8nResponse.status}`);
    }

    if (!n8nResponse.ok) {
      return c.json({ 
        error: `n8n returned error: ${n8nData.message || JSON.stringify(n8nData)}`,
        status: n8nResponse.status
      }, 502)
    }

    return c.json({ 
      message: `Workflow "${n8nWorkflow.name}" deployed successfully to n8n! Workflow ID: ${n8nData.id}`,
      workflowId: n8nData.id,
      workflow: n8nData,
      compiler: {
        version: 'v2',
        score: validationResult.score,
        warnings: (validationResult as any).warnings || [],
        nodeCount: n8nNodes.length,
        edgeCount: Object.values(connections).reduce((acc: number, c: any) => acc + (c.main?.[0]?.length || 0), 0)
      }
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

// Workspace Chat Persistence (Now uses 'workflows' table)
app.get('/api/workflows/:workspaceId/chat', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401)

    // Find the latest workflow for this user
    const { data, error } = await supabaseAdmin
      .from('workflows')
      .select('id, messages, nodes, edges')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
      
    if (error && error.code !== 'PGRST116') {
      console.error('[Chat Fetch] Database error:', error)
      return c.json({ error: 'Failed to fetch chat history' }, 500)
    }

    if (!data) {
      return c.json({ messages: [], canvasState: null })
    }

    return c.json({ 
      messages: data.messages || [], 
      canvasState: { nodes: data.nodes || [], edges: data.edges || [] } 
    })
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

    const { messages, canvasState } = await c.req.json()
    
    // Find the latest workflow to update
    const { data: latest } = await supabaseAdmin
      .from('workflows')
      .select('id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
      
    if (latest?.id) {
      const { error } = await supabaseAdmin
        .from('workflows')
        .update({
          messages: messages || [],
          nodes: canvasState?.nodes || [],
          edges: canvasState?.edges || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', latest.id)
        .eq('user_id', user.id)
        
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('workflows')
        .insert({
          user_id: user.id,
          name: 'My n8n Workflow',
          messages: messages || [],
          nodes: canvasState?.nodes || [],
          edges: canvasState?.edges || []
        })
        
      if (error) throw error;
    }

    return c.json({ success: true })
  } catch (err: any) {
    console.error('[Chat Save] Database error:', err)
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
      // Fall through to LLM â€” do NOT list workflows
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
                  const statusIcon = wf.active ? 'ðŸŸ¢ Active' : 'âš« Inactive';
                  const tagsList = wf.tags && wf.tags.length > 0 ? ` [Tags: ${wf.tags.map((t: any) => t.name).join(', ')}]` : '';
                  return `${i + 1}. **${wf.name}** (ID: \`${wf.id}\`) â€” ${statusIcon}${tagsList}`;
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
                message: { role: 'assistant', content: `âŒ Failed to fetch workflows from n8n: ${e.message}`, tool_calls: null },
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

    let defaultProvider = {
      baseUrl: process.env.OMNIROUTE_API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-3.5-turbo'
    }

    let providers: any[] = []

    // 2. Use BYOK if configured
    if (profile && profile.encrypted_llm_api_key) {
      let decryptedKey = decrypt(profile.encrypted_llm_api_key)
      if (decryptedKey.startsWith('[') && decryptedKey.endsWith(']')) {
        try {
          providers = JSON.parse(decryptedKey)
        } catch (e) {
          console.error("Failed to parse providers list in chat", e)
        }
      } else if (profile.llm_base_url) {
        providers = [{ baseUrl: profile.llm_base_url, model: profile.llm_model, apiKey: decryptedKey }]
      }
    }
    
    if (providers.length === 0) providers = [defaultProvider]

    // 3. System Prompt (single unified prompt, canvas state embedded here)
    const canvasContext = canvasState
      ? `\n\nCURRENT CANVAS STATE:\nNodes: ${JSON.stringify(canvasState.nodes)}\nEdges: ${JSON.stringify(canvasState.edges)}\nIMPORTANT: Use these existing node IDs when connecting or updating. Do NOT create duplicate nodes.`
      : ''
    const systemPrompt = {
      role: 'system',
      content: `You are WorkflowCompiler v2 — an AI-powered workflow modification, repair, and customization engine for existing n8n workflows.

You are NOT a workflow generation platform that creates workflows from scratch unless EXPLICITLY requested. Your primary goal is to safely patch, modify, and extend existing workflows without breaking them.
Your output is machine-executable n8n workflow JSON.
Correctness > Speed. Reliability > Completeness. Workflow Preservation > Creativity.

====================================================
COMPILER RULES & PATCH ARCHITECTURE (MANDATORY)
====================================================

1. PRIMARY DIRECTIVE: Analyze, modify, repair, and customize existing workflows.
2. NEVER regenerate an entire workflow using generate_workflow unless explicitly asked to build from scratch.
3. Use a PATCH-BASED architecture: Analyze -> Generate Diff -> Validate -> Save.
4. Make MINIMAL changes. Only use update_node, add_node, delete_node, and connect_nodes to target the specific components that need changing.
5. PRESERVE existing working logic. Do not overwrite working configurations blindly.
6. OPTIMIZE AI REQUESTS: When modifying multiple nodes, call your tool functions (update_node, add_node, etc.) MULTIPLE TIMES IN THE SAME RESPONSE (Parallel Tool Calling). Do not wait between edits.
7. DEPLOYMENT: Always call deploy_workflow_to_n8n autonomously immediately after you finish your batch of modifications or generation. NEVER ask the user to deploy.
8. ERROR REPAIR: If deployment fails, fix the errors autonomously using update_node and retry. NEVER call generate_workflow to fix errors.
9. SUMMARY: After a successful deploy, write a concise 2-sentence confirmation summary.

====================================================
CREDENTIAL RULES (CRITICAL)
====================================================

CREDENTIALS ARE CONFIGURED BY THE USER DIRECTLY IN n8n — NOT IN THIS APP.

NEVER ask the user for:
- API keys
- OAuth tokens
- Apify tokens
- Google Sheets credentials
- Any credential, secret, or key

NEVER block workflow generation because credentials are missing.
NEVER say "I need your credentials to proceed."
NEVER say "Please provide your API token."
NEVER say "You need to configure credentials."

For nodes that require credentials (Google Sheets, Slack, Apify, etc.):
- Generate the node with all parameters fully configured
- Leave the credentials field empty or omit it — the user sets it in n8n UI
- Never mention credentials in your response to the user

====================================================
APPROVED NODE TYPES (use these EXACT label strings)
====================================================

Triggers:          Webhook | Schedule | Manual Trigger | Error Trigger
Logic:             If | Switch | Merge | Code | Set Fields
HTTP/API:          HTTP Request
Batching:          Split In Batches | Wait
Data:              Google Sheets | Postgres | MySQL | Supabase | Redis | Notion | Airtable
AI/LLM:            OpenAI Chat | AI Agent
Comms:             Slack | Email Send | Gmail | WhatsApp
Flow Control:      Respond to Webhook | Execute Workflow | Stop And Error | Remove Duplicates | Filter | Aggregate

====================================================
PARAMETER TEMPLATES (copy exactly)
====================================================

VALIDATE INPUT (Code):
{ "jsCode": "const input = items[0].json;\\nif (!input.location) throw new Error('location is required');\\nif (!input.businessType) throw new Error('businessType is required');\\nreturn items;" }

HTTP REQUEST (with retry):
{ "method": "POST", "url": "https://api.example.com/endpoint", "options": { "retryOnFail": true, "maxTries": 3, "waitBetweenTries": 2000, "timeout": 30000 } }

APIFY SCRAPER (HTTP Request):
{ "method": "POST", "url": "https://api.apify.com/v2/acts/apify~google-maps-scraper/runs?token={{$env.APIFY_TOKEN}}", "sendBody": true, "specifyBody": "json", "jsonBody": "{ \\"startUrls\\": [{ \\"url\\": \\"https://maps.google.com/search/={{$json.businessType}}+in+={{$json.location}}\\" }], \\"maxCrawledPlacesPerSearch\\": ={{$json.limit}} }", "options": { "retryOnFail": true, "maxTries": 3, "timeout": 60000 } }

REMOVE DUPLICATES (Code):
{ "jsCode": "const seen = new Set();\\nreturn items.filter(item => {\\n  const key = item.json.phone || item.json.website || item.json.name;\\n  if (seen.has(key)) return false;\\n  seen.add(key);\\n  return true;\\n});" }

LEAD SCORING (Code):
{ "jsCode": "return items.map(item => {\\n  let score = 0;\\n  if (!item.json.website) score += 40;\\n  if (item.json.totalScore > 4) score += 20;\\n  if (item.json.reviewsCount > 50) score += 20;\\n  if (item.json.phone) score += 20;\\n  item.json.leadScore = score;\\n  return item;\\n});" }

IF/FILTER (check if empty / exists):
{ "conditions": { "options": { "caseSensitive": true }, "combinator": "and", "conditions": [{ "id": "cond1", "leftValue": "={{$json.website}}", "operator": { "type": "string", "operation": "isEmpty" } }] } }

IF/FILTER (score >= 60):
{ "conditions": { "options": { "caseSensitive": true }, "combinator": "and", "conditions": [{ "id": "cond1", "leftValue": "={{$json.leadScore}}", "rightValue": 60, "operator": { "type": "number", "operation": "gte" } }] } }

GOOGLE SHEETS APPEND:
{ "operation": "append", "documentId": { "value": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" }, "sheetName": { "value": "Sheet1" }, "columns": { "mappingMode": "defineBelow", "value": { "Name": "={{$json.title}}", "Phone": "={{$json.phone}}", "Website": "={{$json.website}}", "Score": "={{$json.leadScore}}" } }, "options": {} }

GOOGLE SHEETS LOOKUP (read):
{ "operation": "read", "documentId": { "value": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" }, "sheetName": { "value": "Sheet1" }, "options": {} }

STOP AND ERROR:
{ "errorMessage": "={{$json.errorMessage || 'Critical workflow error occurred'}}" }

SLACK NOTIFICATION:
{ "resource": "message", "operation": "post", "channel": "#alerts", "text": "={{$json.errorMessage || 'Workflow completed'}}" }

RESPOND TO WEBHOOK (success):
{ "respondWith": "json", "responseBody": "={{JSON.stringify({ success: true, executionId: $execution.id })}}" }

RESPOND TO WEBHOOK (error 400):
{ "respondWith": "json", "responseBody": "={{JSON.stringify({ success: false, error: $json.message })}}", "options": { "responseCode": 400 } }

====================================================
EXPRESSION RULES (STRICT)
====================================================

ALWAYS use:  ={{$json.field}}  or  ={{$json["field-name"]}}
CROSS-NODE:  ={{$node["NodeName"].json.field}}
METADATA:    ={{$execution.id}}  ={{$workflow.id}}  ={{$now}}
NEVER use:   {{ $json.field }}  or  {{$json.field}}  (missing = prefix)
NEVER emit:  empty {}  alone as entire parameters object
NEVER use:   placeholder, TODO, example.com as values

====================================================
ERROR ARCHITECTURE (inject into EVERY workflow)
====================================================

1. All HTTP/API nodes must have: retryOnFail=true, maxTries=3, waitBetweenTries=2000
2. Webhook workflows must ALWAYS end with a Respond to Webhook node
3. Bad input (missing required fields) → Respond to Webhook with HTTP 400
4. Critical failures → Stop And Error node with descriptive message

====================================================
PRODUCTION QUALITY STANDARDS
====================================================

- EVERY node must have complete, non-empty parameters
- EVERY workflow must include input validation (Code node) after webhook trigger
- EVERY batch operation must use Split In Batches with batchSize <= 10 + Wait node
- Invent realistic field names that match the data domain
- Never ask for more details — design complete production workflows autonomously
- NEVER ask for credentials — they are optional and user-managed in n8n directly
- NEVER ask user to deploy — always deploy autonomously

${canvasContext}`
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_workflow",
          description: "Generate a COMPLETE n8n workflow with ALL nodes and ALL connections in a SINGLE call. Use this for creating new workflows. Output the entire workflow structure at once.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "The workflow name." },
              nodes: {
                type: "array",
                description: "Array of all nodes in the workflow.",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique node ID (e.g. 'node1')." },
                    label: { type: "string", description: "Display label." },
                    type: { type: "string", description: "Node type string." },
                    parameters: { type: "object", description: "Complete node configuration. MUST NOT be empty." }
                  },
                  required: ["id", "label", "type", "parameters"]
                }
              },
              connections: {
                type: "array",
                description: "Array of all edges between nodes.",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string", description: "Source node ID." },
                    target: { type: "string", description: "Target node ID." }
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
          description: "Deploy the current canvas state to the user's n8n instance. Call this AFTER generate_workflow to persist. If it returns an error, fix silently and retry.",
          parameters: {
            type: "object",
            properties: {
              workflow_name: { type: "string", description: "Optional workflow name override." }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_new_workflow",
          description: "Clear the canvas and start fresh.",
          parameters: { type: "object", properties: { name: { type: "string" } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "add_node",
          description: "Add a single node. Use ONLY for small edits to existing workflows. For new workflows use generate_workflow.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" }, type: { type: "string" }, label: { type: "string" },
              parameters: { type: "object", description: "Node config. MUST NOT be empty." }
            },
            required: ["id", "type", "label", "parameters"]
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
            properties: { id: { type: "string" }, label: { type: "string" }, parameters: { type: "object" } },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_node",
          description: "Delete a node from the canvas.",
          parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
        }
      },
      {
        type: "function",
        function: {
          name: "connect_nodes",
          description: "Connect two nodes. Use for small edits only.",
          parameters: {
            type: "object",
            properties: { source_id: { type: "string" }, target_id: { type: "string" } },
            required: ["source_id", "target_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_n8n_workflows",
          description: "Fetch all workflows from n8n.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_n8n_workflow",
          description: "Fetch a specific n8n workflow by ID.",
          parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
        }
      },
      {
        type: "function",
        function: {
          name: "activate_n8n_workflow",
          description: "Activate or deactivate a workflow.",
          parameters: {
            type: "object",
            properties: { id: { type: "string" }, active: { type: "boolean" } },
            required: ["id", "active"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_n8n_workflow",
          description: "Permanently delete a workflow from n8n.",
          parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
        }
      },
      {
        type: "function",
        function: {
          name: "execute_workflow",
          description: "Execute a workflow in n8n.",
          parameters: {
            type: "object",
            properties: {
              workflow_id: { type: "string" },
              execution_mode: { type: "string", enum: ["production", "manual"] },
              input_data: { type: "object" }
            },
            required: ["workflow_id", "execution_mode"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_execution",
          description: "Get execution status and results.",
          parameters: {
            type: "object",
            properties: { execution_id: { type: "string" }, include_data: { type: "boolean" } },
            required: ["execution_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_executions",
          description: "Search workflow executions.",
          parameters: {
            type: "object",
            properties: {
              workflow_id: { type: "string" },
              status: { type: "string", enum: ["success", "error", "waiting", "running"] },
              limit: { type: "number" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_credentials",
          description: "List available credentials in n8n.",
          parameters: { type: "object", properties: { type: { type: "string" } }, required: [] }
        }
      }
    ];

    let response;
    let errTxt = '';
    let success = false;

    // 4. Loop through configured providers
    for (let pIdx = 0; pIdx < providers.length; pIdx++) {
      const provider = providers[pIdx]
      const baseUrl = provider.baseUrl.endsWith('/') ? provider.baseUrl.slice(0, -1) : provider.baseUrl
      const model = provider.model
      const apiKey = provider.apiKey

      const chatEndpoint = baseUrl.toLowerCase().includes('/v1')
        ? `${baseUrl}/chat/completions`
        : `${baseUrl}/v1/chat/completions`

      const modelsEndpoint = baseUrl.toLowerCase().includes('/v1')
        ? `${baseUrl}/models`
        : `${baseUrl}/v1/models`

      let modelsToTry = [model];
      
      console.log(`[Backend AI Chat] Starting request to Provider ${pIdx + 1} (${chatEndpoint})`)

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        console.log(`[Backend AI Chat] Trying model: ${currentModel} on Provider ${pIdx + 1} (Attempt ${i + 1}/${modelsToTry.length})`)

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

        // If we failed and we haven't fetched fallback models yet, fetch them now (OpenRouter specific behavior)
        if (!success && i === 0 && baseUrl.includes('openrouter')) {
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
      
      if (success) {
        break; // Stop provider loop on first successful response
      } else {
        console.warn(`[Backend AI Chat] Provider ${pIdx + 1} exhausted. Failing over to next provider if available.`)
      }
    }

    if (!success || !response) {
      return c.json({ error: 'All configured providers and models failed or timed out', details: errTxt }, 502)
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

// Billing (Razorpay Subscriptions)
app.post('/api/billing/create-subscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const { plan, currency = 'INR', amount } = await c.req.json();
    
    // In a real app, you would retrieve the user's razorpay_customer_id
    // or create one if it doesn't exist.
    
    const rzp = razorpay;
    
    let planId: string | undefined;
    
    try {
      // Find an existing plan dynamically to avoid .env caching/typo issues
      const plans = await rzp.plans.all();
      const defaultAmount = plan === 'yearly' ? 100 : 100;
      const finalAmount = amount || defaultAmount;
      const expectedName = `NodePilot Pro ${plan === 'yearly' ? 'Yearly' : 'Monthly'} (${currency} ${finalAmount})`;
      const existingPlan = plans.items.find((p: any) => p.item.name === expectedName && p.item.currency === currency && p.item.amount === finalAmount);
      
      if (existingPlan) {
        planId = existingPlan.id;
        console.log(`Found existing Razorpay Plan: ${planId}`);
      } else {
        console.log(`Plan not found on Razorpay. Creating one dynamically...`);
        const newPlan = await rzp.plans.create({
          period: plan === 'yearly' ? 'yearly' : 'monthly',
          interval: 1,
          item: {
            name: expectedName,
            amount: finalAmount,
            currency: currency,
            description: `Subscription to NodePilot Pro (${plan}) - ${currency}`
          }
        });
        planId = newPlan.id;
        console.log(`Successfully created new Razorpay Plan: ${planId}`);
      }
    } catch (fetchErr: any) {
      console.error('Error fetching or creating Razorpay plan:', fetchErr);
      return c.json({ error: `Failed to initialize subscription plan: ${fetchErr.description || fetchErr.message}` }, 400);
    }
    
    // Calculate start_at for a 1-day free trial (24 hours from now)
    // Razorpay requires start_at to be a future unix timestamp.
    const startAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60) + 120; // 24 hours + 2 mins buffer

    const subscription = await rzp.subscriptions.create({
      plan_id: planId,
      total_count: plan === 'yearly' ? 10 : 120, // number of billing cycles
      customer_notify: 1,
      start_at: startAt
    });
    
    return c.json(subscription);
  } catch (error: any) {
    console.error('Razorpay create subscription error:', JSON.stringify(error, null, 2));
    const msg = error.error?.description || error.description || error.message || 'Failed to create subscription';
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/billing/verify-subscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = await c.req.json();
    
    const body = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');
      
    if (expectedSignature === razorpay_signature) {
      console.log(`Payment verified for user ${user.id}. Updating database...`);
      
      // Update database to mark subscription_status as 'active' for the profile
      const { data: updatedProfile, error: updateErr } = await supabaseAdmin.from('profiles').update({
        subscription_id: razorpay_subscription_id,
        subscription_status: 'active',
        subscription_plan: plan
      }).eq('id', user.id).select();
      
      if (updateErr) {
        console.error('Error updating profile in DB:', updateErr);
      } else if (!updatedProfile || updatedProfile.length === 0) {
        console.log('Profile row not found, attempting to create one via upsert...');
        const { error: upsertErr } = await supabaseAdmin.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          subscription_id: razorpay_subscription_id,
          subscription_status: 'active',
          subscription_plan: plan
        });
        if (upsertErr) console.error('Error upserting profile in DB:', upsertErr);
      } else {
        console.log('Profile updated successfully in DB!');
      }
      
      return c.json({ message: 'Subscription verified successfully', success: true });
    } else {
      console.error('Invalid signature during verification');
      return c.json({ error: 'Invalid signature', success: false }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Verification failed' }, 500)
  }
})

app.get('/api/billing/subscription-status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id, subscription_status, subscription_plan')
      .eq('id', user.id)
      .single();

    if (fetchErr) {
      console.error('Error fetching profile for subscription status:', fetchErr);
    }

    if (!profile || !profile.subscription_id || profile.subscription_status !== 'active') {
      console.log(`User ${user.id} is not active. Profile:`, profile);
      return c.json({ active: false });
    }

    if (profile.subscription_id === 'sub_pro_manual') {
      return c.json({
        active: true,
        status: 'active',
        plan: profile.subscription_plan,
        current_end: new Date(Date.now() + 31536000000).toISOString(),
        cancel_at_period_end: false
      });
    }

    const rzp = razorpay;

    try {
      const sub = await rzp.subscriptions.fetch(profile.subscription_id);
      return c.json({
        active: sub.status === 'active' || sub.status === 'authenticated',
        status: sub.status,
        plan: profile.subscription_plan,
        current_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end
      });
    } catch (rzpErr) {
      console.error('Razorpay fetch subscription error:', rzpErr);
      return c.json({ active: false, error: 'Could not fetch subscription from payment gateway' });
    }
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/api/billing/cancel-subscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return c.json({ error: 'Unauthorized' }, 401);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.subscription_id) {
      return c.json({ error: 'No active subscription found' }, 400);
    }

    const rzp = razorpay;

    try {
      await rzp.subscriptions.cancel(profile.subscription_id);
      
      await supabaseAdmin.from('profiles').update({
        subscription_status: 'cancelled'
      }).eq('id', user.id);
      
      return c.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (rzpErr: any) {
      console.error('Razorpay cancel subscription error:', rzpErr);
      return c.json({ error: rzpErr.message || 'Failed to cancel subscription' }, 500);
    }
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

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
      let decryptedKey = ''
      if (profile && profile.encrypted_llm_api_key) {
        try {
          decryptedKey = decrypt(profile.encrypted_llm_api_key)
        } catch (e) {
          console.error("Failed to decrypt API key")
        }
      }
      
      let providers = []
      // Check if it's a new multi-provider JSON string
      if (decryptedKey.startsWith('[') && decryptedKey.endsWith(']')) {
        try {
          providers = JSON.parse(decryptedKey)
        } catch (e) {
          console.error("Failed to parse providers JSON", e)
        }
      } else if (profile?.llm_base_url || decryptedKey) {
        // Legacy single provider fallback
        providers = [{
          baseUrl: profile?.llm_base_url || '',
          model: profile?.llm_model || '',
          apiKey: decryptedKey
        }]
      }
      
      return c.json({ providers })
    }
    
    return c.json({ providers: [] })
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
    let providers = []
    
    // Support new payload format ({ providers: [...] }) or legacy fallback
    if (body.providers && Array.isArray(body.providers)) {
      providers = body.providers
    } else if (body.baseUrl || body.apiKey) {
      providers = [{ baseUrl: body.baseUrl, model: body.model, apiKey: body.apiKey }]
    }
    
    // Encrypt the JSON array of providers
    const encryptedKey = providers.length > 0 ? encrypt(JSON.stringify(providers)) : null
    
    // Set legacy columns for the first provider, or empty
    const firstProvider = providers.length > 0 ? providers[0] : null
    const legacyBaseUrl = firstProvider?.baseUrl || ''
    const legacyModel = firstProvider?.model || ''

    // Ensure profile exists or update it
    const { data: existingProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', user.email)

    if (existingProfiles && existingProfiles.length > 0) {
      await supabaseAdmin.from('user_profiles').update({ 
        llm_base_url: legacyBaseUrl, 
        llm_model: legacyModel, 
        encrypted_llm_api_key: encryptedKey 
      }).eq('email', user.email)
    } else {
      await supabaseAdmin.from('user_profiles').insert({ 
        email: user.email, 
        role: 'admin',
        llm_base_url: legacyBaseUrl, 
        llm_model: legacyModel, 
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
const isCloudflareWorker = typeof (globalThis as any).WebSocketPair !== 'undefined'

if (!isCloudflareWorker && typeof process !== 'undefined' && process.versions && process.versions.node) {
  import('@hono/node-server').then(({ serve }) => {
    console.log(`Server is running on port ${port}`)
    serve({
      fetch: app.fetch,
      port
    })
  })
}

export default app
