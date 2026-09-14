/**
 * The type guards.
 *
 * Every one of these sits on a boundary where a value arrives from the
 * database, a URL, or a model, and decides whether the domain will accept it.
 * They are one line each, which is exactly why they are worth testing: a
 * guard that accepts everything looks identical to one that works.
 */
import { describe, expect, it } from "vitest";

import { isState } from "./conversation/states";
import { isInterventionSlug } from "./interventions/catalog";
import { isPattern, isTone, isTrigger, isIntensity, INTENSITY_MAX, INTENSITY_MIN } from "./patterns/taxonomy";
import { isRiskLevel, isSafetyCategory } from "./safety/risk";
import { isUrgeTarget } from "./urges/index";
import { isBillingStatus, isPlan } from "./entitlements/index";

const cases: readonly [string, (value: unknown) => boolean, unknown, unknown][] = [
  ["state", isState, "UNDERSTAND", "LOITERING"],
  ["intervention", isInterventionSlug, "grounding", "hypnosis"],
  ["pattern", isPattern, "rumination", "vibes"],
  ["trigger", isTrigger, "work", "weather"],
  ["tone", isTone, "gentle", "shouty"],
  ["safety category", isSafetyCategory, "self_harm", "spicy"],
  ["urge target", isUrgeTarget, "search", "telepathy"],
  ["plan", isPlan, "plus", "platinum"],
  ["billing status", isBillingStatus, "active", "vibing"],
];

describe("type guards", () => {
  it.each(cases)("accepts a real %s and rejects anything else", (_name, guard, good, bad) => {
    expect(guard(good)).toBe(true);
    expect(guard(bad)).toBe(false);
    expect(guard(null)).toBe(false);
    expect(guard(undefined)).toBe(false);
    expect(guard(42)).toBe(false);
    expect(guard({})).toBe(false);
    expect(guard("")).toBe(false);
  });

  it("accepts only whole numbers on the risk ladder", () => {
    for (const level of [0, 1, 2, 3, 4]) expect(isRiskLevel(level)).toBe(true);
    expect(isRiskLevel(5)).toBe(false);
    expect(isRiskLevel(-1)).toBe(false);
    expect(isRiskLevel(2.5)).toBe(false);
    expect(isRiskLevel("3")).toBe(false);
    expect(isRiskLevel(Number.NaN)).toBe(false);
  });

  it("accepts only whole numbers on the intensity scale", () => {
    expect(isIntensity(INTENSITY_MIN)).toBe(true);
    expect(isIntensity(INTENSITY_MAX)).toBe(true);
    expect(isIntensity(0)).toBe(false);
    expect(isIntensity(11)).toBe(false);
    expect(isIntensity(5.5)).toBe(false);
    expect(isIntensity("7")).toBe(false);
  });
});
