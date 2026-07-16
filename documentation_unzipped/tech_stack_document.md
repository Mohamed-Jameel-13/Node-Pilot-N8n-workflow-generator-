# Tech Stack Document

This document explains, in everyday language, the technology choices behind our n8n Prompt-Driven Control Plane (BYOK SaaS) project. You don’t need a technical background to understand why each tool and framework was chosen and how they work together.

## 1. Frontend Technologies

We want a fast, interactive, and easy-to-update user interface that works for both technical and non-technical users. Here’s what we use:

- Next.js 15 (App Router)
  • A React-based framework that makes our site fast and easy to navigate.
  • Handles page routing (moving between screens) automatically.
  • Optimized for deployment on Cloudflare Pages with built-in performance benefits.

- @xyflow/react (React Flow)
  • Powers the interactive canvas where users see and connect their workflow nodes.
  • Lets us drag-and-drop nodes and draw lines (edges) between them.

- Tailwind CSS
  • A utility-first styling toolkit, so we can quickly apply consistent colors, spacing, and fonts without writing custom CSS files.
  • Ensures our design stays uniform and easy to tweak.

- shadcn/ui components
  • A ready-made set of user interface elements (buttons, cards, dialogs) designed to plug into Tailwind.
  • Speeds up development and keeps our look-and-feel cohesive.

How these choices enhance the experience:

- Instant loading and smooth navigation thanks to Next.js and Cloudflare Pages.
- A clear, visual workflow canvas powered by React Flow, perfect for drag-and-drop edits.
- Consistent, dark-mode–friendly styling with Tailwind and shadcn/ui, ensuring readability and a modern look.

## 2. Backend Technologies

All the behind-the-scenes logic that powers our AI, data storage, and secure API calls.

- Node.js with Hono (or Express) and TypeScript
  • Node.js runs JavaScript on the server, keeping development fast by using a single language.
  • Hono is a lightweight framework optimized for speed and small deployments; Express is a familiar alternative.
  • TypeScript adds type safety—helping us catch mistakes early in development.

- Supabase (PostgreSQL + Auth + RLS)
  • Provides our database, user authentication (login), and row-level security (RLS) out of the box.
  • PostgreSQL free tier gives us 500 MB of storage for user data, workflows, and audit logs.
  • Supabase Auth manages user signup, password resets, and supports Google/GitHub single sign-on.
  • RLS ensures that each organization and workspace can only see its own data.

- OmniRoute Open-Source Gateway
  • Serves as our AI orchestration layer, transparently routing chat requests to providers like Anthropic, OpenAI, and Google.
  • Supports automatic failover if one provider is unavailable.
  • Presents a single `/v1/chat/completions` endpoint so our code doesn’t need to handle each provider separately.

Data flow:

1. Frontend sends a chat request to our Node.js API.
2. API passes the request (with structured function definitions) to OmniRoute.
3. OmniRoute forwards it to an LLM (e.g., GPT-4o).
4. The AI’s structured response comes back through OmniRoute to our API.
5. API applies the requested changes (add_node, update_node, etc.) to our local JSON model and returns it to the frontend.

## 3. Infrastructure and Deployment

How we host, deploy, and manage our code so it’s reliable and scales without extra cost.

- Cloudflare Pages (Free Tier)
  • Hosts our Next.js frontend globally at no cost.
  • Automatically builds and deploys on each git push.

- Render Free Web Service or Cloudflare Workers
  • Runs our Node.js API on the free tier.
  • Simple to configure—just point to our repository, set environment variables, and go.

- Version Control: GitHub (or similar)
  • All code lives in a git repository for tracking changes and collaborating.
  • We use GitHub Actions (or Render/Cloudflare’s built-in CI) to automatically test and deploy code when we push.

- Local Development: Docker Compose
  • Brings up a sandbox environment with PostgreSQL, OmniRoute, and a test n8n instance.
  • Mirrors production as closely as possible so testing is accurate.

Benefits:

- Zero-cost hosting on Cloudflare and Render keeps the MVP within budget.
- Automatic builds and deployments reduce manual work and human error.
- Local Docker setup ensures everyone on the team can run the full stack on their laptop.

## 4. Third-Party Integrations

We connect to several external services to add functionality without building everything from scratch.

- Supabase Auth (Google & GitHub OAuth)
  • Lets users sign in with Google or GitHub accounts instantly.
  • Plans for enterprise SSO (Azure AD, SAML) in future phases.

- Sentry (Free Tier)
  • Tracks frontend and backend errors and performance issues.
  • Sends alerts via email or Slack when error rates spike.

- Logflare (Free Tier)
  • Collects structured logs from Cloudflare Workers and Render services.
  • Makes logs searchable and sets up alerts for patterns like HTTP 500 errors.

- Cloudflare Analytics (Built-In)
  • Provides site-wide metrics—bandwidth, status codes, geographical distribution—at no charge.

- Stripe (for billing)
  • Manages subscriptions at the organization level.
  • Ties each customer to a Stripe Customer ID for clear invoices and usage tracking.

- n8n Instance-Level MCP / REST API
  • Our core integration: we connect to each user’s self-hosted n8n server using their personal API token.
  • Actions include creating, updating, or deleting nodes, and connecting workflow edges.

## 5. Security and Performance Considerations

We’ve built in multiple layers of protection, and tuned for responsive performance.

Security Measures:

- Encryption at Rest: AES-256-CBC via Node.js crypto module
  • User API tokens and BYOK keys are encrypted with a server‐side secret before storing in Supabase.

- HTTPS Everywhere
  • All traffic between users, our frontend, our backend, and n8n instances is encrypted with TLS.

- Supabase Row-Level Security (RLS)
  • Ensures users can only access data in their organization and workspace.

- JWT Authentication
  • Protects our API endpoints, making sure only logged-in users can send requests.

- CORS Policies
  • Locked down so browsers only allow our approved frontend origins to talk to our API.

- OWASP Top 10 Mitigations
  • Validation, sanitization, and least-privilege principles applied everywhere.

Performance Optimizations:

- Edge Caching on Cloudflare Pages
  • Serves static assets (JavaScript, CSS) from locations close to users.

- Lightweight Frameworks
  • Hono (or Express) keeps our API footprint small and fast.

- React Flow & Zustand
  • State management in the browser is instant, so canvas interactions feel snappy (<100 ms).

- AI Call Efficiency
  • Structured function calls reduce back-and-forth with LLMs, keeping chat–update cycles under 1 second when possible.

## 6. Conclusion and Overall Tech Stack Summary

Our technology choices are guided by three goals: zero-cost hosting, a smooth user experience, and enterprise-grade governance.

- Frontend: Next.js, React Flow, Tailwind, shadcn/ui for a fast, interactive canvas and clear UI.
- Backend: Node.js with Hono or Express, TypeScript for reliable, secure APIs.
- Database & Auth: Supabase (Postgres + Auth + RLS) for multi-tenant isolation out of the box.
- AI Gateway: OmniRoute for seamless, failover-ready access to multiple LLM providers.
- Deployment: Cloudflare Pages and Render free tiers for hassle-free, cost-effective hosting.
- Security: AES-256-CBC encryption, JWT auth, RLS, TLS, and OWASP best practices.
- Observability: Sentry, Logflare, and Cloudflare Analytics keep us on top of errors and performance.
- Integrations: Stripe for billing, Supabase Auth for SSO, and direct n8n MCP/REST calls for workflow control.

Together, this stack empowers both technical and non-technical users to build, edit, and govern n8n workflows with natural-language prompts, all while keeping costs at zero and ensuring enterprise-grade security and auditability.