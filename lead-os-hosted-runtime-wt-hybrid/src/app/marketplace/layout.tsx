import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Marketplace | CX React",
  description: "Browse and purchase verified leads, templates, and integrations in the CX React marketplace.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
