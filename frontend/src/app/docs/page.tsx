import Link from "next/link";

export default function GenericPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Coming Soon</h1>
        <p className="text-xl text-muted-foreground">
          We are currently building out this section. Check back soon for updates!
        </p>
        <div className="pt-8">
          <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
