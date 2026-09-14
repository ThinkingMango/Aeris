/**
 * The risk ladder and the decision shape every safety path produces.
 *
 * Pure data and pure functions. Nothing here reads a message, calls a model or
 * touches storage — it only defines the vocabulary the rest of the safety
 * system is allowed to speak.
 */

/**
 * Five levels, ordered. The numeric values are meaningful: `Math.max` over two
 * levels is the merge operation, and "a floor may only be raised" is expressed
 * as `Math.max(floor, proposed)`.
 */
export const RiskLevel = {
  /** Ordinary worry or stress. */
  NONE: 0,
  /** Clear distress with no safety concern. */
  DISTRESS: 1,
  /** Concerning, but no immediate threat identified. Advice must narrow. */
  ELEVATED: 2,
  /** A stated wish to die, self-harm, violence, or comparable risk. */
  HIGH: 3,
  /** Imminent danger, an act in progress, or a medical emergency. */
  IMMEDIATE: 4,
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const RISK_LEVELS: readonly RiskLevel[] = [0, 1, 2, 3, 4];

export function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4;
}

/**
 * What the concern is about. This is never shown to a person and never used as
 * a diagnosis; it selects which reviewed copy answers the turn.
 */
export const SAFETY_CATEGORIES = [
  "none",
  "self_harm",
  "harm_to_others",
  "abuse",
  "medical_emergency",
  "medication",
  "substance_crisis",
  "reality_sensitive",
  "other_high_risk",
] as const;

export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];

export function isSafetyCategory(value: unknown): value is SafetyCategory {
  return typeof value === "string" && (SAFETY_CATEGORIES as readonly string[]).includes(value);
}

/** What the application must do about this turn. */
export const SAFETY_ACTIONS = [
  /** Ordinary conversation may proceed. */
  "continue",
  /** Conversation continues with advice narrowed and no intervention offered. */
  "restrict",
  /** Ordinary generation is bypassed; reviewed copy answers the turn. */
  "redirect",
] as const;

export type SafetyAction = (typeof SAFETY_ACTIONS)[number];

/** The route a turn takes, derived from the decision. */
export type SafetyRoute = "normal" | "restricted" | "safety";

/**
 * How much the deterministic layer trusts its own match.
 *
 * `high` means the language is literal and unambiguous, and the classifier is
 * not consulted at all — there is nothing it could add that would be allowed
 * to lower the level. `medium` means the match stands as a floor but the
 * classifier still runs and may raise it.
 */
export type Certainty = "high" | "medium";

export interface SafetyDecision {
  readonly level: RiskLevel;
  readonly category: SafetyCategory;
  readonly action: SafetyAction;
  /** Which rule tiers matched, for evaluation and debugging. Never shown. */
  readonly signals: readonly string[];
  readonly classifierVersion: string;
}

export const SAFETY_RULES_VERSION = "1.0.0";

/**
 * The decision used whenever safety infrastructure fails. It is deliberately
 * not "no risk": an outage must never read as safety.
 */
export const CONSERVATIVE_FALLBACK: SafetyDecision = Object.freeze({
  level: RiskLevel.ELEVATED,
  category: "other_high_risk",
  action: "restrict",
  signals: Object.freeze(["infra_fallback"]) as readonly string[],
  classifierVersion: SAFETY_RULES_VERSION,
});

/** The action implied by a level, before any rule raises it further. */
export function actionForLevel(level: RiskLevel): SafetyAction {
  if (level >= RiskLevel.HIGH) return "redirect";
  if (level === RiskLevel.ELEVATED) return "restrict";
  return "continue";
}

/** Actions are ordered too: a merge may only move toward "redirect". */
const ACTION_RANK: Record<SafetyAction, number> = { continue: 0, restrict: 1, redirect: 2 };

export function strongerAction(a: SafetyAction, b: SafetyAction): SafetyAction {
  return ACTION_RANK[a] >= ACTION_RANK[b] ? a : b;
}

export function routeFor(decision: SafetyDecision): SafetyRoute {
  if (decision.action === "redirect") return "safety";
  if (decision.action === "restrict") return "restricted";
  return "normal";
}

/** True when ordinary generation must be bypassed entirely. */
export function blocksGeneration(decision: SafetyDecision): boolean {
  return decision.action === "redirect";
}

export function makeDecision(input: {
  level: RiskLevel;
  category: SafetyCategory;
  action?: SafetyAction;
  signals?: readonly string[];
  classifierVersion?: string;
}): SafetyDecision {
  const level = input.level;
  // A category of "none" is only coherent below the elevated threshold.
  const category =
    input.category === "none" && level >= RiskLevel.ELEVATED ? "other_high_risk" : input.category;
  // An explicitly supplied action may raise the implied one, never lower it.
  const action = strongerAction(actionForLevel(level), input.action ?? "continue");
  return Object.freeze({
    level,
    category,
    action,
    signals: Object.freeze([...(input.signals ?? [])]),
    classifierVersion: input.classifierVersion ?? SAFETY_RULES_VERSION,
  });
}
