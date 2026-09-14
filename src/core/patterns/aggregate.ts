/**
 * Turning one session's provisional observations into long-term evidence.
 *
 * Conservative by construction:
 *  - one session contributes at most one piece of evidence per pattern;
 *  - `unknown` and low-confidence candidates contribute nothing;
 *  - a pattern the person marked "not true for me" stays hidden and gains no
 *    further evidence, ever.
 *
 * Pure: it returns a plan, it does not write anything.
 */
import { isPattern, type Pattern } from "./taxonomy";

/** Minimum per-session confidence before a candidate counts as evidence. */
export const MIN_CONFIDENCE = 0.5;

export interface SessionCandidate {
  readonly pattern: string;
  readonly confidence: number;
}

export interface ExistingPattern {
  readonly id: string;
  readonly pattern: string;
  readonly evidenceCount: number;
  readonly confidence: number;
  readonly hiddenByUser: boolean;
}

export interface AggregationPlan {
  /** Existing rows that gain one more piece of evidence. */
  readonly increments: readonly {
    readonly id: string;
    readonly evidenceCount: number;
    readonly confidence: number;
  }[];
  /** Patterns seen for the first time. */
  readonly inserts: readonly {
    readonly pattern: Pattern;
    readonly confidence: number;
  }[];
  /** Candidates deliberately ignored, with the reason. Safe to log. */
  readonly skipped: readonly { readonly pattern: string; readonly reason: SkipReason }[];
}

export type SkipReason = "not_a_pattern" | "unknown_pattern" | "low_confidence" | "duplicate" | "hidden_by_user";

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

export function planAggregation(
  candidates: readonly SessionCandidate[],
  existing: readonly ExistingPattern[],
): AggregationPlan {
  const increments: { id: string; evidenceCount: number; confidence: number }[] = [];
  const inserts: { pattern: Pattern; confidence: number }[] = [];
  const skipped: { pattern: string; reason: SkipReason }[] = [];

  const byPattern = new Map(existing.map((row) => [row.pattern, row]));
  const seen = new Set<Pattern>();

  for (const candidate of candidates) {
    if (!isPattern(candidate.pattern)) {
      skipped.push({ pattern: candidate.pattern, reason: "not_a_pattern" });
      continue;
    }
    if (candidate.pattern === "unknown") {
      skipped.push({ pattern: candidate.pattern, reason: "unknown_pattern" });
      continue;
    }
    const confidence = clamp(candidate.confidence);
    if (confidence < MIN_CONFIDENCE) {
      skipped.push({ pattern: candidate.pattern, reason: "low_confidence" });
      continue;
    }
    // One session is one piece of evidence, however often it was inferred.
    if (seen.has(candidate.pattern)) {
      skipped.push({ pattern: candidate.pattern, reason: "duplicate" });
      continue;
    }
    seen.add(candidate.pattern);

    const row = byPattern.get(candidate.pattern);
    if (row === undefined) {
      inserts.push({ pattern: candidate.pattern, confidence });
      continue;
    }
    // Corrected by the person: keep it hidden and stop reinforcing it.
    if (row.hiddenByUser) {
      skipped.push({ pattern: candidate.pattern, reason: "hidden_by_user" });
      continue;
    }
    increments.push({
      id: row.id,
      evidenceCount: row.evidenceCount + 1,
      confidence: Math.max(clamp(row.confidence), confidence),
    });
  }

  return Object.freeze({
    increments: Object.freeze(increments),
    inserts: Object.freeze(inserts),
    skipped: Object.freeze(skipped),
  });
}
