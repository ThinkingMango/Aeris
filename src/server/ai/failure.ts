/**
 * How a model call can fail, in terms this application understands.
 *
 * Provider-neutral on purpose. Every provider has its own error taxonomy and
 * its own HTTP quirks; the rest of the app reasons about *kinds* of failure,
 * and each provider adapter is responsible for translating into this list and
 * nothing else. No provider body, status line or stack trace crosses this
 * boundary — they can contain the prompt, and the prompt is what someone typed.
 */
export type FailureKind =
  | "unauthorized"
  | "rate_limited"
  | "overloaded"
  | "timeout"
  | "refusal"
  | "blocked"
  | "malformed"
  | "unavailable"
  | "internal";

/**
 * The two that look alike and are not.
 *
 * `refusal` is the model declining to generate. `blocked` is a provider-side
 * content filter intercepting the request or the response — a mechanism
 * outside this application, with its own thresholds, that we did not calibrate
 * and cannot see into.
 *
 * They are separated because the correct response to each is the same only by
 * coincidence. Both end in reviewed copy today. But a `blocked` classifier
 * call means the safety classifier never saw the message, which is an
 * operational problem worth alerting on, while a `refusal` means it saw it and
 * declined — and conflating them would hide the first inside the second.
 */
export const CONTENT_FAILURES: readonly FailureKind[] = Object.freeze(["refusal", "blocked"]);

/** Failures where nothing was judged: the call never reached a verdict. */
export const INFRASTRUCTURE_FAILURES: readonly FailureKind[] = Object.freeze([
  "rate_limited",
  "overloaded",
  "timeout",
  "unavailable",
  "internal",
]);

export function isContentFailure(kind: FailureKind): boolean {
  return CONTENT_FAILURES.includes(kind);
}

export function isInfrastructureFailure(kind: FailureKind): boolean {
  return INFRASTRUCTURE_FAILURES.includes(kind);
}

/**
 * HTTP status to failure kind.
 *
 * Shared because every provider this application talks to is an HTTP API and
 * they agree on the status codes that matter. A provider adapter uses this for
 * the general case and handles only its own specifics itself.
 */
export function failureForStatus(status: number): FailureKind {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 422) return "malformed";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 500) return "overloaded";
  return "unavailable";
}
