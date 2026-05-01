import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Lead OS",
  description: "Get help choosing a package, adding credentials, activating integrations, or discussing partnerships.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
