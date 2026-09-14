import { describe, expect, it } from "vitest";

import {
  BILLING_STATUSES,
  FREE_MONTHLY_SESSIONS,
  PLANS,
  allowanceCopy,
  checkAllowance,
  entitlementsFor,
  nextPeriodStart,
  periodStart,
  summariseUsage,
} from "./index";

describe("entitlements", () => {
  it("fails closed on anything it does not recognise", () => {
    expect(entitlementsFor(null, null).anxietyMap).toBe(false);
    expect(entitlementsFor(undefined, undefined).monthlySessions).toBe(FREE_MONTHLY_SESSIONS);
    expect(entitlementsFor("plus", "unknown").anxietyMap).toBe(false);
    expect(entitlementsFor("nonsense" as never, "active").anxietyMap).toBe(false);
    expect(entitlementsFor("plus", "garbage" as never).anxietyMap).toBe(false);
  });

  it("keeps paid access through the payment retry window", () => {
    expect(entitlementsFor("plus", "past_due").anxietyMap).toBe(true);
    expect(entitlementsFor("plus", "canceled").anxietyMap).toBe(false);
    expect(entitlementsFor("plus", "paused").anxietyMap).toBe(false);
  });

  it("gives every plan the same rights over their own data and safety", () => {
    for (const plan of PLANS) {
      for (const status of BILLING_STATUSES) {
        const entitlements = entitlementsFor(plan, status);
        expect(entitlements.dataExport).toBe(true);
        expect(entitlements.accountDeletion).toBe(true);
        expect(entitlements.safetySupport).toBe(true);
        expect(entitlements.fullToolkit).toBe(true);
        expect(entitlements.urgeCapture).toBe(true);
      }
    }
  });

  it("leaves the wedge itself free and charges for the long view of it", () => {
    const free = entitlementsFor("free", "none");
    expect(free.urgeCapture).toBe(true);
    expect(free.urgeInsights).toBe(false);
    expect(entitlementsFor("plus", "active").urgeInsights).toBe(true);
  });

  it("unlocks a team seat the same way as a personal subscription", () => {
    expect(entitlementsFor("team", "active").anxietyMap).toBe(true);
    expect(entitlementsFor("practitioner", "active").anxietyMap).toBe(true);
  });
});

describe("the monthly allowance", () => {
  const now = new Date("2026-09-14T12:00:00Z");

  it("runs on calendar months in UTC", () => {
    expect(periodStart(now)).toBe("2026-09-01");
    expect(nextPeriodStart(now)).toBe("2026-10-01");
    expect(nextPeriodStart(new Date("2026-12-20T00:00:00Z"))).toBe("2027-01-01");
  });

  it("counts down from the free allowance", () => {
    const summary = summariseUsage(2, entitlementsFor("free", "none"), now);
    expect(summary.limit).toBe(FREE_MONTHLY_SESSIONS);
    expect(summary.remaining).toBe(3);
    expect(summary.unlimited).toBe(false);
  });

  it("treats nonsense usage as zero rather than trusting it", () => {
    expect(summariseUsage(Number.NaN, entitlementsFor("free", "none"), now).used).toBe(0);
    expect(summariseUsage(-4, entitlementsFor("free", "none"), now).used).toBe(0);
  });

  it("never blocks a turn that needs a safety route", () => {
    const exhausted = summariseUsage(99, entitlementsFor("free", "none"), now);
    expect(checkAllowance({ summary: exhausted, safetyRoute: "safety" })).toEqual({
      blocked: false,
      reason: "safety_first",
    });
  });

  it("fails open when the allowance could not be read", () => {
    expect(checkAllowance({ summary: null }).blocked).toBe(false);
    const exhausted = summariseUsage(99, entitlementsFor("free", "none"), now);
    expect(checkAllowance({ summary: exhausted, degraded: true }).blocked).toBe(false);
  });

  it("blocks only a verified, exhausted allowance on an ordinary turn", () => {
    const exhausted = summariseUsage(5, entitlementsFor("free", "none"), now);
    expect(checkAllowance({ summary: exhausted, safetyRoute: "normal" })).toEqual({
      blocked: true,
      reason: "exhausted",
    });
  });

  it("never blocks an unlimited plan", () => {
    const plus = summariseUsage(500, entitlementsFor("plus", "active"), now);
    expect(checkAllowance({ summary: plus }).reason).toBe("unlimited");
  });

  it("says so without implying that wellbeing depends on paying", () => {
    const copy = allowanceCopy(summariseUsage(5, entitlementsFor("free", "none"), now));
    expect(copy.heading).toContain("5");
    expect(copy.body).toContain("still open");
    expect(`${copy.heading} ${copy.body}`).not.toMatch(/upgrade|unlock|don't miss|risk/i);
  });
});
