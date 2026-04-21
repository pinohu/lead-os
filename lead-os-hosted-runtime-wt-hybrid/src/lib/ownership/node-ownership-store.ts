type OwnershipState = "unclaimed" | "claimed_pending" | "active_exclusive" | "active_backup" | "at_risk" | "replacement_needed";

export type NodeOwnership = {
  nodeId: string;
  ownerId: string;
  state: OwnershipState;
  createdAt: string;
};

const ownership: NodeOwnership[] = [];

export function createClaim(nodeId: string, ownerId: string) {
  const record: NodeOwnership = {
    nodeId,
    ownerId,
    state: "claimed_pending",
    createdAt: new Date().toISOString(),
  };

  ownership.push(record);
  return record;
}

export function approveClaim(nodeId: string, ownerId: string) {
  const record = ownership.find(o => o.nodeId === nodeId && o.ownerId === ownerId);
  if (!record) return null;

  record.state = "active_exclusive";
  return record;
}

export function getOwnership(nodeId: string) {
  return ownership.find(o => o.nodeId === nodeId) || null;
}
