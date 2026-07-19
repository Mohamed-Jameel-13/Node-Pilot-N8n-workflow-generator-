"use client";

import { use } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AuditTrailPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-background text-foreground">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground mt-2">View all activity and changes made in your workspace.</p>
        </div>
        
        <Card className="bg-card border-border/50 text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">
              A chronological log of all actions performed in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 p-8 text-center">
              <p className="text-muted-foreground">No audit logs available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Activity logging will appear here soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
