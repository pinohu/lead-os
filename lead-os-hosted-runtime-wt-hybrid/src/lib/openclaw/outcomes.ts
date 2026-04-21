const outcomes = [];

export function recordOutcome(outcome) {
  outcomes.push(outcome);
  return outcomes.slice(-100);
}

export function getOutcomes() {
  return outcomes;
}
