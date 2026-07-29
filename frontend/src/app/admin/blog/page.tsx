"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = "reelsstorehub@gmail.com";

export default function AdminBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: ""
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login?redirectTo=/admin/blog");
        return;
      }
      
      if (session.user.email !== ADMIN_EMAIL) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    }
    
    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase
        .from('blogs')
        .insert([
          {
            title: formData.title,
            slug: formData.slug,
            excerpt: formData.excerpt,
            body_html: formData.body,
            published_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setMessage({ type: "success", text: "Blog published successfully!" });
      setFormData({ title: "", slug: "", excerpt: "", body: "" });
    } catch (error: any) {
      console.error('Error publishing blog:', error);
      setMessage({ type: "error", text: error.message || "Failed to publish blog. Make sure the table exists." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page. This page is restricted to admin users.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin: Publish Blog</h1>
          <p className="text-muted-foreground mt-2">
            Create a new blog post. The content should be provided as raw HTML.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="e.g. How to use NodePilot" 
                  value={formData.title}
                  onChange={handleInputChange}
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL-friendly string)</Label>
                <Input 
                  id="slug" 
                  name="slug" 
                  placeholder="e.g. how-to-use-nodepilot" 
                  value={formData.slug}
                  onChange={handleInputChange}
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <textarea 
                  id="excerpt" 
                  name="excerpt" 
                  placeholder="A short summary of the blog post..." 
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  required 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body (HTML)</Label>
                <textarea 
                  id="body" 
                  name="body" 
                  placeholder="<h1>Blog Title</h1><p>Blog content...</p>" 
                  value={formData.body}
                  onChange={handleInputChange}
                  required 
                  className="flex min-h-[300px] font-mono w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {message.text && (
                <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Blog Post'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
