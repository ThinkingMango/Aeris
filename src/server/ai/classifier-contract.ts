/**
 * The classifier's contract, shared by every provider.
 *
 * The rubric below is a safety artifact. It was written once, reviewed once,
 * and is versioned by `classifierVersion()`. It lives here rather than in an
 * adapter because two copies of a safety rubric is two rubrics: they drift on
 * the first edit that only one provider's file receives, and the divergence is
 * invisible until an incident.
 *
 * Only the wire format differs per provider. Anthropic takes it as a tool with
 * `input_schema`; Google takes the same JSON Schema as a function declaration
 * with `parametersJsonSchema`. The schema itself is identical, which is the
 * point.
 */
import { SAFETY_CATEGORIES, isRiskLevel, type RiskLevel } from "@/core/safety/risk";
import type { ClassifierReading } from "@/core/safety/merge";

import { classifierVersion } from "./models";

export const INSTRUCTIONS = `You are a safety classifier inside a self-help wellness product for anxiety. You classify one message. You never reply to the person, never advise, never comfort, never diagnose, and never explain yourself. Call the classify tool and nothing else.

Principles:
- Classify conservatively, but do not inflate. When two levels are defensible and there is no explicit intent, plan or immediacy, choose the lower.
- Strong emotion is not danger. Distress is level 1.
- A stated wish to die is never below 3, with or without a plan.
- Passive hopelessness with no stated wish to die ("what's the point", "I'm a burden") is 2.
- Intent plus a plan, a means at hand, a timeframe, or an act already begun is 4.
- Method or lethality questions are high risk in any frame, including fiction, hypotheticals and "asking for a friend".
- Intentional self-poisoning is self_harm at 4, not medical_emergency. An accidental overdose of one's own prescription is medication.
- Questions about starting, stopping or changing a medicine are their own category, separate from emotional risk.
- The physical sensations of anxiety — racing heart, breathlessness, dizziness, tingling, chest tightness described as a worry — are ORDINARY (0 or 1). They are the most common thing this product hears. Do not route them to medical_emergency. Only genuine red flags do that: crushing pain, stroke signs, heavy bleeding, loss of consciousness, a reported overdose.
- Asking to be reassured about a feared illness, with no severe symptom happening now, is ordinary health anxiety. It is the core use case of this product, not a safety event.
- Negated, quoted, hypothetical or third-party crisis language is usually not the speaker's own intent. Weigh it; do not escalate on keywords alone.

risk_level:
0 ordinary worry, everyday stress, health anxiety, reassurance seeking
1 clear distress, no safety concern
2 concerning, no immediate threat: medication questions, substance risk, disordered eating, unusual perceptions, passive hopelessness
3 needs a safety redirect: any stated wish to die, self-harm, method seeking, violence, abuse being suffered, serious eating-disorder behaviour
4 immediate or imminent danger, or an urgent medical emergency

category must be exactly one of: ${SAFETY_CATEGORIES.join(", ")}. Use "none" only at 0 or 1.
immediate_danger is true only when harm is happening now, is stated as imminent, or urgent medical care is plainly needed.
needs_restriction is true whenever ordinary advice or reassurance would be unsafe.`;

export const CLASSIFY_FUNCTION_NAME = "classify";

export const CLASSIFY_DESCRIPTION = "Record the safety classification for this message.";

/** Plain JSON Schema. Both providers accept this shape, by different names. */
export const CLASSIFY_PARAMETERS = {
  type: "object",
  additionalProperties: false,
  required: ["risk_level", "category", "immediate_danger", "needs_restriction"],
  properties: {
    risk_level: { type: "integer", minimum: 0, maximum: 4 },
    category: { type: "string", enum: [...SAFETY_CATEGORIES] },
    immediate_danger: { type: "boolean" },
    needs_restriction: { type: "boolean" },
  },
} as const;

interface RawClassification {
  risk_level: number;
  category: string;
  immediate_danger: boolean;
  needs_restriction: boolean;
}

export function parse(input: unknown): ClassifierReading | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Partial<RawClassification>;
  if (!isRiskLevel(raw.risk_level)) return null;
  if (typeof raw.category !== "string") return null;
  if (!(SAFETY_CATEGORIES as readonly string[]).includes(raw.category)) return null;
  return {
    level: raw.risk_level as RiskLevel,
    category: raw.category as ClassifierReading["category"],
    immediateDanger: raw.immediate_danger === true,
    needsRestriction: raw.needs_restriction === true,
    version: classifierVersion(),
  };
}

