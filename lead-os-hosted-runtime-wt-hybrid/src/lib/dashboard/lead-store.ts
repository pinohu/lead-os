export type StoredLead = {
  id: string;
  nodeId: string;
  ownerId: string | null;
  createdAt: string;
  payload: any;
  delivery?: any;
};

const leads: StoredLead[] = [];

export function storeLead(record: StoredLead) {
  leads.push(record);
  return record;
}

export function getLeadsByOwner(ownerId: string) {
  return leads.filter(l => l.ownerId === ownerId);
}

export function getLeadsByNode(nodeId: string) {
  return leads.filter(l => l.nodeId === nodeId);
}
