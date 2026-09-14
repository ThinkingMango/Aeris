/**
 * The anxiety map.
 *
 * Every section states the threshold it needs and refuses to render until the
 * data actually supports it. An insight drawn from three sessions is noise
 * dressed as self-knowledge, and a product that shows it teaches people to
 * distrust the ones that are real.
 *
 * Pure: rows in, sections out. No clock beyond what the caller passes.
 */
import {
  hasPersonalEvidence,
  summariseEffectiveness,
  type Effectiveness,
  type RunRecord,
} from "../interventions/ranking";
import { INTERVENTIONS, type InterventionSlug } from "../interventions/catalog";
import { isDisplayable, phraseFor, strengthFor, type Strength } from "../patterns/evidence";
import { PATTERN_LABELS, TRIGGER_LABELS, isPattern, isTrigger, type Pattern, type Trigger } from "../patterns/taxonomy";
import { summariseUrges, URGE_TARGET_LABELS, type UrgeRecord } from "../urges/index";

export const THRESHOLDS = Object.freeze({
  timeOfDay: { minSessions: 6, dominantShare: 0.4 },
  dayOfWeek: { minSessions: 8, dominantShare: 0.3 },
  triggers: { minSessions: 4, topN: 3 },
  whatHelps: { minRuns: 2 },
  urges: { minUrges: 3 },
  intensityTrend: { minWeeks: 3 },
});

export interface SessionRow {
  readonly localHour: number | null;
  readonly localDow: number | null;
  readonly trigger: string | null;
  readonly intensityBefore: number | null;
  readonly startedAt: Date;
}

export interface UserPatternRow {
  readonly pattern: string;
  readonly evidenceCount: number;
  readonly hiddenByUser: boolean;
}

export interface InsightsInput {
  readonly sessions: readonly SessionRow[];
  readonly patterns: readonly UserPatternRow[];
  readonly runs: readonly RunRecord[];
  readonly urges: readonly UrgeRecord[];
}

export interface Section<T> {
  readonly available: boolean;
  /** Plain sentence naming what has to happen. Rendered in the empty state. */
  readonly reason: string | null;
  readonly items: readonly T[];
}

const unavailable = <T>(reason: string): Section<T> =>
  Object.freeze({ available: false, reason, items: Object.freeze([]) as readonly T[] });

const available = <T>(items: readonly T[]): Section<T> =>
  Object.freeze({ available: true, reason: null, items: Object.freeze(items) });

/* ---------------------------- time of day ---------------------------- */

export const TIME_BUCKETS = ["night", "morning", "afternoon", "evening"] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

export const TIME_BUCKET_LABELS: Readonly<Record<TimeBucket, string>> = Object.freeze({
  night: "late at night",
  morning: "in the morning",
  afternoon: "in the afternoon",
  evening: "in the evening",
});

export function bucketForHour(hour: number): TimeBucket {
  if (hour >= 23 || hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export interface TimeOfDayItem {
  readonly bucket: TimeBucket;
  readonly count: number;
  readonly phrase: string;
}

function timeOfDay(sessions: readonly SessionRow[]): Section<TimeOfDayItem> {
  const hours = sessions
    .map((session) => session.localHour)
    .filter((hour): hour is number => hour !== null);

  if (hours.length < THRESHOLDS.timeOfDay.minSessions) {
    return unavailable(
      `Shows after ${THRESHOLDS.timeOfDay.minSessions} sessions. You have ${hours.length}.`,
    );
  }

  const counts = new Map<TimeBucket, number>();
  for (const hour of hours) {
    const bucket = bucketForHour(hour);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  /* c8 ignore next */
  if (top === undefined) return unavailable("Not enough sessions yet.");

  if (top[1] / hours.length < THRESHOLDS.timeOfDay.dominantShare) {
    return unavailable("Your sessions are spread fairly evenly through the day so far.");
  }

  return available([
    {
      bucket: top[0],
      count: top[1],
      phrase: `Anxiety tends to come up for you ${TIME_BUCKET_LABELS[top[0]]}.`,
    },
  ]);
}

/* ---------------------------- day of week ---------------------------- */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface DayOfWeekItem {
  readonly dow: number;
  readonly count: number;
  readonly phrase: string;
}

function dayOfWeek(sessions: readonly SessionRow[]): Section<DayOfWeekItem> {
  const days = sessions
    .map((session) => session.localDow)
    .filter((dow): dow is number => dow !== null && dow >= 0 && dow <= 6);

  if (days.length < THRESHOLDS.dayOfWeek.minSessions) {
    return unavailable(
      `Shows after ${THRESHOLDS.dayOfWeek.minSessions} sessions. You have ${days.length}.`,
    );
  }

  const counts = new Map<number, number>();
  for (const dow of days) counts.set(dow, (counts.get(dow) ?? 0) + 1);

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  /* c8 ignore next */
  if (top === undefined) return unavailable("Not enough sessions yet.");

  if (top[1] / days.length < THRESHOLDS.dayOfWeek.dominantShare) {
    return unavailable("No single day stands out yet.");
  }

  return available([
    {
      dow: top[0],
      count: top[1],
      phrase: `${DAY_NAMES[top[0]] ?? "That day"}s come up more often than other days.`,
    },
  ]);
}

/* ------------------------------ triggers ----------------------------- */

export interface TriggerItem {
  readonly trigger: Trigger;
  readonly label: string;
  readonly count: number;
}

function triggers(sessions: readonly SessionRow[]): Section<TriggerItem> {
  const values = sessions
    .map((session) => session.trigger)
    .filter((value): value is Trigger => isTrigger(value) && value !== "unknown");

  if (sessions.length < THRESHOLDS.triggers.minSessions) {
    return unavailable(
      `Shows after ${THRESHOLDS.triggers.minSessions} sessions. You have ${sessions.length}.`,
    );
  }
  if (values.length === 0) return unavailable("Nothing has come up often enough to name yet.");

  const counts = new Map<Trigger, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  return available(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, THRESHOLDS.triggers.topN)
      .map(([trigger, count]) => ({ trigger, label: TRIGGER_LABELS[trigger], count })),
  );
}

/* ------------------------------ patterns ----------------------------- */

export interface PatternItem {
  readonly pattern: Pattern;
  readonly label: string;
  readonly strength: Strength;
  readonly phrase: string;
}

function patterns(rows: readonly UserPatternRow[]): Section<PatternItem> {
  const items: PatternItem[] = [];
  for (const row of rows) {
    if (!isPattern(row.pattern) || row.pattern === "unknown") continue;
    if (!isDisplayable(row.evidenceCount, row.hiddenByUser)) continue;
    const phrase = phraseFor(row.pattern, row.evidenceCount);
    if (phrase === null) continue;
    items.push({
      pattern: row.pattern,
      label: PATTERN_LABELS[row.pattern],
      strength: strengthFor(row.evidenceCount),
      phrase,
    });
  }

  if (items.length === 0) {
    return unavailable("Patterns appear once something has come up in more than one session.");
  }
  return available(items);
}

/* ----------------------------- what helps ---------------------------- */

export interface WhatHelpsItem {
  readonly intervention: InterventionSlug;
  readonly title: string;
  readonly completedRuns: number;
  readonly meanIntensityChange: number | null;
  readonly strong: boolean;
  readonly phrase: string;
}

function whatHelps(runs: readonly RunRecord[]): Section<WhatHelpsItem> {
  const rows: readonly Effectiveness[] = summariseEffectiveness(runs).filter(
    (row) => row.completedRuns >= THRESHOLDS.whatHelps.minRuns,
  );

  if (rows.length === 0) {
    return unavailable(
      `Shows once you have tried the same exercise ${THRESHOLDS.whatHelps.minRuns} times.`,
    );
  }

  return available(
    rows.map((row) => {
      const change = row.meanIntensityChange;
      const phrase =
        change === null
          ? `You have used ${INTERVENTIONS[row.intervention].title.toLowerCase()} a few times.`
          : change <= -1
            ? `${INTERVENTIONS[row.intervention].title} usually brings the intensity down a little for you.`
            : `${INTERVENTIONS[row.intervention].title} has not shifted much for you so far.`;
      return {
        intervention: row.intervention,
        title: INTERVENTIONS[row.intervention].title,
        completedRuns: row.completedRuns,
        meanIntensityChange: change,
        strong: hasPersonalEvidence(row),
        phrase,
      };
    }),
  );
}

/* -------------------------------- urges ------------------------------ */

export interface UrgeItem {
  readonly label: string;
  readonly value: string;
  readonly phrase: string;
}

function urges(records: readonly UrgeRecord[]): Section<UrgeItem> {
  if (records.length < THRESHOLDS.urges.minUrges) {
    return unavailable(
      `Shows after ${THRESHOLDS.urges.minUrges} times you tell Aeris you want to check.`,
    );
  }

  const stats = summariseUrges(records);
  const items: UrgeItem[] = [
    {
      label: "Urges noticed",
      value: String(stats.total),
      phrase: `You have noticed the urge ${stats.total} times.`,
    },
  ];

  if (stats.resistRate !== null) {
    items.push({
      label: "Waited it out",
      value: `${stats.resisted} of ${stats.resisted + (stats.withDelay - stats.resisted)}`,
      phrase: `You waited it out ${Math.round(stats.resistRate * 100)}% of the times you tried.`,
    });
  }
  if (stats.meanDelayAchieved !== null) {
    items.push({
      label: "Average wait",
      value: `${stats.meanDelayAchieved} min`,
      phrase: `When you wait, it averages about ${stats.meanDelayAchieved} minutes.`,
    });
  }
  const top = stats.byTarget[0];
  if (top !== undefined) {
    items.push({
      label: "Most common",
      value: URGE_TARGET_LABELS[top.target],
      phrase: `${URGE_TARGET_LABELS[top.target]} is the one that comes up most.`,
    });
  }

  return available(items);
}

/* --------------------------- intensity trend ------------------------- */

export interface IntensityWeek {
  readonly weekStart: string;
  readonly mean: number;
  readonly sessions: number;
}

function isoWeekStart(date: Date): string {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const diff = (day + 6) % 7; // Monday-based
  copy.setUTCDate(copy.getUTCDate() - diff);
  return copy.toISOString().slice(0, 10);
}

function intensityTrend(sessions: readonly SessionRow[]): Section<IntensityWeek> {
  const withIntensity = sessions.filter(
    (session): session is SessionRow & { intensityBefore: number } =>
      session.intensityBefore !== null,
  );

  const buckets = new Map<string, number[]>();
  for (const session of withIntensity) {
    const key = isoWeekStart(session.startedAt);
    const list = buckets.get(key) ?? [];
    list.push(session.intensityBefore);
    buckets.set(key, list);
  }

  if (buckets.size < THRESHOLDS.intensityTrend.minWeeks) {
    return unavailable(
      `Shows after ${THRESHOLDS.intensityTrend.minWeeks} weeks with sessions. You have ${buckets.size}.`,
    );
  }

  return available(
    [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStart, values]) => ({
        weekStart,
        mean: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
        sessions: values.length,
      })),
  );
}

/* ------------------------------ assembly ----------------------------- */

export interface Insights {
  readonly timeOfDay: Section<TimeOfDayItem>;
  readonly dayOfWeek: Section<DayOfWeekItem>;
  readonly triggers: Section<TriggerItem>;
  readonly patterns: Section<PatternItem>;
  readonly whatHelps: Section<WhatHelpsItem>;
  readonly urges: Section<UrgeItem>;
  readonly intensityTrend: Section<IntensityWeek>;
  /** True when at least one section has something to say. */
  readonly anyAvailable: boolean;
}

export function computeInsights(input: InsightsInput): Insights {
  const sections = {
    timeOfDay: timeOfDay(input.sessions),
    dayOfWeek: dayOfWeek(input.sessions),
    triggers: triggers(input.sessions),
    patterns: patterns(input.patterns),
    whatHelps: whatHelps(input.runs),
    urges: urges(input.urges),
    intensityTrend: intensityTrend(input.sessions),
  };

  return Object.freeze({
    ...sections,
    anyAvailable: Object.values(sections).some((section) => section.available),
  });
}
