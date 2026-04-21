import { recall, remember } from "./memory";

export async function orchestrate(event) {
  const actions = [];

  // Base capture logic
  if (event.eventType === 'lead.captured') {
    actions.push('qualifier');
  }

  // Score-based escalation
  if (event.metadata?.score > 70) {
    actions.push('closer');
  }

  // Stage-based routing
  if (event.metadata?.stage === 'qualified') {
    actions.push('closer');
  }

  // Memory-based reinforcement
  const pastHot = recall('hot_leads');
  if (pastHot.length > 10 && event.metadata?.score > 60) {
    actions.push('closer');
  }

  // Learn from this event
  if (event.metadata?.score > 80) {
    remember('hot_leads', { leadKey: event.leadKey, score: event.metadata.score });
  }

  return [...new Set(actions)];
}
