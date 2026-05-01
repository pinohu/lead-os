import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Access - Lead OS Dashboard",
  description: "Manage provider API keys, integration tokens, and account access vault.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
