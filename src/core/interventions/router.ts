/**
 * Which exercises are permissible for a given reading of the situation.
 *
 * Deterministic. The model is handed this list and may pick from it; anything
 * it names outside the list is discarded by the server. That is the mechanism
 * that stops a model inventing an exercise or reaching for one that does not
 * belong in a self-help product.
 *
 * Deliberately excluded, whatever the pattern: exposure and interoceptive
 * exposure, trauma processing, anything involving medication, and any
 * diagnostic instrument.
 */
import { isPattern, type Pattern } from "../patterns/taxonomy";
import { INTERVENTION_SLUGS, type InterventionSlug } from "./catalog";

/** Every pattern maps to at least one exercise. The map is exhaustive. */
export const PATTERN_ROUTES: Readonly<Record<Pattern, readonly InterventionSlug[]>> = Object.freeze(
  {
    catastrophizing: ["untangle_thought", "sit_with_not_knowing"],
    rumination: ["grounding", "worry_postponement", "next_step"],
    intolerance_of_uncertainty: ["sit_with_not_knowing", "control_circle"],
    reassurance_seeking: ["delay_the_check", "sit_with_not_knowing"],
    checking_compulsion: ["delay_the_check", "sit_with_not_knowing"],
    mind_reading: ["untangle_thought"],
    fear_of_failure: ["untangle_thought", "next_step"],
    social_evaluation: ["untangle_thought", "grounding"],
    physical_arousal: ["physiological_sigh", "slow_breathing", "grounding"],
    avoidance: ["next_step"],
    decision_paralysis: ["next_step", "control_circle"],
    sleep_worry: ["wind_down", "worry_postponement", "grounding"],
    self_criticism: ["untangle_thought"],
    general_overwhelm: ["physiological_sigh", "grounding", "next_step"],
    unknown: ["grounding", "next_step"],
  },
);

export interface RoutingContext {
  /** Local hour 0–23, when known. Late-night sessions bias toward winding down. */
  readonly localHour?: number;
}

const NIGHT_START = 22;
const NIGHT_END = 5;

function isNight(hour: number | undefined): boolean {
  if (hour === undefined || !Number.isInteger(hour) || hour < 0 || hour > 23) return false;
  return hour >= NIGHT_START || hour < NIGHT_END;
}

/**
 * The de-duplicated, canonically ordered set of exercises allowed this turn.
 *
 * Unrecognised strings are ignored rather than rejected, so a model cannot
 * widen the set by inventing a pattern name. With no recognised pattern at
 * all, the safest general set is used.
 */
export function allowedInterventions(
  patterns: readonly string[],
  context: RoutingContext = {},
): readonly InterventionSlug[] {
  const recognised = patterns.filter((value): value is Pattern => isPattern(value));
  const source: readonly Pattern[] = recognised.length > 0 ? recognised : ["unknown"];

  const allowed = new Set<InterventionSlug>();
  for (const pattern of source) {
    for (const slug of PATTERN_ROUTES[pattern]) allowed.add(slug);
  }

  // Late at night, putting the day down is almost always available and almost
  // always the more useful offer.
  if (isNight(context.localHour)) allowed.add("wind_down");

  // Canonical order keeps the interface and the tests predictable.
  return INTERVENTION_SLUGS.filter((slug) => allowed.has(slug));
}

/** True when a model's recommendation is both real and permitted this turn. */
export function isAllowed(
  candidate: string,
  allowed: readonly InterventionSlug[],
): candidate is InterventionSlug {
  return (allowed as readonly string[]).includes(candidate);
}
