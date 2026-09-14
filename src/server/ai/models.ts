/**
 * Every model decision in one place.
 *
 * No other module may name a model, a thinking level or a token limit. When
 * the conversation model changes, the safety evaluation has to be re-run, and
 * that is only enforceable if there is exactly one place the change can happen.
 *
 * Deliberately free of any provider SDK. This module is imported by route
 * handlers and by a test that compares client and server limits, and dragging
 * a vendor client into those is how a server-only dependency ends up somewhere
 * it cannot run.
 */

/* ------------------------------------------------------------------ */
/* Which provider                                                      */
/* ------------------------------------------------------------------ */

export const AI_PROVIDERS = ["google", "anthropic"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && (AI_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Google by default.
 *
 * Anthropic is kept rather than deleted because it is working, evaluated code,
 * and a provider seam whose second implementation has been removed is not a
 * seam — it is a comment. One environment variable moves the whole application
 * back, which is the cheapest possible insurance against a migration that
 * turns out to read badly to the people using it.
 */
export function aiProvider(): AiProvider {
  const configured = process.env["AERIS_AI_PROVIDER"];
  return isAiProvider(configured) ? configured : "google";
}

/* ------------------------------------------------------------------ */
/* Which model                                                         */
/* ------------------------------------------------------------------ */

interface ModelSet {
  readonly conversation: string;
  readonly classifier: string;
  readonly summary: string;
}

/**
 * Google.
 *
 * The classifier is deliberately **not** on Flash-Lite, which would be roughly
 * ten times cheaper and is the obvious saving, because this is the
 * highest-stakes call in the product and it sits in front of somebody who is
 * waiting. `gemini-3.1-flash-lite` is one environment variable away — pull it
 * when `npm run eval:safety` shows it holds, and not before.
 */
const GOOGLE_MODELS: ModelSet = {
  conversation: "gemini-3.1-pro-preview",
  classifier: "gemini-3.1-pro-preview",
  // Summaries are read by nobody until the person confirms them, and a wrong
  // one is visible and correctable. This is the one place a cheaper model
  // carries no safety weight.
  summary: "gemini-3.1-flash-lite",
};

const ANTHROPIC_MODELS: ModelSet = {
  conversation: "claude-opus-5",
  classifier: "claude-opus-5",
  summary: "claude-opus-5",
};

function models(): ModelSet {
  return aiProvider() === "anthropic" ? ANTHROPIC_MODELS : GOOGLE_MODELS;
}

/**
 * Resolved as functions rather than constants.
 *
 * They used to be module-level constants, which read more nicely but bakes the
 * provider in at import time — so a test could not switch provider, and the
 * eval harness could not run the same fixtures against both.
 */
export function conversationModel(): string {
  return process.env["AERIS_CONVERSATION_MODEL"] ?? models().conversation;
}

export function classifierModel(): string {
  return process.env["AERIS_CLASSIFIER_MODEL"] ?? models().classifier;
}

export function summaryModel(): string {
  return process.env["AERIS_SUMMARY_MODEL"] ?? models().summary;
}

/** Bumped whenever the system prompt changes. Stored on every safety event. */
export const PROMPT_VERSION = "1.0.0";
/** Bumped whenever the classifier's instructions or schema change. */
export const CLASSIFIER_RULES_VERSION = "1.0.0";

/**
 * The classifier's identity, rules and model together.
 *
 * Composed rather than hand-maintained because the model is half of what a
 * classifier *is*, and a safety event recording only "classifier 1.0.0" cannot
 * answer the question that matters after an incident: which model made this
 * call. Deriving it means a model swap cannot be deployed without the audit
 * trail changing with it, and nobody has to remember to bump anything.
 */
export function classifierVersion(): string {
  return `${CLASSIFIER_RULES_VERSION}/${classifierModel()}`;
}

export const LIMITS = Object.freeze({
  /** Longest single message accepted from a person. */
  maxInputChars: 4000,
  /** Most prior turns ever sent as context. */
  maxContextMessages: 12,
  /** Longest reply kept. The prompt asks for far less than this. */
  maxOutputChars: 1200,
  /** Output token ceiling for a conversation turn. */
  turnMaxTokens: 2000,
  /**
   * The same ceiling where thinking tokens are billed as output.
   *
   * Gemini counts thinking against `maxOutputTokens` and thinking cannot be
   * disabled on Gemini 3 Pro, so the Anthropic budget applied unchanged would
   * let reasoning consume the whole allowance and return an empty reply. The
   * headroom is for the thinking, not for a longer answer — the prompt still
   * asks for a short one, and `maxOutputChars` still trims it.
   */
  turnMaxTokensWithThinking: 6000,
  /** Output token ceiling for the classifier. */
  classifierMaxTokens: 512,
  summaryMaxTokens: 700,
  /**
   * The classifier sits in front of a waiting person, so it is bounded.
   * Ordinary generation is not put on a timer; a thoughtful turn may take time.
   */
  classifierTimeoutMs: 8000,
  /** No overall deadline on a turn — only a stall guard. */
  turnStallTimeoutMs: 45_000,
});

/** Anthropic's effort control. Ignored by the Google adapter. */
export const EFFORT = Object.freeze({
  conversation: "medium",
  classifier: "low",
  summary: "low",
} as const);

/**
 * Google's thinking control.
 *
 * Thinking cannot be disabled on Gemini 3 Pro, so these choose how much rather
 * than whether. The classifier runs LOW: it applies a fixed rubric to one short
 * message, and the latency of deeper reasoning is paid by somebody mid-panic.
 */
export const THINKING = Object.freeze({
  conversation: "MEDIUM",
  classifier: "LOW",
  summary: "MINIMAL",
} as const);
