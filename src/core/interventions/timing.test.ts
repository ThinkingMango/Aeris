import { describe, expect, it } from "vitest";

import { INTERVENTIONS } from "./catalog";
import {
  BREATH_LABELS,
  breathStateAt,
  cycleDurationMs,
  delayStateAt,
  formatRemaining,
  holdingLineAt,
  phaseBoundaries,
  stepProgress,
  totalDurationMs,
  type BreathPattern,
} from "./timing";

const SLOW: BreathPattern = { inhaleSeconds: 4, exhaleSeconds: 6, cycles: 8 };
const SIGH: BreathPattern = { inhaleSeconds: 3, exhaleSeconds: 6, secondInhale: true, cycles: 5 };

describe("breath timing", () => {
  it("matches the patterns the catalog actually ships", () => {
    const slow = INTERVENTIONS.slow_breathing.content;
    const sigh = INTERVENTIONS.physiological_sigh.content;
    expect(slow.kind).toBe("breath");
    expect(sigh.kind).toBe("breath");
    if (slow.kind !== "breath" || sigh.kind !== "breath") return;

    // 4 in + 6 out = 10s a cycle, eight cycles, eighty seconds.
    expect(cycleDurationMs(slow)).toBe(10_000);
    expect(totalDurationMs(slow)).toBe(80_000);
    // 3 in + 1 sniff + 6 out = 10s, five cycles, fifty seconds.
    expect(cycleDurationMs(sigh)).toBe(10_000);
    expect(totalDurationMs(sigh)).toBe(50_000);
  });

  it("walks through the phases of a cycle", () => {
    expect(breathStateAt(SLOW, 0).phase).toBe("inhale");
    expect(breathStateAt(SLOW, 3_999).phase).toBe("inhale");
    expect(breathStateAt(SLOW, 4_000).phase).toBe("exhale");
    expect(breathStateAt(SLOW, 9_999).phase).toBe("exhale");
    // Next cycle.
    expect(breathStateAt(SLOW, 10_000).phase).toBe("inhale");
  });

  it("inserts the second inhale only where the pattern asks for one", () => {
    expect(breathStateAt(SIGH, 2_999).phase).toBe("inhale");
    expect(breathStateAt(SIGH, 3_000).phase).toBe("sniff");
    expect(breathStateAt(SIGH, 3_999).phase).toBe("sniff");
    expect(breathStateAt(SIGH, 4_000).phase).toBe("exhale");
    // The plain pattern never sniffs.
    for (let ms = 0; ms < 10_000; ms += 250) {
      expect(breathStateAt(SLOW, ms).phase).not.toBe("sniff");
    }
  });

  it("counts cycles from one, the way a person would read them", () => {
    expect(breathStateAt(SLOW, 0).cycle).toBe(1);
    expect(breathStateAt(SLOW, 10_000).cycle).toBe(2);
    expect(breathStateAt(SLOW, 70_000).cycle).toBe(8);
    expect(breathStateAt(SLOW, 0).totalCycles).toBe(8);
  });

  it("reports progress through the current phase", () => {
    const halfway = breathStateAt(SLOW, 2_000);
    expect(halfway.phase).toBe("inhale");
    expect(halfway.phaseProgress).toBeCloseTo(0.5, 5);
    expect(halfway.phaseDurationMs).toBe(4_000);
  });

  it("counts down the whole exercise, not just the phase", () => {
    expect(breathStateAt(SLOW, 0).totalRemainingMs).toBe(80_000);
    expect(breathStateAt(SLOW, 40_000).totalRemainingMs).toBe(40_000);
  });

  it("finishes, and stays finished", () => {
    expect(breathStateAt(SLOW, 80_000).complete).toBe(true);
    expect(breathStateAt(SLOW, 80_000).phase).toBe("done");
    expect(breathStateAt(SLOW, 999_999).complete).toBe(true);
    expect(breathStateAt(SLOW, 999_999).totalRemainingMs).toBe(0);
  });

  it("survives a clock that went backwards", () => {
    // A device whose clock corrects itself mid-exercise must not produce a
    // negative phase or a NaN on screen.
    const state = breathStateAt(SLOW, -5_000);
    expect(state.phase).toBe("inhale");
    expect(state.phaseProgress).toBe(0);
    expect(Number.isNaN(state.totalRemainingMs)).toBe(false);
  });

  it("treats a degenerate pattern as already done rather than dividing by zero", () => {
    expect(breathStateAt({ inhaleSeconds: 0, exhaleSeconds: 0, cycles: 4 }, 0).complete).toBe(true);
    expect(breathStateAt({ ...SLOW, cycles: 0 }, 0).complete).toBe(true);
    expect(breathStateAt({ ...SLOW, cycles: -3 }, 0).complete).toBe(true);
  });

  it("has a short label for every phase", () => {
    for (const phase of ["inhale", "sniff", "exhale", "done"] as const) {
      expect(BREATH_LABELS[phase].length).toBeGreaterThan(0);
      expect(BREATH_LABELS[phase].length).toBeLessThan(24);
    }
  });
});

describe("the delay timer", () => {
  const start = Date.UTC(2026, 8, 14, 1, 30, 0);
  const minutesLater = (n: number): number => start + n * 60_000;

  it("counts down from the chosen wait", () => {
    const state = delayStateAt(start, 10, start);
    expect(state.totalMs).toBe(600_000);
    expect(state.remainingMs).toBe(600_000);
    expect(state.progress).toBe(0);
    expect(state.complete).toBe(false);
  });

  it("is correct after a backgrounded tab, because it reads the clock", () => {
    // The person put the phone down, which is the entire point of the exercise.
    // A tick counter would come back at zero elapsed. This does not.
    const state = delayStateAt(start, 10, minutesLater(7));
    expect(state.elapsedMs).toBe(420_000);
    expect(formatRemaining(state.remainingMs)).toBe("3:00");
    expect(state.progress).toBeCloseTo(0.7, 5);
  });

  it("completes exactly on time and never overshoots", () => {
    expect(delayStateAt(start, 10, minutesLater(10)).complete).toBe(true);
    const late = delayStateAt(start, 10, minutesLater(99));
    expect(late.complete).toBe(true);
    expect(late.remainingMs).toBe(0);
    expect(late.elapsedMs).toBe(600_000);
    expect(late.progress).toBe(1);
  });

  it("clamps a clock that runs backwards instead of reporting negative progress", () => {
    const skewed = delayStateAt(start, 10, start - 60_000);
    expect(skewed.elapsedMs).toBe(0);
    expect(skewed.remainingMs).toBe(600_000);
    expect(skewed.progress).toBe(0);
  });

  it("formats a countdown a person can read at a glance", () => {
    expect(formatRemaining(600_000)).toBe("10:00");
    expect(formatRemaining(61_000)).toBe("1:01");
    expect(formatRemaining(9_000)).toBe("0:09");
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(-5_000)).toBe("0:00");
  });

  it("spreads the holding script evenly across the wait", () => {
    const script = ["one", "two", "three", "four"];
    expect(holdingLineAt(script, 0, 600_000)).toBe("one");
    expect(holdingLineAt(script, 200_000, 600_000)).toBe("two");
    expect(holdingLineAt(script, 400_000, 600_000)).toBe("three");
    expect(holdingLineAt(script, 599_000, 600_000)).toBe("four");
    // Past the end stays on the last line rather than falling off.
    expect(holdingLineAt(script, 900_000, 600_000)).toBe("four");
  });

  it("has nothing to say when there is no script", () => {
    expect(holdingLineAt([], 0, 600_000)).toBeNull();
  });

  it("uses the script the catalog actually ships", () => {
    const content = INTERVENTIONS.delay_the_check.content;
    expect(content.kind).toBe("timer");
    if (content.kind !== "timer") return;
    expect(content.offeredMinutes).toEqual([10, 20, 30]);
    expect(holdingLineAt(content.holdingScript, 0, 600_000)).toBe(content.holdingScript[0]);
  });
});

describe("step progress", () => {
  it("reads the way a person counts", () => {
    const first = stepProgress(0, 6);
    expect(first.position).toBe(1);
    expect(first.isFirst).toBe(true);
    expect(first.isLast).toBe(false);
    expect(stepProgress(5, 6).isLast).toBe(true);
  });

  it("clamps an index out of range rather than trusting it", () => {
    expect(stepProgress(99, 6).index).toBe(5);
    expect(stepProgress(-4, 6).index).toBe(0);
    expect(stepProgress(2.7, 6).index).toBe(2);
  });

  it("handles an empty exercise without producing a negative position", () => {
    const none = stepProgress(0, 0);
    expect(none.total).toBe(0);
    expect(none.index).toBe(0);
    expect(none.isLast).toBe(true);
  });
});

describe("phase boundaries for the CSS animation", () => {
  it("splits a plain cycle at the point the breath turns around", () => {
    expect(phaseBoundaries(SLOW)).toEqual([
      { phase: "inhale", startPercent: 0, endPercent: 40 },
      { phase: "exhale", startPercent: 40, endPercent: 100 },
    ]);
  });

  it("makes room for the second inhale", () => {
    expect(phaseBoundaries(SIGH)).toEqual([
      { phase: "inhale", startPercent: 0, endPercent: 30 },
      { phase: "sniff", startPercent: 30, endPercent: 40 },
      { phase: "exhale", startPercent: 40, endPercent: 100 },
    ]);
  });

  it("always covers the whole cycle exactly once", () => {
    for (const pattern of [SLOW, SIGH]) {
      const boundaries = phaseBoundaries(pattern);
      expect(boundaries[0]?.startPercent).toBe(0);
      expect(boundaries[boundaries.length - 1]?.endPercent).toBe(100);
      for (let i = 1; i < boundaries.length; i += 1) {
        expect(boundaries[i]?.startPercent).toBe(boundaries[i - 1]?.endPercent);
      }
    }
  });

  it("has nothing to draw for a degenerate pattern", () => {
    expect(phaseBoundaries({ inhaleSeconds: 0, exhaleSeconds: 0, cycles: 3 })).toEqual([]);
  });
});
