"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function PricingPage() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        if (data.country_code === "IN") {
          setCurrency("INR");
        }
      })
      .catch(err => console.error("Error fetching location", err));
  }, []);

  const monthlyPrice = currency === "INR" ? "₹499" : "$3";

  return (
    <div className="min-h-screen bg-background text-foreground py-32 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">Start free. Scale as you grow. Cancel anytime.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Starter Plan */}
        <div className="border border-border/50 rounded-2xl p-8 bg-card shadow-sm flex flex-col">
          <div className="mb-8">
            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">STARTER</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            <p className="text-muted-foreground mt-4">Perfect for individual developers and small projects.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground/80 font-medium">1 n8n instance connection</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground/80 font-medium">Up to 5 workflows</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground/80 font-medium">1,000 AI-assisted operations/month</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground/80 font-medium">7-day audit trail retention</span>
            </li>
          </ul>
          <Link 
            href="/auth/signup" 
            className="block w-full px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold text-center transition-colors border border-border shadow-sm"
          >
            Get Started Free
          </Link>
        </div>

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
              <span className="text-foreground/80 font-medium">Unlimited n8n instances</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground/80 font-medium">Unlimited workflows</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground/80 font-medium">100K AI operations/month</span>
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
            href="/auth/signup?plan=pro" 
            className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-center transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Start 14-Day Free Trial
          </Link>
        </div>
      </div>
      <div className="mt-16 text-center">
        <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
