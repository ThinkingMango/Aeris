/**
 * One conversation turn, on Gemini.
 *
 * The reply streams to the person while deterministic guards run on the live
 * buffer. If a guard trips, the stream is abandoned, the partial text is thrown
 * away, and reviewed copy answers instead. The structured decision arrives as a
 * `record_turn` function call and is re-validated against server state before
 * anything is stored.
 *
 * This module owns no rules. Every rule it applies comes from `core/`.
 *
 * Two things differ from the Anthropic adapter and both are Gemini-specific:
 *
 *  - **Thought parts are in the stream.** Gemini 3 returns its reasoning as
 *    parts flagged `thought: true`, interleaved with the answer. Streaming
 *    those to somebody mid-panic would show them the model deliberating about
 *    them. They are filtered out before the guards, not after, so they never
 *    enter the buffer that becomes the reply.
 *
 *  - **A response can be cut off by Google rather than by us.** That is
 *    reported as `blocked` and answered from reviewed copy, exactly as a guard
 *    abort is — a truncated reply is never shown.
 */
import { FunctionCallingConfigMode, type GenerateContentResponse } from "@google/genai";

import { GUARD_FALLBACK_REPLY, DEGRADED_REPLY } from "@/core/copy/index";
import {
  RECORD_TURN_TOOL,
  safeFallbackDecision,
  validateTurn,
} from "@/core/conversation/turn-contract";
import { createStreamGuard, type GuardId } from "@/core/safety/output-guards";

import type { RunTurnInput, TurnResult } from "../contracts";
import type { FailureKind } from "../failure";
import { conversationModel, LIMITS, THINKING } from "../models";
import { SYSTEM_PROMPT, buildTurnContext } from "../prompt";
import { recordUsage } from "../telemetry";
import {
  checkBlocked,
  classifyGoogleFailure,
  google,
  readUsage,
  SAFETY_SETTINGS,
  thinkingLevel,
} from "./client";

export async function runTurnWithGoogle(input: RunTurnInput): Promise<TurnResult> {
  const startedAt = Date.now();
  const model = conversationModel();
  const guard = createStreamGuard({
    seekingReassurance: input.promptContext.seekingReassurance,
  });

  const controller = new AbortController();
  let abortedBy: GuardId | null = null;
  let blocked = false;
  let toolArgs: unknown;
  let last: GenerateContentResponse | null = null;

  try {
    const stream = await google().models.generateContentStream({
      model,
      contents: [
        ...input.history.slice(-LIMITS.maxContextMessages).map((entry) => ({
          // Gemini's word for the assistant is "model".
          role: entry.role === "assistant" ? "model" : "user",
          parts: [{ text: entry.content }],
        })),
        {
          role: "user",
          parts: [{ text: input.userMessage.slice(0, LIMITS.maxInputChars) }],
        },
      ],
      config: {
        // The stable prompt first, the volatile context second, matching the
        // Anthropic adapter. Gemini caches implicitly on a matching prefix, so
        // the ordering still earns the discount without a cache breakpoint.
        systemInstruction: `${SYSTEM_PROMPT}\n\n${buildTurnContext(input.promptContext)}`,
        maxOutputTokens: LIMITS.turnMaxTokensWithThinking,
        thinkingConfig: { thinkingLevel: thinkingLevel(THINKING.conversation) },
        safetySettings: [...SAFETY_SETTINGS],
        tools: [
          {
            functionDeclarations: [
              {
                name: RECORD_TURN_TOOL.name,
                description: RECORD_TURN_TOOL.description,
                parametersJsonSchema: RECORD_TURN_TOOL.input_schema,
              },
            ],
          },
        ],
        // AUTO rather than ANY: forcing the call would suppress the prose, and
        // the prose is what the person is waiting for. The prompt requires the
        // call, and `validateTurn` has a safe answer for a turn that omits it.
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        abortSignal: controller.signal,
      },
    });

    for await (const chunk of stream) {
      last = chunk;

      if (checkBlocked(chunk).blocked) {
        blocked = true;
        controller.abort();
        break;
      }

      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if (part.functionCall?.name === RECORD_TURN_TOOL.name) {
          toolArgs = part.functionCall.args;
          continue;
        }
        // Reasoning, not an answer. Never shown, never guarded, never stored.
        if (part.thought === true) continue;
        const delta = part.text;
        if (delta === undefined || delta.length === 0) continue;

        const violation = guard.push(delta);
        if (violation !== null) {
          abortedBy = violation;
          controller.abort();
          break;
        }
        input.onTextDelta(delta);
      }

      if (abortedBy !== null) break;
    }

    if (abortedBy !== null) {
      return guardAborted(input, startedAt, model, guard.finish());
    }

    if (blocked) {
      // Google intercepted it. Nothing partial is shown: a reply that stops
      // mid-sentence is what being abandoned feels like.
      return degraded(input, startedAt, model, "blocked", guard.finish());
    }

    const validated = validateTurn(toolArgs, input.validation);
    const lateGuards = guard.finish();
    const usage = last === null ? null : readUsage(last);

    recordUsage({
      requestId: input.requestId,
      operation: "turn",
      model,
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      cacheReadTokens: usage?.cacheReadTokens ?? 0,
      cacheWriteTokens: 0,
      latencyMs: Date.now() - startedAt,
      ok: lateGuards.length === 0 && validated.ok,
      guards: lateGuards,
    });

    if (lateGuards.length > 0) {
      // A violation only visible once the reply finished. The draft is
      // discarded, never shown.
      return {
        text: GUARD_FALLBACK_REPLY,
        decision: safeFallbackDecision(input.validation.currentState),
        corrections: validated.ok ? validated.corrections : [],
        guards: lateGuards,
        guardAborted: true,
        degraded: false,
        failureKind: null,
      };
    }

    if (!validated.ok) {
      // The model wrote something usable but did not record a valid decision.
      // The words stand; the conversation holds where it is.
      return {
        text: guard.text(),
        decision: safeFallbackDecision(input.validation.currentState),
        corrections: [],
        guards: [],
        guardAborted: false,
        degraded: false,
        failureKind: "malformed",
      };
    }

    return {
      text: guard.text(),
      decision: validated.decision,
      corrections: validated.corrections,
      guards: [],
      guardAborted: false,
      degraded: false,
      failureKind: null,
    };
  } catch (error) {
    // An abort we triggered ourselves is our own result, not a provider failure.
    if (abortedBy !== null) return guardAborted(input, startedAt, model, guard.finish());
    if (blocked) return degraded(input, startedAt, model, "blocked", guard.finish());
    return degraded(input, startedAt, model, classifyGoogleFailure(error), guard.finish());
  }
}

function guardAborted(
  input: RunTurnInput,
  startedAt: number,
  model: string,
  guards: readonly GuardId[],
): TurnResult {
  recordUsage({
    requestId: input.requestId,
    operation: "turn",
    model,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    latencyMs: Date.now() - startedAt,
    ok: false,
    failureKind: "guard_abort",
    guards,
  });
  return {
    text: GUARD_FALLBACK_REPLY,
    decision: safeFallbackDecision(input.validation.currentState),
    corrections: [],
    guards,
    guardAborted: true,
    degraded: false,
    failureKind: null,
  };
}

function degraded(
  input: RunTurnInput,
  startedAt: number,
  model: string,
  failureKind: FailureKind,
  guards: readonly GuardId[],
): TurnResult {
  recordUsage({
    requestId: input.requestId,
    operation: "turn",
    model,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    latencyMs: Date.now() - startedAt,
    ok: false,
    failureKind,
    guards,
  });
  return {
    text: DEGRADED_REPLY,
    decision: safeFallbackDecision(input.validation.currentState),
    corrections: [],
    guards: [],
    guardAborted: false,
    degraded: true,
    failureKind,
  };
}
