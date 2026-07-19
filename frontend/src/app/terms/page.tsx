import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: July 2026</p>
        </div>
        
        <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:text-muted-foreground prose-h2:text-foreground prose-h3:text-foreground max-w-none">
          <h2>1. Agreement to Terms</h2>
          <p>By accessing or using NodePilot, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access our service.</p>
          
          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on NodePilot's website for personal, non-commercial transitory viewing only.</p>
          
          <h2>3. Subscriptions & Billing</h2>
          <p>NodePilot is offered on a subscription basis. By selecting a subscription plan, you agree to pay NodePilot the monthly or annual subscription fees indicated for that service.</p>
          
          <h2>4. User Data & BYOK Encryption</h2>
          <p>You retain all rights to your data. By using our Bring Your Own Key (BYOK) encryption features, you acknowledge that you are responsible for maintaining your encryption keys. NodePilot cannot recover your data if you lose your encryption key.</p>
          
          <h2>5. Disclaimer</h2>
          <p>The materials on NodePilot's website are provided on an 'as is' basis. NodePilot makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </div>
      </div>
    </div>
  );
}
