import { getActiveOwner, suspendOwnership } from "./node-ownership-store";
import { isSubscriptionActive } from "@/lib/billing/subscription-store";

export function resolveEffectiveOwner(nodeId: string) {
  const owner = getActiveOwner(nodeId);
  if (!owner) return null;

  const active = isSubscriptionActive(owner.ownerId, nodeId);

  if (!active) {
    suspendOwnership(nodeId, owner.ownerId);
    return null;
  }

  return owner;
}
