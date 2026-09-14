import { describe, expect, it } from "vitest";

import {
  DELAY_RUNGS,
  detectReassuranceSeeking,
  detectUrgeTarget,
  suggestDelayMinutes,
  summariseUrges,
  type DelayOutcome,
  type UrgeRecord,
} from "./index";

const at = (daysAgo: number): Date => new Date(Date.UTC(2026, 8, 14 - daysAgo));

describe("reassurance detection", () => {
  const seeking = [
    "am I definitely not having a heart attack?",
    "can you just tell me it's fine",
    "do you think he's angry with me?",
    "should I be worried about this mole?",
    "is this normal?",
    "promise me I don't have cancer",
    "reassure me please",
  ];

  it.each(seeking)("reads a bid for reassurance: %s", (message) => {
    expect(detectReassuranceSeeking(message).seeking).toBe(true);
  });

  it("needs more than one weak signal before deciding", () => {
    expect(detectReassuranceSeeking("what if it rains tomorrow").seeking).toBe(false);
    expect(
      detectReassuranceSeeking("what if it's serious, I keep googling it").seeking,
    ).toBe(true);
  });

  it("leaves plain description alone", () => {
    expect(detectReassuranceSeeking("I had a hard day at work").seeking).toBe(false);
    expect(detectReassuranceSeeking("my boss hasn't replied").seeking).toBe(false);
  });

  it("reports which signals fired without echoing the message", () => {
    const reading = detectReassuranceSeeking("reassure me");
    expect(reading.signals.length).toBeGreaterThan(0);
    for (const signal of reading.signals) expect(signal).toMatch(/^(strong|weak):\d+$/);
  });
});

describe("urge targets", () => {
  it("recognises what the person is about to do", () => {
    expect(detectUrgeTarget("I want to google it again")).toBe("search");
    expect(detectUrgeTarget("I keep checking my pulse")).toBe("body_check");
    expect(detectUrgeTarget("I want to reread their message")).toBe("reread");
    expect(detectUrgeTarget("I want to text him again")).toBe("message");
    expect(detectUrgeTarget("I want to ask my partner")).toBe("ask_person");
    expect(detectUrgeTarget("I keep looking at her instagram story")).toBe("social_check");
  });

  it("admits when it cannot tell", () => {
    expect(detectUrgeTarget("I feel awful")).toBeNull();
  });
});

describe("the delay ladder", () => {
  const outcome = (minutes: number, resisted: boolean, daysAgo = 0): DelayOutcome => ({
    minutes,
    resisted,
    at: at(daysAgo),
  });

  it("starts at the lowest rung", () => {
    expect(suggestDelayMinutes([])).toBe(DELAY_RUNGS[0]);
  });

  it("steps up after a success", () => {
    expect(suggestDelayMinutes([outcome(10, true)])).toBe(20);
    expect(suggestDelayMinutes([outcome(20, true)])).toBe(30);
  });

  it("repeats rather than demotes after a lapse", () => {
    // Dropping the target after a hard attempt reads as a punishment, and the
    // product's whole posture is that checking is not a moral failure.
    expect(suggestDelayMinutes([outcome(20, false)])).toBe(20);
  });

  it("stops at the top rung", () => {
    expect(suggestDelayMinutes([outcome(30, true)])).toBe(30);
  });

  it("uses the most recent attempt, not the first", () => {
    expect(
      suggestDelayMinutes([outcome(10, true, 5), outcome(20, true, 1)]),
    ).toBe(30);
  });

  it("falls back to the first rung on an unrecognised duration", () => {
    expect(suggestDelayMinutes([outcome(7, true)])).toBe(DELAY_RUNGS[0]);
  });
});

describe("urge statistics", () => {
  const urge = (over: Partial<UrgeRecord> = {}): UrgeRecord => ({
    target: "search",
    at: at(1),
    delayMinutes: 10,
    resisted: true,
    ...over,
  });

  it("counts only settled delays in the resist rate", () => {
    const stats = summariseUrges([
      urge(),
      urge({ resisted: false }),
      urge({ resisted: null }),
      urge({ delayMinutes: null, resisted: null }),
    ]);
    expect(stats.total).toBe(4);
    expect(stats.withDelay).toBe(3);
    expect(stats.resisted).toBe(1);
    expect(stats.resistRate).toBe(0.5);
  });

  it("averages only the delays actually completed", () => {
    const stats = summariseUrges([
      urge({ delayMinutes: 10 }),
      urge({ delayMinutes: 30 }),
      urge({ delayMinutes: 30, resisted: false }),
    ]);
    expect(stats.meanDelayAchieved).toBe(20);
  });

  it("ranks what gets checked most", () => {
    const stats = summariseUrges([
      urge({ target: "search" }),
      urge({ target: "search" }),
      urge({ target: "reread" }),
    ]);
    expect(stats.byTarget[0]).toEqual({ target: "search", count: 2 });
  });

  it("says nothing rather than guessing with no data", () => {
    const stats = summariseUrges([]);
    expect(stats.resistRate).toBeNull();
    expect(stats.meanDelayAchieved).toBeNull();
    expect(stats.total).toBe(0);
  });
});

describe("reassurance detection does not over-fire", () => {
  const ordinary = [
    "do I have time to finish this before the meeting",
    "I am definitely going to be late",
    "she said it was fine",
    "I told him I was okay",
  ];

  it.each(ordinary)("leaves ordinary phrasing alone: %s", (message) => {
    expect(detectReassuranceSeeking(message).seeking).toBe(false);
  });
});
