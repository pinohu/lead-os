import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preferences | Lead OS",
  description: "Manage your email preferences and communication settings.",
};

export default function PreferencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
