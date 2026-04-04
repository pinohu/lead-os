import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | CX React",
  description: "Get in touch with the CX React team for sales, support, or partnership inquiries.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
