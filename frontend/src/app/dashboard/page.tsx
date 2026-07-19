import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // Bypass the workspace selection hub and go directly to a default canvas
  redirect("/dashboard/default/canvas");
}
