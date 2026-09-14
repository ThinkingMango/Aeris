/**
 * What a person can do, in one place.
 *
 * No screen and no route may decide access with its own `if (isPlus)` check.
 * They ask for entitlements and read a named capability. Three capabilities
 * are true on every plan and every billing state, including lapsed and unpaid:
 * exporting your data, deleting your account, and reaching safety support.
 *
 * Fails closed: an unknown plan or an unrecognised status resolves to Free,
 * never to Plus.
 */

export const PLANS = ["free", "plus", "team", "practitioner"] as const;
export type Plan = (typeof PLANS)[number];

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

/**
 * The normalised billing lifecycle. Provider dialects are translated into this
 * vocabulary at the adapter edge; `unknown` is the fail-closed bucket.
 */
export const BILLING_STATUSES = [
  "none",
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
  "unknown",
] as const;

export type BillingStatus = (typeof BILLING_STATUSES)[number];

export function isBillingStatus(value: unknown): value is BillingStatus {
  return typeof value === "string" && (BILLING_STATUSES as readonly string[]).includes(value);
}

/**
 * Statuses that keep paid access on.
 *
 * `past_due` keeps it during the retry window: someone whose card expired
 * should not lose their history mid-month over a payment-processor hiccup.
 */
export const PAID_STATUSES: readonly BillingStatus[] = Object.freeze([
  "trialing",
  "active",
  "past_due",
]);

export const FREE_MONTHLY_SESSIONS = 5;
export const FREE_HISTORY_DAYS = 7;

export interface Entitlements {
  /** Guided conversations per calendar month. Null means no cap. */
  readonly monthlySessions: number | null;
  /** Days of history visible. Null means all of it. */
  readonly historyDays: number | null;
  readonly anxietyMap: boolean;
  /** Long-term urge and delay statistics. The capture itself is always free. */
  readonly urgeInsights: boolean;
  readonly voiceInput: boolean;
  /** Always true. Present so callers read it rather than assuming. */
  readonly dataExport: true;
  /** Always true. */
  readonly accountDeletion: true;
  /** Always true. Safety is never a paid feature, and never rate limited. */
  readonly safetySupport: true;
  /**
   * Always true. Every exercise, including the delay timer, works offline of
   * the model and is available on every plan — it is the part that helps at
   * 1:30 a.m. when someone has already used their five sessions.
   */
  readonly fullToolkit: true;
  /** Always true. Noticing an urge is the habit the product is trying to build. */
  readonly urgeCapture: true;
}

const ALWAYS_ON = Object.freeze({
  dataExport: true,
  accountDeletion: true,
  safetySupport: true,
  fullToolkit: true,
  urgeCapture: true,
} as const);

export const FREE_ENTITLEMENTS: Entitlements = Object.freeze({
  monthlySessions: FREE_MONTHLY_SESSIONS,
  historyDays: FREE_HISTORY_DAYS,
  anxietyMap: false,
  urgeInsights: false,
  voiceInput: false,
  ...ALWAYS_ON,
});

export const PAID_ENTITLEMENTS: Entitlements = Object.freeze({
  monthlySessions: null,
  historyDays: null,
  anxietyMap: true,
  urgeInsights: true,
  voiceInput: true,
  ...ALWAYS_ON,
});

/** The only place a plan and a billing status become capabilities. */
export function entitlementsFor(
  plan: Plan | null | undefined,
  status: BillingStatus | null | undefined,
): Entitlements {
  if (!isPlan(plan) || !isBillingStatus(status)) return FREE_ENTITLEMENTS;
  if (plan === "free") return FREE_ENTITLEMENTS;
  return PAID_STATUSES.includes(status) ? PAID_ENTITLEMENTS : FREE_ENTITLEMENTS;
}

/* ------------------------------------------------------------------ */
/* The monthly allowance                                               */
/* ------------------------------------------------------------------ */

export interface UsageSummary {
  readonly used: number;
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly unlimited: boolean;
  readonly periodStart: string;
  readonly resetsAt: string;
}

/** Allowances run on calendar months in UTC so the reset date is unambiguous. */
export function periodStart(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function nextPeriodStart(now: Date = new Date()): string {
  const rollsOver = now.getUTCMonth() === 11;
  const year = rollsOver ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const month = rollsOver ? 1 : now.getUTCMonth() + 2;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function summariseUsage(
  used: number,
  entitlements: Entitlements,
  now: Date = new Date(),
): UsageSummary {
  const limit = entitlements.monthlySessions;
  const safeUsed = Number.isFinite(used) && used > 0 ? Math.floor(used) : 0;
  return Object.freeze({
    used: safeUsed,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - safeUsed),
    unlimited: limit === null,
    periodStart: periodStart(now),
    resetsAt: nextPeriodStart(now),
  });
}

export type GateReason = "allowed" | "unlimited" | "safety_first" | "unverified" | "exhausted";

export interface AllowanceDecision {
  readonly blocked: boolean;
  readonly reason: GateReason;
}

/**
 * Whether a guided conversation may start.
 *
 * Two rules, in this order. Safety outranks the allowance completely: if the
 * current input needs a safety route, nothing is ever blocked. And it fails
 * open: an allowance that could not be read lets the person through.
 */
export function checkAllowance(input: {
  readonly summary: UsageSummary | null;
  readonly safetyRoute?: "normal" | "restricted" | "safety";
  readonly degraded?: boolean;
}): AllowanceDecision {
  if (input.safetyRoute === "safety") return { blocked: false, reason: "safety_first" };
  if (input.summary === null || input.degraded === true) {
    return { blocked: false, reason: "unverified" };
  }
  if (input.summary.unlimited) return { blocked: false, reason: "unlimited" };
  return (input.summary.remaining ?? 0) > 0
    ? { blocked: false, reason: "allowed" }
    : { blocked: true, reason: "exhausted" };
}

/**
 * What someone reads when the allowance is used up.
 *
 * Factual, never urgent, and never implying that their wellbeing depends on
 * paying — which is both dishonest and, in the EU, a prohibited way to treat a
 * vulnerable user.
 */
export function allowanceCopy(summary: UsageSummary | null): {
  readonly heading: string;
  readonly body: string;
} {
  const limit = summary?.limit ?? null;
  return Object.freeze({
    heading:
      limit === null
        ? "You've used your guided sessions for this month."
        : `You've used your ${limit} guided sessions for this month.`,
    body: "Every exercise and all of your support options are still open, and they always will be.",
  });
}
