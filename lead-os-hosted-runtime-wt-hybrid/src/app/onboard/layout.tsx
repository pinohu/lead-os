import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started | Lead OS",
  description: "Set up your Lead OS instance in minutes. Choose your niche, plan, and integrations.",
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
