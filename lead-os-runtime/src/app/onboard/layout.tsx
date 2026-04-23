import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started | CX React",
  description: "Set up your CX React instance in minutes. Choose your niche, plan, and integrations.",
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
