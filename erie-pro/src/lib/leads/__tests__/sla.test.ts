import { describe, it, expect } from "vitest";
import {
  computeSlaDeadline,
  isSlaExpired,
  slaSecondsRemaining,
  pickFailoverTarget,
  inferLeadResponseState,
  SLA_SECONDS,
  MAX_FAILOVER_ATTEMPTS,
  type FailoverCandidate,
} from "@/lib/leads/sla";

describe("computeSlaDeadline", () => {
  const t0 = new Date("2026-05-17T12:00:00Z");

  it("uses emergency window (20 min)", () => {
    const d = computeSlaDeadline("emergency", t0);
    expect(d.getTime() - t0.getTime()).toBe(20 * 60 * 1000);
  });

  it("uses this-week window (4 hr)", () => {
    const d = computeSlaDeadline("this-week", t0);
    expect(d.getTime() - t0.getTime()).toBe(4 * 60 * 60 * 1000);
  });

  it("uses researching window (24 hr)", () => {
    const d = computeSlaDeadline("researching", t0);
    expect(d.getTime() - t0.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("defaults unknown / null urgency to this-week", () => {
    const d1 = computeSlaDeadline(null, t0);
    const d2 = computeSlaDeadline(undefined, t0);
    const d3 = computeSlaDeadline("garbage", t0);
    expect(d1.getTime() - t0.getTime()).toBe(SLA_SECONDS["this-week"] * 1000);
    expect(d2.getTime() - t0.getTime()).toBe(SLA_SECONDS["this-week"] * 1000);
    expect(d3.getTime() - t0.getTime()).toBe(SLA_SECONDS["this-week"] * 1000);
  });
});

describe("isSlaExpired", () => {
  it("returns true when past deadline", () => {
    const past = new Date(Date.now() - 60_000);
    expect(isSlaExpired(past)).toBe(true);
  });
  it("returns false when before deadline", () => {
    const future = new Date(Date.now() + 60_000);
    expect(isSlaExpired(future)).toBe(false);
  });
  it("returns false when deadline is null/undefined", () => {
    expect(isSlaExpired(null)).toBe(false);
    expect(isSlaExpired(undefined)).toBe(false);
  });
});

describe("slaSecondsRemaining", () => {
  const now = new Date("2026-05-17T12:00:00Z");
  it("returns positive when time remains", () => {
    const dl = new Date(now.getTime() + 90 * 1000);
    expect(slaSecondsRemaining(dl, now)).toBe(90);
  });
  it("returns negative when expired", () => {
    const dl = new Date(now.getTime() - 30 * 1000);
    expect(slaSecondsRemaining(dl, now)).toBe(-30);
  });
  it("returns null when no deadline", () => {
    expect(slaSecondsRemaining(null)).toBeNull();
  });
});

function makeCandidate(overrides: Partial<FailoverCandidate>): FailoverCandidate {
  return {
    providerId: "p-default",
    tier: "primary",
    todaysFailoverLoad: 0,
    acceptingLeads: true,
    hasDeclinedThisLead: false,
    ...overrides,
  };
}

describe("pickFailoverTarget", () => {
  it("skips the current routedTo", () => {
    const candidates = [
      makeCandidate({ providerId: "p1" }),
      makeCandidate({ providerId: "p2" }),
    ];
    const pick = pickFailoverTarget("p1", candidates);
    expect(pick?.providerId).toBe("p2");
  });

  it("returns null when no eligible candidates", () => {
    const candidates = [
      makeCandidate({ providerId: "p1", acceptingLeads: false }),
      makeCandidate({ providerId: "p2", hasDeclinedThisLead: true }),
    ];
    expect(pickFailoverTarget(null, candidates)).toBeNull();
  });

  it("prefers primary over failover over overflow tier", () => {
    const candidates = [
      makeCandidate({ providerId: "p-over", tier: "overflow" }),
      makeCandidate({ providerId: "p-fail", tier: "failover" }),
      makeCandidate({ providerId: "p-prim", tier: "primary" }),
    ];
    const pick = pickFailoverTarget(null, candidates);
    expect(pick?.providerId).toBe("p-prim");
  });

  it("within the same tier, prefers lower failover load (load-balancing)", () => {
    const candidates = [
      makeCandidate({ providerId: "p-heavy", tier: "failover", todaysFailoverLoad: 5 }),
      makeCandidate({ providerId: "p-light", tier: "failover", todaysFailoverLoad: 1 }),
    ];
    const pick = pickFailoverTarget(null, candidates);
    expect(pick?.providerId).toBe("p-light");
  });

  it("excludes providers already accepting leads = false", () => {
    const candidates = [
      makeCandidate({ providerId: "p-off", acceptingLeads: false }),
      makeCandidate({ providerId: "p-on" }),
    ];
    expect(pickFailoverTarget(null, candidates)?.providerId).toBe("p-on");
  });

  it("excludes providers that already declined THIS lead", () => {
    const candidates = [
      makeCandidate({ providerId: "p-declined", hasDeclinedThisLead: true }),
      makeCandidate({ providerId: "p-fresh" }),
    ];
    expect(pickFailoverTarget(null, candidates)?.providerId).toBe("p-fresh");
  });
});

describe("inferLeadResponseState", () => {
  const now = new Date("2026-05-17T12:00:00Z");
  const future = new Date(now.getTime() + 60_000);
  const past = new Date(now.getTime() - 60_000);

  it("unrouted: no routedToId", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: null,
          slaDeadline: null,
          failoverAttempts: 0,
          outcomeType: null,
        },
        now
      )
    ).toBe("unrouted");
  });

  it("awaiting-provider: routed, SLA in future, no outcome", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: future,
          failoverAttempts: 0,
          outcomeType: null,
        },
        now
      )
    ).toBe("awaiting-provider");
  });

  it("accepted: outcomeType=responded", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: future,
          failoverAttempts: 0,
          outcomeType: "responded",
        },
        now
      )
    ).toBe("accepted");
  });

  it("completed: outcomeType=converted", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: future,
          failoverAttempts: 0,
          outcomeType: "converted",
        },
        now
      )
    ).toBe("completed");
  });

  it("declined: outcomeType=declined and attempts < max", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: future,
          failoverAttempts: 1,
          outcomeType: "declined",
        },
        now
      )
    ).toBe("declined");
  });

  it("exhausted: declined and attempts >= max", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: future,
          failoverAttempts: MAX_FAILOVER_ATTEMPTS,
          outcomeType: "declined",
        },
        now
      )
    ).toBe("exhausted");
  });

  it("expired: no outcome, SLA past, attempts < max", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: past,
          failoverAttempts: 1,
          outcomeType: null,
        },
        now
      )
    ).toBe("expired");
  });

  it("exhausted: SLA past, attempts >= max, no outcome", () => {
    expect(
      inferLeadResponseState(
        {
          routedToId: "p1",
          slaDeadline: past,
          failoverAttempts: MAX_FAILOVER_ATTEMPTS,
          outcomeType: null,
        },
        now
      )
    ).toBe("exhausted");
  });
});
