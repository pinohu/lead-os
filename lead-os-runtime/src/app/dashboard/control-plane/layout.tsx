import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Control plane — Lead OS",
  description: "Runtime health, queues, pricing risk, nodes, and dead-letter visibility.",
};

export default function ControlPlaneLayout({ children }: { children: ReactNode }) {
  return children;
}
