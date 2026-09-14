/**
 * What a person is entitled to, resolved once.
 *
 * The rule this enforces is that **access is read from our own database, never
 * from Paddle**. A conversation turn must not wait on a third-party API, and it
 * must not fail because that API is having a bad afternoon. The webhook writes;
 * everything else reads one indexed row.
 *
 * It fails closed at every step. No subscription, an unreadable plan, a row
 * written against the other Paddle environment — each resolves to the free
 * tier, which still includes every exercise, the delay timer and all of the
 * safety paths.
 */
import {
  entitlementsFor,
  periodStart,
  summariseUsage,
  type BillingStatus,
  type Entitlements,
  type Plan,
  type UsageSummary,
} from "@/core/entitlements";

import { billingConfig } from "./config";
import { repository } from "../repo";
import type { SubscriptionRow } from "../repo/types";

export interface Access {
  readonly plan: Plan;
  readonly status: BillingStatus;
  readonly entitlements: Entitlements;
  readonly subscription: SubscriptionRow | null;
}

export async function accessFor(userId: string): Promise<Access> {
  const subscription = await repository().getSubscription(userId);
  const environment = billingConfig().environment;

  // A sandbox row must never grant access in production, and the reverse is
  // just as wrong. If the two ever share a database, this is what stops a test
  // purchase becoming a real entitlement.
  const usable =
    subscription !== null && subscription.environment === environment ? subscription : null;

  const plan = usable?.plan ?? "free";
  const status = usable?.status ?? "none";

  return {
    plan,
    status,
    entitlements: entitlementsFor(plan, status),
    subscription: usable,
  };
}

export interface UsageAndAccess extends Access {
  readonly usage: UsageSummary;
}

/** Access plus this month's count, for the allowance check and the account screen. */
export async function usageAndAccessFor(userId: string): Promise<UsageAndAccess> {
  const access = await accessFor(userId);
  const used = await repository().countGuidedSessions(userId, periodStart());
  return { ...access, usage: summariseUsage(used, access.entitlements) };
}
