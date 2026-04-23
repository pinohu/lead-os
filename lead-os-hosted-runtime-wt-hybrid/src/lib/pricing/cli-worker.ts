// src/lib/pricing/cli-worker.ts
// Back-compat entry — delegates to full worker bootstrap (workers + scheduler).

import { startPricingRuntimeWorker } from "./bootstrap.ts";

await startPricingRuntimeWorker();
console.log("[pricing-worker] BullMQ workers online (use src/runtime/worker-entry.ts via npm run worker).");
