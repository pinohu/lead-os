import { headers } from "next/headers";
import { DashboardSidebar } from "./DashboardSidebar";
import { requireOperatorPageSession, sanitizeNextPath } from "@/lib/operator-auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const rawPath = h.get("x-leados-pathname") ?? "/dashboard";
  const nextPath = sanitizeNextPath(rawPath);
  await requireOperatorPageSession(nextPath);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main id="dashboard-main" className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">{children}</div>
      </main>
    </div>
  );
}
