/**
 * Paddle's webhook.
 *
 * This is the only thing in the product that can grant paid access, so it is
 * written defensively at four separate points.
 *
 *  1. **Signature first, before anything else is read.** The body is a string
 *     from the internet until `unmarshal` has verified it. Nothing is parsed,
 *     looked up or logged before that.
 *
 *  2. **Replay is stopped by a unique index, not by an `if`.** Paddle retries
 *     on any non-2xx and can deliver the same event twice concurrently. Two
 *     handlers both asking "have I seen this?" would both hear no. Letting the
 *     database answer makes the second one lose, which is the point.
 *
 *  3. **Order is not assumed.** `upsertSubscription` discards a write carrying
 *     an older event than the stored row, so a delayed `subscription.created`
 *     cannot reinstate a plan that has since been cancelled.
 *
 *  4. **The status code is a retry instruction.** 400 and 200 mean stop; 500
 *     means try again. Returning 200 on a failure loses the event silently,
 *     and returning 500 on an event we deliberately ignore produces a retry
 *     storm that ends with the endpoint disabled.
 */
import { billingConfig, billingReadiness, planForPrice } from "@/server/billing/config";
import { paddle } from "@/server/billing/paddle";
import { asSubscriptionShape, summarise } from "@/server/billing/status";
import { json } from "@/server/http";
import { repository } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROVIDER = "paddle";

/** Events that change what someone can do. Everything else is acknowledged. */
const SUBSCRIPTION_EVENTS: readonly string[] = [
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.canceled",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "subscription.trialing",
];

export async function POST(request: Request): Promise<Response> {
  const config = billingConfig();
  if (!billingReadiness(config).ready) {
    // Configured off. Acknowledge so Paddle does not retry against a
    // deployment that has deliberately disabled commerce.
    return json({ ignored: "billing_disabled" });
  }

  const signature = request.headers.get("paddle-signature");
  if (signature === null) return json({ error: "unsigned" }, { status: 400 });

  // Raw body. Any reparse or re-serialise before this point breaks the
  // signature, which is why nothing upstream — middleware included — touches
  // this path.
  const raw = await request.text();

  let event;
  try {
    event = await paddle(config).webhooks.unmarshal(raw, config.webhookSecret, signature);
  } catch {
    return json({ error: "invalid_signature" }, { status: 400 });
  }
  if (event === null || event === undefined) {
    return json({ error: "invalid_signature" }, { status: 400 });
  }

  const repo = repository();
  const occurredAt = new Date(event.occurredAt);
  const validOccurredAt = Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt;

  const fresh = await repo.recordBillingEvent({
    provider: PROVIDER,
    eventId: event.eventId,
    eventType: event.eventType,
    environment: config.environment,
    occurredAt: validOccurredAt,
  });
  if (!fresh) return json({ replayed: true });

  if (!SUBSCRIPTION_EVENTS.includes(event.eventType)) {
    await repo.markBillingEvent(PROVIDER, event.eventId, "ignored", null);
    return json({ ignored: event.eventType });
  }

  try {
    const shape = asSubscriptionShape(event.data);
    if (shape === null) {
      await repo.markBillingEvent(PROVIDER, event.eventId, "ignored", "unreadable_payload");
      return json({ ignored: "unreadable_payload" });
    }

    const summary = summarise(shape, (priceId) => planForPrice(config, priceId));

    // `customData` is the primary link, because we wrote it when the
    // transaction was created. The customer lookup is the fallback for a
    // subscription that was created outside this application — a manual fix in
    // the Paddle dashboard, or an import.
    const userId =
      summary.userId ??
      (await repo.findUserIdByCustomer(PROVIDER, summary.providerCustomerId));

    if (userId === null) {
      // Acknowledged rather than retried: no number of retries will make this
      // event name an account, and the row in `billing_events` is the record
      // that it arrived and why nothing happened.
      await repo.markBillingEvent(PROVIDER, event.eventId, "ignored", "no_matching_user");
      return json({ ignored: "no_matching_user" });
    }

    await repo.upsertSubscription({
      userId,
      plan: summary.plan,
      status: summary.status,
      environment: config.environment,
      provider: PROVIDER,
      providerCustomerId: summary.providerCustomerId,
      providerSubscriptionId: summary.providerSubscriptionId,
      providerPriceId: summary.providerPriceId,
      currentPeriodEnd: summary.currentPeriodEnd,
      cancelAtPeriodEnd: summary.cancelAtPeriodEnd,
      lastEventAt: validOccurredAt,
    });

    await repo.markBillingEvent(PROVIDER, event.eventId, "processed", null);
    return json({ processed: event.eventType });
  } catch {
    // Marked failed, which is what lets `recordBillingEvent` claim it again.
    // The 500 asks Paddle to retry, and the retry will now be processed rather
    // than dismissed as a replay.
    await repo.markBillingEvent(PROVIDER, event.eventId, "failed", "processing_error");
    return json({ error: "processing_failed" }, { status: 500 });
  }
}
