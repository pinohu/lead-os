import test from "node:test";
import assert from "node:assert/strict";
import {
  getAvailableSlots,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  getBooking,
  listBookings,
  listEventTypes,
  getBookingWidgetUrl,
  resetSchedulingStore,
} from "../src/lib/integrations/scheduling.ts";

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

function setup() {
  resetSchedulingStore();
}

// ---------------------------------------------------------------------------
// getAvailableSlots (dry-run)
// ---------------------------------------------------------------------------

test("getAvailableSlots returns mock slots when Cal.com is not configured", async () => {
  setup();
  const slots = await getAvailableSlots("1", "2026-04-01T00:00:00Z", "2026-04-01T23:59:59Z");
  assert.ok(Array.isArray(slots));
  assert.ok(slots.length > 0);
  for (const slot of slots) {
    assert.ok(typeof slot.start === "string");
    assert.ok(typeof slot.end === "string");
    assert.ok(typeof slot.available === "boolean");
  }
});

test("getAvailableSlots only returns slots within business hours (9-17 UTC)", async () => {
  setup();
  const slots = await getAvailableSlots("1", "2026-04-01T00:00:00Z", "2026-04-02T00:00:00Z");
  for (const slot of slots) {
    const hour = new Date(slot.start).getUTCHours();
    assert.ok(hour >= 9 && hour < 17, `Slot hour ${hour} is outside business hours`);
  }
});

// ---------------------------------------------------------------------------
// createBooking (dry-run)
// ---------------------------------------------------------------------------

test("createBooking returns a dry-run booking when Cal.com is not configured", async () => {
  setup();
  const booking = await createBooking("tenant-1", {
    leadKey: "lead-abc",
    eventTypeId: "1",
    startTime: "2026-04-01T10:00:00Z",
    attendeeName: "Alice Smith",
    attendeeEmail: "alice@example.com",
  });

  assert.ok(booking.id.startsWith("bk_"));
  assert.equal(booking.tenantId, "tenant-1");
  assert.equal(booking.leadKey, "lead-abc");
  assert.equal(booking.status, "dry-run");
  assert.ok(typeof booking.meetingUrl === "string");
  assert.ok(typeof booking.createdAt === "string");
});

test("createBooking persists booking to in-memory store", async () => {
  setup();
  const booking = await createBooking("tenant-2", {
    leadKey: "lead-xyz",
    eventTypeId: "2",
    startTime: "2026-04-02T14:00:00Z",
    attendeeName: "Bob Jones",
    attendeeEmail: "bob@example.com",
  });

  const fetched = await getBooking(booking.id);
  assert.ok(fetched);
  assert.equal(fetched.id, booking.id);
  assert.equal(fetched.attendeeEmail, "bob@example.com");
});

test("createBooking derives endTime 30 minutes after startTime", async () => {
  setup();
  const booking = await createBooking("tenant-1", {
    leadKey: "lead-1",
    eventTypeId: "1",
    startTime: "2026-04-01T10:00:00Z",
    attendeeName: "Test User",
    attendeeEmail: "test@example.com",
  });

  const start = new Date(booking.startTime).getTime();
  const end = new Date(booking.endTime).getTime();
  assert.equal(end - start, 30 * 60 * 1000);
});

// ---------------------------------------------------------------------------
// cancelBooking
// ---------------------------------------------------------------------------

test("cancelBooking updates status to cancelled", async () => {
  setup();
  const booking = await createBooking("tenant-1", {
    leadKey: "lead-1",
    eventTypeId: "1",
    startTime: "2026-04-01T09:00:00Z",
    attendeeName: "Cancel Me",
    attendeeEmail: "cancel@example.com",
  });

  const cancelled = await cancelBooking(booking.id, "No longer needed");
  assert.equal(cancelled.status, "cancelled");
});

test("cancelBooking throws for unknown booking in dry-run mode", async () => {
  setup();
  await assert.rejects(
    () => cancelBooking("bk_nonexistent"),
    /Booking not found/,
  );
});

// ---------------------------------------------------------------------------
// rescheduleBooking
// ---------------------------------------------------------------------------

test("rescheduleBooking updates startTime and sets status to rescheduled", async () => {
  setup();
  const booking = await createBooking("tenant-1", {
    leadKey: "lead-1",
    eventTypeId: "1",
    startTime: "2026-04-01T09:00:00Z",
    attendeeName: "Reschedule Me",
    attendeeEmail: "reschedule@example.com",
  });

  const newTime = "2026-04-02T11:00:00Z";
  const rescheduled = await rescheduleBooking(booking.id, newTime);

  assert.equal(rescheduled.status, "rescheduled");
  assert.equal(rescheduled.startTime, newTime);
});

test("rescheduleBooking derives new endTime 30 minutes after new start", async () => {
  setup();
  const booking = await createBooking("tenant-1", {
    leadKey: "lead-1",
    eventTypeId: "1",
    startTime: "2026-04-01T09:00:00Z",
    attendeeName: "Test",
    attendeeEmail: "test@example.com",
  });

  const newStart = "2026-04-03T15:00:00Z";
  const rescheduled = await rescheduleBooking(booking.id, newStart);
  const diff = new Date(rescheduled.endTime).getTime() - new Date(rescheduled.startTime).getTime();
  assert.equal(diff, 30 * 60 * 1000);
});

// ---------------------------------------------------------------------------
// listBookings
// ---------------------------------------------------------------------------

test("listBookings returns only bookings for the given tenantId", async () => {
  setup();
  await createBooking("tenant-A", {
    leadKey: "l1",
    eventTypeId: "1",
    startTime: "2026-04-01T09:00:00Z",
    attendeeName: "A",
    attendeeEmail: "a@a.com",
  });
  await createBooking("tenant-B", {
    leadKey: "l2",
    eventTypeId: "1",
    startTime: "2026-04-01T10:00:00Z",
    attendeeName: "B",
    attendeeEmail: "b@b.com",
  });

  const tenantABookings = await listBookings("tenant-A");
  assert.equal(tenantABookings.length, 1);
  assert.equal(tenantABookings[0].tenantId, "tenant-A");
});

test("listBookings filters by status when provided", async () => {
  setup();
  const b1 = await createBooking("tenant-1", {
    leadKey: "l1",
    eventTypeId: "1",
    startTime: "2026-04-01T09:00:00Z",
    attendeeName: "A",
    attendeeEmail: "a@a.com",
  });
  await cancelBooking(b1.id);

  await createBooking("tenant-1", {
    leadKey: "l2",
    eventTypeId: "1",
    startTime: "2026-04-01T10:00:00Z",
    attendeeName: "B",
    attendeeEmail: "b@b.com",
  });

  const dryRun = await listBookings("tenant-1", "dry-run");
  assert.equal(dryRun.length, 1);

  const cancelled = await listBookings("tenant-1", "cancelled");
  assert.equal(cancelled.length, 1);
});

// ---------------------------------------------------------------------------
// listEventTypes
// ---------------------------------------------------------------------------

test("listEventTypes returns mock event types when Cal.com is not configured", async () => {
  setup();
  const types = await listEventTypes();
  assert.ok(Array.isArray(types));
  assert.ok(types.length >= 3);
  for (const t of types) {
    assert.ok(typeof t.id === "string");
    assert.ok(typeof t.title === "string");
    assert.ok(typeof t.duration === "number");
    assert.ok(typeof t.slug === "string");
  }
});

// ---------------------------------------------------------------------------
// getBookingWidgetUrl
// ---------------------------------------------------------------------------

test("getBookingWidgetUrl returns a URL containing the event type slug", () => {
  const url = getBookingWidgetUrl("discovery-call");
  assert.ok(url.includes("discovery-call"), `URL "${url}" should contain slug`);
});

test("getBookingWidgetUrl returns a string URL", () => {
  const url = getBookingWidgetUrl("my-event");
  assert.ok(typeof url === "string");
  assert.ok(url.length > 0);
});

// ---------------------------------------------------------------------------
// resetSchedulingStore
// ---------------------------------------------------------------------------

test("resetSchedulingStore clears all bookings", async () => {
  await createBooking("tenant-1", {
    leadKey: "l1",
    eventTypeId: "1",
    startTime: "2026-04-01T09:00:00Z",
    attendeeName: "A",
    attendeeEmail: "a@a.com",
  });

  resetSchedulingStore();
  const bookings = await listBookings("tenant-1");
  assert.equal(bookings.length, 0);
});
