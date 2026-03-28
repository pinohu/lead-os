// Cal.com adapter for appointment booking.
// Uses Cal.com API v2 when CALCOM_API_KEY + CALCOM_URL are set.
// Falls back to an in-memory store with mock slots when not configured.

export interface BookingSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface Booking {
  id: string;
  tenantId: string;
  leadKey: string;
  eventTypeId: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  status: "confirmed" | "cancelled" | "rescheduled" | "completed" | "dry-run";
  meetingUrl?: string;
  createdAt: string;
}

interface CreateBookingInput {
  leadKey: string;
  eventTypeId: string;
  startTime: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  notes?: string;
}

interface EventType {
  id: string;
  title: string;
  duration: number;
  slug: string;
}

// ---------------------------------------------------------------------------
// In-memory store (dry-run / fallback)
// ---------------------------------------------------------------------------

const bookingStore = new Map<string, Booking>();

export function resetSchedulingStore(): void {
  bookingStore.clear();
}

// ---------------------------------------------------------------------------
// Cal.com client helpers
// ---------------------------------------------------------------------------

function getCalcomConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.CALCOM_API_KEY;
  const baseUrl = process.env.CALCOM_URL;
  if (!apiKey || !baseUrl) return null;
  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, "") };
}

async function calcomRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getCalcomConfig();
  if (!config) throw new Error("Cal.com not configured");

  const res = await fetch(`${config.baseUrl}/v2${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Cal.com API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function generateMockSlots(
  dateFrom: string,
  dateTo: string,
  durationMinutes = 30,
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const current = new Date(start);

  while (current < end) {
    const hour = current.getUTCHours();
    if (hour >= 9 && hour < 17) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60_000);
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        available: Math.random() > 0.3,
      });
    }
    current.setUTCMinutes(current.getUTCMinutes() + durationMinutes);
  }

  return slots;
}

function deriveMeetingUrl(bookingId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meet.example.com";
  return `${siteUrl}/meeting/${bookingId}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getAvailableSlots(
  eventTypeId: string,
  dateFrom: string,
  dateTo: string,
): Promise<BookingSlot[]> {
  const config = getCalcomConfig();

  if (!config) {
    return generateMockSlots(dateFrom, dateTo);
  }

  const params = new URLSearchParams({
    eventTypeId,
    startTime: dateFrom,
    endTime: dateTo,
  });

  const data = await calcomRequest<{ slots: { start: string; end: string }[] }>(
    `/slots?${params.toString()}`,
  );

  return (data.slots ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    available: true,
  }));
}

export async function createBooking(
  tenantId: string,
  booking: CreateBookingInput,
): Promise<Booking> {
  const config = getCalcomConfig();
  const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startDt = new Date(booking.startTime);
  const endDt = new Date(startDt.getTime() + 30 * 60_000);

  if (!config) {
    const record: Booking = {
      id,
      tenantId,
      leadKey: booking.leadKey,
      eventTypeId: booking.eventTypeId,
      startTime: booking.startTime,
      endTime: endDt.toISOString(),
      attendeeName: booking.attendeeName,
      attendeeEmail: booking.attendeeEmail,
      status: "dry-run",
      meetingUrl: deriveMeetingUrl(id),
      createdAt: new Date().toISOString(),
    };
    bookingStore.set(id, record);
    return record;
  }

  const data = await calcomRequest<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    meetingUrl?: string;
  }>("/bookings", {
    method: "POST",
    body: JSON.stringify({
      eventTypeId: Number(booking.eventTypeId),
      start: booking.startTime,
      attendee: {
        name: booking.attendeeName,
        email: booking.attendeeEmail,
        phone: booking.attendeePhone,
        timeZone: "UTC",
      },
      metadata: {
        tenantId,
        leadKey: booking.leadKey,
        notes: booking.notes ?? "",
      },
    }),
  });

  const record: Booking = {
    id: String(data.id),
    tenantId,
    leadKey: booking.leadKey,
    eventTypeId: booking.eventTypeId,
    startTime: data.startTime,
    endTime: data.endTime,
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    status: "confirmed",
    meetingUrl: data.meetingUrl,
    createdAt: new Date().toISOString(),
  };

  bookingStore.set(record.id, record);
  return record;
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<Booking> {
  const existing = bookingStore.get(bookingId);
  const config = getCalcomConfig();

  if (!config) {
    if (!existing) {
      throw new Error(`Booking not found: ${bookingId}`);
    }
    const updated: Booking = { ...existing, status: "cancelled" };
    bookingStore.set(bookingId, updated);
    return updated;
  }

  await calcomRequest<unknown>(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });

  const updated: Booking = existing
    ? { ...existing, status: "cancelled" }
    : {
        id: bookingId,
        tenantId: "",
        leadKey: "",
        eventTypeId: "",
        startTime: "",
        endTime: "",
        attendeeName: "",
        attendeeEmail: "",
        status: "cancelled",
        createdAt: new Date().toISOString(),
      };

  bookingStore.set(bookingId, updated);
  return updated;
}

export async function rescheduleBooking(
  bookingId: string,
  newStartTime: string,
): Promise<Booking> {
  const existing = bookingStore.get(bookingId);
  const config = getCalcomConfig();
  const newEnd = new Date(
    new Date(newStartTime).getTime() + 30 * 60_000,
  ).toISOString();

  if (!config) {
    if (!existing) {
      throw new Error(`Booking not found: ${bookingId}`);
    }
    const updated: Booking = {
      ...existing,
      startTime: newStartTime,
      endTime: newEnd,
      status: "rescheduled",
    };
    bookingStore.set(bookingId, updated);
    return updated;
  }

  const data = await calcomRequest<{
    startTime: string;
    endTime: string;
  }>(`/bookings/${bookingId}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ start: newStartTime }),
  });

  const updated: Booking = existing
    ? { ...existing, startTime: data.startTime, endTime: data.endTime, status: "rescheduled" }
    : {
        id: bookingId,
        tenantId: "",
        leadKey: "",
        eventTypeId: "",
        startTime: data.startTime,
        endTime: data.endTime,
        attendeeName: "",
        attendeeEmail: "",
        status: "rescheduled",
        createdAt: new Date().toISOString(),
      };

  bookingStore.set(bookingId, updated);
  return updated;
}

export async function getBooking(
  bookingId: string,
): Promise<Booking | undefined> {
  const config = getCalcomConfig();

  if (!config) {
    return bookingStore.get(bookingId);
  }

  try {
    const data = await calcomRequest<{
      id: string;
      startTime: string;
      endTime: string;
      status: string;
      attendees?: { name: string; email: string }[];
      meetingUrl?: string;
      metadata?: Record<string, string>;
    }>(`/bookings/${bookingId}`);

    const attendee = data.attendees?.[0];
    const record: Booking = {
      id: String(data.id),
      tenantId: data.metadata?.tenantId ?? "",
      leadKey: data.metadata?.leadKey ?? "",
      eventTypeId: "",
      startTime: data.startTime,
      endTime: data.endTime,
      attendeeName: attendee?.name ?? "",
      attendeeEmail: attendee?.email ?? "",
      status: data.status as Booking["status"],
      meetingUrl: data.meetingUrl,
      createdAt: new Date().toISOString(),
    };

    bookingStore.set(record.id, record);
    return record;
  } catch {
    return bookingStore.get(bookingId);
  }
}

export async function listBookings(
  tenantId: string,
  status?: string,
): Promise<Booking[]> {
  const all = Array.from(bookingStore.values()).filter(
    (b) => b.tenantId === tenantId,
  );

  if (status) {
    return all.filter((b) => b.status === status);
  }

  return all;
}

export async function listEventTypes(): Promise<EventType[]> {
  const config = getCalcomConfig();

  if (!config) {
    return [
      { id: "1", title: "30 Minute Discovery Call", duration: 30, slug: "discovery-call" },
      { id: "2", title: "60 Minute Strategy Session", duration: 60, slug: "strategy-session" },
      { id: "3", title: "15 Minute Quick Check-in", duration: 15, slug: "quick-checkin" },
    ];
  }

  const data = await calcomRequest<{
    event_types: { id: number; title: string; length: number; slug: string }[];
  }>("/event-types");

  return (data.event_types ?? []).map((et) => ({
    id: String(et.id),
    title: et.title,
    duration: et.length,
    slug: et.slug,
  }));
}

export function getBookingWidgetUrl(eventTypeSlug: string): string {
  const config = getCalcomConfig();

  if (!config) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cal.example.com";
    return `${siteUrl}/book/${eventTypeSlug}`;
  }

  const baseUrl = config.baseUrl.replace(/\/v2$/, "");
  return `${baseUrl}/${eventTypeSlug}`;
}
