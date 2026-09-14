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

import type { ClassifierReading } from "@/core/safety/merge";

import {
  CLASSIFY_DESCRIPTION,
  CLASSIFY_FUNCTION_NAME,
  CLASSIFY_PARAMETERS,
  INSTRUCTIONS,
  parse,
} from "../classifier-contract";

import { anthropic, classifyFailure } from "./client";
import { classifierModel, EFFORT, LIMITS } from "../models";
import { recordUsage } from "../telemetry";

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: CLASSIFY_FUNCTION_NAME,
  description: CLASSIFY_DESCRIPTION,
  input_schema: CLASSIFY_PARAMETERS as unknown as Anthropic.Tool["input_schema"],
  strict: true,
};

/**
 * Classifies one message. Returns null on any failure, which the gate treats
 * as degraded infrastructure.
 */
export async function classifyWithAnthropic(
  message: string,
  requestId: string,
): Promise<ClassifierReading | null> {
  const startedAt = Date.now();
  const model = classifierModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.classifierTimeoutMs);

  try {
    const response = await anthropic().messages.create(
      {
        model,
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
      model,
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
      model,
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
