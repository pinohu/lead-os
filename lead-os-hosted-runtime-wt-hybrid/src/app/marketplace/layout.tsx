import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Marketplace | Lead OS",
  description: "Browse and purchase verified leads, templates, and integrations in the Lead OS marketplace.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
