/**
 * How much weight an observation has earned, and how to say it.
 *
 * A single inference is never a fact about a person. A pattern is only
 * mentioned once it has appeared in more than one confirmed session, and even
 * then it is worded as an observation rather than a cause. Raw model
 * confidence is internal and is never displayed.
 */
import { PATTERN_LABELS, type Pattern } from "./taxonomy";

export const EVIDENCE_THRESHOLDS = Object.freeze({
  /** Below this, nothing is shown as a personal pattern at all. */
  possible: 2,
  emerging: 3,
  recurring: 5,
});

export const STRENGTHS = ["insufficient", "possible", "emerging", "recurring"] as const;
export type Strength = (typeof STRENGTHS)[number];

export function strengthFor(evidenceCount: number): Strength {
  const count = Number.isFinite(evidenceCount) ? Math.floor(evidenceCount) : 0;
  if (count >= EVIDENCE_THRESHOLDS.recurring) return "recurring";
  if (count >= EVIDENCE_THRESHOLDS.emerging) return "emerging";
  if (count >= EVIDENCE_THRESHOLDS.possible) return "possible";
  return "insufficient";
}

/** A thinly evidenced or user-hidden pattern is never presented. */
export function isDisplayable(evidenceCount: number, hiddenByUser = false): boolean {
  return !hiddenByUser && strengthFor(evidenceCount) !== "insufficient";
}

export const STRENGTH_LABELS: Readonly<Record<Exclude<Strength, "insufficient">, string>> =
  Object.freeze({
    possible: "Possible",
    emerging: "Emerging",
    recurring: "Recurring",
  });

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Tentative, non-causal phrasing. Returns null when the evidence is too thin
 * to say anything at all, which is the common case early on and is fine.
 */
export function phraseFor(pattern: Pattern, evidenceCount: number): string | null {
  if (pattern === "unknown") return null;
  const label = lowerFirst(PATTERN_LABELS[pattern]);
  switch (strengthFor(evidenceCount)) {
    case "possible":
      return `This might be a pattern for you: ${label}.`;
    case "emerging":
      return `${PATTERN_LABELS[pattern]} has come up in more than one session.`;
    case "recurring":
      return `${PATTERN_LABELS[pattern]} comes up often for you.`;
    case "insufficient":
      return null;
  }
}
