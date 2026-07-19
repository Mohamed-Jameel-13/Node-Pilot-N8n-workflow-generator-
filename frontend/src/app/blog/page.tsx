import Link from "next/link";
import { ArrowRight, Clock, User, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – NodePilot | n8n Workflow Automation Tips & Guides",
  description: "Expert guides on self-hosted n8n automation, AI workflow building, BYOK encryption, and workflow security. Learn how to automate smarter with NodePilot.",
  keywords: ["n8n tutorial", "self-hosted n8n", "workflow automation AI", "n8n BYOK encryption", "n8n audit trail", "automate n8n workflows", "n8n control plane"],
  openGraph: {
    title: "NodePilot Blog – n8n Automation Guides",
    description: "Expert guides on self-hosted n8n workflow automation, AI orchestration, and enterprise security.",
    type: "website",
  },
};

const posts = [
  {
    slug: "self-host-n8n-complete-guide",
    title: "The Complete 2025 Guide to Self-Hosting n8n (Free & Secure)",
    excerpt: "Learn how to self-host n8n on a VPS for complete data ownership. We cover Docker setup, reverse proxy config, SSL certificates, and how to manage it all from a single AI-powered control plane.",
    category: "Guides",
    readTime: "12 min read",
    author: "NodePilot Team",
    date: "July 15, 2025",
    featured: true,
    tags: ["n8n", "self-hosting", "Docker", "DevOps"],
  },
  {
    slug: "n8n-vs-zapier-comparison",
    title: "n8n vs Zapier in 2025: Which Should You Choose?",
    excerpt: "A head-to-head comparison of n8n and Zapier covering pricing, automation power, data privacy, and when self-hosting with an AI control plane is the better choice for your business.",
    category: "Comparisons",
    readTime: "8 min read",
    author: "NodePilot Team",
    date: "July 10, 2025",
    featured: true,
    tags: ["n8n", "Zapier", "comparison", "automation"],
  },
  {
    slug: "byok-encryption-workflow-automation",
    title: "What is BYOK Encryption and Why Your Workflows Need It",
    excerpt: "Bring Your Own Key (BYOK) encryption lets you control your own encryption keys, so no vendor — not even us — can read your sensitive workflow credentials. Here's why it matters.",
    category: "Security",
    readTime: "6 min read",
    author: "NodePilot Team",
    date: "July 5, 2025",
    featured: false,
    tags: ["BYOK", "encryption", "security", "privacy"],
  },
  {
    slug: "ai-workflow-automation-n8n",
    title: "Building AI-Powered Workflows with n8n: A Practical Guide",
    excerpt: "Use natural language to describe your automation goals and let AI generate the n8n workflow for you. We walk through real examples using NodePilot's AI canvas.",
    category: "Tutorials",
    readTime: "10 min read",
    author: "NodePilot Team",
    date: "June 28, 2025",
    featured: false,
    tags: ["AI", "n8n", "automation", "LLM"],
  },
  {
    slug: "n8n-audit-trail-compliance",
    title: "How Audit Trails Keep Your n8n Workflows Compliant",
    excerpt: "Enterprise compliance requires you to know who changed what, and when. Learn how NodePilot's 12-month audit trail helps your team stay audit-ready without extra tooling.",
    category: "Security",
    readTime: "7 min read",
    author: "NodePilot Team",
    date: "June 20, 2025",
    featured: false,
    tags: ["compliance", "audit", "enterprise", "n8n"],
  },
  {
    slug: "n8n-workflow-rollback-versioning",
    title: "One-Click Rollback: How to Recover Broken n8n Workflows Instantly",
    excerpt: "Deployed a workflow that broke your automation pipeline? NodePilot's versioning system lets you instantly roll back to any previous state with a single click — no manual recovery needed.",
    category: "Features",
    readTime: "5 min read",
    author: "NodePilot Team",
    date: "June 12, 2025",
    featured: false,
    tags: ["versioning", "rollback", "n8n", "DevOps"],
  },
];

const categoryColors: Record<string, string> = {
  Guides: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Comparisons: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Security: "bg-red-500/10 text-red-600 dark:text-red-400",
  Tutorials: "bg-green-500/10 text-green-600 dark:text-green-400",
  Features: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function BlogPage() {
  const featured = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            ← Back to Home
          </Link>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">NodePilot Blog</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              n8n Automation Guides &amp; Insights
            </h1>
            <p className="text-lg text-muted-foreground">
              Practical tutorials, security deep-dives, and workflow automation tips for teams running self-hosted n8n.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">

        {/* Featured Posts */}
        <section aria-label="Featured articles" className="mb-16">
          <h2 className="text-2xl font-bold mb-8 tracking-tight">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((post) => (
              <article
                key={post.slug}
                className="group border border-border/50 rounded-2xl bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                {/* Decorative gradient top bar */}
                <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category]}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-6">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                      <span>·</span>
                      <span>{post.date}</span>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Read <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* All Posts */}
        <section aria-label="All articles">
          <h2 className="text-2xl font-bold mb-8 tracking-tight">All Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <article
                key={post.slug}
                className="group border border-border/50 rounded-xl bg-card p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[post.category]}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors leading-snug flex-1">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Read <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="mt-20 border border-border/50 rounded-2xl p-8 md:p-12 bg-card text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Stay ahead with n8n automation tips</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Get weekly guides on self-hosted n8n, AI workflow building, and security best practices delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors whitespace-nowrap">
              Subscribe Free
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No spam. Unsubscribe anytime.</p>
        </section>
      </div>
    </div>
  );
}
