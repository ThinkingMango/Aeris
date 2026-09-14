import { describe, expect, it } from "vitest";

import { PATTERNS, type Pattern } from "../patterns/taxonomy";
import { INTERVENTIONS, INTERVENTION_SLUGS, getIntervention } from "./catalog";
import {
  MIN_RUNS_FOR_EVIDENCE,
  hasPersonalEvidence,
  rankInterventions,
  summariseEffectiveness,
  type RunRecord,
} from "./ranking";
import { PATTERN_ROUTES, allowedInterventions, isAllowed } from "./router";

const run = (over: Partial<RunRecord> = {}): RunRecord => ({
  intervention: "grounding",
  completed: true,
  intensityBefore: 8,
  intensityAfter: 5,
  helpfulness: 3,
  ...over,
});

describe("catalog", () => {
  it("owns the content of every exercise it offers", () => {
    for (const slug of INTERVENTION_SLUGS) {
      const item = getIntervention(slug);
      expect(item.slug).toBe(slug);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.framing.length).toBeGreaterThan(0);
      // Every exercise must be justifiable to a reviewer.
      expect(item.evidenceNote.length).toBeGreaterThan(20);
    }
  });

  it("makes no treatment or outcome claims in anything a person reads", () => {
    const banned = /\b(cure|cures|treat|treats|treatment for|therapy for|guarantee|proven to)\b/i;
    for (const slug of INTERVENTION_SLUGS) {
      const item = getIntervention(slug);
      const visible = `${item.title} ${item.intro} ${item.framing}`;
      expect(visible, `claim in ${slug}`).not.toMatch(banned);
    }
  });

  it("never tells anyone to hold their breath", () => {
    for (const slug of INTERVENTION_SLUGS) {
      const content = getIntervention(slug).content;
      if (content.kind !== "breath") continue;
      // The copy may say "never hold your breath"; it may not instruct one.
      const note = content.note.toLowerCase();
      expect(note, `${slug} instructs a breath hold`).not.toMatch(
        /(?<!never |don't |do not )\bhold (your|the) breath\b/,
      );
      expect(content.exhaleSeconds).toBeGreaterThan(content.inhaleSeconds);
    }
  });

  it("frames breathing as settling, never as stopping panic", () => {
    expect(INTERVENTIONS.slow_breathing.framing.toLowerCase()).toContain("isn't meant to make");
  });
});

describe("router", () => {
  it("maps every pattern to at least one exercise", () => {
    for (const pattern of PATTERNS) {
      expect(PATTERN_ROUTES[pattern].length, `${pattern} routes nowhere`).toBeGreaterThan(0);
    }
  });

  it("only ever routes to real exercises", () => {
    for (const slugs of Object.values(PATTERN_ROUTES)) {
      for (const slug of slugs) expect(INTERVENTION_SLUGS).toContain(slug);
    }
  });

  it("sends reassurance seeking to the delay, which is the whole point", () => {
    expect(allowedInterventions(["reassurance_seeking"])).toContain("delay_the_check");
    expect(allowedInterventions(["checking_compulsion"])).toContain("delay_the_check");
  });

  it("does not offer the delay for unrelated patterns", () => {
    expect(allowedInterventions(["physical_arousal"])).not.toContain("delay_the_check");
  });

  it("ignores invented pattern names rather than widening the set", () => {
    const allowed = allowedInterventions(["not_a_real_pattern", "totally_made_up"]);
    expect(allowed).toEqual(allowedInterventions(["unknown"]));
  });

  it("always returns something safe when nothing is recognised", () => {
    expect(allowedInterventions([]).length).toBeGreaterThan(0);
  });

  it("offers winding down late at night", () => {
    expect(allowedInterventions(["rumination"], { localHour: 2 })).toContain("wind_down");
    expect(allowedInterventions(["rumination"], { localHour: 14 })).not.toContain("wind_down");
  });

  it("ignores an impossible hour rather than trusting it", () => {
    expect(allowedInterventions(["rumination"], { localHour: 99 })).not.toContain("wind_down");
  });

  it("returns the set in canonical order and without duplicates", () => {
    const allowed = allowedInterventions(["physical_arousal", "general_overwhelm"]);
    expect([...new Set(allowed)]).toEqual([...allowed]);
    const indices = allowed.map((slug) => INTERVENTION_SLUGS.indexOf(slug));
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
  });

  it("guards a model recommendation against the allowed set", () => {
    expect(isAllowed("grounding", ["grounding"])).toBe(true);
    expect(isAllowed("delay_the_check", ["grounding"])).toBe(false);
    expect(isAllowed("made_up", ["grounding"])).toBe(false);
  });
});

describe("effectiveness", () => {
  it("ignores runs the person did not finish", () => {
    const rows = summariseEffectiveness([run({ completed: false }), run()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.completedRuns).toBe(1);
  });

  it("measures the direction intensity actually moved", () => {
    const rows = summariseEffectiveness([
      run({ intensityBefore: 8, intensityAfter: 4 }),
      run({ intensityBefore: 7, intensityAfter: 5 }),
    ]);
    expect(rows[0]?.meanIntensityChange).toBe(-3);
  });

  it("puts what helped this person first", () => {
    const runs: RunRecord[] = [
      run({ intervention: "grounding", intensityBefore: 8, intensityAfter: 7, helpfulness: 1 }),
      run({ intervention: "grounding", intensityBefore: 8, intensityAfter: 8, helpfulness: 1 }),
      run({ intervention: "next_step", intensityBefore: 8, intensityAfter: 3, helpfulness: 3 }),
      run({ intervention: "next_step", intensityBefore: 7, intensityAfter: 3, helpfulness: 3 }),
    ];
    const ranked = rankInterventions(["grounding", "next_step"], summariseEffectiveness(runs));
    expect(ranked[0]).toBe("next_step");
  });

  it("does not bury an untried exercise behind a badly performing one", () => {
    const runs: RunRecord[] = [
      run({ intervention: "grounding", intensityBefore: 5, intensityAfter: 8, helpfulness: 1 }),
      run({ intervention: "grounding", intensityBefore: 5, intensityAfter: 7, helpfulness: 1 }),
    ];
    const ranked = rankInterventions(["grounding", "untangle_thought"], summariseEffectiveness(runs));
    expect(ranked).toEqual(["untangle_thought", "grounding"]);
  });

  it("leaves the order alone when nobody has a track record", () => {
    const allowed = ["grounding", "next_step"] as const;
    expect(rankInterventions([...allowed], [])).toEqual([...allowed]);
  });

  it("sets a high bar before claiming something helped you before", () => {
    const weak = summariseEffectiveness([run({ intensityBefore: 6, intensityAfter: 5 })]);
    expect(hasPersonalEvidence(weak[0])).toBe(false);

    const strong = summariseEffectiveness([
      run({ intensityBefore: 9, intensityAfter: 4 }),
      run({ intensityBefore: 8, intensityAfter: 4 }),
    ]);
    expect(strong[0]?.completedRuns).toBeGreaterThanOrEqual(MIN_RUNS_FOR_EVIDENCE);
    expect(hasPersonalEvidence(strong[0])).toBe(true);
    expect(hasPersonalEvidence(undefined)).toBe(false);
  });

  it("reads helpfulness ratings as a trend", () => {
    expect(summariseEffectiveness([run({ helpfulness: 3 }), run({ helpfulness: 3 })])[0]?.helpfulness)
      .toBe("often");
    expect(summariseEffectiveness([run({ helpfulness: 1 }), run({ helpfulness: 1 })])[0]?.helpfulness)
      .toBe("rarely");
    expect(summariseEffectiveness([run({ helpfulness: null })])[0]?.helpfulness).toBe("unknown");
  });
});

describe("the routing map is exhaustive", () => {
  it("covers every declared pattern", () => {
    const covered = Object.keys(PATTERN_ROUTES).sort();
    expect(covered).toEqual([...PATTERNS].sort() as Pattern[]);
  });
});
