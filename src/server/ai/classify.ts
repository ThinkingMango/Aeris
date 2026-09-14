/**
 * The safety classifier.
 *
 * Its only job is to place one message on the risk ladder. It never writes
 * anything a person reads, never advises, never comforts, never diagnoses.
 * Raw provider output does not leave this module.
 *
 * Every failure path returns `null`, which the gate reads as "could not run" —
 * never as "no risk".
 */
import type Anthropic from "@anthropic-ai/sdk";

import { SAFETY_CATEGORIES, isRiskLevel, type RiskLevel } from "@/core/safety/risk";
import type { ClassifierReading } from "@/core/safety/merge";

import { anthropic, classifyFailure } from "./client";
import { CLASSIFIER_MODEL, CLASSIFIER_VERSION, EFFORT, LIMITS } from "./models";
import { recordUsage } from "./telemetry";

const INSTRUCTIONS = `You are a safety classifier inside a self-help wellness product for anxiety. You classify one message. You never reply to the person, never advise, never comfort, never diagnose, and never explain yourself. Call the classify tool and nothing else.

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

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "classify",
  description: "Record the safety classification for this message.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["risk_level", "category", "immediate_danger", "needs_restriction"],
    properties: {
      risk_level: { type: "integer", minimum: 0, maximum: 4 },
      category: { type: "string", enum: [...SAFETY_CATEGORIES] },
      immediate_danger: { type: "boolean" },
      needs_restriction: { type: "boolean" },
    },
  },
  strict: true,
};

interface RawClassification {
  risk_level: number;
  category: string;
  immediate_danger: boolean;
  needs_restriction: boolean;
}

function parse(input: unknown): ClassifierReading | null {
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
    version: CLASSIFIER_VERSION,
  };
}

/**
 * Classifies one message. Returns null on any failure, which the gate treats
 * as degraded infrastructure.
 */
export async function classifyMessage(
  message: string,
  requestId: string,
): Promise<ClassifierReading | null> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.classifierTimeoutMs);

  try {
    const response = await anthropic().messages.create(
      {
        model: CLASSIFIER_MODEL,
        max_tokens: LIMITS.classifierMaxTokens,
        output_config: { effort: EFFORT.classifier },
        system: [{ type: "text", text: INSTRUCTIONS, cache_control: { type: "ephemeral" } }],
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: "tool", name: "classify" },
        messages: [{ role: "user", content: message.slice(0, LIMITS.maxInputChars) }],
      },
      { signal: controller.signal },
    );

    const block = response.content.find(
      (candidate): candidate is Anthropic.ToolUseBlock =>
        candidate.type === "tool_use" && candidate.name === "classify",
    );
    const reading = block === undefined ? null : parse(block.input);

    recordUsage({
      requestId,
      operation: "classify",
      model: CLASSIFIER_MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      ok: reading !== null,
      ...(reading === null ? { failureKind: "malformed" } : {}),
    });

    return reading;
  } catch (error) {
    // Only the coarse kind is derived. The error object is discarded so no
    // provider body or stack trace can ever reach a log.
    recordUsage({
      requestId,
      operation: "classify",
      model: CLASSIFIER_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      latencyMs: Date.now() - startedAt,
      ok: false,
      failureKind: classifyFailure(error),
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}
