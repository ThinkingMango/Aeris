import { describe, expect, it } from "vitest";

import { planAggregation, type ExistingPattern, type SessionCandidate } from "./aggregate";
import { EVIDENCE_THRESHOLDS, isDisplayable, phraseFor, strengthFor } from "./evidence";
import { PATTERNS, PATTERN_LABELS, REASSURANCE_FAMILY, TRIGGERS, TRIGGER_LABELS, isPattern, isTrigger } from "./taxonomy";

const existing = (over: Partial<ExistingPattern> = {}): ExistingPattern => ({
  id: "row-1",
  pattern: "rumination",
  evidenceCount: 2,
  confidence: 0.6,
  hiddenByUser: false,
  ...over,
});

describe("taxonomy", () => {
  it("labels every pattern and trigger in plain words", () => {
    for (const pattern of PATTERNS) expect(PATTERN_LABELS[pattern].length).toBeGreaterThan(0);
    for (const trigger of TRIGGERS) expect(TRIGGER_LABELS[trigger].length).toBeGreaterThan(0);
  });

  it("keeps clinical vocabulary out of everything a person reads", () => {
    const clinical = /\b(disorder|diagnos|patholog|symptom|comorbid|catastrophi|rumination|cognitive distortion)\b/i;
    for (const pattern of PATTERNS) {
      expect(PATTERN_LABELS[pattern], `${pattern} label is clinical`).not.toMatch(clinical);
    }
  });

  it("guards against values that are not in the vocabulary", () => {
    expect(isPattern("rumination")).toBe(true);
    expect(isPattern("made_up")).toBe(false);
    expect(isTrigger("work")).toBe(true);
    expect(isTrigger("")).toBe(false);
  });

  it("names the family the product is built around", () => {
    expect(REASSURANCE_FAMILY).toContain("reassurance_seeking");
    for (const pattern of REASSURANCE_FAMILY) expect(PATTERNS).toContain(pattern);
  });
});

describe("evidence thresholds", () => {
  it("says nothing at all from a single session", () => {
    expect(strengthFor(1)).toBe("insufficient");
    expect(isDisplayable(1)).toBe(false);
    expect(phraseFor("rumination", 1)).toBeNull();
  });

  it("grows more confident only as evidence accumulates", () => {
    expect(strengthFor(EVIDENCE_THRESHOLDS.possible)).toBe("possible");
    expect(strengthFor(EVIDENCE_THRESHOLDS.emerging)).toBe("emerging");
    expect(strengthFor(EVIDENCE_THRESHOLDS.recurring)).toBe("recurring");
  });

  it("never shows a pattern the person said was wrong", () => {
    expect(isDisplayable(10, true)).toBe(false);
  });

  it("phrases an observation, never a fact about a person", () => {
    const phrase = phraseFor("catastrophizing", 2) ?? "";
    expect(phrase).toMatch(/might|may/i);
    expect(phrase).not.toMatch(/\byou are\b|\byou have\b/i);
  });

  it("has nothing to say about an unnamed pattern", () => {
    expect(phraseFor("unknown", 10)).toBeNull();
  });

  it("treats nonsense counts as no evidence", () => {
    expect(strengthFor(Number.NaN)).toBe("insufficient");
    expect(strengthFor(-5)).toBe("insufficient");
  });
});

describe("aggregation", () => {
  const candidate = (pattern: string, confidence = 0.8): SessionCandidate => ({ pattern, confidence });

  it("counts one session as one piece of evidence, however often it was inferred", () => {
    const plan = planAggregation(
      [candidate("rumination"), candidate("rumination"), candidate("rumination")],
      [existing()],
    );
    expect(plan.increments).toHaveLength(1);
    expect(plan.increments[0]?.evidenceCount).toBe(3);
    expect(plan.skipped.filter((entry) => entry.reason === "duplicate")).toHaveLength(2);
  });

  it("ignores a low-confidence guess", () => {
    const plan = planAggregation([candidate("rumination", 0.2)], []);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.skipped[0]?.reason).toBe("low_confidence");
  });

  it("ignores 'unknown' and anything outside the vocabulary", () => {
    const plan = planAggregation([candidate("unknown"), candidate("invented_thing")], []);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.skipped.map((entry) => entry.reason)).toEqual(["unknown_pattern", "not_a_pattern"]);
  });

  it("never reinforces a pattern the person marked as wrong", () => {
    const plan = planAggregation(
      [candidate("rumination")],
      [existing({ hiddenByUser: true })],
    );
    expect(plan.increments).toHaveLength(0);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.skipped[0]?.reason).toBe("hidden_by_user");
  });

  it("records a pattern seen for the first time", () => {
    const plan = planAggregation([candidate("sleep_worry", 0.9)], []);
    expect(plan.inserts).toEqual([{ pattern: "sleep_worry", confidence: 0.9 }]);
  });

  it("keeps the highest confidence seen rather than the latest", () => {
    const plan = planAggregation(
      [candidate("rumination", 0.55)],
      [existing({ confidence: 0.9 })],
    );
    expect(plan.increments[0]?.confidence).toBe(0.9);
  });

  it("clamps a confidence outside the range instead of trusting it", () => {
    const plan = planAggregation([candidate("sleep_worry", 4.2)], []);
    expect(plan.inserts[0]?.confidence).toBe(1);
  });
});
