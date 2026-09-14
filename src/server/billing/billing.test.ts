import { describe, expect, it } from "vitest";

import { entitlementsFor } from "@/core/entitlements";

import { billingReadiness, planForPrice, type BillingConfig } from "./config";
import {
  asSubscriptionShape,
  normaliseStatus,
  summarise,
  userIdFromCustomData,
  type PaddleSubscriptionShape,
} from "./status";

const config = (overrides: Partial<BillingConfig> = {}): BillingConfig => ({
  enabled: true,
  environment: "sandbox",
  apiKey: "key",
  webhookSecret: "secret",
  clientToken: "token",
  prices: { pri_plus: "plus", pri_team: "team" },
  ...overrides,
});

const USER = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

const subscription = (
  overrides: Partial<PaddleSubscriptionShape> = {},
): PaddleSubscriptionShape => ({
  id: "sub_1",
  status: "active",
  customerId: "ctm_1",
  currentBillingPeriod: { endsAt: "2026-10-01T00:00:00Z" },
  scheduledChange: null,
  items: [{ price: { id: "pri_plus" } }],
  customData: { userId: USER },
  ...overrides,
});

describe("status normalisation", () => {
  it("translates every status Paddle actually sends", () => {
    expect(normaliseStatus("active")).toBe("active");
    expect(normaliseStatus("trialing")).toBe("trialing");
    expect(normaliseStatus("past_due")).toBe("past_due");
    expect(normaliseStatus("paused")).toBe("paused");
    expect(normaliseStatus("canceled")).toBe("canceled");
  });

  it("resolves anything else to unknown, which is the free tier", () => {
    expect(normaliseStatus("gifted")).toBe("unknown");
    expect(normaliseStatus("")).toBe("unknown");
    // The point of "unknown" is what it grants, not what it is called.
    expect(entitlementsFor("plus", normaliseStatus("gifted")).anxietyMap).toBe(false);
  });

  it("never lets `none` arrive from the provider as a real status", () => {
    // "none" is our word for "never subscribed". A provider sending it would
    // be describing something else.
    expect(normaliseStatus("none")).toBe("unknown");
  });
});

describe("custom data", () => {
  it("reads the user id we attached at checkout", () => {
    expect(userIdFromCustomData({ userId: USER })).toBe(USER);
    expect(userIdFromCustomData({ user_id: USER })).toBe(USER);
  });

  it("rejects anything that is not a uuid", () => {
    // This value reaches a database query, so "it came from Paddle" is not a
    // reason to skip checking it.
    expect(userIdFromCustomData({ userId: "admin" })).toBeNull();
    expect(userIdFromCustomData({ userId: "' or 1=1--" })).toBeNull();
    expect(userIdFromCustomData({ userId: 42 })).toBeNull();
    expect(userIdFromCustomData(null)).toBeNull();
    expect(userIdFromCustomData({})).toBeNull();
  });
});

describe("price to plan", () => {
  it("maps a configured price", () => {
    expect(planForPrice(config(), "pri_plus")).toBe("plus");
    expect(planForPrice(config(), "pri_team")).toBe("team");
  });

  it("grants free for a price this deployment does not sell", () => {
    // A production price id arriving at a sandbox deployment, or a price that
    // was removed from configuration, must not be guessed at.
    expect(planForPrice(config(), "pri_from_somewhere_else")).toBe("free");
    expect(planForPrice(config(), null)).toBe("free");
  });
});

describe("summarising a subscription", () => {
  it("reads an active subscription into our own terms", () => {
    const summary = summarise(subscription(), (id) => planForPrice(config(), id));
    expect(summary.plan).toBe("plus");
    expect(summary.status).toBe("active");
    expect(summary.userId).toBe(USER);
    expect(summary.providerSubscriptionId).toBe("sub_1");
    expect(summary.currentPeriodEnd?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(summary.cancelAtPeriodEnd).toBe(false);
  });

  it("treats a scheduled cancellation as paid through the period", () => {
    // Paddle keeps the status `active` until the date arrives. Reading the
    // scheduled change is what lets the account screen say the true end date
    // rather than implying access has already gone.
    const summary = summarise(
      subscription({ scheduledChange: { action: "cancel" } }),
      (id) => planForPrice(config(), id),
    );
    expect(summary.status).toBe("active");
    expect(summary.cancelAtPeriodEnd).toBe(true);
    expect(entitlementsFor(summary.plan, summary.status).anxietyMap).toBe(true);
  });

  it("does not mistake a pause for a cancellation", () => {
    const summary = summarise(
      subscription({ scheduledChange: { action: "pause" } }),
      (id) => planForPrice(config(), id),
    );
    expect(summary.cancelAtPeriodEnd).toBe(false);
  });

  it("survives a subscription with no billing period yet", () => {
    const summary = summarise(
      subscription({ currentBillingPeriod: null }),
      (id) => planForPrice(config(), id),
    );
    expect(summary.currentPeriodEnd).toBeNull();
  });

  it("ignores an unparseable date rather than storing an invalid one", () => {
    const summary = summarise(
      subscription({ currentBillingPeriod: { endsAt: "not a date" } }),
      (id) => planForPrice(config(), id),
    );
    expect(summary.currentPeriodEnd).toBeNull();
  });
});

describe("reading a webhook payload", () => {
  it("accepts a well-formed payload in either casing", () => {
    const camel = asSubscriptionShape({
      id: "sub_1",
      status: "active",
      customerId: "ctm_1",
      currentBillingPeriod: { endsAt: "2026-10-01T00:00:00Z" },
      items: [{ price: { id: "pri_plus" } }],
      customData: { userId: USER },
    });
    expect(camel?.id).toBe("sub_1");

    // Paddle's wire format is snake_case; the SDK camelises. Accepting both
    // means a raw payload and a parsed entity read identically.
    const snake = asSubscriptionShape({
      id: "sub_1",
      status: "active",
      customer_id: "ctm_1",
      current_billing_period: { ends_at: "2026-10-01T00:00:00Z" },
      items: [{ price: { id: "pri_plus" } }],
      custom_data: { user_id: USER },
    });
    expect(snake?.customerId).toBe("ctm_1");
    expect(snake?.currentBillingPeriod?.endsAt).toBe("2026-10-01T00:00:00Z");
    expect(snake?.customData?.["user_id"]).toBe(USER);
  });

  it("refuses a payload missing anything that identifies it", () => {
    // Half a subscription is not a subscription. The alternative is undefined
    // flowing into a database write.
    expect(asSubscriptionShape({ status: "active", customerId: "ctm_1" })).toBeNull();
    expect(asSubscriptionShape({ id: "sub_1", customerId: "ctm_1" })).toBeNull();
    expect(asSubscriptionShape({ id: "sub_1", status: "active" })).toBeNull();
    expect(asSubscriptionShape(null)).toBeNull();
    expect(asSubscriptionShape("sub_1")).toBeNull();
    expect(asSubscriptionShape([])).toBeNull();
  });

  it("tolerates missing or malformed items without throwing", () => {
    const shape = asSubscriptionShape({
      id: "sub_1",
      status: "active",
      customerId: "ctm_1",
      items: [{ price: null }, {}, "nonsense"],
    });
    expect(shape).not.toBeNull();
    expect(shape?.items.every((item) => item.price === null)).toBe(true);
  });
});

describe("readiness", () => {
  it("is not ready when billing is switched off", () => {
    expect(billingReadiness(config({ enabled: false })).ready).toBe(false);
  });

  it("names what is missing, and never its value", () => {
    const result = billingReadiness(config({ apiKey: "", webhookSecret: "" }));
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("PADDLE_API_KEY");
    expect(result.missing).toContain("PADDLE_WEBHOOK_SECRET");
  });

  it("is not ready with no prices, because nothing could be bought", () => {
    expect(billingReadiness(config({ prices: {} })).ready).toBe(false);
  });

  it("is ready when fully configured", () => {
    expect(billingReadiness(config()).ready).toBe(true);
  });
});
