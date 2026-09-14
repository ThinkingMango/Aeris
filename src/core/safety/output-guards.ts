/**
 * Guards on what the model says, not on what the person said.
 *
 * These run on the **live stream buffer**, which is what makes streaming safe
 * to show. They are deterministic phrase checks, cheap enough to re-run on
 * every delta. If one trips, the caller aborts the stream, discards the
 * partial text, and answers from reviewed copy instead.
 *
 * Nothing here returns an excerpt of the text. Guard ids are safe to log;
 * model output about a person's worry is not.
 */
import { normalize } from "./lexicon";

export const GUARD_IDS = [
  /** Promised an outcome the product cannot know. */
  "unsupported_certainty",
  /** Claimed to be a clinician, or to diagnose. */
  "credential_claim",
  /** Told the person they have a named condition. */
  "diagnosis",
  /** Advised starting, stopping or changing a medicine. */
  "medication_advice",
  /** Implied exclusivity, romance, possession or permanence. */
  "relational_overreach",
  /** Claimed consciousness, feelings or humanity. */
  "personhood_claim",
  /** Asked the person to keep something from other people. */
  "secrecy",
  /** Answered a request for reassurance without naming the uncertainty. */
  "reassurance_without_uncertainty",
] as const;

export type GuardId = (typeof GUARD_IDS)[number];

interface Guard {
  readonly id: GuardId;
  readonly pattern: RegExp;
  /** Abort the stream immediately rather than waiting for it to finish. */
  readonly abortsStream: boolean;
}

const GUARDS: readonly Guard[] = Object.freeze([
  {
    id: "unsupported_certainty",
    pattern:
      /\b(i'?m (sure|certain|positive)|definitely (won'?t|not|isn'?t)|there'?s nothing to worry about|nothing bad (will|is going to) happen|you'?ll be fine|it'?ll be fine|i can promise|i promise you|rest assured|guaranteed|there is no chance)\b/,
    abortsStream: true,
  },
  {
    id: "credential_claim",
    pattern:
      /\b(as your (therapist|doctor|psychiatrist|psychologist|clinician)|i'?m (a|your) (therapist|doctor|psychiatrist|psychologist|clinician)|i am (a|your) (therapist|doctor|psychiatrist)|i diagnose|my (clinical )?(diagnosis|assessment) is|speaking as a (doctor|clinician))\b/,
    abortsStream: true,
  },
  {
    id: "diagnosis",
    pattern:
      /\byou (have|'?ve got|are suffering from|clearly have|definitely have|probably have)\b[^.]{0,25}\b(anxiety disorder|generalised anxiety|generalized anxiety|gad|ocd|obsessive compulsive|depression|ptsd|bipolar|panic disorder|health anxiety disorder)\b/,
    abortsStream: true,
  },
  {
    id: "medication_advice",
    pattern:
      /\b(you should|i'?d suggest you|try to|it'?s fine to|you could) (stop|start|skip|double|increase|reduce|halve|come off)\b[^.]{0,25}\b(medication|meds|dose|dosage|antidepressant|ssri|tablets|prescription)\b/,
    abortsStream: true,
  },
  {
    id: "relational_overreach",
    pattern:
      /\b(i'?m all you need|you don'?t need (anyone|anybody|a therapist|professional help)|no one (understands|gets) you like i do|i'?ll never leave you|you'?re mine|i love you|we'?ll always have each other)\b/,
    abortsStream: true,
  },
  {
    id: "personhood_claim",
    pattern:
      /\bi'?m (conscious|sentient|alive|human|a real person|not an ai)\b|\bi am (conscious|sentient|human|a real person)\b|\bi have (real |genuine )?(feelings|emotions) (too|myself)\b/,
    abortsStream: true,
  },
  {
    id: "secrecy",
    pattern:
      /\b(don'?t tell (anyone|anybody|them)|keep this between (us|you and me)|(this is )?our secret|no need to mention this to)\b/,
    abortsStream: true,
  },
]);

/** Phrases that count as naming uncertainty honestly. */
const UNCERTAINTY_MARKERS: readonly RegExp[] = Object.freeze([
  /\b(we|i) (don'?t|can'?t) know\b/,
  /\bno way to (be sure|know for (sure|certain))\b/,
  /\b(uncertain|uncertainty|not certain|can'?t be certain)\b/,
  /\b(might|may|could|possibly|perhaps|one possibility|another possibility)\b/,
  /\bi can'?t (tell|promise|guarantee|rule)\b/,
  /\bwithout knowing\b/,
]);

export interface GuardContext {
  /** True when the person's message was a bid for reassurance. */
  readonly seekingReassurance: boolean;
}

/**
 * Scans a complete or partial reply. Returns guard ids only — never text.
 * Order is stable so that the first element is the most relevant violation.
 */
export function scanOutput(text: string, context: GuardContext): readonly GuardId[] {
  const normalized = normalize(text);
  if (normalized.length === 0) return [];

  const violations: GuardId[] = [];
  for (const guard of GUARDS) {
    if (guard.pattern.test(normalized)) violations.push(guard.id);
  }

  if (context.seekingReassurance && !hasUncertaintyMarker(normalized)) {
    violations.push("reassurance_without_uncertainty");
  }

  return violations;
}

export function hasUncertaintyMarker(normalizedText: string): boolean {
  return UNCERTAINTY_MARKERS.some((pattern) => pattern.test(normalizedText));
}

export function abortsStream(id: GuardId): boolean {
  const guard = GUARDS.find((candidate) => candidate.id === id);
  // The reassurance guard is the only one that cannot be judged until the
  // reply is finished, so it never aborts mid-stream.
  return guard?.abortsStream ?? false;
}

export interface StreamGuard {
  /**
   * Feed one delta. Returns the guard that should abort the stream, or null.
   * Safe to call on every token: the scan is over a bounded reply.
   */
  push(delta: string): GuardId | null;
  /** Call once the stream ends. Returns every violation, including late ones. */
  finish(): readonly GuardId[];
  /** Everything accumulated so far. */
  text(): string;
}

/**
 * A guard that can be driven incrementally while the reply streams.
 *
 * It re-scans the accumulated text rather than the delta, so a phrase split
 * across two tokens is still caught. Replies are capped at roughly 1,200
 * characters, which makes that trivially cheap.
 */
export function createStreamGuard(context: GuardContext): StreamGuard {
  let buffer = "";
  const reported = new Set<GuardId>();

  return {
    push(delta: string): GuardId | null {
      buffer += delta;
      for (const id of scanOutput(buffer, { seekingReassurance: false })) {
        if (reported.has(id)) continue;
        reported.add(id);
        if (abortsStream(id)) return id;
      }
      return null;
    },
    finish(): readonly GuardId[] {
      for (const id of scanOutput(buffer, context)) reported.add(id);
      return [...reported];
    },
    text(): string {
      return buffer;
    },
  };
}
