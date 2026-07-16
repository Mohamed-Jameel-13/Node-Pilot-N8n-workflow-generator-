# Project Requirements Document (PRD)

## 1. Project Overview

We are building a secure, cloud-hosted control plane for self-hosted n8n instances that lets both technical and non-technical users manipulate n8n workflows via natural-language prompts and a visual canvas. Think of it as a SaaS dashboard that connects to your own n8n server over n8n’s native MCP (Model Context Protocol) or REST API. Users can add, update, delete, or connect workflow nodes simply by chatting with an AI assistant or by dragging and dropping on an interactive canvas. Everything you do is tracked in an enterprise-grade audit log, and you get a one-click rollback to any previous state if you ever need to undo your changes.

We’re building this to simplify workflow orchestration, governance, and compliance at scale. Key objectives include:  
• Allowing prompt-driven workflow edits with zero coding.  
• Ensuring user credentials and AI keys are protected at rest (BYOK model).  
• Providing full multi-tenant isolation using Supabase row-level security.  
• Offering instant historic rollback via a JSONB-powered audit trail.  

Success criteria: users can log in via Google or GitHub, connect to their n8n instance, build or modify workflows in under a minute, and restore any prior version with one click—all on free-tier infrastructure.

---

## 2. In-Scope vs. Out-of-Scope

### In-Scope (MVP)
- Next.js 15 app with App Router, React Flow (@xyflow/react), Tailwind CSS, shadcn/ui, hosted on Cloudflare Pages.
- Node.js API (Hono or Express) deployed on Render or Cloudflare Workers.
- Supabase (free PostgreSQL + Auth) with JWT login (email + Google/GitHub OAuth) and RLS policies for org/workspace isolation.
- OmniRoute gateway integration for multi-provider LLM calls (Anthropic Claude 3.5, OpenAI GPT-4o, Google Gemini 3.1 Pro) with failover.
- Visual canvas: add/update/delete/connect nodes via AI chat and drag-and-drop.
- AES-256-CBC encryption service for storing user API tokens and LLM keys (BYOK) with versioning.
- Workflow audit trail in Supabase JSONB column and 12-month retention (configurable up to 36 months).
- 1-click rollback endpoint to restore any historical workflow state directly to n8n.
- Sentry, Logflare, and Cloudflare Analytics for free-tier observability.

### Out-of-Scope (Later Phases)
- Enterprise SSO (Azure AD, SAML) beyond default OAuth providers.
- Multi-region DB replication or advanced DR beyond Supabase free tier backups.
- HIPAA or other region-specific compliance.
- Mobile application version.
- Custom LLM models or paid AI plans.
- Usage-based billing analytics (Stripe integration is planned but not fully built in MVP).

---

## 3. User Flow

A new user lands on the SaaS homepage and clicks “Sign Up.” They pick Google or GitHub SSO (powered by Supabase Auth), confirm their email, and land on an empty dashboard. The user is prompted to create an Organization (for billing and multi-tenant isolation) and then a Workspace, where they paste their personal n8n MCP access token or REST API key. The system encrypts the token and verifies connectivity to their self-hosted n8n instance.

Once connected, the user sees a split-pane view: on the left, an AI chat interface with a friendly “n8n Orchestration Specialist” system prompt; on the right, a React Flow canvas. They type “Add a database query node after the HTTP trigger,” and the AI returns a structured JSON payload to add_node(). Instantly, the new node appears on the canvas with a pulsing green border. The user drags an edge from the trigger node to the new node. When they’re happy, they hit “Deploy,” and the workflow JSON is pushed to n8n via MCP or REST. All changes are recorded in the audit table.

---

## 4. Core Features

- **Authentication & Authorization**: Supabase Auth with email, Google/GitHub OAuth, JWT sessions, RLS for org/workspace isolation.
- **Multi-Tenant Model**: `organizations`, `workspaces`, `user_profiles` tables with RLS policies.
- **BYOK Key Management**: UI for pasting Base64 AES keys or uploading JSON files, versioning, rotation.
- **AI Chat Interface**: Friendly, professional persona, four structured tools (add_node, update_node, delete_node, connect_nodes) with JSON-only outputs.
- **Visual Canvas**: React Flow with custom BaseNode components, split-pane layout, real-time AI diff borders (green/orange/red).
- **Workflow Deployment**: Push to n8n via Instance-Level MCP or REST; Bearer token authorization.
- **Audit Trail**: `workflow_audit_trail` table with JSONB snapshots, 12-month default retention, nightly purge function.
- **Rollback Engine**: POST `/api/workflows/:id/rollback` to restore a chosen snapshot without AI.
- **Encryption Service**: AES-256-CBC functions in Node.js for encrypting tokens and LLM keys.
- **LLM Gateway**: OmniRoute integration for free-tier chat completions with failover logic.
- **Observability**: Sentry (errors + perf), Logflare (structured logs), Cloudflare Analytics.

---

## 5. Tech Stack & Tools

- Frontend: Next.js 15 (App Router), React Flow (@xyflow/react), Tailwind CSS, shadcn/ui.
- Backend: Node.js with Hono (preferred) or Express, TypeScript.
- Hosting: Cloudflare Pages (frontend), Render free Web Service or Cloudflare Workers (backend).
- Database & Auth: Supabase (Postgres free tier, Auth, RLS).
- AI Orchestration: OmniRoute open-source gateway (calls `/v1/chat/completions`).
- Encryption: Node.js `crypto` module (AES-256-CBC).
- Observability: Sentry, Logflare, Cloudflare Analytics.
- Local Dev: Docker Compose (Postgres, OmniRoute, n8n MCP sandbox).
- IDE Plugins: (Optional) Cursor for code AI assistance, Windsurf for local debugging.

---

## 6. Non-Functional Requirements

- **Performance**:  
  • Page TTFB < 300ms on Cloudflare Pages.  
  • Canvas interactions < 100ms.  
  • AI chat + tool-call round-trip < 1s (with caching/fallback).
- **Security**:  
  • AES-256-CBC encryption for secrets.  
  • TLS everywhere.  
  • Supabase RLS & least-privilege JWT scopes.  
  • CORS locked to our origins.  
  • OWASP Top 10 mitigation.
- **Compliance**:  
  • GDPR, CCPA support (data minimization, erasure).  
  • SOC 2 Type II controls in audit logs and access management.
- **Usability**:  
  • Dark-mode UI by default.  
  • Responsive design.  
  • Jargon-light tooltips for non-technical users.

---

## 7. Constraints & Assumptions

- Must stay on all free-tier infrastructure (Supabase 500MB, Cloudflare free plans, Render free services).
- Users must generate and paste n8n PATs; no OAuth flow available from n8n.
- n8n MCP server must be enabled with `N8N_MCP_MANAGED_BY_ENV=true` and `N8N_MCP_ACCESS_ENABLED=true`.
- Supabase free backups only; nightly scheduled SQL exports to R2 as a manual DR workaround.
- OmniRoute gateway and selected LLM free-tier quotas may rate-limit; assume fair usage.

---

## 8. Known Issues & Potential Pitfalls

- **n8n Schema Drift**: Self-hosted users may run different n8n versions. Mitigation: version field in workflow JSON and schema validation library.
- **CORS & Networking**: Self-hosted n8n may sit behind firewalls. Mitigation: clear instructions for opening an HTTPS endpoint or VPN.
- **API Rate Limits**: OmniRoute or free LLM providers may throttle. Mitigation: implement exponential backoff and local caching of recent replies.
- **Supabase RLS Complexity**: Misconfigured policies could block data. Mitigation: write thorough RLS test scripts and staging predicates.
- **Encryption Key Loss**: If a user loses their BYOK key, they can’t decrypt history. Mitigation: warn users about key backup and allow re-import of old versions.


---

This PRD provides a clear, unambiguous blueprint for building the n8n Prompt-Driven Control Plane SaaS MVP. Each subsequent technical doc (architecture diagram, file layouts, code generators) can now reference these specifications directly without guesswork.