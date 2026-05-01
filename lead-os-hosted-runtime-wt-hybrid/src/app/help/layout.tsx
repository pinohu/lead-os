import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | Lead OS",
  description: "Find answers about solution launch, intake details, lead management, integrations, and billing.",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
