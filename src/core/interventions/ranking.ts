/**
 * Ordering the allowed exercises by what has actually helped this person.
 *
 * This is the difference between "an app that suggests breathing" and "an app
 * that learned breathing does nothing for you but walking does". It is pure
 * arithmetic over completed runs; nothing here decides what is allowed, only
 * what order the allowed set is offered in.
 */
import type { InterventionSlug } from "./catalog";

/** Below this many completed runs, an exercise has no personal track record. */
export const MIN_RUNS_FOR_EVIDENCE = 2;

/** A drop of at least this many intensity points counts as "this helped you". */
export const MEANINGFUL_DROP = 2;

export type HelpfulnessTrend = "often" | "sometimes" | "rarely" | "unknown";

export interface Effectiveness {
  readonly intervention: InterventionSlug;
  readonly completedRuns: number;
  /** Mean of (after − before). Negative means intensity came down. */
  readonly meanIntensityChange: number | null;
  readonly helpfulness: HelpfulnessTrend;
}

export interface RunRecord {
  readonly intervention: InterventionSlug;
  readonly completed: boolean;
  readonly intensityBefore: number | null;
  readonly intensityAfter: number | null;
  /** 1 = not really, 2 = somewhat, 3 = very. */
  readonly helpfulness: number | null;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

function trendFor(ratings: readonly number[]): HelpfulnessTrend {
  if (ratings.length === 0) return "unknown";
  const mean = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  if (mean >= 2.5) return "often";
  if (mean >= 1.8) return "sometimes";
  return "rarely";
}

/** Folds raw runs into one row per exercise. Incomplete runs are ignored. */
export function summariseEffectiveness(runs: readonly RunRecord[]): readonly Effectiveness[] {
  const buckets = new Map<
    InterventionSlug,
    { completed: number; changes: number[]; ratings: number[] }
  >();

  for (const run of runs) {
    if (!run.completed) continue;
    const bucket = buckets.get(run.intervention) ?? { completed: 0, changes: [], ratings: [] };
    bucket.completed += 1;
    if (run.intensityBefore !== null && run.intensityAfter !== null) {
      bucket.changes.push(run.intensityAfter - run.intensityBefore);
    }
    if (run.helpfulness !== null) bucket.ratings.push(run.helpfulness);
    buckets.set(run.intervention, bucket);
  }

  return [...buckets.entries()]
    .map(([intervention, bucket]) => ({
      intervention,
      completedRuns: bucket.completed,
      meanIntensityChange:
        bucket.changes.length === 0
          ? null
          : round2(bucket.changes.reduce((sum, value) => sum + value, 0) / bucket.changes.length),
      helpfulness: trendFor(bucket.ratings),
    }))
    .sort((a, b) => b.completedRuns - a.completedRuns);
}

const HELPFULNESS_POINTS: Readonly<Record<HelpfulnessTrend, number>> = Object.freeze({
  often: 2,
  sometimes: 1,
  rarely: -1,
  unknown: 0,
});

export function scoreFor(effectiveness: Effectiveness): number {
  const drop = effectiveness.meanIntensityChange === null ? 0 : -effectiveness.meanIntensityChange;
  return drop * 2 + HELPFULNESS_POINTS[effectiveness.helpfulness];
}

/**
 * Reorders the allowed set so that what has helped this person comes first.
 *
 * Three tiers, in order:
 *
 *  1. Exercises with a track record of helping.
 *  2. Exercises not yet tried enough to judge, in canonical order.
 *  3. Exercises that have a track record of *not* helping this person.
 *
 * The third tier is the point. Something measured to do nothing for someone
 * must not be offered ahead of something they have never tried — that is how
 * a personalisation engine ends up worse than no personalisation at all.
 */
export function rankInterventions(
  allowed: readonly InterventionSlug[],
  effectiveness: readonly Effectiveness[],
): readonly InterventionSlug[] {
  const bySlug = new Map(effectiveness.map((row) => [row.intervention, row]));

  const helping: { slug: InterventionSlug; score: number; index: number }[] = [];
  const untried: InterventionSlug[] = [];
  const notHelping: { slug: InterventionSlug; score: number; index: number }[] = [];

  allowed.forEach((slug, index) => {
    const row = bySlug.get(slug);
    if (row === undefined || row.completedRuns < MIN_RUNS_FOR_EVIDENCE) {
      untried.push(slug);
      return;
    }
    const score = scoreFor(row);
    (score > 0 ? helping : notHelping).push({ slug, score, index });
  });

  const byScore = (
    a: { score: number; index: number },
    b: { score: number; index: number },
  ): number => b.score - a.score || a.index - b.index;

  helping.sort(byScore);
  notHelping.sort(byScore);

  return [
    ...helping.map((entry) => entry.slug),
    ...untried,
    ...notHelping.map((entry) => entry.slug),
  ];
}

/**
 * Whether the interface may say "this has helped you before".
 *
 * The bar is deliberately high: a claim about someone's own history is worse
 * than no claim when it is wrong.
 */
export function hasPersonalEvidence(effectiveness: Effectiveness | undefined): boolean {
  if (effectiveness === undefined) return false;
  if (effectiveness.completedRuns < MIN_RUNS_FOR_EVIDENCE) return false;
  if (effectiveness.meanIntensityChange === null) return false;
  return effectiveness.meanIntensityChange <= -MEANINGFUL_DROP;
}
