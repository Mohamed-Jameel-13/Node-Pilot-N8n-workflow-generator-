import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Self-Host n8n in 2025: Complete Free Guide | NodePilot",
  description: "Step-by-step guide to self-hosting n8n on a VPS using Docker. Covers setup, reverse proxy with Nginx, SSL, and managing all your workflows from an AI control plane.",
  keywords: ["self-host n8n", "n8n Docker setup", "n8n VPS tutorial", "n8n free hosting", "n8n control plane", "n8n workflow automation 2025"],
  openGraph: {
    title: "The Complete 2025 Guide to Self-Hosting n8n",
    description: "Learn how to self-host n8n on a VPS for complete data ownership, covering Docker, Nginx, SSL, and AI-powered workflow management.",
    type: "article",
    publishedTime: "2025-07-15T00:00:00Z",
    authors: ["NodePilot Team"],
    tags: ["n8n", "self-hosting", "Docker", "DevOps", "automation"],
  },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Article Header */}
      <div className="border-b border-border/40 bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Blog
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">Guides</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
            The Complete 2025 Guide to Self-Hosting n8n (Free &amp; Secure)
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Learn how to self-host n8n on a VPS for complete data ownership. We cover Docker setup, reverse proxy config, SSL certificates, and how to manage it all from a single AI-powered control plane.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>NodePilot Team</span>
            <span>·</span>
            <time dateTime="2025-07-15">July 15, 2025</time>
            <span>·</span>
            <span>12 min read</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="prose prose-base dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-code:text-primary prose-strong:text-foreground max-w-none">

          <h2>Why Self-Host n8n?</h2>
          <p>
            n8n is one of the most powerful open-source workflow automation tools available. Unlike SaaS tools such as Zapier or Make,
            self-hosting n8n gives you <strong>complete control over your data</strong>, no per-task pricing, and unlimited workflows.
          </p>
          <p>
            In 2025, the combination of cheap VPS providers and tools like <strong>NodePilot</strong> make self-hosting n8n easier than ever —
            even without deep DevOps experience.
          </p>

          <h2>What You'll Need</h2>
          <ul>
            <li>A VPS (DigitalOcean, Hetzner, or Vultr — from $4/mo)</li>
            <li>Docker and Docker Compose installed</li>
            <li>A domain name pointing to your server</li>
            <li>~30 minutes of setup time</li>
          </ul>

          <h2>Step 1: Install Docker on Your VPS</h2>
          <p>SSH into your server and install Docker:</p>
          <pre><code>{`curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER`}</code></pre>

          <h2>Step 2: Create Your n8n Docker Compose File</h2>
          <p>Create a <code>docker-compose.yml</code> file:</p>
          <pre><code>{`version: '3'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=your-domain.com
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://your-domain.com/
    volumes:
      - ~/.n8n:/home/node/.n8n`}</code></pre>

          <p>Run it:</p>
          <pre><code>docker compose up -d</code></pre>

          <h2>Step 3: Set Up Nginx Reverse Proxy &amp; SSL</h2>
          <p>
            Install Nginx and Certbot to get a free SSL certificate from Let's Encrypt.
            This is what makes your n8n instance accessible at <code>https://your-domain.com</code>.
          </p>

          <h2>Step 4: Manage Everything with NodePilot</h2>
          <p>
            Once your n8n instance is running, connect it to <strong>NodePilot</strong>. Instead of manually navigating
            the n8n UI for every change, NodePilot lets you:
          </p>
          <ul>
            <li>Build workflows using natural language (AI canvas)</li>
            <li>Deploy with one click directly to your self-hosted instance</li>
            <li>Roll back any workflow to a previous version instantly</li>
            <li>Maintain a full 12-month audit trail for compliance</li>
            <li>Encrypt all your credentials with BYOK (Bring Your Own Key)</li>
          </ul>

          <h2>Why NodePilot Instead of the Raw n8n UI?</h2>
          <p>
            The raw n8n editor is powerful but not built for teams. NodePilot adds an AI-first layer on top,
            letting you describe what you want in plain English and getting a deployable workflow back in seconds.
          </p>

          <div className="not-prose mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <h3 className="font-bold text-lg mb-2 text-foreground">Try NodePilot Free for 1 Day</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Connect your self-hosted n8n instance and start building AI-powered workflows today.
              No charge for the first 24 hours — cancel anytime.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-16 pt-10 border-t border-border/40">
          <h2 className="text-xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/blog/n8n-vs-zapier-comparison" className="group p-4 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all">
              <p className="text-xs text-muted-foreground mb-1">Comparisons</p>
              <h3 className="font-semibold group-hover:text-primary transition-colors text-sm leading-snug">n8n vs Zapier in 2025: Which Should You Choose?</h3>
            </Link>
            <Link href="/blog/byok-encryption-workflow-automation" className="group p-4 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all">
              <p className="text-xs text-muted-foreground mb-1">Security</p>
              <h3 className="font-semibold group-hover:text-primary transition-colors text-sm leading-snug">What is BYOK Encryption and Why Your Workflows Need It</h3>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to all articles
          </Link>
        </div>
      </article>
    </div>
  );
}
