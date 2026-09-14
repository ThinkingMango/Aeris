/**
 * The Anthropic client, constructed once.
 *
 * Server-only. Importing this from browser code is a build error waiting to
 * happen, which is the point.
 */
import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (cached !== null) return cached;
  // The SDK resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or a local
  // `ant auth login` profile in that order. Nothing is hardcoded.
  cached = new Anthropic({ maxRetries: 2 });
  return cached;
}

/** Test seam. Never called in production code paths. */
export function setAnthropicForTesting(client: Anthropic | null): void {
  cached = client;
}

/** Coarse failure kinds. Never a provider body, a stack trace or a key. */
export type FailureKind =
  | "unauthorized"
  | "rate_limited"
  | "overloaded"
  | "timeout"
  | "refusal"
  | "malformed"
  | "unavailable"
  | "internal";

export function classifyFailure(error: unknown): FailureKind {
  if (error instanceof Anthropic.AuthenticationError) return "unauthorized";
  if (error instanceof Anthropic.RateLimitError) return "rate_limited";
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.APIConnectionError) return "unavailable";
  if (error instanceof Anthropic.APIError) {
    if (error.status !== undefined && error.status >= 500) return "overloaded";
    return "unavailable";
  }
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "internal";
}
