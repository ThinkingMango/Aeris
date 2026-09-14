/**
 * Every model decision in one place.
 *
 * No other module may name a model, an effort level or a token limit. When the
 * conversation model changes, the safety evaluation has to be re-run, and that
 * is only enforceable if there is exactly one place the change can happen.
 */

/**
 * The conversation. Claude Opus 5 with adaptive thinking, which is on by
 * default on this model.
 */
export const CONVERSATION_MODEL = process.env["AERIS_CONVERSATION_MODEL"] ?? "claude-opus-5";

/**
 * The safety classifier.
 *
 * Also Opus 5. This is the highest-stakes call in the product and it sits in
 * front of a person who is waiting, so it runs at low effort rather than on a
 * smaller model. `claude-sonnet-5` is the obvious latency and cost lever, but
 * it must not be pulled until the safety evaluation set proves it holds — the
 * id is configuration precisely so that swap is one variable plus an eval run.
 */
export const CLASSIFIER_MODEL = process.env["AERIS_CLASSIFIER_MODEL"] ?? "claude-opus-5";

export const SUMMARY_MODEL = process.env["AERIS_SUMMARY_MODEL"] ?? "claude-opus-5";

/** Bumped whenever the system prompt changes. Stored on every safety event. */
export const PROMPT_VERSION = "1.0.0";
export const CLASSIFIER_VERSION = "1.0.0";

export const LIMITS = Object.freeze({
  /** Longest single message accepted from a person. */
  maxInputChars: 4000,
  /** Most prior turns ever sent as context. */
  maxContextMessages: 12,
  /** Longest reply kept. The prompt asks for far less than this. */
  maxOutputChars: 1200,
  /** Output token ceiling for a conversation turn. */
  turnMaxTokens: 2000,
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

export const EFFORT = Object.freeze({
  conversation: "medium",
  classifier: "low",
  summary: "low",
} as const);
