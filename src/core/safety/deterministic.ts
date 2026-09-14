/**
 * Evaluates the deterministic tiers against one message.
 *
 * Produces a **floor**: the minimum risk this turn may be treated as. It never
 * produces a ceiling, and it never concludes "no risk" — an empty result means
 * "nothing literal matched", which is a different statement.
 */
import {
  DENIAL_PATTERNS,
  RELATIONAL_BID_PATTERNS,
  SAFETY_RULES,
  normalize,
  type LexicalRule,
} from "./lexicon";
import { RiskLevel, type Certainty, type SafetyCategory } from "./risk";

export interface DeterministicResult {
  /** Null when nothing matched. Not the same as a decision of level 0. */
  readonly floor: {
    readonly level: RiskLevel;
    readonly category: SafetyCategory;
  } | null;
  /**
   * `high` only when a high-certainty rule matched and no denial or distancing
   * language was present. A `high` floor at level 3 or above means the
   * classifier is not consulted at all.
   */
  readonly certainty: Certainty | null;
  /** Rule ids that matched. Safe to log: they contain no message text. */
  readonly signals: readonly string[];
  /** True when denial or distancing language was present alongside a match. */
  readonly denialPresent: boolean;
  /** True when the person is addressing the product as a relationship. */
  readonly relationalBid: boolean;
}

const EMPTY: DeterministicResult = Object.freeze({
  floor: null,
  certainty: null,
  signals: Object.freeze([]) as readonly string[],
  denialPresent: false,
  relationalBid: false,
});

function matches(normalized: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(normalized));
}

/**
 * Picks the winning rule: highest level first, then earliest in
 * `SAFETY_RULES`, which is ordered most severe first.
 */
function strongest(hits: readonly LexicalRule[]): LexicalRule | null {
  let best: LexicalRule | null = null;
  for (const hit of hits) {
    if (best === null || hit.level > best.level) best = hit;
  }
  return best;
}

export function evaluateDeterministic(message: string): DeterministicResult {
  const normalized = normalize(message);
  if (normalized.length === 0) return EMPTY;

  const relationalBid = matches(normalized, RELATIONAL_BID_PATTERNS);
  const hits = SAFETY_RULES.filter((rule) => rule.pattern.test(normalized));

  if (hits.length === 0) {
    return Object.freeze({
      floor: null,
      certainty: null,
      signals: Object.freeze([]) as readonly string[],
      denialPresent: false,
      relationalBid,
    });
  }

  const denialPresent = matches(normalized, DENIAL_PATTERNS);
  const winner = strongest(hits);
  // `hits` is non-empty, so `strongest` cannot return null here.
  /* c8 ignore next */
  if (winner === null) return EMPTY;

  // Denial never lowers the floor. It lowers confidence, which routes the turn
  // to the classifier instead of redirecting on the phrase alone.
  const certainty: Certainty = denialPresent ? "medium" : winner.certainty;

  return Object.freeze({
    floor: Object.freeze({ level: winner.level, category: winner.category }),
    certainty,
    signals: Object.freeze(hits.map((hit) => hit.id)),
    denialPresent,
    relationalBid,
  });
}

/**
 * True when the deterministic layer is confident enough to decide alone.
 *
 * Only literal, undenied language at the redirect threshold qualifies. Anything
 * else goes to the classifier, which may raise the level but never lower it.
 */
export function isSelfSufficient(result: DeterministicResult): boolean {
  return (
    result.floor !== null &&
    result.certainty === "high" &&
    result.floor.level >= RiskLevel.HIGH
  );
}
