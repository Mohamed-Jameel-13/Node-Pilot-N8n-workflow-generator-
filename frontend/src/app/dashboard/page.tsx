import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Bypass the workspace selection hub and go directly to a default canvas
  redirect("/dashboard/default/canvas");
}
