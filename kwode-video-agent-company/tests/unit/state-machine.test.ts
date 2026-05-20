import { describe, it, expect } from "vitest";
import {
  canTransition,
  allowedNext,
  happyPathNext,
  isFailure,
  isBlocked,
  isTerminal,
  IllegalTransitionError,
} from "../../packages/workflow-engine/src/state-machine.js";

describe("state machine", () => {
  it("allows the happy path draft → archived", () => {
    let cur: ReturnType<typeof happyPathNext> = "draft";
    const visited: string[] = [];
    while (cur) {
      visited.push(cur);
      const nextStep = happyPathNext(cur);
      if (!nextStep) break;
      expect(canTransition(cur, nextStep)).toBe(true);
      cur = nextStep;
    }
    expect(visited).toContain("brief_ready");
    expect(visited).toContain("qa_passed");
    expect(visited).toContain("delivered");
  });

  it("rejects illegal direct transitions", () => {
    expect(canTransition("draft", "delivered")).toBe(false);
    expect(canTransition("brief_generating", "archived")).toBe(false);
    expect(canTransition("qa_failed", "delivered")).toBe(false);
  });

  it("classifies failure and blocked statuses", () => {
    expect(isFailure("failed_qa")).toBe(true);
    expect(isFailure("delivered")).toBe(false);
    expect(isBlocked("blocked_missing_consent")).toBe(true);
    expect(isBlocked("delivered")).toBe(false);
    expect(isTerminal("archived")).toBe(true);
    expect(isTerminal("delivered")).toBe(false);
  });

  it("exposes allowed next via allowedNext()", () => {
    expect(allowedNext("draft")).toContain("intake_received");
    expect(allowedNext("qa_pending")).toEqual(expect.arrayContaining(["qa_passed", "qa_failed"]));
  });

  it("constructs IllegalTransitionError with both endpoints", () => {
    const e = new IllegalTransitionError("draft", "delivered");
    expect(e.from).toBe("draft");
    expect(e.to).toBe("delivered");
    expect(e.message).toContain("draft -> delivered");
  });
});
