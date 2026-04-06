"use client";

import dynamic from "next/dynamic";

const BehavioralTracker = dynamic(() => import("@/components/BehavioralTracker"), { ssr: false });
const ExitIntent = dynamic(() => import("@/components/ExitIntent"), { ssr: false });
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });
const FunnelOrchestrator = dynamic(() => import("@/components/FunnelOrchestrator"), { ssr: false });
const WhatsAppOptIn = dynamic(() => import("@/components/WhatsAppOptIn"), { ssr: false });

export function ClientWidgets() {
  return (
    <>
      <BehavioralTracker />
      <ExitIntent />
      <ChatWidget />
      <FunnelOrchestrator />
      <WhatsAppOptIn />
    </>
  );
}
