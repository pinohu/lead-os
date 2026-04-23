// src/lib/pricing/runtime-state.ts
// In-process diagnostics for health and /api/system.

export interface PricingRuntimeSnapshot {
  workersStarted: boolean;
  schedulerStarted: boolean;
  memorySchedulerStarted: boolean;
  lastTickStartedAt: string | null;
  lastTickFinishedAt: string | null;
  lastTickError: string | null;
  lastDlqAt: string | null;
  ticksProcessed: number;
  measurementsProcessed: number;
}

const state: PricingRuntimeSnapshot = {
  workersStarted: false,
  schedulerStarted: false,
  memorySchedulerStarted: false,
  lastTickStartedAt: null,
  lastTickFinishedAt: null,
  lastTickError: null,
  lastDlqAt: null,
  ticksProcessed: 0,
  measurementsProcessed: 0,
};

export function getPricingRuntimeSnapshot(): PricingRuntimeSnapshot {
  return { ...state };
}

export function markTickStart(): void {
  state.lastTickStartedAt = new Date().toISOString();
  state.lastTickError = null;
}

export function markTickSuccess(): void {
  state.lastTickFinishedAt = new Date().toISOString();
  state.ticksProcessed += 1;
}

export function markTickError(message: string): void {
  state.lastTickError = message;
  state.lastTickFinishedAt = new Date().toISOString();
}

export function markMeasurementSuccess(): void {
  state.measurementsProcessed += 1;
}

export function markWorkersStarted(): void {
  state.workersStarted = true;
}

export function markSchedulerStarted(): void {
  state.schedulerStarted = true;
}

export function markMemorySchedulerStarted(): void {
  state.memorySchedulerStarted = true;
}

export function markDlq(): void {
  state.lastDlqAt = new Date().toISOString();
}
