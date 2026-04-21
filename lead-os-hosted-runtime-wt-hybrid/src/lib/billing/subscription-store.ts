type BillingState = "inactive" | "trialing" | "active" | "past_due" | "canceled";

export type Subscription = {
  ownerId: string;
  nodeId: string;
  state: BillingState;
  startedAt: string;
};

const subscriptions: Subscription[] = [];

export function createSubscription(ownerId: string, nodeId: string) {
  const sub: Subscription = {
    ownerId,
    nodeId,
    state: "trialing",
    startedAt: new Date().toISOString(),
  };
  subscriptions.push(sub);
  return sub;
}

export function activateSubscription(ownerId: string, nodeId: string) {
  const sub = subscriptions.find(s => s.ownerId === ownerId && s.nodeId === nodeId);
  if (!sub) return null;
  sub.state = "active";
  return sub;
}

export function getSubscription(ownerId: string, nodeId: string) {
  return subscriptions.find(s => s.ownerId === ownerId && s.nodeId === nodeId) || null;
}

export function isSubscriptionActive(ownerId: string, nodeId: string) {
  const sub = getSubscription(ownerId, nodeId);
  return sub && (sub.state === "active" || sub.state === "trialing");
}
