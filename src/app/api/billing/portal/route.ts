/**
 * A link into Paddle's customer portal.
 *
 * Cancelling, updating a card and downloading invoices all happen there rather
 * than in screens built here. That is not laziness: self-serve cancellation is
 * a legal requirement in the EU and California, and the version that is always
 * correct is the one the merchant of record maintains.
 */
import { identityFor, json } from "@/server/http";
import { billingConfig, billingReadiness } from "@/server/billing/config";
import { paddle } from "@/server/billing/paddle";
import { repository } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const config = billingConfig();
  if (!billingReadiness(config).ready) {
    return json({ error: "billing_unavailable" }, { status: 503 });
  }

  const identity = await identityFor(request);
  const subscription = await repository().getSubscription(identity.userId);

  if (subscription === null || subscription.providerCustomerId === null) {
    return json({ error: "no_subscription" }, { status: 404 });
  }
  // A row written against the other Paddle environment is not this
  // deployment's to act on, and its ids do not exist here.
  if (subscription.environment !== config.environment) {
    return json({ error: "no_subscription" }, { status: 404 });
  }

  try {
    const session = await paddle(config).customerPortalSessions.create(
      subscription.providerCustomerId,
      subscription.providerSubscriptionId === null ? [] : [subscription.providerSubscriptionId],
    );
    return json({ url: session.urls.general.overview });
  } catch {
    return json({ error: "portal_failed" }, { status: 502 });
  }
}
