import { describe, expect, it } from "vitest";

import type { RunRecord } from "../interventions/ranking";
import type { UrgeRecord } from "../urges/index";
import { THRESHOLDS, bucketForHour, computeInsights, type SessionRow, type UserPatternRow } from "./index";

const session = (over: Partial<SessionRow> = {}): SessionRow => ({
  localHour: 23,
  localDow: 1,
  trigger: "work",
  intensityBefore: 7,
  startedAt: new Date("2026-09-07T23:00:00Z"),
  ...over,
});

const empty = { sessions: [], patterns: [], runs: [], urges: [] };

describe("time buckets", () => {
  it("puts the small hours in the night", () => {
    expect(bucketForHour(23)).toBe("night");
    expect(bucketForHour(2)).toBe("night");
    expect(bucketForHour(4)).toBe("night");
    expect(bucketForHour(9)).toBe("morning");
    expect(bucketForHour(14)).toBe("afternoon");
    expect(bucketForHour(20)).toBe("evening");
  });
});

describe("thresholds", () => {
  it("says nothing at all with no data", () => {
    const insights = computeInsights(empty);
    expect(insights.anyAvailable).toBe(false);
    for (const section of [
      insights.timeOfDay,
      insights.dayOfWeek,
      insights.triggers,
      insights.patterns,
      insights.whatHelps,
      insights.urges,
      insights.intensityTrend,
    ]) {
      expect(section.available).toBe(false);
      expect(section.reason).not.toBeNull();
      expect(section.items).toHaveLength(0);
    }
  });

  it("names what has to happen before a section appears", () => {
    const insights = computeInsights({ ...empty, sessions: [session(), session()] });
    expect(insights.timeOfDay.reason).toContain(String(THRESHOLDS.timeOfDay.minSessions));
    expect(insights.timeOfDay.reason).toContain("2");
  });

  it("holds back a time-of-day claim until the sessions support it", () => {
    const five = Array.from({ length: 5 }, () => session());
    expect(computeInsights({ ...empty, sessions: five }).timeOfDay.available).toBe(false);

    const six = Array.from({ length: 6 }, () => session());
    const insights = computeInsights({ ...empty, sessions: six });
    expect(insights.timeOfDay.available).toBe(true);
    expect(insights.timeOfDay.items[0]?.bucket).toBe("night");
    expect(insights.timeOfDay.items[0]?.phrase).toContain("late at night");
  });

  it("refuses a claim when the sessions are spread evenly", () => {
    const spread = [
      session({ localHour: 2 }),
      session({ localHour: 3 }),
      session({ localHour: 9 }),
      session({ localHour: 10 }),
      session({ localHour: 14 }),
      session({ localHour: 20 }),
      session({ localHour: 21 }),
      session({ localHour: 15 }),
    ];
    expect(computeInsights({ ...empty, sessions: spread }).timeOfDay.available).toBe(false);
  });

  it("holds back a day-of-week claim until eight sessions", () => {
    const seven = Array.from({ length: 7 }, () => session({ localDow: 0 }));
    expect(computeInsights({ ...empty, sessions: seven }).dayOfWeek.available).toBe(false);

    const eight = Array.from({ length: 8 }, () => session({ localDow: 0 }));
    const insights = computeInsights({ ...empty, sessions: eight });
    expect(insights.dayOfWeek.available).toBe(true);
    expect(insights.dayOfWeek.items[0]?.phrase).toContain("Sunday");
  });

  it("ranks the top few triggers once there are enough sessions", () => {
    const sessions = [
      session({ trigger: "work" }),
      session({ trigger: "work" }),
      session({ trigger: "sleep" }),
      session({ trigger: "money" }),
    ];
    const insights = computeInsights({ ...empty, sessions });
    expect(insights.triggers.available).toBe(true);
    expect(insights.triggers.items[0]?.trigger).toBe("work");
    expect(insights.triggers.items).toHaveLength(3);
  });

  it("ignores an unnamed trigger rather than reporting it", () => {
    const sessions = Array.from({ length: 4 }, () => session({ trigger: "unknown" }));
    expect(computeInsights({ ...empty, sessions }).triggers.available).toBe(false);
  });
});

describe("patterns section", () => {
  const row = (over: Partial<UserPatternRow> = {}): UserPatternRow => ({
    pattern: "rumination",
    evidenceCount: 3,
    hiddenByUser: false,
    ...over,
  });

  it("shows only what has enough evidence behind it", () => {
    const insights = computeInsights({
      ...empty,
      patterns: [row({ evidenceCount: 1 }), row({ pattern: "sleep_worry", evidenceCount: 5 })],
    });
    expect(insights.patterns.items).toHaveLength(1);
    expect(insights.patterns.items[0]?.pattern).toBe("sleep_worry");
    expect(insights.patterns.items[0]?.strength).toBe("recurring");
  });

  it("never shows a pattern the person corrected", () => {
    const insights = computeInsights({ ...empty, patterns: [row({ hiddenByUser: true })] });
    expect(insights.patterns.available).toBe(false);
  });

  it("ignores a stored value outside the vocabulary", () => {
    const insights = computeInsights({
      ...empty,
      patterns: [{ pattern: "legacy_value", evidenceCount: 9, hiddenByUser: false }],
    });
    expect(insights.patterns.available).toBe(false);
  });
});

describe("what helps", () => {
  const run = (over: Partial<RunRecord> = {}): RunRecord => ({
    intervention: "grounding",
    completed: true,
    intensityBefore: 8,
    intensityAfter: 4,
    helpfulness: 3,
    ...over,
  });

  it("waits for a repeat before saying anything about an exercise", () => {
    expect(computeInsights({ ...empty, runs: [run()] }).whatHelps.available).toBe(false);

    const insights = computeInsights({ ...empty, runs: [run(), run()] });
    expect(insights.whatHelps.available).toBe(true);
    expect(insights.whatHelps.items[0]?.strong).toBe(true);
  });

  it("says plainly when something has not shifted much", () => {
    const flat = [
      run({ intensityBefore: 6, intensityAfter: 6, helpfulness: 1 }),
      run({ intensityBefore: 6, intensityAfter: 6, helpfulness: 1 }),
    ];
    const item = computeInsights({ ...empty, runs: flat }).whatHelps.items[0];
    expect(item?.strong).toBe(false);
    expect(item?.phrase).toContain("not shifted much");
  });
});

describe("urges section", () => {
  const urge = (over: Partial<UrgeRecord> = {}): UrgeRecord => ({
    target: "search",
    at: new Date("2026-09-10T22:00:00Z"),
    delayMinutes: 20,
    resisted: true,
    ...over,
  });

  it("waits until the habit has been used a few times", () => {
    expect(computeInsights({ ...empty, urges: [urge(), urge()] }).urges.available).toBe(false);
  });

  it("reports the numbers that make waiting feel worth it", () => {
    const insights = computeInsights({
      ...empty,
      urges: [urge(), urge(), urge({ resisted: false })],
    });
    expect(insights.urges.available).toBe(true);
    const labels = insights.urges.items.map((item) => item.label);
    expect(labels).toContain("Urges noticed");
    expect(labels).toContain("Waited it out");
    expect(labels).toContain("Average wait");
    expect(labels).toContain("Most common");
  });
});

describe("intensity trend", () => {
  it("needs several weeks before drawing a line", () => {
    const oneWeek = [session({ startedAt: new Date("2026-09-07T10:00:00Z") })];
    expect(computeInsights({ ...empty, sessions: oneWeek }).intensityTrend.available).toBe(false);

    const threeWeeks = [
      session({ startedAt: new Date("2026-08-24T10:00:00Z"), intensityBefore: 8 }),
      session({ startedAt: new Date("2026-08-31T10:00:00Z"), intensityBefore: 6 }),
      session({ startedAt: new Date("2026-09-07T10:00:00Z"), intensityBefore: 4 }),
    ];
    const insights = computeInsights({ ...empty, sessions: threeWeeks });
    expect(insights.intensityTrend.available).toBe(true);
    expect(insights.intensityTrend.items.map((week) => week.mean)).toEqual([8, 6, 4]);
  });

  it("groups by Monday-based week", () => {
    const sameWeek = [
      session({ startedAt: new Date("2026-09-07T10:00:00Z"), intensityBefore: 6 }),
      session({ startedAt: new Date("2026-09-13T10:00:00Z"), intensityBefore: 8 }),
      session({ startedAt: new Date("2026-09-14T10:00:00Z"), intensityBefore: 2 }),
      session({ startedAt: new Date("2026-09-21T10:00:00Z"), intensityBefore: 3 }),
    ];
    const weeks = computeInsights({ ...empty, sessions: sameWeek }).intensityTrend.items;
    expect(weeks).toHaveLength(3);
    expect(weeks[0]?.mean).toBe(7);
    expect(weeks[0]?.sessions).toBe(2);
  });
});
