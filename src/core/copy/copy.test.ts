import { describe, expect, it } from "vitest";

import { COPY_ROUTES } from "../safety/index";
import {
  AI_DISCLOSURE,
  BOUNDARY_STATEMENT,
  COVERED_COUNTRIES,
  DEGRADED_REPLY,
  GENERIC_COUNTRY,
  GUARD_FALLBACK_REPLY,
  REVIEWED_REPLIES,
  resolveCrisisResources,
} from "./index";

describe("crisis registry", () => {
  it("never infers a number: every entry has a source and a date", () => {
    for (const country of COVERED_COUNTRIES) {
      const { resources } = resolveCrisisResources(country);
      expect(resources.length).toBeGreaterThan(0);
      for (const resource of resources) {
        expect(resource.source, `${resource.label} has no source`).toMatch(/^https:\/\//);
        expect(resource.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(resource.value.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every covered country a way to reach emergency services", () => {
    for (const country of COVERED_COUNTRIES) {
      const { resources } = resolveCrisisResources(country);
      expect(
        resources.some((resource) => resource.kind === "emergency"),
        `${country} has no emergency route`,
      ).toBe(true);
    }
  });

  it("never falls through to another country's numbers", () => {
    // A wrong emergency number is worse than none at all.
    const unknown = resolveCrisisResources("ZZ");
    expect(unknown.countryCode).toBe(GENERIC_COUNTRY);
    expect(unknown.resources).toHaveLength(0);

    expect(resolveCrisisResources(null).resources).toHaveLength(0);
    expect(resolveCrisisResources("").resources).toHaveLength(0);
  });

  it("is case insensitive about the country it is given", () => {
    expect(resolveCrisisResources("hk").resources.length).toBeGreaterThan(0);
    expect(resolveCrisisResources("Hk").countryCode).toBe("HK");
  });

  it("covers the launch markets", () => {
    for (const country of ["HK", "SG", "GB", "AU", "US"]) {
      expect(COVERED_COUNTRIES).toContain(country);
    }
  });
});

describe("reviewed replies", () => {
  it("has copy for every route the gate can choose", () => {
    for (const route of COPY_ROUTES) {
      expect(REVIEWED_REPLIES[route], `no copy for ${route}`).toBeTruthy();
      expect(REVIEWED_REPLIES[route].length).toBeGreaterThan(40);
    }
  });

  it("promises nothing and diagnoses nothing", () => {
    const banned = /\b(you'll be fine|don't worry|nothing to worry about|i'm sure|you have (anxiety|depression|ocd))\b/i;
    const all = [
      ...Object.values(REVIEWED_REPLIES),
      GUARD_FALLBACK_REPLY,
      DEGRADED_REPLY,
      AI_DISCLOSURE,
      BOUNDARY_STATEMENT,
    ];
    for (const text of all) expect(text).not.toMatch(banned);
  });

  it("says plainly what it is when asked for a relationship", () => {
    expect(REVIEWED_REPLIES.relational.toLowerCase()).toContain("ai");
    expect(REVIEWED_REPLIES.relational.toLowerCase()).toContain("not a person");
  });

  it("refuses medication questions without hedging", () => {
    expect(REVIEWED_REPLIES.medication.toLowerCase()).toContain("prescriber");
  });

  it("keeps the toolkit reachable when the model is down", () => {
    expect(DEGRADED_REPLY.toLowerCase()).toContain("exercises");
  });

  it("states the boundary and the AI disclosure in plain words", () => {
    expect(AI_DISCLOSURE.toLowerCase()).toContain("isn't a person");
    expect(BOUNDARY_STATEMENT.toLowerCase()).toContain("doesn't diagnose");
  });
});
