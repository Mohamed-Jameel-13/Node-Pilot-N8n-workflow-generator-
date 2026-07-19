// ============================================================
// WorkflowCompiler v2 — Node Registry
// Full 30+ node registry with exact n8n types, typeVersions,
// required parameter schemas, and expression/connection validators
// ============================================================

export interface NodeParameterSchema {
  required: string[];
  forbidden: string[];
}

export interface NodeSchema {
  nodeType: string;
  typeVersion: number;
  requiredConfig: string[];
  requiredCredentials?: string[];
  parameterSchema?: NodeParameterSchema;
  validateNode?: (node: any) => string | null;
}

// ─── 30+ Node Registry with exact n8n types & typeVersions ───────────────────
export const nodeRegistry: Record<string, NodeSchema> = {

  // ── Core Trigger Nodes ───────────────────────────────────────────────────
  "manual_trigger": {
    nodeType: "n8n-nodes-base.manualTrigger",
    typeVersion: 1,
    requiredConfig: [],
  },
  "webhook": {
    nodeType: "n8n-nodes-base.webhook",
    typeVersion: 2,
    requiredConfig: ["path", "httpMethod"],
    parameterSchema: {
      required: ["path", "httpMethod"],
      forbidden: ["placeholder", "TODO", "example.com"]
    },
    validateNode: (node) => {
      const path = node.parameters?.path || "";
      const method = node.parameters?.httpMethod || "";
      if (!path || path.trim() === "") return "Webhook node: 'path' is required and cannot be empty.";
      if (!method) return "Webhook node: 'httpMethod' is required.";
      if (!["GET","POST","PUT","PATCH","DELETE","HEAD"].includes(method.toUpperCase()))
        return `Webhook node: invalid httpMethod '${method}'. Must be GET/POST/PUT/PATCH/DELETE/HEAD.`;
      return null;
    }
  },
  "schedule": {
    nodeType: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1,
    requiredConfig: ["rule"],
    validateNode: (node) => {
      const rule = node.parameters?.rule;
      if (!rule) return "Schedule node: 'rule' parameter is required.";
      return null;
    }
  },
  "error_trigger": {
    nodeType: "n8n-nodes-base.errorTrigger",
    typeVersion: 1,
    requiredConfig: [],
  },

  // ── Core Logic Nodes ─────────────────────────────────────────────────────
  "http_request": {
    nodeType: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    requiredConfig: ["url", "method"],
    parameterSchema: {
      required: ["url", "method"],
      forbidden: ["placeholder", "TODO", "http://example.com", "https://example.com"]
    },
    validateNode: (node) => {
      const url = node.parameters?.url || "";
      const method = node.parameters?.method || "";
      if (!url || url === "") return "HTTP Request: 'url' is required.";
      if (url === "http://example.com" || url === "https://example.com")
        return "HTTP Request: URL cannot be example.com placeholder.";
      if (!method) return "HTTP Request: 'method' is required.";
      return null;
    }
  },
  "code": {
    nodeType: "n8n-nodes-base.code",
    typeVersion: 2,
    requiredConfig: ["jsCode"],
    validateNode: (node) => {
      const code = node.parameters?.jsCode || "";
      if (!code || code.trim() === "") return "Code node: 'jsCode' cannot be empty.";
      if (code.includes("// TODO") || code.includes("placeholder"))
        return "Code node: contains placeholder code.";
      return null;
    }
  },
  "set_fields": {
    nodeType: "n8n-nodes-base.set",
    typeVersion: 3,
    requiredConfig: ["fields"],
    validateNode: (node) => {
      const mode = node.parameters?.mode;
      if (!mode) return "Set Fields node: 'mode' is required (use 'manual').";
      return null;
    }
  },
  "if_condition": {
    nodeType: "n8n-nodes-base.if",
    typeVersion: 2,
    requiredConfig: ["conditions"],
    validateNode: (node) => {
      const conditions = node.parameters?.conditions;
      if (!conditions || (typeof conditions === 'object' && Object.keys(conditions).length === 0))
        return "IF node: 'conditions' must be defined and non-empty.";
      return null;
    }
  },
  "switch": {
    nodeType: "n8n-nodes-base.switch",
    typeVersion: 3,
    requiredConfig: ["rules"],
    validateNode: (node) => {
      const rules = node.parameters?.rules;
      if (!rules) return "Switch node: 'rules' parameter is required.";
      return null;
    }
  },
  "merge": {
    nodeType: "n8n-nodes-base.merge",
    typeVersion: 3,
    requiredConfig: ["mode"],
    validateNode: (node) => {
      const mode = node.parameters?.mode;
      if (!mode) return "Merge node: 'mode' is required (e.g. 'append', 'mergeByKey').";
      return null;
    }
  },
  "split_in_batches": {
    nodeType: "n8n-nodes-base.splitInBatches",
    typeVersion: 3,
    requiredConfig: ["batchSize"],
    validateNode: (node) => {
      const batchSize = node.parameters?.batchSize;
      if (!batchSize && batchSize !== 0) return "SplitInBatches node: 'batchSize' is required.";
      if (Number(batchSize) > 100) return "SplitInBatches node: batchSize > 100 is unsafe in production. Use <= 10 for external APIs.";
      return null;
    }
  },
  "wait": {
    nodeType: "n8n-nodes-base.wait",
    typeVersion: 1,
    requiredConfig: ["amount", "unit"],
  },
  "respond_to_webhook": {
    nodeType: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1,
    requiredConfig: ["respondWith"],
    validateNode: (node) => {
      const rw = node.parameters?.respondWith;
      if (!rw) return "Respond to Webhook: 'respondWith' is required.";
      if (!["json","text","binary","noData"].includes(rw))
        return `Respond to Webhook: invalid respondWith '${rw}'. Must be json/text/binary/noData.`;
      return null;
    }
  },
  "execute_workflow": {
    nodeType: "n8n-nodes-base.executeWorkflow",
    typeVersion: 1,
    requiredConfig: ["workflowId"],
    validateNode: (node) => {
      const wfId = node.parameters?.workflowId;
      if (!wfId) return "Execute Workflow node: 'workflowId' is required.";
      return null;
    }
  },
  "aggregate": {
    nodeType: "n8n-nodes-base.aggregate",
    typeVersion: 1,
    requiredConfig: ["aggregate"],
  },
  "filter": {
    nodeType: "n8n-nodes-base.filter",
    typeVersion: 1,
    requiredConfig: ["conditions"],
  },
  "remove_duplicates": {
    nodeType: "n8n-nodes-base.removeDuplicates",
    typeVersion: 1,
    requiredConfig: [],
  },
  "stop_and_error": {
    nodeType: "n8n-nodes-base.stopAndError",
    typeVersion: 1,
    requiredConfig: ["errorMessage"],
    validateNode: (node) => {
      const msg = node.parameters?.errorMessage;
      if (!msg || msg.trim() === "") return "Stop And Error node: 'errorMessage' cannot be empty.";
      return null;
    }
  },

  // ── Data Integration Nodes ──────────────────────────────────────────────
  "google_sheets": {
    nodeType: "n8n-nodes-base.googleSheets",
    typeVersion: 4,
    requiredConfig: ["operation", "documentId", "sheetName"],
    requiredCredentials: ["googleSheetsOAuth2Api"],
    validateNode: (node) => {
      const op = node.parameters?.operation;
      const docId = node.parameters?.documentId;
      const sheet = node.parameters?.sheetName;
      if (!op) return "Google Sheets: 'operation' is required.";
      if (!docId || docId === "YOUR_DOCUMENT_ID") return "Google Sheets: 'documentId' must be set to a real sheet ID.";
      if (!sheet) return "Google Sheets: 'sheetName' is required.";
      return null;
    }
  },
  "postgres": {
    nodeType: "n8n-nodes-base.postgres",
    typeVersion: 2,
    requiredConfig: ["operation"],
    requiredCredentials: ["postgres"],
    validateNode: (node) => {
      const op = node.parameters?.operation;
      if (!op) return "Postgres node: 'operation' is required.";
      if (op === "executeQuery") {
        const query = node.parameters?.query;
        if (!query || query.trim() === "") return "Postgres node: 'query' is required for executeQuery operation.";
      }
      return null;
    }
  },
  "mysql": {
    nodeType: "n8n-nodes-base.mySql",
    typeVersion: 2,
    requiredConfig: ["operation"],
    requiredCredentials: ["mySql"],
  },
  "supabase": {
    nodeType: "n8n-nodes-base.supabase",
    typeVersion: 1,
    requiredConfig: ["operation", "tableId"],
    requiredCredentials: ["supabaseApi"],
    validateNode: (node) => {
      const tableId = node.parameters?.tableId;
      if (!tableId || tableId.trim() === "") return "Supabase node: 'tableId' is required.";
      return null;
    }
  },
  "redis": {
    nodeType: "n8n-nodes-base.redis",
    typeVersion: 1,
    requiredConfig: ["operation"],
    requiredCredentials: ["redis"],
  },
  "notion": {
    nodeType: "n8n-nodes-base.notion",
    typeVersion: 2,
    requiredConfig: ["resource", "operation"],
    requiredCredentials: ["notionApi"],
  },
  "airtable": {
    nodeType: "n8n-nodes-base.airtable",
    typeVersion: 2,
    requiredConfig: ["operation", "baseId", "tableId"],
    requiredCredentials: ["airtableTokenApi"],
  },

  // ── AI/LLM Nodes ─────────────────────────────────────────────────────────
  "openai_chat": {
    nodeType: "@n8n/n8n-nodes-langchain.openAi",
    typeVersion: 1,
    requiredConfig: ["resource", "operation"],
    requiredCredentials: ["openAiApi"],
    validateNode: (node) => {
      const resource = node.parameters?.resource;
      if (!resource) return "OpenAI node: 'resource' is required.";
      return null;
    }
  },
  "ai_agent": {
    nodeType: "@n8n/n8n-nodes-langchain.agent",
    typeVersion: 1,
    requiredConfig: ["agent"],
    requiredCredentials: ["openAiApi"],
  },

  // ── Communication Nodes ──────────────────────────────────────────────────
  "slack_send": {
    nodeType: "n8n-nodes-base.slack",
    typeVersion: 2,
    requiredConfig: ["resource", "operation", "channel"],
    requiredCredentials: ["slackOAuth2Api"],
    validateNode: (node) => {
      const channel = node.parameters?.channel;
      if (!channel || channel.trim() === "") return "Slack node: 'channel' is required.";
      return null;
    }
  },
  "email_send": {
    nodeType: "n8n-nodes-base.emailSend",
    typeVersion: 2,
    requiredConfig: ["toEmail", "subject"],
    requiredCredentials: ["smtp"],
    validateNode: (node) => {
      const to = node.parameters?.toEmail;
      const subject = node.parameters?.subject;
      if (!to || to.trim() === "") return "Email Send node: 'toEmail' is required.";
      if (!subject || subject.trim() === "") return "Email Send node: 'subject' is required.";
      return null;
    }
  },
  "gmail": {
    nodeType: "n8n-nodes-base.gmail",
    typeVersion: 2,
    requiredConfig: ["resource", "operation"],
    requiredCredentials: ["gmailOAuth2"],
  },
  "whatsapp": {
    nodeType: "n8n-nodes-base.whatsApp",
    typeVersion: 1,
    requiredConfig: ["resource", "operation"],
    requiredCredentials: ["whatsAppCloudApi"],
  },

  // ── Scraping Nodes ───────────────────────────────────────────────────────
  "apify_scraper": {
    nodeType: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    requiredConfig: ["url", "method"],
    requiredCredentials: ["httpBinAuth"],
    validateNode: (node) => {
      const url = node.parameters?.url || "";
      if (!url.includes("apify.com")) return "Apify Scraper: URL must point to api.apify.com.";
      return null;
    }
  },
};

// ─── Credential Type Map ──────────────────────────────────────────────────────
export const credentialTypeMap: Record<string, string> = {
  "google_sheets": "googleSheetsOAuth2Api",
  "openai_chat":   "openAiApi",
  "ai_agent":      "openAiApi",
  "slack_send":    "slackOAuth2Api",
  "gmail":         "gmailOAuth2",
  "postgres":      "postgres",
  "mysql":         "mySql",
  "notion":        "notionApi",
  "airtable":      "airtableTokenApi",
  "whatsapp":      "whatsAppCloudApi",
  "supabase":      "supabaseApi",
  "redis":         "redis",
  "apify_scraper": "httpBinAuth",
  "email_send":    "smtp",
};

// ─── Expression Validator ─────────────────────────────────────────────────────
const INVALID_EXPRESSION_PATTERNS = [
  { pattern: /^\{\{[^=]/, description: "missing '=' prefix" },
  { pattern: /^\{\s*\{\s*\$json/, description: "has space after opening brace" },
  { pattern: /^=\{\{\s*\}\}$/, description: "empty expression" },
  { pattern: /placeholder/i, description: "contains placeholder value" },
  { pattern: /TODO/i, description: "contains TODO value" },
];

export function validateExpression(value: string, nodeName: string, fieldName: string): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('=')) return null;

  for (const { pattern, description } of INVALID_EXPRESSION_PATTERNS) {
    if (pattern.test(value)) {
      return `Node '${nodeName}' field '${fieldName}': invalid expression '${value}' — ${description}`;
    }
  }
  return null;
}

function validateExpressionsInObject(obj: any, nodeName: string, path: string = ''): string[] {
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null) return errors;

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && value.startsWith('=')) {
      const err = validateExpression(value, nodeName, fieldPath);
      if (err) errors.push(err);
    } else if (typeof value === 'object') {
      errors.push(...validateExpressionsInObject(value, nodeName, fieldPath));
    }
  }
  return errors;
}

// ─── Connection Validator ─────────────────────────────────────────────────────
export function validateConnections(
  nodes: any[],
  edges: any[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map(n => n.id));
  const nodeNames = new Map(nodes.map(n => [n.id, n.data?.label || n.name || n.id]));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node ID: '${edge.source}'`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node ID: '${edge.target}'`);
    }
    if (edge.source === edge.target) {
      errors.push(`Self-loop detected on node '${nodeNames.get(edge.source)}'`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── DAG Validator ────────────────────────────────────────────────────────────
export function validateDAG(nodes: any[], edges: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const adj: Map<string, string[]> = new Map();
  for (const node of nodes) adj.set(node.id, []);
  for (const edge of edges) {
    const sources = adj.get(edge.source);
    if (sources) sources.push(edge.target);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);
    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push(`Circular dependency (cycle) detected in workflow graph. Workflows must be Directed Acyclic Graphs.`);
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Main Workflow Validator (v2) ─────────────────────────────────────────────
export function validateWorkflow(
  nodes: any[],
  edges: any[]
): { valid: boolean; errors: string[]; warnings: string[]; score: number } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    return { valid: false, errors: ["Workflow cannot be empty."], warnings, score: 0 };
  }

  const nodeIds = new Set<string>();
  const nodeNames = new Set<string>();

  for (const node of nodes) {
    const nodeData = node.data || node;
    const parameters = nodeData.parameters || node.parameters || {};
    const nodeName = nodeData.label || node.name || 'Unnamed Node';
    const nodeId = node.id || '';
    const nodeType = nodeData.type || node.type || '';

    if (nodeId && nodeIds.has(nodeId)) {
      errors.push(`Duplicate node ID detected: '${nodeId}'. Node IDs must be unique.`);
    }
    if (nodeId) nodeIds.add(nodeId);

    if (nodeNames.has(nodeName)) {
      errors.push(`Duplicate node name: '${nodeName}'. Names must be unique.`);
    }
    nodeNames.add(nodeName);

    const paramsStr = JSON.stringify(parameters);
    if (paramsStr === "{}" || paramsStr === '{"options":{}}') {
      errors.push(`Node '${nodeName}': parameters are empty. All nodes must have complete configuration.`);
    }
    if (paramsStr.includes('"placeholder"') || paramsStr.includes('"TODO"')) {
      errors.push(`Node '${nodeName}': contains placeholder/TODO values.`);
    }
    if (paramsStr.includes('"YOUR_DOCUMENT_ID"')) {
      errors.push(`Node '${nodeName}': contains placeholder document ID.`);
    }

    const exprErrors = validateExpressionsInObject(parameters, nodeName);
    errors.push(...exprErrors);

    const registryKey = Object.keys(nodeRegistry).find(key => {
      const schema = nodeRegistry[key]!;
      return schema.nodeType === nodeType || nodeName.toLowerCase().includes(key.replace(/_/g, ' '));
    });

    if (registryKey) {
      const schema = nodeRegistry[registryKey]!;

      const declaredVersion = nodeData.typeVersion || node.typeVersion;
      if (declaredVersion && declaredVersion !== schema.typeVersion) {
        warnings.push(`Node '${nodeName}': typeVersion ${declaredVersion} declared but registry expects ${schema.typeVersion}.`);
      }

      for (const requiredField of schema.requiredConfig) {
        const val = parameters[requiredField];
        if (
          val === undefined || 
          val === null || 
          val === '' || 
          (typeof val === 'object' && Object.keys(val).length === 0)
        ) {
          errors.push(`Node '${nodeName}': required field '${requiredField}' is missing or empty.`);
        }
      }

      // Credentials are user-managed in n8n directly — never block deploy for missing credentials
      if (schema.requiredCredentials && schema.requiredCredentials.length > 0) {
        const credentials = nodeData.credentials || node.credentials || {};
        if (Object.keys(credentials).length === 0) {
          warnings.push(`Node '${nodeName}': credentials not set (${schema.requiredCredentials.join(', ')}) — configure in n8n UI after deploy.`);
        }
      }

      if (schema.validateNode) {
        const customError = schema.validateNode({ parameters, name: nodeName, type: nodeType });
        if (customError) errors.push(customError);
      }
    }

    // Credential checks are informational only — user configures them in n8n UI
    if (nodeType === "n8n-nodes-base.googleSheets") {
      const credentials = nodeData.credentials || node.credentials || {};
      if (Object.keys(credentials).length === 0) {
        warnings.push(`Node '${nodeName}': Google Sheets credentials not set — configure OAuth2 in n8n UI after deploy.`);
      }
    }
    if (nodeType === "n8n-nodes-base.slack") {
      const credentials = nodeData.credentials || node.credentials || {};
      if (Object.keys(credentials).length === 0) {
        warnings.push(`Node '${nodeName}': Slack credentials not set — configure OAuth2 in n8n UI after deploy.`);
      }
    }
  }

  if (nodes.length > 1) {
    const sourceIds = new Set(edges.map((e: any) => e.source));
    const targetIds = new Set(edges.map((e: any) => e.target));
    for (const node of nodes) {
      const isSource = sourceIds.has(node.id);
      const isTarget = targetIds.has(node.id);
      if (!isSource && !isTarget) {
        errors.push(`Node '${node.data?.label || node.name}' is disconnected from the workflow.`);
      }
    }
  }

  const connValidation = validateConnections(nodes, edges);
  errors.push(...connValidation.errors);

  const dagValidation = validateDAG(nodes, edges);
  errors.push(...dagValidation.errors);

  let score = 100;
  score -= Math.min(errors.length * 5, 60);
  score -= Math.min(warnings.length * 2, 20);
  score = Math.max(0, score);

  return { valid: errors.length === 0, errors, warnings, score };
}

// ─── Node Type Mapper (label → n8n type + typeVersion) ───────────────────────
export function resolveNodeType(label: string): { nodeType: string; typeVersion: number } {
  const l = label.toLowerCase();

  for (const [key, schema] of Object.entries(nodeRegistry)) {
    const keyWords = key.replace(/_/g, ' ');
    if (l.includes(keyWords) || l === keyWords) {
      return { nodeType: schema.nodeType, typeVersion: schema.typeVersion };
    }
  }

  if (l.includes('webhook') && l.includes('respond')) return { nodeType: 'n8n-nodes-base.respondToWebhook', typeVersion: 1 };
  if (l.includes('webhook')) return { nodeType: 'n8n-nodes-base.webhook', typeVersion: 2 };
  if (l.includes('cron') || l.includes('schedule')) return { nodeType: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1 };
  if (l.includes('apify')) return { nodeType: 'n8n-nodes-base.httpRequest', typeVersion: 4 };
  if (l.includes('http') || l.includes('api') || l.includes('request')) return { nodeType: 'n8n-nodes-base.httpRequest', typeVersion: 4 };
  if (l.includes('google sheet') || l.includes('sheets')) return { nodeType: 'n8n-nodes-base.googleSheets', typeVersion: 4 };
  if (l.includes('postgres') || l.includes('postgresql')) return { nodeType: 'n8n-nodes-base.postgres', typeVersion: 2 };
  if (l.includes('mysql')) return { nodeType: 'n8n-nodes-base.mySql', typeVersion: 2 };
  if (l.includes('supabase')) return { nodeType: 'n8n-nodes-base.supabase', typeVersion: 1 };
  if (l.includes('redis')) return { nodeType: 'n8n-nodes-base.redis', typeVersion: 1 };
  if (l.includes('notion')) return { nodeType: 'n8n-nodes-base.notion', typeVersion: 2 };
  if (l.includes('airtable')) return { nodeType: 'n8n-nodes-base.airtable', typeVersion: 2 };
  if (l.includes('openai') || l.includes('gpt') || l.includes('llm')) return { nodeType: '@n8n/n8n-nodes-langchain.openAi', typeVersion: 1 };
  if (l.includes('ai agent') || l.includes('agent')) return { nodeType: '@n8n/n8n-nodes-langchain.agent', typeVersion: 1 };
  if (l.includes('slack')) return { nodeType: 'n8n-nodes-base.slack', typeVersion: 2 };
  if (l.includes('gmail')) return { nodeType: 'n8n-nodes-base.gmail', typeVersion: 2 };
  if (l.includes('email') || l.includes('mail') || l.includes('smtp')) return { nodeType: 'n8n-nodes-base.emailSend', typeVersion: 2 };
  if (l.includes('whatsapp')) return { nodeType: 'n8n-nodes-base.whatsApp', typeVersion: 1 };
  if (l.includes('split') || l.includes('batch')) return { nodeType: 'n8n-nodes-base.splitInBatches', typeVersion: 3 };
  if (l.includes('merge')) return { nodeType: 'n8n-nodes-base.merge', typeVersion: 3 };
  if (l.includes('filter')) return { nodeType: 'n8n-nodes-base.filter', typeVersion: 1 };
  if (l.includes('dedupe') || l.includes('duplicate')) return { nodeType: 'n8n-nodes-base.removeDuplicates', typeVersion: 1 };
  if (l.includes('aggregate')) return { nodeType: 'n8n-nodes-base.aggregate', typeVersion: 1 };
  if (l.includes('wait') || l.includes('delay')) return { nodeType: 'n8n-nodes-base.wait', typeVersion: 1 };
  if (l.includes('if') || l.includes('condition') || l.includes('branch')) return { nodeType: 'n8n-nodes-base.if', typeVersion: 2 };
  if (l.includes('switch') || l.includes('route')) return { nodeType: 'n8n-nodes-base.switch', typeVersion: 3 };
  if (l.includes('set') || l.includes('transform') || l.includes('map')) return { nodeType: 'n8n-nodes-base.set', typeVersion: 3 };
  if (l.includes('code') || l.includes('function') || l.includes('script') || l.includes('validate') || l.includes('score') || l.includes('enrich') || l.includes('deduplicate')) {
    return { nodeType: 'n8n-nodes-base.code', typeVersion: 2 };
  }
  if (l.includes('error') || l.includes('stop')) return { nodeType: 'n8n-nodes-base.stopAndError', typeVersion: 1 };
  if (l.includes('respond')) return { nodeType: 'n8n-nodes-base.respondToWebhook', typeVersion: 1 };
  if (l.includes('execute workflow') || l.includes('sub-workflow')) return { nodeType: 'n8n-nodes-base.executeWorkflow', typeVersion: 1 };
  if (l.includes('manual') || l.includes('trigger')) return { nodeType: 'n8n-nodes-base.manualTrigger', typeVersion: 1 };

  return { nodeType: 'n8n-nodes-base.httpRequest', typeVersion: 4 };
}
