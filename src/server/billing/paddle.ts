/**
 * The Paddle client, constructed once.
 *
 * Server-only. The API key here can read and write every customer and
 * subscription in the account, which is why nothing under `src/app` outside a
 * route handler imports this module and why the name carries no
 * `NEXT_PUBLIC_` prefix.
 */
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

import { billingConfig, type BillingConfig } from "./config";

let cached: Paddle | null = null;
let cachedFor: string | null = null;

export function paddle(config: BillingConfig = billingConfig()): Paddle {
  if (config.apiKey.length === 0) {
    throw new Error("PADDLE_API_KEY is not set.");
  }
  // Keyed on the environment as well as cached, so a test that switches
  // environment does not silently keep talking to the previous one.
  const key = `${config.environment}`;
  if (cached !== null && cachedFor === key) return cached;

  cached = new Paddle(config.apiKey, {
    environment:
      config.environment === "production" ? Environment.production : Environment.sandbox,
  });
  cachedFor = key;
  return cached;
}

/** Test seam. */
export function resetPaddleForTesting(): void {
  cached = null;
  cachedFor = null;
}
