/**
 * Opens a checkout.
 *
 * The transaction is created **here**, on the server, and the browser is only
 * handed its id. The alternative — letting Paddle.js open a checkout with a
 * price and a `customData.userId` supplied by the page — would let anyone put
 * somebody else's id in the payload and pay for their subscription. Harmless
 * in intent, but it means the field that decides who gets access is one the
 * client writes, and that is not a property worth having.
 */
import { identityFor, json, optionalString, readJson } from "@/server/http";
import { billingConfig, billingReadiness } from "@/server/billing/config";
import { paddle } from "@/server/billing/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const config = billingConfig();
  const readiness = billingReadiness(config);
  if (!readiness.ready) {
    return json({ error: "billing_unavailable" }, { status: 503 });
  }

  const body = await readJson(request);
  const priceId = optionalString(body["priceId"]);
  // Checked against the configured catalog rather than passed through, so the
  // only things that can be bought are things this deployment sells.
  if (priceId === undefined || config.prices[priceId] === undefined) {
    return json({ error: "unknown_price" }, { status: 400 });
  }

  const identity = await identityFor(request);

  try {
    const transaction = await paddle(config).transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId: identity.userId },
    });
    return json({ transactionId: transaction.id }, { headers: identity.headers });
  } catch {
    // Never relays the provider's error. It can name the account and the key.
    return json({ error: "checkout_failed" }, { status: 502 });
  }
}
