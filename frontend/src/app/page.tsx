"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap, Shield, Code, Globe, Database, Activity, GitBranch, Lock, CheckCircle2, Key, History, CreditCard, LogOut, ArrowLeft, PanelLeftClose, Play, Send, Undo2, Redo2, MessageSquare, Sun, Moon, Sparkles, Network, PenTool, ArrowRight, Check, ChevronRight, Terminal, Bot } from "lucide-react";
import StructuredData from "@/components/structured-data";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"canvas" | "audit" | "mcp">("canvas");
  const [showStickyCta, setShowStickyCta] = useState(false);
  
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        if (data.country_code === "IN") {
          setCurrency("INR");
        }
      })
      .catch(err => console.error("Error fetching location", err));

    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    // Scroll listener for sticky CTA
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowStickyCta(true);
      } else {
        setShowStickyCta(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const monthlyPrice = currency === "INR" ? "₹499" : "$3";
  const yearlyPrice = currency === "INR" ? "₹3590" : "$22";

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-20">
        
        {/* Global Keyframe for Flowchart Animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slide-right {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(1000%); opacity: 0; }
          }
        `}} />

        {/* Navigation */}
        <nav className="border-b border-border/40 sticky top-0 bg-background/70 backdrop-blur-xl z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-shadow">
                <Network className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">NodePilot</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 font-medium">
              <a href="#home" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                href={isLoggedIn ? "/dashboard" : "/auth/login"} 
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-all shadow-sm hover:shadow-md"
              >
                {isLoggedIn ? "Dashboard" : "Login"}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-4 h-4" />
            <span>Now supporting Model Context Protocol (MCP)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 text-balance animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150">
            Control your n8n workflows
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">with AI assistance</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 text-balance leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            The premium AI-powered control plane for self-hosted n8n instances. Build, audit, and manage workflows using natural language and enterprise-grade BYOK security.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-500 relative z-20">
            <form className="flex flex-col sm:flex-row w-full max-w-md gap-3 relative group" onSubmit={(e) => e.preventDefault()}>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-blue-500 opacity-20 group-hover:opacity-40 blur-lg transition duration-500"></div>
              <input 
                type="email" 
                placeholder="Enter your work email" 
                className="relative flex-1 bg-background border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-colors shadow-sm"
                required
              />
              <button 
                type="submit"
                className="relative px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 group/btn"
              >
                Start Free <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </form>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required. 14-day free trial.
            </p>
          </div>
        </section>

        {/* Interactive Tabbed Preview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-muted/50 p-1.5 rounded-xl border border-border/50 inline-flex gap-1 backdrop-blur-sm overflow-x-auto max-w-full">
              <button 
                onClick={() => setActiveTab('canvas')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'canvas' ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                <PenTool className="w-4 h-4"/> AI Canvas Builder
              </button>
              <button 
                onClick={() => setActiveTab('audit')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'audit' ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                <History className="w-4 h-4"/> Audit Trail
              </button>
              <button 
                onClick={() => setActiveTab('mcp')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'mcp' ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                <Terminal className="w-4 h-4"/> MCP Integration
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-border/50 relative group">
            
            {/* Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="ml-4 text-sm text-muted-foreground font-mono">
                {activeTab === 'canvas' && "nodepilot.app/flow/lead-sync"}
                {activeTab === 'audit' && "nodepilot.app/settings/audit"}
                {activeTab === 'mcp' && "nodepilot.app/docs/mcp-server"}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">● Connected to n8n</span>
              </div>
            </div>
            
            <div className="h-[450px] md:h-[600px] bg-background relative overflow-hidden flex flex-col md:flex-row">
              {activeTab === 'canvas' && (
                <>
                  <div className="flex-1 relative">
                     {/* Dots background grid simulation */}
                    <div className="absolute inset-0 bg-[radial-gradient(#80808018_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    
                    {/* Nodes Area */}
                    <div className="absolute inset-0 overflow-hidden flex items-center justify-center p-4">
                      {/* SVG Connector Lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                        <path d="M 30%,50% L 50%,50%" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_10s_linear_infinite] text-primary" />
                        <path d="M 50%,50% C 65%,50% 65%,35% 80%,35%" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
                        <path d="M 50%,50% C 65%,50% 65%,65% 80%,65%" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
                      </svg>

                      {/* Webhook Node */}
                      <div className="absolute left-[20%] top-[45%] w-[120px] bg-card border border-border rounded-xl shadow-lg p-3 flex flex-col items-center justify-center text-center group-hover:border-primary/50 transition-colors">
                        <Zap className="w-5 h-5 text-amber-500 mb-1" />
                        <span className="font-semibold text-xs">Webhook Trigger</span>
                      </div>

                      {/* AI Classifier Node */}
                      <div className="absolute left-[45%] top-[45%] w-[120px] bg-primary/10 border border-primary/40 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.1)] p-3 flex flex-col items-center justify-center text-center ring-1 ring-primary/20">
                        <Bot className="w-5 h-5 text-primary mb-1" />
                        <span className="font-semibold text-xs text-primary">AI Lead Router</span>
                      </div>

                      {/* Slack Destination Node */}
                      <div className="absolute left-[75%] top-[30%] w-[120px] bg-card border border-border rounded-xl shadow-lg p-3 flex flex-col items-center justify-center text-center">
                        <MessageSquare className="w-5 h-5 text-blue-500 mb-1" />
                        <span className="font-semibold text-xs">Slack Alert</span>
                      </div>

                      {/* Postgres Node */}
                      <div className="absolute left-[75%] top-[60%] w-[120px] bg-card border border-border rounded-xl shadow-lg p-3 flex flex-col items-center justify-center text-center">
                        <Database className="w-5 h-5 text-emerald-500 mb-1" />
                        <span className="font-semibold text-xs">Postgres DB</span>
                      </div>
                    </div>
                  </div>
                  {/* Chat Panel */}
                  <div className="hidden md:flex w-[300px] border-l border-border/50 bg-muted/10 flex-col justify-between p-4">
                    <div>
                      <div className="font-semibold text-sm mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> AI Assistant</div>
                      <div className="bg-card border border-border/50 p-3 rounded-xl text-xs text-muted-foreground shadow-sm">
                        I've configured the AI Lead Router to categorize incoming leads and route high-priority ones to Slack. Would you like me to deploy this to n8n?
                      </div>
                    </div>
                    <div className="relative">
                      <input disabled placeholder="Ask anything..." className="w-full bg-background border border-border/80 rounded-lg py-2 pl-3 pr-9 text-xs" />
                      <Send className="w-3.5 h-3.5 absolute right-3 top-2.5 text-muted-foreground" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'audit' && (
                <div className="w-full h-full p-8 overflow-y-auto bg-card/30">
                  <h3 className="text-xl font-bold mb-6">Workflow Audit Log</h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-background border border-border/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 1 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {i === 1 ? <Check className="w-4 h-4" /> : <History className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">Lead Sync Flow Updated</div>
                            <div className="text-xs text-muted-foreground">Version {10 - i}.0 • by system_admin • {i * 2} hours ago</div>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-xs font-medium transition-colors">
                          View JSON Diff
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'mcp' && (
                <div className="w-full h-full p-8 bg-card/30 flex items-center justify-center">
                  <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
                      <Terminal className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-mono text-zinc-400">bash</span>
                    </div>
                    <div className="p-4 font-mono text-sm">
                      <div className="text-zinc-500 mb-2"># Add NodePilot MCP server to your AI Agent (e.g., Claude Desktop)</div>
                      <div className="text-emerald-400 mb-4 flex items-center gap-2">
                        <span className="text-zinc-500">$</span> claude mcp add nodepilot https://api.nodepilot.app/mcp
                      </div>
                      <div className="text-zinc-500 mb-2"># The agent can now build workflows autonomously</div>
                      <div className="text-blue-400 flex items-start gap-2">
                        <span className="text-zinc-500">&gt;</span> 
                        <span>
                          "Create a workflow that listens to Shopify webhooks<br/>
                          and saves new orders to Airtable."
                        </span>
                      </div>
                      <div className="text-zinc-300 mt-4 italic opacity-80">
                        Agent: I have generated and deployed the workflow (ID: #4091).
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* Visual Flowchart Section ("How It Works") */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 rounded-[50%] blur-[100px] pointer-events-none -z-10"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 tracking-tight relative z-10">From intention to automation</h2>
          
          <div className="relative max-w-5xl mx-auto z-10">
            {/* Animated connection line for desktop */}
            <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-border -translate-y-1/2 z-0">
              <div className="absolute top-[-2px] left-0 h-0.5 bg-primary w-32 animate-[slide-right_4s_ease-in-out_infinite] shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
              <div className="bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg mb-6 group-hover:-translate-y-1 transition-transform duration-300 relative">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Connect n8n</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Securely link your self-hosted n8n instance via REST API or our Model Context Protocol (MCP) server.
                </p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-white flex items-center justify-center text-2xl shadow-lg mb-6 group-hover:-translate-y-1 transition-transform duration-300 relative">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Build with AI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Use natural language to architect complex workflows. Our AI translates instructions into exact node configurations.
                </p>
              </div>

              <div className="bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg mb-6 group-hover:-translate-y-1 transition-transform duration-300 relative">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Deploy securely</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Push changes directly to n8n with BYOK encryption, automatic versioning, and a complete 12-month audit trail.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 border-t border-border/40">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Enterprise-grade control plane</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to manage self-hosted n8n workflows at scale.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: "Unified Dashboard", desc: "Monitor all workflows, executions, and performance metrics across multiple n8n instances from a single pane of glass." },
              { icon: Lock, title: "BYOK Encryption", desc: "Bring Your Own Keys. Your n8n credentials are encrypted with AES-256-CBC using your own master encryption key." },
              { icon: Database, title: "Complete Audit Trail", desc: "Every workflow change is logged with JSONB snapshots. Default 12-month retention, configurable up to 36 months." },
              { icon: GitBranch, title: "One-Click Rollback", desc: "Restore previous workflow versions instantly. We automatically version every change to ensure zero downtime." },
              { icon: Terminal, title: "MCP Native", desc: "Expose your n8n workflows directly to AI agents via the Model Context Protocol for autonomous execution." },
              { icon: Shield, title: "Multi-tenant Isolation", desc: "Built with Supabase RLS, JWT authentication, and SOC 2 compliant audit logs for enterprise compliance." },
            ].map((feature, i) => (
              <div key={i} className="border border-border/50 rounded-3xl p-8 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-primary/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Premium Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 relative">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Transparent pricing</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">Start free. Scale securely. Cancel anytime.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10">
            {/* Standard Plan */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="mb-8">
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Standard</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-muted-foreground font-medium">/month</span>
                </div>
                <p className="text-muted-foreground mt-4">Perfect for individuals and small automation setups.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Up to 5 workflows", "1,000 AI operations/month", "7-day audit trail", "Community support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground/80 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/auth/signup" 
                className="block w-full px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-semibold text-center transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-card/90 backdrop-blur-xl border-2 border-primary rounded-3xl p-8 shadow-2xl relative group overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-b-lg">
                MOST POPULAR
              </div>
              
              <div className="mb-8 relative z-10 mt-4">
                <div className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  PRO <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold">{monthlyPrice}</span>
                  <span className="text-muted-foreground font-medium">/month</span>
                </div>
                <p className="text-muted-foreground mt-4">For teams running production n8n workflows at scale.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1 relative z-10">
                {[
                  "50 workflows", 
                  "10,000 AI operations/month", 
                  "12-month audit trail", 
                  "BYOK encryption & key versioning",
                  "Priority email support"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href={isLoggedIn ? "/dashboard" : "/auth/signup?plan=pro"} 
                className="relative z-10 block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-center transition-all shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)]"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-12 bg-muted/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                <ul className="space-y-3 text-muted-foreground font-medium text-sm">
                  <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                  <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                  <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
                <ul className="space-y-3 text-muted-foreground font-medium text-sm">
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <Network className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold tracking-tight">NodePilot</span>
              </Link>
              <p className="text-muted-foreground text-sm font-medium">
                © 2026 NodePilot Control Plane. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Sticky Footer CTA */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-in-out ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">NodePilot Pro</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Start automating securely today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="hidden sm:block text-right">
                <div className="font-bold text-lg">{monthlyPrice}<span className="text-muted-foreground text-sm font-normal">/mo</span></div>
              </div>
              <Link 
                href={isLoggedIn ? "/dashboard" : "/auth/signup?plan=pro"} 
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] flex items-center justify-center gap-2 group whitespace-nowrap"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
