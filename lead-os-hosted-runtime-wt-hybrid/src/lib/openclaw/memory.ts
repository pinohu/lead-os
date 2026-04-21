const signalMemory = new Map();

export function remember(key, value) {
  const existing = signalMemory.get(key) ?? [];
  existing.push({ value, at: new Date().toISOString() });
  signalMemory.set(key, existing.slice(-25));
  return signalMemory.get(key);
}

export function recall(key) {
  return signalMemory.get(key) ?? [];
}

export function summarizeMemory(key) {
  const entries = recall(key);
  return {
    count: entries.length,
    latest: entries.length > 0 ? entries[entries.length - 1] : null,
  };
}
