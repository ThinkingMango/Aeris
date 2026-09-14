/**
 * The Anthropic client, constructed once.
 *
 * Server-only. Importing this from browser code is a build error waiting to
 * happen, which is the point.
 */
import Anthropic from "@anthropic-ai/sdk";

import { failureForStatus, type FailureKind } from "../failure";

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

/**
 * Anthropic's errors, translated into the shared taxonomy.
 *
 * The SDK's typed error classes are more precise than a status code, so they
 * are preferred where they exist and `failureForStatus` covers the rest.
 */
export function classifyFailure(error: unknown): FailureKind {
  if (error instanceof Anthropic.AuthenticationError) return "unauthorized";
  if (error instanceof Anthropic.RateLimitError) return "rate_limited";
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.APIConnectionError) return "unavailable";
  if (error instanceof Anthropic.APIError) {
    return error.status === undefined ? "unavailable" : failureForStatus(error.status);
  }
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "internal";
}
