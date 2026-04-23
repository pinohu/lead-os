import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | CX React",
  description: "Find answers to common questions about CX React setup, lead management, integrations, and billing.",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
