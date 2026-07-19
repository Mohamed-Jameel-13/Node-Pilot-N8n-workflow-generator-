export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground">We're here to help you build better workflows.</p>
        <div className="bg-card border border-border/50 rounded-xl p-8 mt-8">
          <p className="mb-4">Email us at:</p>
          <a href="mailto:support@flowforge.app" className="text-primary text-xl font-medium hover:underline">support@flowforge.app</a>
        </div>
      </div>
    </div>
  );
}
