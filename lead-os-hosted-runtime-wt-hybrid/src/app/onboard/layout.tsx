import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started | Lead OS",
  description: "Create your account, choose plan capacity, and launch customer packages from setup details.",
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
