/**
 * The safety gate.
 *
 * Every turn passes through here after the person's message is stored and
 * before any ordinary generation happens. What it decides is final: the
 * conversational model is never asked about it and can never soften it.
 *
 * I/O is injected, so the whole gate is testable without a network.
 */
import { evaluateDeterministic, isSelfSufficient } from "./deterministic";
import { fromClassifier, merge, type ClassifierReading } from "./merge";
import {
  RiskLevel,
  blocksGeneration as decisionBlocks,
  makeDecision,
  routeFor,
  type SafetyDecision,
  type SafetyRoute,
} from "./risk";

export * from "./risk";
export * from "./lexicon";
export * from "./deterministic";
export * from "./merge";
export * from "./output-guards";

/**
 * Which body of reviewed copy answers this turn instead of the model.
 *
 * Every one of these is a place where an improvised reply is worse than a
 * fixed one, so the model is not consulted at all.
 */
export const COPY_ROUTES = [
  "crisis",
  "medication",
  "reality_sensitive",
  "violence_abuse",
  "relational",
  "constrained",
] as const;

export type CopyRoute = (typeof COPY_ROUTES)[number];

export interface SafetyGateResult {
  readonly decision: SafetyDecision;
  readonly route: SafetyRoute;
  /** Non-null when reviewed copy must answer rather than the model. */
  readonly copyRoute: CopyRoute | null;
  /** True when ordinary generation is bypassed entirely. */
  readonly blocksGeneration: boolean;
  /** True when generation may continue but advice must narrow. */
  readonly restricted: boolean;
  /** True when the classifier could not be consulted. */
  readonly infraFailure: boolean;
  /** True when the classifier was skipped because the floor was sufficient. */
  readonly classifierSkipped: boolean;
}

/**
 * Injected classifier. Returning `null` means "could not run" — which is
 * treated as degraded infrastructure, never as an absence of risk.
 */
export type Classify = (message: string) => Promise<ClassifierReading | null>;

function copyRouteFor(
  decision: SafetyDecision,
  options: { relationalBid: boolean; constrained: boolean },
): CopyRoute | null {
  if (decisionBlocks(decision)) return "crisis";
  if (decision.category === "medication" && decision.level >= RiskLevel.ELEVATED) {
    return "medication";
  }
  if (decision.category === "reality_sensitive") return "reality_sensitive";
  if (decision.category === "harm_to_others" || decision.category === "abuse") {
    return "violence_abuse";
  }
  if (options.relationalBid) return "relational";
  if (options.constrained) return "constrained";
  return null;
}

export async function runSafetyGate(
  message: string,
  classify: Classify,
): Promise<SafetyGateResult> {
  const deterministic = evaluateDeterministic(message);

  // Literal, undenied language at the redirect threshold. There is nothing a
  // classifier could add that would be allowed to lower it, so the message is
  // not sent anywhere else.
  if (isSelfSufficient(deterministic)) {
    const floor = deterministic.floor as NonNullable<typeof deterministic.floor>;
    const decision = makeDecision({
      level: floor.level,
      category: floor.category,
      signals: deterministic.signals,
    });
    return Object.freeze({
      decision,
      route: routeFor(decision),
      copyRoute: copyRouteFor(decision, {
        relationalBid: deterministic.relationalBid,
        constrained: false,
      }),
      blocksGeneration: true,
      restricted: false,
      infraFailure: false,
      classifierSkipped: true,
    });
  }

  let reading: ClassifierReading | null = null;
  let infraFailure = false;
  try {
    reading = await classify(message);
    if (reading === null) infraFailure = true;
  } catch {
    // A classifier outage never reads as "no risk".
    reading = null;
    infraFailure = true;
  }

  const decision = merge(deterministic, reading === null ? null : fromClassifier(reading));
  const blocks = decisionBlocks(decision);

  // Nothing literal matched and the classifier could not run. Rather than let
  // the model generate unsupervised while safety cover is missing, the app
  // answers from constrained copy.
  const constrained = infraFailure && deterministic.floor === null && !blocks;

  return Object.freeze({
    decision,
    route: routeFor(decision),
    copyRoute: copyRouteFor(decision, {
      relationalBid: deterministic.relationalBid,
      constrained,
    }),
    blocksGeneration: blocks,
    restricted: !blocks && decision.action === "restrict",
    infraFailure,
    classifierSkipped: false,
  });
}
