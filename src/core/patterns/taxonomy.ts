/**
 * The fixed vocabularies the domain speaks.
 *
 * Two rules govern every label in this file:
 *
 *  1. Nothing here is a diagnosis. `catastrophizing` is an internal key; what
 *     a person reads is "jumping to the worst case". No clinical term ever
 *     reaches the interface.
 *  2. The keys are stored in the database, so adding is safe and renaming is a
 *     migration.
 */

/** What the worry is about. */
export const TRIGGERS = [
  "work",
  "relationship",
  "family",
  "social",
  "money",
  "health_worry",
  "sleep",
  "decision",
  "uncertainty",
  "future",
  "past_event",
  "body_sensation",
  "unknown",
] as const;

export type Trigger = (typeof TRIGGERS)[number];

export function isTrigger(value: unknown): value is Trigger {
  return typeof value === "string" && (TRIGGERS as readonly string[]).includes(value);
}

export const TRIGGER_LABELS: Readonly<Record<Trigger, string>> = Object.freeze({
  work: "Work",
  relationship: "A relationship",
  family: "Family",
  social: "Being around people",
  money: "Money",
  health_worry: "Health",
  sleep: "Sleep",
  decision: "A decision",
  uncertainty: "Not knowing",
  future: "The future",
  past_event: "Something that happened",
  body_sensation: "How your body feels",
  unknown: "Something hard to name",
});

/** What the mind is doing. */
export const PATTERNS = [
  "catastrophizing",
  "rumination",
  "intolerance_of_uncertainty",
  "reassurance_seeking",
  "checking_compulsion",
  "mind_reading",
  "fear_of_failure",
  "social_evaluation",
  "physical_arousal",
  "avoidance",
  "decision_paralysis",
  "sleep_worry",
  "self_criticism",
  "general_overwhelm",
  "unknown",
] as const;

export type Pattern = (typeof PATTERNS)[number];

export function isPattern(value: unknown): value is Pattern {
  return typeof value === "string" && (PATTERNS as readonly string[]).includes(value);
}

/**
 * Plain, non-clinical wording. These are the exact words a person sees, so
 * they are written to be recognisable rather than accurate-sounding.
 */
export const PATTERN_LABELS: Readonly<Record<Pattern, string>> = Object.freeze({
  catastrophizing: "Jumping to the worst case",
  rumination: "Going over it again and again",
  intolerance_of_uncertainty: "Needing to know for sure",
  reassurance_seeking: "Needing to be told it's fine",
  checking_compulsion: "Checking to make the feeling go",
  mind_reading: "Assuming what others think",
  fear_of_failure: "Worrying it will go wrong",
  social_evaluation: "Worrying how you came across",
  physical_arousal: "A body on high alert",
  avoidance: "Putting it off",
  decision_paralysis: "Stuck between options",
  sleep_worry: "Worry that follows you to bed",
  self_criticism: "Being hard on yourself",
  general_overwhelm: "Everything at once",
  unknown: "Hard to name yet",
});

/**
 * The patterns the reassurance wedge is built around. A session touching any
 * of these is eligible for urge capture and the delay tool.
 */
export const REASSURANCE_FAMILY: readonly Pattern[] = Object.freeze([
  "reassurance_seeking",
  "checking_compulsion",
  "intolerance_of_uncertainty",
]);

export function isReassuranceFamily(pattern: Pattern): boolean {
  return REASSURANCE_FAMILY.includes(pattern);
}

/** How the product should sound to this person. */
export const TONES = ["gentle", "balanced", "direct"] as const;
export type Tone = (typeof TONES)[number];
export const DEFAULT_TONE: Tone = "balanced";

export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && (TONES as readonly string[]).includes(value);
}

/** Intensity is always captured on the same scale. */
export const INTENSITY_MIN = 1;
export const INTENSITY_MAX = 10;

export function isIntensity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= INTENSITY_MIN &&
    value <= INTENSITY_MAX
  );
}
