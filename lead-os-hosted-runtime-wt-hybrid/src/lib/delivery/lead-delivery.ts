export async function deliverLead(input) {
  const { ownerId, nodeId, lead } = input;
  return {
    delivered: Boolean(ownerId),
    ownerId: ownerId || null,
    nodeId,
    channels: ownerId ? ["email", "sms", "crm"] : [],
    lead,
  };
}
