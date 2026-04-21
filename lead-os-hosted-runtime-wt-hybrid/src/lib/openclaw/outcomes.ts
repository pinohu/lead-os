import fs from "fs";
import path from "path";

const MAX_OUTCOMES = 1000;
const outcomesFile = path.join(process.cwd(), "generated", "openclaw-outcomes.json");
let loaded = false;
const outcomes = [];

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    if (!fs.existsSync(outcomesFile)) return;
    const raw = fs.readFileSync(outcomesFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      outcomes.splice(0, outcomes.length, ...parsed.slice(-MAX_OUTCOMES));
    }
  } catch {
    // Ignore corrupted persisted state and start fresh in memory.
  }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(outcomesFile), { recursive: true });
    fs.writeFileSync(outcomesFile, JSON.stringify(outcomes.slice(-MAX_OUTCOMES), null, 2));
  } catch {
    // Do not fail the runtime if outcome persistence cannot be written.
  }
}

export function recordOutcome(outcome) {
  ensureLoaded();
  const saved = { ...outcome, at: new Date().toISOString() };
  outcomes.push(saved);
  if (outcomes.length > MAX_OUTCOMES) {
    outcomes.splice(0, outcomes.length - MAX_OUTCOMES);
  }
  persist();
  return saved;
}

export function listOutcomes() {
  ensureLoaded();
  return outcomes.slice();
}

export function summarizeOutcomes() {
  ensureLoaded();
  const total = outcomes.length;
  const won = outcomes.filter((o) => o.status === "won").length;
  const lost = outcomes.filter((o) => o.status === "lost").length;
  const revenue = outcomes.reduce((sum, o) => sum + (typeof o.value === "number" ? o.value : 0), 0);
  return {
    total,
    won,
    lost,
    revenue,
    winRate: total > 0 ? won / total : 0,
  };
}
