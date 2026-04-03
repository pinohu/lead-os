import { DashboardSidebar } from "./DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main id="dashboard-main" className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
