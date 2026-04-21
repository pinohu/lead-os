const outcomes = [];

export function recordOutcome(outcome) {
  outcomes.push({ ...outcome, at: new Date().toISOString() });
  if (outcomes.length > 1000) {
    outcomes.shift();
  }
  return outcomes[outcomes.length - 1];
}

export function listOutcomes() {
  return outcomes.slice();
}

export function summarizeOutcomes() {
  const total = outcomes.length;
  const won = outcomes.filter(o => o.status === 'won').length;
  const lost = outcomes.filter(o => o.status === 'lost').length;
  return { total, won, lost, winRate: total > 0 ? won / total : 0 };
}
