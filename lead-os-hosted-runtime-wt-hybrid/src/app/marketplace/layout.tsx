import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Marketplace Package | Lead OS",
  description: "Buyer-side lead claim, pricing, inventory, and outcome flow for marketplace packages.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
