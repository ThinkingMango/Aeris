/**
 * The wedge: urges to check, ask, search and re-read.
 *
 * This is the one place where a general chatbot's default behaviour — warm,
 * available, endlessly willing to reassure — is the thing making the person
 * worse. Everything in this module exists to notice the urge, name it without
 * shaming it, and offer a delay instead of an answer.
 *
 * Pure: detection is lexical, the ladder is arithmetic, the stats are a fold.
 */

/** What the person wants to do to make the feeling go away. */
export const URGE_TARGETS = [
  /** Search engines, symptom checkers, forums. */
  "search",
  /** Send another message and watch for the reply. */
  "message",
  /** Ask a person for reassurance. */
  "ask_person",
  /** Re-read a message, an email, a thread. */
  "reread",
  /** Check the body: pulse, a lump, a mole, the throat. */
  "body_check",
  /** Check someone's profile, story, last-seen. */
  "social_check",
  "other",
] as const;

export type UrgeTarget = (typeof URGE_TARGETS)[number];

export function isUrgeTarget(value: unknown): value is UrgeTarget {
  return typeof value === "string" && (URGE_TARGETS as readonly string[]).includes(value);
}

export const URGE_TARGET_LABELS: Readonly<Record<UrgeTarget, string>> = Object.freeze({
  search: "Searching",
  message: "Messaging again",
  ask_person: "Asking someone",
  reread: "Re-reading",
  body_check: "Checking your body",
  social_check: "Checking their profile",
  other: "Checking",
});

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Reassurance detection                                               */
/* ------------------------------------------------------------------ */

/** Unambiguous bids for reassurance. One is enough. */
const STRONG_REASSURANCE: readonly RegExp[] = Object.freeze([
  /\b(reassure me|tell me it'?s (ok|okay|fine|nothing)|tell me i'?m (ok|okay|fine|not))\b/,
  /\bpromise me\b/,
  /\bjust (tell|say) (me|it)\b/,
  // "Am I definitely not having a heart attack?" is the canonical health-anxiety
  // bid. The intensifier is the tell, whatever follows it.
  /\bam i (definitely|really|actually|certainly)\b/,
  /\bam i (not |going to |gonna )*(be )?(ok|okay|fine|alright|dying|ill|having|getting)\b/,
  /\bdo you think (i|it|this|they|he|she)\b/,
  /\bshould i be (worried|concerned|scared)\b/,
  /\bis (this|it) (serious|normal|bad|dangerous|cancer|a heart attack)\b/,
  /\b(can|could) you (just )?confirm\b/,
]);

/** Weaker signals. Two or more together count. */
const WEAK_REASSURANCE: readonly RegExp[] = Object.freeze([
  /\bwhat if\b/,
  /\bi keep (thinking|worrying|checking|googling|asking)\b/,
  /\b(worried|scared|terrified) (that|it|i|about)\b/,
  /\bkeeps? going round\b/,
  /\bi need to know\b/,
  /\bcan'?t stop (thinking|checking|googling|worrying)\b/,
  /\b(again|one more time|last time)\b/,
  /\bdo i have\b/,
]);

export interface ReassuranceReading {
  readonly seeking: boolean;
  /** Which signals fired. Safe to log: no message text. */
  readonly signals: readonly string[];
}

/**
 * Is this message asking to be told it is fine?
 *
 * A deliberately generous reading. A false positive costs a slightly firmer
 * reply; a false negative costs the product's whole reason to exist.
 */
export function detectReassuranceSeeking(message: string): ReassuranceReading {
  const text = normalize(message);
  const signals: string[] = [];

  STRONG_REASSURANCE.forEach((pattern, index) => {
    if (pattern.test(text)) signals.push(`strong:${index}`);
  });
  if (signals.length > 0) return Object.freeze({ seeking: true, signals: Object.freeze(signals) });

  WEAK_REASSURANCE.forEach((pattern, index) => {
    if (pattern.test(text)) signals.push(`weak:${index}`);
  });

  return Object.freeze({ seeking: signals.length >= 2, signals: Object.freeze(signals) });
}

/* ------------------------------------------------------------------ */
/* Urge target detection                                               */
/* ------------------------------------------------------------------ */

const TARGET_PATTERNS: readonly { readonly target: UrgeTarget; readonly pattern: RegExp }[] =
  Object.freeze([
    {
      target: "search",
      pattern: /\b(google|googling|search(ing)?|look(ed|ing)? it up|webmd|symptom checker|nhs website)\b/,
    },
    {
      target: "body_check",
      pattern:
        /\b(check|checking|feel|feeling|press|prod|prodding|look at)\b[^.]{0,20}\b(my )?(pulse|heart ?rate|lump|mole|chest|throat|neck|breathing|glands)\b/,
    },
    {
      target: "reread",
      pattern: /\b(re ?read|reading (it|the message|their message|the email) again|check the (message|email|thread))\b/,
    },
    {
      target: "social_check",
      pattern: /\b(check|checking|look(ing)? at)\b[^.]{0,20}\b(their|his|her)\b[^.]{0,15}\b(profile|instagram|story|stories|last seen|online)\b/,
    },
    {
      target: "message",
      pattern: /\b(text|message|messaging|dm|email|send)\b[^.]{0,20}\b(him|her|them|again|another)\b/,
    },
    {
      target: "ask_person",
      pattern: /\bask(ing)?\b[^.]{0,20}\b(him|her|them|my (mum|mom|dad|partner|husband|wife|friend|doctor|gp))\b/,
    },
  ]);

/** Best guess at what the person is about to do. Null when unclear. */
export function detectUrgeTarget(message: string): UrgeTarget | null {
  const text = normalize(message);
  for (const { target, pattern } of TARGET_PATTERNS) {
    if (pattern.test(text)) return target;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* The delay ladder                                                    */
/* ------------------------------------------------------------------ */

export const DELAY_RUNGS: readonly number[] = Object.freeze([10, 20, 30]);

export interface DelayOutcome {
  readonly minutes: number;
  /** True when the person made it to the end without checking. */
  readonly resisted: boolean;
  readonly at: Date;
}

/**
 * The next delay to offer.
 *
 * Moves up a rung after a success and repeats after a lapse. It never skips
 * ahead and never punishes: a lapse returns the same rung, not a lower one,
 * because dropping the target after a hard attempt reads as a demotion.
 */
export function suggestDelayMinutes(history: readonly DelayOutcome[]): number {
  const first = DELAY_RUNGS[0] ?? 10;
  if (history.length === 0) return first;

  const recent = [...history].sort((a, b) => b.at.getTime() - a.at.getTime())[0];
  /* c8 ignore next */
  if (recent === undefined) return first;

  const index = DELAY_RUNGS.indexOf(recent.minutes);
  if (index === -1) return first;
  if (!recent.resisted) return recent.minutes;
  return DELAY_RUNGS[Math.min(index + 1, DELAY_RUNGS.length - 1)] ?? recent.minutes;
}

/* ------------------------------------------------------------------ */
/* Stats — what the map shows                                          */
/* ------------------------------------------------------------------ */

export interface UrgeRecord {
  readonly target: UrgeTarget;
  readonly at: Date;
  readonly delayMinutes: number | null;
  /** Null while a delay is still running. */
  readonly resisted: boolean | null;
}

export interface UrgeStats {
  readonly total: number;
  readonly withDelay: number;
  readonly resisted: number;
  /** Share of completed delays that were resisted, 0–1. Null with no data. */
  readonly resistRate: number | null;
  /** Mean minutes of delay actually completed. Null with no data. */
  readonly meanDelayAchieved: number | null;
  readonly byTarget: readonly { readonly target: UrgeTarget; readonly count: number }[];
}

export function summariseUrges(records: readonly UrgeRecord[]): UrgeStats {
  const withDelay = records.filter((record) => record.delayMinutes !== null);
  const settled = withDelay.filter((record) => record.resisted !== null);
  const resisted = settled.filter((record) => record.resisted === true);

  const counts = new Map<UrgeTarget, number>();
  for (const record of records) {
    counts.set(record.target, (counts.get(record.target) ?? 0) + 1);
  }

  const achieved = resisted
    .map((record) => record.delayMinutes)
    .filter((minutes): minutes is number => minutes !== null);

  return Object.freeze({
    total: records.length,
    withDelay: withDelay.length,
    resisted: resisted.length,
    resistRate:
      settled.length === 0 ? null : Math.round((resisted.length / settled.length) * 100) / 100,
    meanDelayAchieved:
      achieved.length === 0
        ? null
        : Math.round((achieved.reduce((sum, value) => sum + value, 0) / achieved.length) * 10) / 10,
    byTarget: Object.freeze(
      [...counts.entries()]
        .map(([target, count]) => ({ target, count }))
        .sort((a, b) => b.count - a.count || a.target.localeCompare(b.target)),
    ),
  });
}
