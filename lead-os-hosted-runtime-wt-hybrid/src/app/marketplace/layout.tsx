import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Marketplace Solution | Lead OS",
  description: "Buyer-side lead claim, pricing, inventory, and outcome flow for marketplace solutions.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
