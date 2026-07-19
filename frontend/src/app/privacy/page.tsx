import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: July 2026</p>
        </div>
        
        <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:text-muted-foreground prose-h2:text-foreground prose-h3:text-foreground max-w-none">
          <h2>1. Information We Collect</h2>
          <p>We only collect the information you choose to give us, and we process it with your consent, or on another legal basis; we only require the minimum amount of personal information that is necessary to fulfill the purpose of your interaction with us.</p>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to operate, maintain, and provide you with the features and functionality of the Service, as well as to communicate directly with you, such as to send you email messages regarding your subscription.</p>
          
          <h2>3. Data Security & BYOK</h2>
          <p>We take the security of your data very seriously. NodePilot offers Bring Your Own Key (BYOK) encryption, ensuring that your sensitive n8n credentials and API keys are encrypted at rest. We cannot read your encrypted data if you utilize BYOK.</p>
          
          <h2>4. Third-Party Services</h2>
          <p>We do not share your personal information with third-parties except as required by law or as necessary to provide our services (such as our payment processor, Razorpay). We do not sell your personal data to advertisers.</p>
          
          <h2>5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting our support team.</p>
        </div>
      </div>
    </div>
  );
}
