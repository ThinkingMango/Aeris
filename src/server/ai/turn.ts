/**
 * One conversation turn.
 *
 * The reply streams to the person while deterministic guards run on the live
 * buffer. If a guard trips, the stream is aborted, the partial text is thrown
 * away, and reviewed copy answers instead. The structured decision arrives
 * separately as a `record_turn` tool call and is re-validated against server
 * state before anything is stored.
 *
 * This module owns no rules. Every rule it applies comes from `core/`.
 */
import type Anthropic from "@anthropic-ai/sdk";

import { GUARD_FALLBACK_REPLY, DEGRADED_REPLY } from "@/core/copy/index";
import {
  RECORD_TURN_TOOL,
  safeFallbackDecision,
  validateTurn,
  type Correction,
  type TurnDecision,
  type ValidationContext,
} from "@/core/conversation/turn-contract";
import { createStreamGuard, type GuardId } from "@/core/safety/output-guards";

import { anthropic, classifyFailure, type FailureKind } from "./client";
import { CONVERSATION_MODEL, EFFORT, LIMITS } from "./models";
import { SYSTEM_PROMPT, buildTurnContext, type TurnContextInput } from "./prompt";
import { recordUsage } from "./telemetry";

export interface HistoryMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface RunTurnInput {
  readonly requestId: string;
  readonly userMessage: string;
  readonly history: readonly HistoryMessage[];
  readonly promptContext: TurnContextInput;
  readonly validation: ValidationContext;
  /** Called for every text delta that survives the guards. */
  readonly onTextDelta: (delta: string) => void;
}

export interface TurnResult {
  /** What the person should end up seeing. */
  readonly text: string;
  readonly decision: TurnDecision;
  readonly corrections: readonly Correction[];
  readonly guards: readonly GuardId[];
  /** True when a guard aborted the stream and the text was replaced. */
  readonly guardAborted: boolean;
  /** True when the provider failed and the app answered instead. */
  readonly degraded: boolean;
  readonly failureKind: FailureKind | null;
}

const TOOLS: Anthropic.Tool[] = [RECORD_TURN_TOOL];

export async function runTurn(input: RunTurnInput): Promise<TurnResult> {
  const startedAt = Date.now();
  const guard = createStreamGuard({
    seekingReassurance: input.promptContext.seekingReassurance,
  });

  const messages: Anthropic.MessageParam[] = [
    ...input.history.slice(-LIMITS.maxContextMessages).map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: "user" as const, content: input.userMessage.slice(0, LIMITS.maxInputChars) },
  ];

  const controller = new AbortController();
  let abortedBy: GuardId | null = null;

  try {
    const stream = anthropic().messages.stream(
      {
        model: CONVERSATION_MODEL,
        max_tokens: LIMITS.turnMaxTokens,
        thinking: { type: "adaptive" },
        output_config: { effort: EFFORT.conversation },
        system: [
          // Byte-stable. Everything volatile lives in the second block, after
          // the cache breakpoint.
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          { type: "text", text: buildTurnContext(input.promptContext) },
        ],
        tools: TOOLS,
        // Auto rather than forced: forcing the tool would skip the text, and
        // the text is what the person is waiting for.
        tool_choice: { type: "auto" },
        messages,
      },
      { signal: controller.signal },
    );

    stream.on("text", (delta: string) => {
      if (abortedBy !== null) return;
      const violation = guard.push(delta);
      if (violation !== null) {
        abortedBy = violation;
        controller.abort();
        return;
      }
      input.onTextDelta(delta);
    });

    const final = await stream.finalMessage();

    // A policy refusal is answered from reviewed copy rather than by a second
    // model: on a message the first one declined, app-owned words are safer
    // than an improvisation.
    if (final.stop_reason === "refusal") {
      return degraded(input, startedAt, "refusal", guard.finish());
    }

    const toolUse = final.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === "record_turn",
    );

    const validated = validateTurn(toolUse?.input, input.validation);
    const lateGuards = guard.finish();
    const textFailed = lateGuards.length > 0;

    recordUsage({
      requestId: input.requestId,
      operation: "turn",
      model: CONVERSATION_MODEL,
      inputTokens: final.usage.input_tokens,
      outputTokens: final.usage.output_tokens,
      cacheReadTokens: final.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: final.usage.cache_creation_input_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      ok: !textFailed && validated.ok,
      guards: lateGuards,
    });

    if (textFailed) {
      // Either a mid-stream abort or a violation only visible once the reply
      // finished. Either way the draft is discarded, never shown.
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
    // An abort we triggered ourselves is a guard result, not a provider failure.
    if (abortedBy !== null) {
      const guards = guard.finish();
      recordUsage({
        requestId: input.requestId,
        operation: "turn",
        model: CONVERSATION_MODEL,
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
    return degraded(input, startedAt, classifyFailure(error), guard.finish());
  }
}

function degraded(
  input: RunTurnInput,
  startedAt: number,
  failureKind: FailureKind,
  guards: readonly GuardId[],
): TurnResult {
  recordUsage({
    requestId: input.requestId,
    operation: "turn",
    model: CONVERSATION_MODEL,
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
