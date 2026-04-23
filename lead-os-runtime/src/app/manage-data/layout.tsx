import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Your Data | CX React",
  description: "Export or delete your personal data. GDPR-compliant self-service data management.",
};

export default function ManageDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
