/**
 * The safety classifier, on Gemini.
 *
 * Its only job is to place one message on the risk ladder. It never writes
 * anything a person reads. Raw provider output does not leave this module.
 *
 * Every failure path returns `null`, which the gate reads as "could not run" —
 * never as "no risk". That includes the path unique to this provider: a
 * response intercepted by Google's own filters returns null too, because a
 * classifier that never saw the message has no opinion about it.
 */
import { FunctionCallingConfigMode } from "@google/genai";

import type { ClassifierReading } from "@/core/safety/merge";

import {
  CLASSIFY_DESCRIPTION,
  CLASSIFY_FUNCTION_NAME,
  CLASSIFY_PARAMETERS,
  INSTRUCTIONS,
  parse,
} from "../classifier-contract";
import { classifierModel, LIMITS, THINKING } from "../models";
import { recordUsage } from "../telemetry";
import {
  checkBlocked,
  classifyGoogleFailure,
  google,
  readUsage,
  SAFETY_SETTINGS,
  thinkingLevel,
} from "./client";

export async function classifyWithGoogle(
  message: string,
  requestId: string,
): Promise<ClassifierReading | null> {
  const startedAt = Date.now();
  const model = classifierModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.classifierTimeoutMs);

  try {
    const response = await google().models.generateContent({
      model,
      contents: [
        { role: "user", parts: [{ text: message.slice(0, LIMITS.maxInputChars) }] },
      ],
      config: {
        systemInstruction: INSTRUCTIONS,
        maxOutputTokens: LIMITS.classifierMaxTokens,
        // The rubric is fixed and the output is four fields. Determinism
        // matters more than variety in a decision that routes somebody to a
        // crisis line, so temperature is pinned rather than left to default.
        temperature: 0,
        thinkingConfig: { thinkingLevel: thinkingLevel(THINKING.classifier) },
        // See the long note in ./client.ts. Off because Google's filter would
        // otherwise hide self-harm text from the classifier whose entire
        // purpose is to read it.
        safetySettings: [...SAFETY_SETTINGS],
        tools: [
          {
            functionDeclarations: [
              {
                name: CLASSIFY_FUNCTION_NAME,
                description: CLASSIFY_DESCRIPTION,
                parametersJsonSchema: CLASSIFY_PARAMETERS,
              },
            ],
          },
        ],
        // ANY with an explicit allow-list is Gemini's equivalent of Anthropic's
        // forced `tool_choice`. Without it the model may answer in prose, and
        // prose is not a classification.
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: [CLASSIFY_FUNCTION_NAME],
          },
        },
        abortSignal: controller.signal,
      },
    });

    const block = checkBlocked(response);
    const call = response.functionCalls?.find(
      (candidate) => candidate.name === CLASSIFY_FUNCTION_NAME,
    );
    // A block is reported as its own failure kind rather than folded into
    // "malformed", so an operator can tell "Google refused to look at this"
    // apart from "the model answered badly".
    const reading = block.blocked || call === undefined ? null : parse(call.args);

    const usage = readUsage(response);
    recordUsage({
      requestId,
      operation: "classify",
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens,
      cacheWriteTokens: 0,
      latencyMs: Date.now() - startedAt,
      ok: reading !== null,
      ...(reading === null
        ? { failureKind: block.blocked ? ("blocked" as const) : ("malformed" as const) }
        : {}),
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
      failureKind: classifyGoogleFailure(error),
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}
