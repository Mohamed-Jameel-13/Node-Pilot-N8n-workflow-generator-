import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Tag, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export const runtime = 'edge';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  author: string;
  date: string;
  tags: string[];
  content: {
    intro: string;
    sections: { title: string; body: string }[];
    conclusion: string;
  };
}

const postsData: Record<string, BlogPost> = {
  "self-host-n8n-complete-guide": {
    slug: "self-host-n8n-complete-guide",
    title: "The Complete 2025 Guide to Self-Hosting n8n (Free & Secure)",
    excerpt: "Learn how to self-host n8n on a VPS for complete data ownership. We cover Docker setup, reverse proxy config, SSL certificates, and how to manage it all from a single AI-powered control plane.",
    category: "Guides",
    readTime: "12 min read",
    author: "NodePilot Team",
    date: "July 15, 2025",
    tags: ["n8n", "self-hosting", "Docker", "DevOps"],
    content: {
      intro: "Self-hosting n8n gives you complete ownership over your automation workflows, eliminates execution limits, and protects sensitive customer data from third-party vendor leaks. In this comprehensive guide, we cover step-by-step instructions to deploy n8n securely on any VPS using Docker Compose, Caddy/Nginx reverse proxies, and NodePilot.",
      sections: [
        {
          title: "1. Why Self-Host n8n Instead of Cloud Automation?",
          body: "Cloud automation platforms like Zapier or Make charge per step or execution, scaling costs exponentially as your operations grow. By self-hosting n8n, your execution cost drops to a fixed server fee ($5-$20/month) regardless of whether you process 1,000 or 1,000,000 requests. Additionally, self-hosted n8n allows you to keep API credentials and database connection strings entirely on your own private infrastructure."
        },
        {
          title: "2. Setting Up n8n with Docker Compose",
          body: "The recommended production setup for n8n is using Docker and PostgreSQL. Docker isolates the n8n process while PostgreSQL provides robust transaction persistence. Create a `docker-compose.yml` file defining the n8n service, environment variables (N8N_HOST, N8N_PORT, WEBHOOK_URL), and a volume mount for node packages."
        },
        {
          title: "3. Configuring SSL & Reverse Proxy (Caddy or Nginx)",
          body: "To connect n8n with external webhooks (like Stripe, GitHub, or Shopify), HTTPS is strictly required. Using Caddy as a reverse proxy automatically provisions free Let's Encrypt TLS certificates. Alternatively, Nginx with Certbot provides granular control over proxy headers and buffer sizes."
        },
        {
          title: "4. Streamlining Management with NodePilot Control Plane",
          body: "Managing multiple self-hosted n8n instances manually can lead to configuration drift, missed updates, and difficulty auditing team changes. NodePilot connects to your self-hosted n8n instance via REST API, giving you natural language AI workflow creation, Bring Your Own Key (BYOK) encryption, automated version control, and 1-click rollbacks."
        }
      ],
      conclusion: "Self-hosting n8n combined with NodePilot's AI-assisted control plane gives you enterprise-grade workflow automation with 100% data sovereignty and zero vendor lock-in."
    }
  },
  "n8n-vs-zapier-comparison": {
    slug: "n8n-vs-zapier-comparison",
    title: "n8n vs Zapier in 2025: Which Should You Choose?",
    excerpt: "A head-to-head comparison of n8n and Zapier covering pricing, automation power, data privacy, and when self-hosting with an AI control plane is the better choice for your business.",
    category: "Comparisons",
    readTime: "8 min read",
    author: "NodePilot Team",
    date: "July 10, 2025",
    tags: ["n8n", "Zapier", "comparison", "automation"],
    content: {
      intro: "Choosing between Zapier and n8n comes down to three factors: cost scalability, data privacy compliance, and workflow complexity. While Zapier pioneered no-code automation, n8n has quickly emerged as the developer-friendly, open-source alternative preferred by modern tech teams.",
      sections: [
        {
          title: "1. Cost & Execution Limits Comparison",
          body: "Zapier's task-based pricing penalizes high-volume workflows. A multi-step workflow processing 50,000 items per month can quickly cost upwards of $300-$600/mo on Zapier. With n8n self-hosted, node executions are unlimited, saving organizations up to 90% in operational software expenses."
        },
        {
          title: "2. Visual Node Editor vs Simple Linear Triggers",
          body: "Zapier enforces linear trigger-action structures that become unwieldy for complex logic. n8n supports full JavaScript/Python code execution within nodes, complex branching, loops, merge nodes, and sub-workflows natively."
        },
        {
          title: "3. Data Privacy and SOC2 Compliance",
          body: "Sending sensitive customer data, PII, or internal database records through third-party SaaS cloud servers introduces compliance liabilities. n8n allows on-premise execution behind your own VPC firewall."
        }
      ],
      conclusion: "If you need quick non-technical integrations, Zapier works. But for data control, scaling, and AI-assisted automation control, n8n paired with NodePilot is unbeatable."
    }
  },
  "byok-encryption-workflow-automation": {
    slug: "byok-encryption-workflow-automation",
    title: "What is BYOK Encryption and Why Your Workflows Need It",
    excerpt: "Bring Your Own Key (BYOK) encryption lets you control your own encryption keys, so no vendor — not even us — can read your sensitive workflow credentials. Here's why it matters.",
    category: "Security",
    readTime: "6 min read",
    author: "NodePilot Team",
    date: "July 5, 2025",
    tags: ["BYOK", "encryption", "security", "privacy"],
    content: {
      intro: "Workflow automation engines store your most sensitive assets: API keys, database credentials, OAuth tokens, and internal webhooks. Bring Your Own Key (BYOK) encryption ensures that your master secret keys remain strictly under your control.",
      sections: [
        {
          title: "1. The Danger of Centralized Credential Storage",
          body: "Traditional SaaS platforms store credentials using platform-managed encryption keys. If the vendor experiences a database breach or internal privilege escalation, your API keys for Stripe, AWS, or OpenAI could be exposed."
        },
        {
          title: "2. How BYOK Architecture Protects Your Data",
          body: "With NodePilot's BYOK model, credentials are encrypted client-side using AES-256 before ever reaching storage. Only your self-hosted n8n instance and local browser session hold the decryption keys, guaranteeing zero-trust security."
        }
      ],
      conclusion: "Enforcing BYOK encryption is essential for any business processing sensitive financial, healthcare, or personal user data through automation pipelines."
    }
  },
  "ai-workflow-automation-n8n": {
    slug: "ai-workflow-automation-n8n",
    title: "Building AI-Powered Workflows with n8n: A Practical Guide",
    excerpt: "Use natural language to describe your automation goals and let AI generate the n8n workflow for you. We walk through real examples using NodePilot's AI canvas.",
    category: "Tutorials",
    readTime: "10 min read",
    author: "NodePilot Team",
    date: "June 28, 2025",
    tags: ["AI", "n8n", "automation", "LLM"],
    content: {
      intro: "Artificial Intelligence has transformed workflow automation from manual drag-and-drop node linking to natural language intent specification. In this guide, we explore how LLM prompt engineering converts user instructions directly into executable n8n JSON nodes.",
      sections: [
        {
          title: "1. Prompting Workflows: From Idea to JSON Nodes",
          body: "Instead of manually configuring Webhook triggers, IF conditions, and HTTP Request nodes, NodePilot allows you to prompt: 'When a new lead fills out Typeform, classify their intent with OpenAI and post high-priority leads to Slack.' NodePilot generates valid n8n node schemas instantly."
        },
        {
          title: "2. Connecting Custom AI Endpoints (Ollama, OpenAI, Groq)",
          body: "NodePilot supports full BYOK AI providers. You can hook up local LLMs running via Ollama for zero-cost execution, or leverage ultra-fast inference from Groq and OpenRouter."
        }
      ],
      conclusion: "Combining AI generation with n8n's robust execution engine allows development teams to ship complex automation pipelines 10x faster."
    }
  },
  "n8n-audit-trail-compliance": {
    slug: "n8n-audit-trail-compliance",
    title: "How Audit Trails Keep Your n8n Workflows Compliant",
    excerpt: "Enterprise compliance requires you to know who changed what, and when. Learn how NodePilot's 12-month audit trail helps your team stay audit-ready without extra tooling.",
    category: "Security",
    readTime: "7 min read",
    author: "NodePilot Team",
    date: "June 20, 2025",
    tags: ["compliance", "audit", "enterprise", "n8n"],
    content: {
      intro: "As teams grow, multiple developers and operations staff edit production workflows simultaneously. Without structured audit logging, untracked changes can cause outage downtime or compliance violations.",
      sections: [
        {
          title: "1. Compliance Requirements for Automation Workflows",
          body: "Frameworks like SOC2, HIPAA, and ISO 27001 mandate explicit audit trails for all system modifications. NodePilot records user ID, timestamp, original node configuration, and delta diffs for every deployment."
        }
      ],
      conclusion: "Maintaining a cryptographically verifiable audit trail gives security teams full visibility and peace of mind."
    }
  },
  "n8n-workflow-rollback-versioning": {
    slug: "n8n-workflow-rollback-versioning",
    title: "One-Click Rollback: How to Recover Broken n8n Workflows Instantly",
    excerpt: "Deployed a workflow that broke your automation pipeline? NodePilot's versioning system lets you instantly roll back to any previous state with a single click — no manual recovery needed.",
    category: "Features",
    readTime: "5 min read",
    author: "NodePilot Team",
    date: "June 12, 2025",
    tags: ["versioning", "rollback", "n8n", "DevOps"],
    content: {
      intro: "Even minor updates to HTTP payloads or JSON parsing nodes can break production webhooks. NodePilot introduces seamless snapshot versioning for n8n instances.",
      sections: [
        {
          title: "1. Instant Rollback Mechanics",
          body: "Every time a workflow is deployed through NodePilot, a historical snapshot is saved. If an error is detected in live executions, clicking 'Rollback' immediately restores the previous stable JSON state to your n8n instance."
        }
      ],
      conclusion: "Never lose sleep over production deployment errors again with automated n8n version control."
    }
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = postsData[resolvedParams.slug];

  if (!post) {
    const { data: dbBlog } = await supabase.from('blogs').select('*').eq('slug', resolvedParams.slug).single();
    
    if (dbBlog) {
      return {
        title: `${dbBlog.title} | NodePilot Blog`,
        description: dbBlog.excerpt,
        keywords: ["Community", "Blog"],
        openGraph: {
          title: dbBlog.title,
          description: dbBlog.excerpt,
          type: "article",
        },
      };
    }

    return {
      title: "Post Not Found – NodePilot",
    };
  }

  return {
    title: `${post.title} | NodePilot Blog`,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const staticPost = postsData[resolvedParams.slug];

  let post = null;
  let isDynamic = false;
  let dynamicBodyHtml = "";

  if (staticPost) {
    post = staticPost;
  } else {
    const { data: dbBlog } = await supabase.from('blogs').select('*').eq('slug', resolvedParams.slug).single();
    if (dbBlog) {
      isDynamic = true;
      dynamicBodyHtml = dbBlog.body_html;
      post = {
        slug: dbBlog.slug,
        title: dbBlog.title,
        excerpt: dbBlog.excerpt || "",
        category: "Community",
        readTime: "5 min read",
        author: "Community",
        date: new Date(dbBlog.published_at || dbBlog.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }),
        tags: ["Community"],
        content: { intro: "", sections: [], conclusion: "" }
      } as BlogPost;
    }
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <nav className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <Link href="/contact" className="text-sm font-medium text-primary hover:underline">
            Contact Team
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Post Header */}
        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-3 text-xs font-semibold text-primary">
            <span className="px-2.5 py-1 bg-primary/10 rounded-full">{post.category}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {post.readTime}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> {post.date}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed pt-2 border-b border-border/40 pb-8">
            {post.excerpt}
          </p>
        </div>

        {/* Post Body */}
        {isDynamic ? (
          <article 
            className="prose dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed text-base sm:text-lg" 
            dangerouslySetInnerHTML={{ __html: dynamicBodyHtml }} 
          />
        ) : (
          <article className="prose dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed text-base sm:text-lg">
            <p className="text-lg font-medium leading-relaxed bg-muted/20 p-6 rounded-lg border border-border/40">
              {post.content.intro}
            </p>

            {post.content.sections.map((section, idx) => (
              <div key={idx} className="space-y-4 pt-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border/40 pb-2">
                  {section.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                </p>
              </div>
            ))}

            <div className="pt-6 border-t border-border/40">
              <h3 className="text-xl font-bold mb-3">Conclusion</h3>
              <p className="text-muted-foreground leading-relaxed">{post.content.conclusion}</p>
            </div>
          </article>
        )}

        {/* Tags */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground mr-2">Tags:</span>
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>

        {/* CTA Card */}
        <div className="mt-16 p-8 bg-card border border-border/60 rounded-xl shadow-xl space-y-4 text-center">
          <h3 className="text-2xl font-bold">Ready to automate self-hosted n8n with AI?</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Experience natural language workflow generation, BYOK encryption, and 1-click rollbacks with NodePilot.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link 
              href="/auth/signup" 
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              Start Free Today <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 NodePilot Control Plane. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
