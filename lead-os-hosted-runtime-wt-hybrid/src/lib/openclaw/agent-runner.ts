export async function runAgent(agentName, event) {
  if (agentName === "qualifier") {
    return {
      agent: "qualifier",
      result: "scored",
      score: event.metadata?.score || 60,
    };
  }

  if (agentName === "closer") {
    return {
      agent: "closer",
      result: "actions-triggered",
      actions: ["email", "sms", "crm_sync"],
    };
  }

  return { agent: agentName, result: "noop" };
}
