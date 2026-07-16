# Backend Structure Document

This document describes the backend setup for the n8n Prompt-Driven Control Plane (BYOK SaaS) project. It explains how we built and organized the system so that anyone—technical or not—can understand how it works.

## 1. Backend Architecture

Overall, our backend follows a simple yet powerful service-oriented design with two main layers:

• API Layer (Node.js + Hono/Express)
  - Handles incoming requests from the frontend and the AI chat interface.
  - Implements our business logic: user authentication, workspace isolation, workflow state management, and audit logging.
  - Written in TypeScript for clarity and type safety.

• Orchestration Gateway (OmniRoute)
  - Receives structured AI chat requests from our API.
  - Forwards them to one of multiple LLM providers (OpenAI, Anthropic, Google) with automatic failover.
  - Returns structured JSON responses (add_node, update_node, delete_node, connect_nodes).

How it supports key goals:
- Scalability: Each component can scale independently—frontend and API on Cloudflare Workers or Render, OmniRoute as its own container or service.
- Maintainability: Clear separation of concerns (authentication, encryption, AI routing, data storage) makes it easy to update or swap out pieces.
- Performance: Lightweight frameworks (Hono) and edge hosting (Cloudflare) keep response times low, while caching and load balancing handle traffic spikes.

## 2. Database Management

We use Supabase (PostgreSQL) on its free tier to store all our data. Supabase also provides built-in user authentication and row-level security (RLS).

• Database Type:
  - SQL (PostgreSQL).

• Key Tables:
  - `organizations`: tracks each tenant and their billing info.
  - `workspaces`: represents individual self-hosted n8n instances under an organization.
  - `user_profiles`: stores user accounts, encrypted API tokens, encryption key versions, and roles.
  - `workflow_audit_trail`: stores historical snapshots of every workflow change as JSONB.

• Data Management Practices:
  - Row-Level Security (RLS) ensures each user only sees their own organization/workspace data.
  - Daily backups via Supabase free-tier, plus optional SQL exports to Cloudflare R2 for disaster recovery.
  - Audit log retention configurable (12-36 months) with nightly purges triggered by Supabase scheduled functions.

## 3. Database Schema

### Human-Readable Overview

• organizations
  - id (UUID)
  - name
  - stripe_customer_id
  - created_at

• workspaces
  - id (UUID)
  - organization_id (FK)
  - name
  - n8n_endpoint_url
  - created_at

• user_profiles
  - id (UUID)
  - organization_id (FK)
  - email
  - encrypted_password (handled by Supabase Auth)
  - role (e.g., admin, editor, viewer, auditor)
  - encryption_key_versions (JSONB): list of keys with versions and timestamps
  - created_at

• workflow_audit_trail
  - id (UUID)
  - workspace_id (FK)
  - snapshot_timestamp
  - raw_n8n_json (JSONB)
  - change_summary (text)

### SQL DDL (PostgreSQL)

```sql
-- organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  n8n_endpoint_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  encryption_key_versions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- workflow_audit_trail table
CREATE TABLE workflow_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_n8n_json JSONB NOT NULL,
  change_summary TEXT,
  CONSTRAINT audit_retention CHECK (snapshot_timestamp > now() - INTERVAL '36 months')
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_audit_trail ENABLE ROW LEVEL SECURITY;
```

## 4. API Design and Endpoints

Our backend exposes a RESTful API with JWT protection. Here are the key endpoints:

• Authentication & User Management
  - POST `/api/auth/signup` — user sign up (email/password/SSO)
  - POST `/api/auth/login` — returns JWT
  - GET `/api/auth/user` — current user profile

• Organizations & Workspaces
  - GET `/api/organizations` — list orgs user belongs to
  - POST `/api/organizations` — create new org
  - GET `/api/organizations/:orgId/workspaces` — list workspaces
  - POST `/api/organizations/:orgId/workspaces` — create workspace (requires n8n token)

• Workflow Operations
  - POST `/api/workflows/:workspaceId/compile` — validate and compile React Flow JSON into n8n schema
  - POST `/api/workflows/:workspaceId/deploy` — push compiled workflow to n8n via MCP or REST
  - GET `/api/workflows/:workspaceId/audit` — fetch audit snapshots
  - POST `/api/workflows/:workspaceId/rollback` — restore a historical snapshot to n8n

• AI Chat & Tool Calls
  - POST `/api/ai/chat` — accepts user prompt and current canvas state
    • internally calls OmniRoute `/v1/chat/completions`
    • passes function definitions for add_node(), update_node(), delete_node(), connect_nodes()

• Key Management
  - GET `/api/keys` — list encryption key versions
  - POST `/api/keys` — add or rotate a BYOK key

Each endpoint enforces:
- JWT authentication
- Row-Level Security to isolate organizations and workspaces
- CORS restricted to our frontend origin

## 5. Hosting Solutions

• Frontend: Cloudflare Pages Free Tier
  - Global CDN distribution for static assets
  - Automatic builds on Git push

• Backend API: Render Free Web Service or Cloudflare Workers
  - Runs Node.js + Hono/Express
  - Scales on demand within free-tier limits
  - Environment variables for secrets (Supabase URL/Key, OmniRoute URL, ENCRYPTION_SECRET)

• Database & Auth: Supabase Free Tier
  - Managed PostgreSQL with Auth
  - 500 MB storage, daily backups, point-in-time recovery

• AI Gateway: OmniRoute (self-hosted via Docker Compose in dev, or managed container in production)

This combination offers:
- Zero-cost or minimal hosting fees
- High reliability via CDN and managed services
- Push-button deploys and seamless scaling

## 6. Infrastructure Components

• Load Balancer / Edge Network
  - Cloudflare automatic edge caching and SSL termination

• Caching
  - Browser caching of static assets (via Cloudflare Pages)
  - In-memory caching in workers for frequent AI prompts (optional)

• Content Delivery Network (CDN)
  - Static site assets served by Cloudflare Pages

• Containerized Services (Local Dev)
  - Docker Compose brings up PostgreSQL, OmniRoute, and test n8n MCP server
  - Mirrors production for accurate testing

• Background Jobs
  - Supabase scheduled functions (daily purge of old audit logs)
  - Optional scheduled SQL exports to R2 for offsite backups

## 7. Security Measures

• Authentication & Authorization
  - Supabase Auth issues JWTs for every logged-in user
  - Role-based access (Admin, Editor, Viewer, Auditor)
  - Row-Level Security policies in Postgres ensure data isolation

• Data Encryption
  - AES-256-CBC implemented in Node.js (crypto module)
  - All n8n API tokens and BYOK keys encrypted at rest using a server-side `ENCRYPTION_SECRET`
  - TLS enforced for all HTTP traffic

• API Security
  - CORS locked to our verified frontend origin
  - CSRF protection via tokens in cookies (if applicable)
  - Input validation and sanitization to prevent injection attacks

• Compliance
  - GDPR, CCPA: data minimization, right to erasure
  - SOC 2 Type II: audit logs, least privilege, encryption

## 8. Monitoring and Maintenance

• Error Tracking & Performance
  - Sentry (Free Tier)
    • Frontend: Next.js plugin captures errors and slow page loads
    • Backend: Hono/Express integration logs exceptions and latency

• Log Aggregation
  - Logflare (Free Tier) collects structured logs from Cloudflare Workers and Render
  - Alerts via Slack or webhooks on critical error patterns

• Infrastructure Metrics
  - Cloudflare Analytics for bandwidth, status codes, geographic distribution
  - Supabase DB logs forwarded to Logflare for query performance insights

• Maintenance Practices
  - Automated nightly backups and optional offsite exports
  - Regular dependency updates via Dependabot or native CI checks
  - Scheduled audits of RLS policies and encryption key rotations

## 9. Conclusion and Overall Backend Summary

In summary, our backend is built from well-integrated, zero-cost components that ensure security, scalability, and ease of maintenance:

• A Node.js API (Hono/Express + TypeScript) powers business logic.
• Supabase (PostgreSQL + Auth + RLS) handles data storage, user management, and multi-tenant isolation.
• OmniRoute serves as a unified AI gateway with multi-provider failover.
• Cloudflare Pages and Render Free Tier deliver quick, reliable hosting.
• AES-256 encryption, JWTs, and RLS protect every piece of sensitive data.
• Sentry, Logflare, and Cloudflare Analytics give us full observability.

This setup aligns perfectly with our goals: a cost-effective, production-ready control plane that lets anyone build and govern n8n workflows using natural-language prompts, with enterprise-grade audit trails and one-click rollback.
