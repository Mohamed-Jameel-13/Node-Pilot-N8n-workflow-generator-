"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, AlertCircle, Network } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMessage("Please fill in all required fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">
      {/* Simple Navigation */}
      <nav className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Network className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">NodePilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-2xl bg-card border border-border/50 rounded-xl shadow-2xl ring-1 ring-border/50 overflow-hidden">
          
          <div className="px-8 py-10 sm:px-12 sm:py-12 border-b border-border/50 bg-muted/20">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Contact Us</h1>
            <p className="text-muted-foreground text-lg">
              Have questions about NodePilot? Interested in custom enterprise features? 
              Fill out the form below and our team will get back to you shortly.
            </p>
          </div>

          <div className="p-8 sm:p-12">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground mb-8 max-w-sm">
                  Thank you for reaching out. We've received your message and will respond as soon as possible.
                </p>
                <button 
                  onClick={() => setStatus("idle")}
                  className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md font-medium transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {status === "error" && (
                  <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{errorMessage}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full bg-background border border-border/80 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Work Email <span className="text-destructive">*</span></label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@company.com"
                      className="w-full bg-background border border-border/80 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">Subject (Optional)</label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full bg-background border border-border/80 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Message <span className="text-destructive">*</span></label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your needs..."
                    className="w-full bg-background border border-border/80 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-y min-h-[120px]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "submitting" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-medium">
            © 2026 NodePilot Control Plane. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
