/**
 * Turning what Paddle says into what this application believes.
 *
 * Pure, and structurally typed rather than typed against the SDK, for two
 * reasons: it can be tested exhaustively without a network or a fixture
 * factory, and an SDK upgrade that renames a class cannot silently change who
 * has access to what.
 *
 * Everything here fails closed. An unrecognised status is `unknown`, which
 * `entitlementsFor` resolves to the free tier — never to a paid one.
 */
import { isBillingStatus, type BillingStatus, type Plan } from "@/core/entitlements";

/** The shape this module needs. Both the API entity and the webhook
 *  notification satisfy it, which is why it is written structurally. */
export interface PaddleSubscriptionShape {
  readonly id: string;
  readonly status: string;
  readonly customerId: string;
  readonly currentBillingPeriod: { readonly endsAt: string } | null;
  readonly scheduledChange: { readonly action: string } | null;
  readonly items: readonly { readonly price: { readonly id: string } | null }[];
  readonly customData: Record<string, unknown> | null;
}

/**
 * Paddle's vocabulary happens to line up with ours one-for-one today. It is
 * still translated rather than cast, so the day Paddle adds a sixth status the
 * answer is `unknown` and the free tier, instead of a string nothing checks.
 */
export function normaliseStatus(paddleStatus: string): BillingStatus {
  return isBillingStatus(paddleStatus) && paddleStatus !== "none" ? paddleStatus : "unknown";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The user id we attached when the transaction was created.
 *
 * Validated as a UUID rather than trusted: `customData` is round-tripped
 * through Paddle and comes back in a webhook, and a value that reaches a
 * database query should have been checked on the way in regardless of how
 * confident we are about where it has been.
 */
export function userIdFromCustomData(customData: Record<string, unknown> | null): string | null {
  if (customData === null) return null;
  const value = customData["userId"] ?? customData["user_id"];
  return typeof value === "string" && UUID.test(value) ? value.toLowerCase() : null;
}

/** A subscription has one recurring price in this product. */
export function priceIdOf(subscription: PaddleSubscriptionShape): string | null {
  for (const item of subscription.items) {
    if (item.price !== null) return item.price.id;
  }
  return null;
}

/**
 * Paddle expresses "cancelled but paid up" as a scheduled change rather than a
 * boolean, and the status stays `active` until the date arrives. Reading it
 * this way is what lets the account screen say the true end date instead of
 * implying access has already gone.
 */
export function cancelsAtPeriodEnd(subscription: PaddleSubscriptionShape): boolean {
  return subscription.scheduledChange?.action === "cancel";
}

export function periodEnd(subscription: PaddleSubscriptionShape): Date | null {
  const raw = subscription.currentBillingPeriod?.endsAt;
  if (raw === undefined) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export interface SubscriptionSummary {
  readonly userId: string | null;
  readonly plan: Plan;
  readonly status: BillingStatus;
  readonly providerCustomerId: string;
  readonly providerSubscriptionId: string;
  readonly providerPriceId: string | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
}

/**
 * Reads a Paddle subscription into the application's own terms.
 *
 * `planForPrice` is injected because the mapping lives in configuration — the
 * same code runs against sandbox price ids and production ones, and hardcoding
 * either would mean a deployment where paying grants nothing.
 */
export function summarise(
  subscription: PaddleSubscriptionShape,
  planForPrice: (priceId: string | null) => Plan,
): SubscriptionSummary {
  const priceId = priceIdOf(subscription);
  return {
    userId: userIdFromCustomData(subscription.customData),
    plan: planForPrice(priceId),
    status: normaliseStatus(subscription.status),
    providerCustomerId: subscription.customerId,
    providerSubscriptionId: subscription.id,
    providerPriceId: priceId,
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: cancelsAtPeriodEnd(subscription),
  };
}

/* ------------------------------------------------------------------ */
/* Reading a webhook payload                                           */
/* ------------------------------------------------------------------ */

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Validates a webhook payload into the shape this module works with.
 *
 * Deliberately structural rather than a cast of the SDK's notification class.
 * The payload crossed a network, and the alternative — trusting the shape
 * because the types say so — is how a missing field becomes `undefined`
 * flowing into a database write. A payload that does not have an id, a status
 * and a customer is not a subscription, and the caller gets null rather than a
 * half-built object.
 */
export function asSubscriptionShape(data: unknown): PaddleSubscriptionShape | null {
  const root = record(data);
  if (root === null) return null;

  const id = str(root["id"]);
  const status = str(root["status"]);
  const customerId = str(root["customerId"] ?? root["customer_id"]);
  if (id === null || status === null || customerId === null) return null;

  const periodSource = record(root["currentBillingPeriod"] ?? root["current_billing_period"]);
  const endsAt = periodSource === null ? null : str(periodSource["endsAt"] ?? periodSource["ends_at"]);

  const changeSource = record(root["scheduledChange"] ?? root["scheduled_change"]);
  const action = changeSource === null ? null : str(changeSource["action"]);

  const rawItems = root["items"];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((entry) => {
    const price = record(record(entry)?.["price"]);
    const priceId = price === null ? null : str(price["id"]);
    return { price: priceId === null ? null : { id: priceId } };
  });

  return {
    id,
    status,
    customerId,
    currentBillingPeriod: endsAt === null ? null : { endsAt },
    scheduledChange: action === null ? null : { action },
    items,
    customData: record(root["customData"] ?? root["custom_data"]),
  };
}
