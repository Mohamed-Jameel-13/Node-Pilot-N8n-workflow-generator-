"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap, Shield, Code, Globe, Database, Activity, GitBranch, Lock, CheckCircle2, Key, History, CreditCard, LogOut, ArrowLeft, PanelLeftClose, Play, Send, Undo2, Redo2, MessageSquare, Sun, Moon, Sparkles, Network, PenTool } from "lucide-react";
import StructuredData from "@/components/structured-data";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const monthlyPrice = currency === "INR" ? "₹299" : "$3";
  const yearlyPrice = currency === "INR" ? "₹2990" : "$30";

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
        {/* Navigation */}
        <nav className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Network className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">NodePilot</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 font-medium">
              <a href="#home" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                href={isLoggedIn ? "/dashboard" : "/auth/login"} 
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors shadow-sm"
              >
                {isLoggedIn ? "Dashboard" : "Login"}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background"></div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance">
            Control your n8n workflows
            <br />
            <span className="font-mono text-primary/80">with AI assistance</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 text-balance leading-relaxed">
            AI-powered control plane for self-hosted n8n instances. Build and manage workflows 
            with natural language, secure BYOK encryption, enterprise audit trails, and one-click rollbacks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={isLoggedIn ? "/dashboard" : "/auth/signup"} 
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start for free"}
            </Link>
            <Link 
              href="/dashboard" 
              className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md font-semibold text-lg transition-colors border border-border shadow-sm"
            >
              View Demo
            </Link>
          </div>
        </section>

        {/* Dashboard Preview (Visual replica of the current AI canvas dashboard) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden ring-1 ring-border/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="ml-4 text-sm text-muted-foreground font-mono">flowforge.app/dashboard/default/canvas</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">● Connected to n8n</span>
              </div>
            </div>
            
            <div className="flex flex-col md:grid md:grid-cols-12 h-[400px] md:h-[550px] bg-background text-foreground select-none">
              
              {/* 1. Left Sidebar Mockup (Exact layout of the real application) */}
              <div className="hidden md:flex md:col-span-2 flex-col justify-between border-r border-border bg-[#0b0b0c] p-3 text-xs">
                <div className="space-y-6">
                  {/* Sidebar Header */}
                  <div className="h-10 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Network className="w-4 h-4 text-primary" />
                      <span>Control Plane</span>
                    </div>
                    <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  
                  {/* Sidebar Menu Links */}
                  <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#18181b] text-foreground font-medium cursor-pointer">
                      <PenTool className="w-4 h-4 text-primary" />
                      <span>Canvas</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground font-medium cursor-pointer hover:bg-[#18181b]/30">
                      <Key className="w-4 h-4" />
                      <span>API & Settings</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground font-medium cursor-pointer hover:bg-[#18181b]/30">
                      <History className="w-4 h-4" />
                      <span>Audit Trail</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground font-medium cursor-pointer hover:bg-[#18181b]/30">
                      <CreditCard className="w-4 h-4" />
                      <span>Pricing & Billing</span>
                    </div>
                  </nav>
                </div>
                
                {/* Sidebar Footer */}
                <div className="border-t border-border/40 pt-3 space-y-3">
                  <div className="flex items-center justify-between px-2 text-muted-foreground text-[10px]">
                    <span>Logged in</span>
                    <div className="w-5 h-5 rounded hover:bg-muted flex items-center justify-center">
                      <Sun className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </div>
                </div>
              </div>

              {/* 2. Middle Canvas Mockup (Dot Grid + Nodes Workflow) */}
              <div className="flex-1 md:col-span-7 flex flex-col justify-between relative bg-background overflow-hidden border-r-0 md:border-r border-border">
                {/* Dots background grid simulation */}
                <div className="absolute inset-0 bg-[radial-gradient(#80808018_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                
                {/* Canvas Header (Matching real layout) */}
                <div className="p-2.5 border-b border-border bg-background/80 backdrop-blur flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border border-border rounded flex items-center justify-center bg-card">
                      <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <input 
                      disabled
                      value="Lead Sync Flow" 
                      className="bg-transparent border border-border/80 px-2.5 py-1 rounded text-xs text-foreground font-medium w-36 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 border-r border-border pr-3">
                      <Undo2 className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer" />
                      <Redo2 className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer" />
                    </div>
                    <div className="flex gap-2">
                      <button disabled className="px-3 py-1 bg-secondary text-secondary-foreground border border-border rounded text-xs font-medium">Clear Canvas</button>
                      <button disabled className="px-3 py-1 bg-[#18181b] text-white rounded text-xs font-medium border border-border/80 shadow">
                        Deploy to n8n
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nodes Area */}
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
                    <div className="min-w-[500px] h-full relative flex items-center justify-center p-4">
                      {/* SVG Connector Lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {/* Webhook -> AI Classifier (Animated dash) */}
                        <path 
                          d="M 120,205 L 210,205" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="2" 
                          strokeDasharray="4 4"
                          className="animate-[dash_10s_linear_infinite]"
                        />
                        {/* AI Classifier -> Slack (Branch up) */}
                        <path 
                          d="M 290,205 C 330,205 330,135 370,135" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2"
                        />
                        {/* AI Classifier -> Postgres (Branch down) */}
                        <path 
                          d="M 290,205 C 330,205 330,275 370,275" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2"
                        />
                      </svg>

                      {/* Webhook Node */}
                      <div className="absolute left-[30px] top-[170px] w-[100px] bg-[#18181b] border border-zinc-700/60 rounded-md shadow p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-sm">⚡</span>
                        <span className="font-semibold text-[10px] text-white">Webhook Trigger</span>
                      </div>

                      {/* AI Classifier Node */}
                      <div className="absolute left-[200px] top-[170px] w-[100px] bg-[#18181b] border border-zinc-700/60 rounded-md shadow p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-sm">🤖</span>
                        <span className="font-semibold text-[10px] text-white">AI Lead Router</span>
                      </div>

                      {/* Slack Destination Node */}
                      <div className="absolute left-[360px] top-[100px] w-[100px] bg-[#18181b] border border-zinc-700/60 rounded-md shadow p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-sm">💬</span>
                        <span className="font-semibold text-[10px] text-white">Slack Alert</span>
                      </div>

                      {/* Postgres Node */}
                      <div className="absolute left-[360px] top-[240px] w-[100px] bg-[#18181b] border border-zinc-700/60 rounded-md shadow p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-sm">🗄️</span>
                        <span className="font-semibold text-[10px] text-white">Postgres DB</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Zoom Controls (bottom-left matching real layout) */}
                  <div className="absolute bottom-3 left-3 bg-card border border-border rounded shadow-sm flex items-center p-1 gap-1 text-muted-foreground scale-90">
                    <button className="p-1 hover:text-foreground text-[10px]">+</button>
                    <button className="p-1 hover:text-foreground text-[10px]">-</button>
                    <button className="p-1 hover:text-foreground text-[10px]">⛶</button>
                    <button className="p-1 hover:text-foreground text-[10px]">🔒</button>
                  </div>

                  {/* Floating Minimap Preview (bottom-right matching real layout) */}
                  <div className="absolute bottom-3 right-3 w-16 h-12 border border-border bg-card/60 backdrop-blur rounded flex items-center justify-center">
                    <div className="w-10 h-7 border border-primary/20 bg-primary/5 rounded"></div>
                  </div>
                </div>

                {/* React Flow Attribution Watermark */}
                <div className="absolute bottom-1 right-24 text-[8px] text-muted-foreground/30 font-semibold font-mono pointer-events-none">
                  React Flow
                </div>

                {/* Canvas Status bar */}
                <div className="p-1.5 bg-muted/20 border-t border-border flex justify-between text-[9px] text-muted-foreground px-4">
                  <span>Zoom: 100%</span>
                  <span>Press Space to Pan</span>
                </div>
              </div>

              {/* 3. Right Side: Chat Panel Mockup (Matching n8n Orchestration Specialist) */}
              <div className="hidden md:flex md:col-span-3 flex-col justify-between bg-card/10 text-xs">
                {/* Chat Header */}
                <div className="p-3 border-b border-border bg-background/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">n8n Orchestration Specialist</span>
                  </div>
                  <History className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer" />
                </div>
                
                {/* Chat Messages Body */}
                <div className="flex-1 p-3.5 space-y-4 overflow-y-auto">
                  <div className="bg-muted/40 border border-border/50 p-3 rounded-lg text-muted-foreground leading-relaxed text-[11px]">
                    Hello! Describe what you want to build or modify in your n8n workflow.
                  </div>
                </div>
                
                {/* Chat Input Area */}
                <div className="p-3 border-t border-border bg-background">
                  <div className="relative flex items-center">
                    <input 
                      disabled
                      placeholder="Ask anything..." 
                      className="w-full bg-background border border-border/80 rounded-md py-2 pl-3 pr-9 text-xs focus:outline-none placeholder-muted-foreground"
                    />
                    <div className="absolute right-2.5 p-1 rounded bg-[#18181b] border border-border/80 text-muted-foreground cursor-pointer">
                      <Send className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-center text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">Everything you need to control n8n</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Enterprise-grade features for self-hosted n8n workflow management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-border/50 rounded-xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Unified n8n Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor all your n8n workflows, executions, and automations from a single control panel. 
                Real-time status, execution history, and performance metrics at a glance.
              </p>
            </div>
            <div className="border border-border/50 rounded-xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Workflow Builder</h3>
              <p className="text-muted-foreground leading-relaxed">
                Build and modify n8n workflows using natural language prompts. Our AI translates 
                your instructions into n8n nodes and connections instantly—no coding required.
              </p>
            </div>
            <div className="border border-border/50 rounded-xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Complete Audit Trail</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every workflow change is logged with JSONB snapshots. 12-month retention by default, 
                configurable up to 36 months. Perfect for compliance and debugging.
              </p>
            </div>
            <div className="border border-border/50 rounded-xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">One-Click Rollback</h3>
              <p className="text-muted-foreground leading-relaxed">
                Restore any previous workflow version with a single click. No manual backups needed—
                we automatically version every change with instant rollback capability.
              </p>
            </div>
            <div className="border border-border/50 rounded-xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">BYOK Encryption</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bring Your Own Keys for complete data sovereignty. Your n8n credentials and API keys 
                are encrypted with AES-256-CBC using your own master encryption key.
              </p>
            </div>
            <div className="border border-border/50 rounded-xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Enterprise Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Multi-tenant isolation with Supabase RLS, JWT authentication, SOC 2 compliant 
                audit logs, and OWASP Top 10 protections. Built for enterprise compliance.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16 tracking-tight">Three easy steps</h2>
          <div className="border border-border/50 rounded-2xl p-6 md:p-12 bg-muted/30 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-border/50 -z-10"></div>
              <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm relative">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">1</div>
                <h3 className="text-xl font-bold mb-4 mt-2">Connect n8n</h3>
                <p className="text-muted-foreground">
                  Link your self-hosted n8n instance using your API token or MCP access. 
                  We support both n8n REST API and Model Context Protocol connections.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm relative">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">2</div>
                <h3 className="text-xl font-bold mb-4 mt-2">Build with AI</h3>
                <p className="text-muted-foreground">
                  Use natural language to create and modify workflows. Our AI understands n8n 
                  nodes and generates the exact configuration you need.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm relative">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">3</div>
                <h3 className="text-xl font-bold mb-4 mt-2">Deploy & Monitor</h3>
                <p className="text-muted-foreground">
                  Push changes to your n8n instance with one click. Monitor executions, 
                  track performance, and rollback when needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">Start free. Scale as you grow. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-xl mx-auto">
            {/* Pro Plan */}
            <div className="border-2 border-primary rounded-2xl p-8 bg-card shadow-xl relative flex flex-col ring-4 ring-primary/5">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              </div>
              <div className="mb-8">
                <div className="text-sm font-bold uppercase tracking-wider text-primary mb-2">PRO</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold">{monthlyPrice}</span>
                  <span className="text-muted-foreground font-medium">/month</span>
                </div>
                <p className="text-muted-foreground mt-4">For teams running production n8n workflows at scale.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground/80 font-medium">50 workflows</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground/80 font-medium">10K AI operations/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground/80 font-medium">12-month audit trail</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground/80 font-medium">BYOK encryption & key versioning</span>
                </li>
              </ul>
              <Link 
                href={isLoggedIn ? "/dashboard" : "/auth/signup?plan=pro"} 
                className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-center transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start 1-Day Free Trial"}
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="border border-border/50 rounded-3xl p-8 md:p-16 bg-card shadow-sm text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Ready to control your n8n workflows?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 md:mb-12 max-w-2xl mx-auto text-balance">
                Join teams managing their self-hosted n8n instances with AI assistance, 
                BYOK security, and enterprise-grade audit trails. Start free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href={isLoggedIn ? "/dashboard" : "/auth/signup"} 
                  className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start for free"}
                </Link>
                <a 
                  href="mailto:support@flowforge.app" 
                  className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md font-semibold text-lg transition-colors border border-border shadow-sm"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-12 bg-muted/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                <ul className="space-y-3 text-muted-foreground font-medium text-sm">
                  <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                  <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
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
    </>
  );
}
