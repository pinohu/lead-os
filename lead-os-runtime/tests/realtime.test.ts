import test from "node:test";
import assert from "node:assert/strict";
import {
  subscribe,
  publish,
  getRecentEvents,
  getSubscriberCount,
  resetRealtime,
  type RealtimeEvent,
} from "../src/lib/realtime.ts";

test("publish delivers event to subscriber", () => {
  resetRealtime();

  const received: RealtimeEvent[] = [];
  subscribe("tenant-a", (event) => received.push(event));

  publish({ type: "lead.captured", tenantId: "tenant-a", payload: { leadKey: "lk1" } });

  assert.equal(received.length, 1);
  assert.equal(received[0].type, "lead.captured");
  assert.equal(received[0].tenantId, "tenant-a");
  assert.equal((received[0].payload as Record<string, unknown>).leadKey, "lk1");
  assert.ok(received[0].id);
  assert.ok(received[0].timestamp);
});

test("tenant isolation: events only go to correct tenant", () => {
  resetRealtime();

  const tenantAEvents: RealtimeEvent[] = [];
  const tenantBEvents: RealtimeEvent[] = [];

  subscribe("tenant-a", (event) => tenantAEvents.push(event));
  subscribe("tenant-b", (event) => tenantBEvents.push(event));

  publish({ type: "lead.captured", tenantId: "tenant-a", payload: { leadKey: "a1" } });
  publish({ type: "lead.scored", tenantId: "tenant-b", payload: { leadKey: "b1" } });
  publish({ type: "lead.hot", tenantId: "tenant-a", payload: { leadKey: "a2" } });

  assert.equal(tenantAEvents.length, 2);
  assert.equal(tenantBEvents.length, 1);
  assert.equal(tenantAEvents[0].type, "lead.captured");
  assert.equal(tenantAEvents[1].type, "lead.hot");
  assert.equal(tenantBEvents[0].type, "lead.scored");
});

test("getRecentEvents returns events for tenant", () => {
  resetRealtime();

  publish({ type: "lead.captured", tenantId: "tenant-x", payload: { n: 1 } });
  publish({ type: "lead.scored", tenantId: "tenant-x", payload: { n: 2 } });
  publish({ type: "lead.captured", tenantId: "tenant-y", payload: { n: 3 } });

  const xEvents = getRecentEvents("tenant-x");
  assert.equal(xEvents.length, 2);
  assert.equal(xEvents[0].type, "lead.captured");
  assert.equal(xEvents[1].type, "lead.scored");

  const yEvents = getRecentEvents("tenant-y");
  assert.equal(yEvents.length, 1);
});

test("getRecentEvents respects limit", () => {
  resetRealtime();

  for (let i = 0; i < 10; i++) {
    publish({ type: "lead.captured", tenantId: "tenant-limit", payload: { n: i } });
  }

  const limited = getRecentEvents("tenant-limit", 3);
  assert.equal(limited.length, 3);
  assert.equal((limited[0].payload as Record<string, unknown>).n, 7);
  assert.equal((limited[2].payload as Record<string, unknown>).n, 9);
});

test("getRecentEvents returns empty for unknown tenant", () => {
  resetRealtime();
  const events = getRecentEvents("nonexistent");
  assert.deepEqual(events, []);
});

test("unsubscribe stops delivery", () => {
  resetRealtime();

  const received: RealtimeEvent[] = [];
  const unsubscribe = subscribe("tenant-unsub", (event) => received.push(event));

  publish({ type: "lead.captured", tenantId: "tenant-unsub", payload: { n: 1 } });
  assert.equal(received.length, 1);

  unsubscribe();

  publish({ type: "lead.captured", tenantId: "tenant-unsub", payload: { n: 2 } });
  assert.equal(received.length, 1, "should not receive events after unsubscribe");
});

test("multiple subscribers receive the same event", () => {
  resetRealtime();

  const sub1: RealtimeEvent[] = [];
  const sub2: RealtimeEvent[] = [];

  subscribe("tenant-multi", (event) => sub1.push(event));
  subscribe("tenant-multi", (event) => sub2.push(event));

  publish({ type: "lead.captured", tenantId: "tenant-multi", payload: {} });

  assert.equal(sub1.length, 1);
  assert.equal(sub2.length, 1);
  assert.equal(sub1[0].id, sub2[0].id, "both subscribers should get the same event");
});

test("subscriber count tracks correctly", () => {
  resetRealtime();

  assert.equal(getSubscriberCount("tenant-count"), 0);

  const unsub1 = subscribe("tenant-count", () => {});
  assert.equal(getSubscriberCount("tenant-count"), 1);

  const unsub2 = subscribe("tenant-count", () => {});
  assert.equal(getSubscriberCount("tenant-count"), 2);

  unsub1();
  assert.equal(getSubscriberCount("tenant-count"), 1);

  unsub2();
  assert.equal(getSubscriberCount("tenant-count"), 0);
});

test("failing subscriber does not break event delivery", () => {
  resetRealtime();

  const received: RealtimeEvent[] = [];

  subscribe("tenant-fail", () => {
    throw new Error("Intentional subscriber failure");
  });
  subscribe("tenant-fail", (event) => received.push(event));

  publish({ type: "lead.captured", tenantId: "tenant-fail", payload: {} });

  assert.equal(received.length, 1, "second subscriber should still receive the event");
});
