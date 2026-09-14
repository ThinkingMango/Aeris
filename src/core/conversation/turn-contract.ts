/**
 * The contract between the model and the application for one turn.
 *
 * The model writes its reply as ordinary streamed text and then calls one
 * tool, `record_turn`, with the structured decision. Two layers guard it:
 *
 *  1. `strict: true` on the tool means the API itself rejects a shape that
 *     does not match the schema.
 *  2. `validateTurn` below re-checks everything that depends on server state —
 *     the legal transitions, the allowed exercise set, the pacing budget —
 *     because the model does not know those and must not be trusted with them.
 */
import { z } from "zod";

import { INTERVENTION_SLUGS, type InterventionSlug } from "../interventions/catalog";
import { PATTERNS, TRIGGERS } from "../patterns/taxonomy";
import { URGE_TARGETS } from "../urges/index";
import type { PacingAssessment } from "./pacing";
import { canTransition, safeFallbackState, type ModelState, type State } from "./states";

/** How the reply should be presented. */
export const UI_KINDS = ["text", "choice", "intervention", "intensity", "summary"] as const;
export type UiKind = (typeof UI_KINDS)[number];

const MODEL_STATE_VALUES = [
  "UNDERSTAND",
  "CLARIFY",
  "NAME_PATTERN",
  "OFFER_TOOL",
  "IN_TOOL",
  "REASSESS",
  "REFLECT",
  "COMPLETE",
  "SAFETY_HOLD",
] as const satisfies readonly ModelState[];

export const MAX_CHOICES = 4;
export const MAX_CHOICE_LENGTH = 120;
export const MAX_PATTERNS = 3;

export const turnDecisionSchema = z.object({
  next_state: z.enum(MODEL_STATE_VALUES),
  trigger: z.enum(TRIGGERS),
  patterns: z
    .array(z.object({ type: z.enum(PATTERNS), confidence: z.number().min(0).max(1) }))
    .max(MAX_PATTERNS),
  needs_more_context: z.boolean(),
  recommended_intervention: z.enum(INTERVENTION_SLUGS).nullable(),
  ui: z.object({
    kind: z.enum(UI_KINDS),
    choices: z.array(z.string().max(MAX_CHOICE_LENGTH)).max(MAX_CHOICES).nullable(),
  }),
  urge: z
    .object({ target: z.enum(URGE_TARGETS), wants_delay: z.boolean() })
    .nullable(),
});

export type TurnDecision = z.infer<typeof turnDecisionSchema>;

/**
 * A JSON Schema object, shaped to match what the Messages API expects for a
 * tool. Declared here rather than imported so that `core/` stays free of any
 * dependency on the SDK; it is structurally assignable to `Anthropic.Tool`.
 */
export interface ToolInputSchema {
  readonly type: "object";
  readonly additionalProperties: boolean;
  readonly required: string[];
  readonly properties: Record<string, unknown>;
  /** The Messages API accepts any further JSON Schema keywords. */
  readonly [keyword: string]: unknown;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly input_schema: ToolInputSchema;
  /** Guarantees the API rejects arguments that do not match the schema. */
  readonly strict: true;
}

/**
 * The JSON Schema handed to the API.
 *
 * Written out rather than generated so that it is byte-stable across
 * processes: it sits in the cached prefix of every request, and a key order
 * that shifted between deployments would silently cost every cache hit.
 */
export const RECORD_TURN_SCHEMA: ToolInputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "next_state",
    "trigger",
    "patterns",
    "needs_more_context",
    "recommended_intervention",
    "ui",
    "urge",
  ],
  properties: {
    next_state: { type: "string", enum: [...MODEL_STATE_VALUES] },
    trigger: { type: "string", enum: [...TRIGGERS] },
    patterns: {
      type: "array",
      maxItems: MAX_PATTERNS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "confidence"],
        properties: {
          type: { type: "string", enum: [...PATTERNS] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    needs_more_context: { type: "boolean" },
    recommended_intervention: { type: ["string", "null"], enum: [...INTERVENTION_SLUGS, null] },
    ui: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "choices"],
      properties: {
        kind: { type: "string", enum: [...UI_KINDS] },
        choices: {
          type: ["array", "null"],
          maxItems: MAX_CHOICES,
          items: { type: "string", maxLength: MAX_CHOICE_LENGTH },
        },
      },
    },
    urge: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["target", "wants_delay"],
      properties: {
        target: { type: "string", enum: [...URGE_TARGETS] },
        wants_delay: { type: "boolean" },
      },
    },
  },
};

export const RECORD_TURN_TOOL: ToolDefinition = {
  name: "record_turn",
  description:
    "Record the structured decision for this turn. Call this exactly once, after you have written your reply to the person. The turn ends when you call it, so do not expect a result back.",
  input_schema: RECORD_TURN_SCHEMA,
  strict: true,
};

/* ------------------------------------------------------------------ */
/* Server-side validation                                              */
/* ------------------------------------------------------------------ */

export const CORRECTIONS = [
  "illegal_transition",
  "intervention_not_allowed",
  "intervention_without_offer",
  "pacing_forced_advance",
  "choices_dropped",
  "urge_dropped",
] as const;

export type Correction = (typeof CORRECTIONS)[number];

export interface ValidationContext {
  readonly currentState: State;
  readonly allowedInterventions: readonly InterventionSlug[];
  readonly pacing: PacingAssessment;
  /** True when this turn was read as a bid for reassurance. */
  readonly seekingReassurance: boolean;
}

export type ValidationResult =
  | {
      readonly ok: true;
      readonly decision: TurnDecision;
      /** What the server had to fix. Safe to log: no message text. */
      readonly corrections: readonly Correction[];
    }
  | { readonly ok: false; readonly reason: "unparseable" };

/**
 * Validates and repairs a model decision against server state.
 *
 * Repairs rather than rejects wherever a sensible repair exists, because
 * discarding a whole turn over a single bad field means the person waits again
 * for no reason. Anything unrepairable falls back to holding the current state.
 */
export function validateTurn(raw: unknown, context: ValidationContext): ValidationResult {
  const parsed = turnDecisionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "unparseable" };

  const corrections: Correction[] = [];
  let decision = parsed.data;

  // 1. The pacing budget outranks whatever the model wanted to do next.
  const forced = context.pacing.mustAdvance
    ? forcedAdvance(decision.next_state, context)
    : null;
  if (forced !== null) {
    decision = { ...decision, next_state: forced };
    corrections.push("pacing_forced_advance");
  }

  // 2. The transition must be legal from the stored state.
  if (!canTransition(context.currentState, decision.next_state)) {
    decision = { ...decision, next_state: safeFallbackState(context.currentState) };
    corrections.push("illegal_transition");
  }

  // 3. An exercise may only be recommended from the server-computed set.
  if (decision.recommended_intervention !== null) {
    const allowed = (context.allowedInterventions as readonly string[]).includes(
      decision.recommended_intervention,
    );
    if (!allowed) {
      decision = { ...decision, recommended_intervention: null };
      corrections.push("intervention_not_allowed");
    } else if (decision.next_state !== "OFFER_TOOL" && decision.next_state !== "IN_TOOL") {
      // Recommending an exercise while moving somewhere else is incoherent:
      // the interface would render a card the conversation is not offering.
      decision = { ...decision, recommended_intervention: null };
      corrections.push("intervention_without_offer");
    }
  }

  // 4. Choice buttons only make sense on a choice turn.
  if (decision.ui.kind !== "choice" && decision.ui.choices !== null) {
    decision = { ...decision, ui: { ...decision.ui, choices: null } };
    corrections.push("choices_dropped");
  }
  if (decision.ui.kind === "choice" && (decision.ui.choices?.length ?? 0) === 0) {
    decision = { ...decision, ui: { kind: "text", choices: null } };
    corrections.push("choices_dropped");
  }

  // 5. An urge is only meaningful where reassurance-seeking was actually read.
  if (decision.urge !== null && !context.seekingReassurance) {
    decision = { ...decision, urge: null };
    corrections.push("urge_dropped");
  }

  return { ok: true, decision, corrections };
}

function forcedAdvance(proposed: ModelState, context: ValidationContext): ModelState | null {
  if (proposed === "OFFER_TOOL" || proposed === "IN_TOOL" || proposed === "SAFETY_HOLD") {
    return null;
  }
  if (canTransition(context.currentState, "OFFER_TOOL")) return "OFFER_TOOL";
  if (canTransition(context.currentState, "NAME_PATTERN")) return "NAME_PATTERN";
  return null;
}

/**
 * The decision used when the model fails entirely: a provider outage, an
 * unparseable reply, or a guard that aborted the stream. It invents nothing
 * and holds the conversation where it is.
 */
export function safeFallbackDecision(currentState: State): TurnDecision {
  return {
    next_state: safeFallbackState(currentState),
    trigger: "unknown",
    patterns: [],
    needs_more_context: false,
    recommended_intervention: null,
    ui: { kind: "text", choices: null },
    urge: null,
  };
}
