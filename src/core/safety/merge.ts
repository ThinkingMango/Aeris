/**
 * Combines the deterministic floor with the classifier's reading.
 *
 * The only rule that matters: **a floor may be raised, never lowered.** Every
 * other behaviour in this file follows from it.
 */
import type { DeterministicResult } from "./deterministic";
import {
  RiskLevel,
  SAFETY_RULES_VERSION,
  actionForLevel,
  makeDecision,
  strongerAction,
  type SafetyCategory,
  type SafetyDecision,
} from "./risk";

/** What a classifier is allowed to report. */
export interface ClassifierReading {
  readonly level: RiskLevel;
  readonly category: SafetyCategory;
  /** Raises the level to IMMEDIATE when true. Never lowers it. */
  readonly immediateDanger: boolean;
  /** Guarantees at least a restricting action. Never relaxes one. */
  readonly needsRestriction: boolean;
  readonly version: string;
}

/** Normalises a classifier reading into a decision, applying its own flags. */
export function fromClassifier(reading: ClassifierReading): SafetyDecision {
  const level: RiskLevel = reading.immediateDanger ? RiskLevel.IMMEDIATE : reading.level;
  const action = reading.needsRestriction
    ? strongerAction(actionForLevel(level), "restrict")
    : actionForLevel(level);
  return makeDecision({
    level,
    category: reading.category,
    action,
    signals: ["classifier"],
    classifierVersion: reading.version,
  });
}

/**
 * Merges floor and classifier.
 *
 * `classifier` is null when the classifier could not run. In that case the
 * floor stands on its own, and the caller is responsible for treating the
 * absence as degraded infrastructure rather than as reassurance.
 */
export function merge(
  deterministic: DeterministicResult,
  classifier: SafetyDecision | null,
): SafetyDecision {
  const floor = deterministic.floor;

  if (floor === null && classifier === null) {
    // Nothing literal matched and nothing classified it. The caller decides
    // whether this is an ordinary turn or a degraded one; on its own it is
    // simply the absence of any signal.
    return makeDecision({
      level: RiskLevel.NONE,
      category: "none",
      signals: deterministic.signals,
      classifierVersion: SAFETY_RULES_VERSION,
    });
  }

  if (classifier === null) {
    // floor is non-null here.
    const f = floor as NonNullable<typeof floor>;
    return makeDecision({
      level: f.level,
      category: f.category,
      signals: [...deterministic.signals, "classifier_unavailable"],
      classifierVersion: SAFETY_RULES_VERSION,
    });
  }

  if (floor === null) {
    return makeDecision({
      level: classifier.level,
      category: classifier.category,
      action: classifier.action,
      signals: [...deterministic.signals, ...classifier.signals],
      classifierVersion: classifier.classifierVersion,
    });
  }

  const level = (Math.max(floor.level, classifier.level) as RiskLevel);
  // The category comes from whichever side set the level. A tie keeps the
  // deterministic reading, which is the more literal of the two.
  const category: SafetyCategory =
    floor.level >= classifier.level ? floor.category : classifier.category;

  return makeDecision({
    level,
    category,
    action: strongerAction(actionForLevel(level), classifier.action),
    signals: [...deterministic.signals, ...classifier.signals],
    classifierVersion: classifier.classifierVersion,
  });
}
