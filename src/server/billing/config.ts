/**
 * Billing configuration.
 *
 * `BILLING_ENABLED` is a commercial kill switch, not a convenience. With it
 * off, no checkout can be opened and no webhook is processed, and the product
 * still works — every exercise, the delay timer, the safety paths. That is the
 * intended failure mode: a billing outage must never be able to stand between
 * somebody and the thing that helps them at 1 a.m.
 */
import type { Plan } from "@/core/entitlements";

export type PaddleEnvironment = "sandbox" | "production";

export interface BillingConfig {
  readonly enabled: boolean;
  readonly environment: PaddleEnvironment;
  readonly apiKey: string;
  readonly webhookSecret: string;
  readonly clientToken: string;
  /** Price id to plan. The only place a purchase becomes a capability. */
  readonly prices: Readonly<Record<string, Plan>>;
}

function readPrices(): Record<string, Plan> {
  const map: Record<string, Plan> = {};
  const add = (value: string | undefined, plan: Plan): void => {
    if (value !== undefined && value.length > 0) map[value] = plan;
  };
  add(process.env["PADDLE_PRICE_PLUS_MONTHLY"], "plus");
  add(process.env["PADDLE_PRICE_PLUS_ANNUAL"], "plus");
  add(process.env["PADDLE_PRICE_TEAM_SEAT_MONTHLY"], "team");
  add(process.env["PADDLE_PRICE_PRACTITIONER_MONTHLY"], "practitioner");
  return map;
}

export function billingConfig(): BillingConfig {
  const environment: PaddleEnvironment =
    process.env["PADDLE_ENVIRONMENT"] === "production" ? "production" : "sandbox";

  return {
    enabled: process.env["BILLING_ENABLED"] === "true",
    environment,
    apiKey: process.env["PADDLE_API_KEY"] ?? "",
    webhookSecret: process.env["PADDLE_WEBHOOK_SECRET"] ?? "",
    clientToken: process.env["NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"] ?? "",
    prices: readPrices(),
  };
}

/** An unrecognised price grants the free tier. Never a guess at what was meant. */
export function planForPrice(config: BillingConfig, priceId: string | null): Plan {
  if (priceId === null) return "free";
  return config.prices[priceId] ?? "free";
}

export interface BillingReadiness {
  readonly ready: boolean;
  readonly missing: readonly string[];
}

/** What is missing, named, so a misconfigured deployment says so once. */
export function billingReadiness(config: BillingConfig): BillingReadiness {
  if (!config.enabled) return { ready: false, missing: ["BILLING_ENABLED"] };
  const missing: string[] = [];
  if (config.apiKey.length === 0) missing.push("PADDLE_API_KEY");
  if (config.webhookSecret.length === 0) missing.push("PADDLE_WEBHOOK_SECRET");
  if (config.clientToken.length === 0) missing.push("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
  if (Object.keys(config.prices).length === 0) missing.push("PADDLE_PRICE_PLUS_MONTHLY");
  return { ready: missing.length === 0, missing };
}
