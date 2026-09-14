import { describe, expect, it } from "vitest";

import type { InterventionSlug } from "../interventions/catalog";
import { assessPacing, computeStats, isDuplicateQuestion, similarity, type HistoryEntry } from "./pacing";
import { STATES, TRANSITIONS, canTransition, isTerminal, safeFallbackState } from "./states";
import {
  RECORD_TURN_SCHEMA,
  RECORD_TURN_TOOL,
  safeFallbackDecision,
  turnDecisionSchema,
  validateTurn,
  type TurnDecision,
  type ValidationContext,
} from "./turn-contract";

const decision = (over: Partial<TurnDecision> = {}): TurnDecision => ({
  next_state: "UNDERSTAND",
  trigger: "work",
  patterns: [],
  needs_more_context: false,
  recommended_intervention: null,
  ui: { kind: "text", choices: null },
  urge: null,
  ...over,
});

const context = (over: Partial<ValidationContext> = {}): ValidationContext => ({
  currentState: "UNDERSTAND",
  allowedInterventions: ["grounding", "next_step"] as InterventionSlug[],
  pacing: { mustAdvance: false, guidance: null, reason: null },
  seekingReassurance: false,
  ...over,
});

describe("state machine", () => {
  it("makes both terminal states genuinely terminal", () => {
    expect(isTerminal("COMPLETE")).toBe(true);
    expect(isTerminal("SAFETY_HOLD")).toBe(true);
    for (const state of STATES) {
      expect(canTransition("COMPLETE", state)).toBe(false);
      expect(canTransition("SAFETY_HOLD", state)).toBe(false);
    }
  });

  it("reaches the safety hold from every live state", () => {
    for (const state of STATES) {
      if (isTerminal(state)) continue;
      expect(canTransition(state, "SAFETY_HOLD"), `no safety exit from ${state}`).toBe(true);
    }
  });

  it("names only real states as targets", () => {
    for (const targets of Object.values(TRANSITIONS)) {
      for (const target of targets) expect(STATES).toContain(target);
    }
  });

  it("lets reassessment offer something else rather than ending the session", () => {
    expect(canTransition("REASSESS", "OFFER_TOOL")).toBe(true);
  });

  it("never falls back to START, because no turn ends there", () => {
    for (const state of STATES) {
      expect(safeFallbackState(state)).not.toBe("START");
    }
  });
});

describe("pacing", () => {
  const assistant = (content: string, state: HistoryEntry["state"]): HistoryEntry => ({
    role: "assistant",
    content,
    state,
  });

  it("counts clarifying turns and the questions already asked", () => {
    const stats = computeStats([
      { role: "user", content: "hi", state: null },
      assistant("What's going on for you right now?", "UNDERSTAND"),
      { role: "user", content: "work", state: null },
      assistant("What happened at work today?", "CLARIFY"),
    ]);
    expect(stats.assistantTurns).toBe(2);
    expect(stats.clarifyTurns).toBe(1);
    expect(stats.askedQuestions).toHaveLength(2);
  });

  it("forces a move once the clarifying budget is spent", () => {
    const stats = computeStats([
      assistant("What happened?", "CLARIFY"),
      assistant("And how did that land?", "CLARIFY"),
    ]);
    const assessment = assessPacing(stats, "CLARIFY");
    expect(assessment.mustAdvance).toBe(true);
    expect(assessment.reason).toBe("clarify_budget");
    expect(assessment.guidance).toContain("Do not ask another question");
  });

  it("leaves pacing alone once the conversation is past exploring", () => {
    const stats = computeStats([
      assistant("What happened?", "CLARIFY"),
      assistant("And then?", "CLARIFY"),
    ]);
    expect(assessPacing(stats, "IN_TOOL").mustAdvance).toBe(false);
  });

  it("recognises a question it has effectively already asked", () => {
    expect(similarity("What happened at work?", "What happened at work today?")).toBeGreaterThan(0.7);
    expect(
      isDuplicateQuestion("What happened at work today?", ["What happened at work?"]),
    ).toBe(true);
    expect(isDuplicateQuestion("How are you sleeping?", ["What happened at work?"])).toBe(false);
  });
});

describe("turn contract", () => {
  it("keeps the Zod schema and the JSON Schema in step", () => {
    const zodKeys = Object.keys(turnDecisionSchema.shape).sort();
    const jsonKeys = Object.keys(RECORD_TURN_SCHEMA.properties).sort();
    expect(jsonKeys).toEqual(zodKeys);
    expect([...RECORD_TURN_SCHEMA.required].sort()).toEqual(zodKeys);
  });

  it("declares itself strict so the API rejects a bad shape before we see it", () => {
    expect(RECORD_TURN_TOOL.strict).toBe(true);
    expect(RECORD_TURN_SCHEMA.additionalProperties).toBe(false);
  });

  it("rejects something that is not a decision at all", () => {
    expect(validateTurn({ nonsense: true }, context()).ok).toBe(false);
    expect(validateTurn(undefined, context()).ok).toBe(false);
  });

  it("repairs an illegal transition instead of discarding the turn", () => {
    const result = validateTurn(
      decision({ next_state: "COMPLETE" }),
      context({ currentState: "UNDERSTAND" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.corrections).toContain("illegal_transition");
    expect(canTransition("UNDERSTAND", result.decision.next_state)).toBe(true);
  });

  it("strips an exercise the server did not authorise", () => {
    const result = validateTurn(
      decision({ next_state: "OFFER_TOOL", recommended_intervention: "delay_the_check" }),
      context({ currentState: "UNDERSTAND", allowedInterventions: ["grounding"] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.recommended_intervention).toBeNull();
    expect(result.corrections).toContain("intervention_not_allowed");
  });

  it("keeps an authorised exercise on an offer turn", () => {
    const result = validateTurn(
      decision({ next_state: "OFFER_TOOL", recommended_intervention: "grounding" }),
      context({ currentState: "UNDERSTAND" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.recommended_intervention).toBe("grounding");
    expect(result.corrections).toHaveLength(0);
  });

  it("drops an exercise recommended while going somewhere else", () => {
    const result = validateTurn(
      decision({ next_state: "CLARIFY", recommended_intervention: "grounding" }),
      context({ currentState: "UNDERSTAND" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.recommended_intervention).toBeNull();
    expect(result.corrections).toContain("intervention_without_offer");
  });

  it("lets the pacing budget outrank what the model wanted", () => {
    const result = validateTurn(
      decision({ next_state: "CLARIFY" }),
      context({
        currentState: "CLARIFY",
        pacing: { mustAdvance: true, guidance: "stop asking", reason: "clarify_budget" },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.next_state).toBe("OFFER_TOOL");
    expect(result.corrections).toContain("pacing_forced_advance");
  });

  it("does not fight a model that was already moving on", () => {
    const result = validateTurn(
      decision({ next_state: "OFFER_TOOL" }),
      context({
        currentState: "CLARIFY",
        pacing: { mustAdvance: true, guidance: "stop asking", reason: "turn_budget" },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.corrections).not.toContain("pacing_forced_advance");
  });

  it("drops choices that do not belong to a choice turn", () => {
    const result = validateTurn(
      decision({ ui: { kind: "text", choices: ["a", "b"] } }),
      context(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.ui.choices).toBeNull();
    expect(result.corrections).toContain("choices_dropped");
  });

  it("falls back to text when a choice turn carries no choices", () => {
    const result = validateTurn(decision({ ui: { kind: "choice", choices: [] } }), context());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.ui.kind).toBe("text");
  });

  it("drops an urge that was never asked for", () => {
    const result = validateTurn(
      decision({ urge: { target: "search", wants_delay: true } }),
      context({ seekingReassurance: false }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.urge).toBeNull();
    expect(result.corrections).toContain("urge_dropped");
  });

  it("keeps an urge when reassurance-seeking was actually read", () => {
    const result = validateTurn(
      decision({ urge: { target: "search", wants_delay: true } }),
      context({ seekingReassurance: true }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.urge?.target).toBe("search");
  });

  it("refuses more than three patterns", () => {
    const result = validateTurn(
      decision({
        patterns: [
          { type: "rumination", confidence: 0.6 },
          { type: "catastrophizing", confidence: 0.6 },
          { type: "avoidance", confidence: 0.6 },
          { type: "self_criticism", confidence: 0.6 },
        ],
      }),
      context(),
    );
    expect(result.ok).toBe(false);
  });

  it("invents nothing in the fallback decision", () => {
    const fallback = safeFallbackDecision("CLARIFY");
    expect(fallback.recommended_intervention).toBeNull();
    expect(fallback.patterns).toHaveLength(0);
    expect(fallback.urge).toBeNull();
    expect(fallback.trigger).toBe("unknown");
  });
});

describe("degraded turns cannot escalate", () => {
  it("always falls back to a legal transition", () => {
    for (const state of STATES) {
      if (isTerminal(state)) continue;
      const fallback = safeFallbackState(state);
      expect(canTransition(state, fallback), `${state} -> ${fallback} is illegal`).toBe(true);
    }
  });

  it("never moves a session into the safety hold", () => {
    // A provider outage or a malformed reply must not be able to put someone
    // into a crisis redirect. Only the safety gate may do that.
    for (const state of STATES) {
      if (state === "SAFETY_HOLD") continue;
      expect(safeFallbackState(state), `${state} escalated`).not.toBe("SAFETY_HOLD");
    }
  });

  it("keeps a session that is already held, held", () => {
    expect(safeFallbackState("SAFETY_HOLD")).toBe("SAFETY_HOLD");
    expect(safeFallbackState("COMPLETE")).toBe("COMPLETE");
  });
});
