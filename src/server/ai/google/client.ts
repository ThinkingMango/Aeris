/**
 * The Google client, constructed once, plus the two things about Gemini that
 * this application has to take a position on.
 *
 * Server-only. The key here can spend money; it carries no `NEXT_PUBLIC_`
 * prefix and nothing under `src/app` imports this module outside a route.
 */
import {
  ApiError,
  FinishReason,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
  type GenerateContentResponse,
  type SafetySetting,
} from "@google/genai";

import { failureForStatus, type FailureKind } from "../failure";

let cached: GoogleGenAI | null = null;

export function googleApiKey(): string {
  const key = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"];
  if (key === undefined || key.length === 0) {
    throw new Error("GEMINI_API_KEY is not set. Get one at aistudio.google.com/apikey.");
  }
  return key;
}

export function google(): GoogleGenAI {
  if (cached !== null) return cached;
  cached = new GoogleGenAI({ apiKey: googleApiKey() });
  return cached;
}

/** Test seam. Never called on a production path. */
export function setGoogleForTesting(client: GoogleGenAI | null): void {
  cached = client;
}

/* ------------------------------------------------------------------ */
/* Safety settings                                                     */
/* ------------------------------------------------------------------ */

/**
 * Google's content filters, turned off deliberately. Read this before changing it.
 *
 * This looks exactly like the line an auditor should object to, so here is why
 * it is the safer setting **in this application specifically**.
 *
 * Aeris already has four safety layers, all of which run before or around
 * anything Gemini is asked to do: deterministic phrase floors that cannot be
 * lowered by any model, a classifier whose reading can only *raise* risk,
 * reviewed app-owned copy for every route that matters, and eight output
 * guards that run on the live stream and abort it mid-sentence. Those layers
 * were designed against this product's actual failure modes and are tested.
 *
 * Google's filter is a fifth layer with different thresholds, calibrated for
 * general-purpose content, that we did not write and cannot inspect. Left on,
 * it does two harmful things here:
 *
 *  1. **It blinds the classifier.** The classifier's entire job is to read text
 *     about self-harm and grade it. A filter that refuses to show that text to
 *     the classifier disables the mechanism at precisely the moment it exists
 *     for. The result is fail-closed and therefore not dangerous — but a
 *     safety system that reliably stops working on dangerous input is not a
 *     safety system.
 *
 *  2. **It truncates replies to distressed people.** A response cut off at
 *     `finishReason: SAFETY` mid-sentence is what an anxious person at 1 a.m.
 *     experiences as being abandoned by the thing they reached for. Aeris's
 *     own guards handle this case properly: they discard the draft entirely
 *     and substitute reviewed words.
 *
 * Turning the filter off does not remove a protection; it removes a *second,
 * uncalibrated* one that conflicts with the protections that were designed for
 * this use. Google's non-adjustable core protections still apply regardless,
 * which is why `blocked` remains a failure kind that must be handled.
 */
export const SAFETY_SETTINGS: readonly SafetySetting[] = Object.freeze([
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
]);

/* ------------------------------------------------------------------ */
/* Thinking                                                            */
/* ------------------------------------------------------------------ */

const THINKING_LEVELS: Readonly<Record<string, ThinkingLevel>> = Object.freeze({
  MINIMAL: ThinkingLevel.MINIMAL,
  LOW: ThinkingLevel.LOW,
  MEDIUM: ThinkingLevel.MEDIUM,
  HIGH: ThinkingLevel.HIGH,
});

/** Maps the provider-neutral level in `models.ts` onto Google's enum. */
export function thinkingLevel(level: string): ThinkingLevel {
  return THINKING_LEVELS[level] ?? ThinkingLevel.LOW;
}

/* ------------------------------------------------------------------ */
/* Failures                                                            */
/* ------------------------------------------------------------------ */

export function classifyGoogleFailure(error: unknown): FailureKind {
  if (error instanceof ApiError) return failureForStatus(error.status);
  if (error instanceof Error) {
    if (error.name === "AbortError") return "timeout";
    // The SDK surfaces transport problems as plain errors. Matching on the
    // message is unpleasant but the alternative is calling a DNS failure
    // "internal" and hiding a whole class of outage.
    if (/fetch failed|ECONNRESET|ENOTFOUND|network/i.test(error.message)) return "unavailable";
  }
  return "internal";
}

/* ------------------------------------------------------------------ */
/* Blocking                                                            */
/* ------------------------------------------------------------------ */

export interface BlockCheck {
  readonly blocked: boolean;
  /** Which side was blocked. Never the text, and never the rating detail. */
  readonly where: "prompt" | "response" | null;
}

/**
 * Whether Google intercepted this exchange.
 *
 * Checked on every response even though the filters above are off, because
 * Google's core protections are not adjustable and a block must never be
 * mistaken for a clean, empty answer. An unchecked block reads as "the model
 * returned no risk", which is the single worst misreading available here.
 */
export function checkBlocked(response: GenerateContentResponse): BlockCheck {
  if (response.promptFeedback?.blockReason !== undefined) {
    return { blocked: true, where: "prompt" };
  }
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === FinishReason.SAFETY) {
    return { blocked: true, where: "response" };
  }
  if (candidate?.finishReason === FinishReason.PROHIBITED_CONTENT) {
    return { blocked: true, where: "response" };
  }
  return { blocked: false, where: null };
}

export interface GoogleUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly thoughtTokens: number;
}

/**
 * Gemini bills thinking tokens as output, so they are added to the output
 * count rather than reported separately — otherwise the cost telemetry would
 * understate every turn on a model whose thinking cannot be switched off.
 */
export function readUsage(response: GenerateContentResponse): GoogleUsage {
  const usage = response.usageMetadata;
  const thoughts = usage?.thoughtsTokenCount ?? 0;
  return {
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: (usage?.candidatesTokenCount ?? 0) + thoughts,
    cacheReadTokens: usage?.cachedContentTokenCount ?? 0,
    thoughtTokens: thoughts,
  };
}
