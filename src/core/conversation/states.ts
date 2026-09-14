/**
 * The conversation state machine.
 *
 * The client renders the current state and reports events. It never chooses
 * the next one. The server reads the stored state, computes the legal moves,
 * and rejects anything else — including anything the model proposes.
 *
 * This is the single most important invariant in the system, which is why it
 * is twenty lines of data and two pure functions rather than logic spread
 * across route handlers.
 */

export const STATES = [
  /** Nothing said yet. */
  "START",
  /** Hearing what is going on. */
  "UNDERSTAND",
  /** One more question, budgeted. */
  "CLARIFY",
  /** Naming what the mind is doing, in plain words. */
  "NAME_PATTERN",
  /** Offering one exercise from the allowed set. */
  "OFFER_TOOL",
  /** The person is inside an app-owned exercise. */
  "IN_TOOL",
  /** Asking where the intensity is now. */
  "REASSESS",
  /** A short closing summary. */
  "REFLECT",
  /** Finished. Terminal. */
  "COMPLETE",
  /** Safety hold. Terminal for this session; a new session starts fresh. */
  "SAFETY_HOLD",
] as const;

export type State = (typeof STATES)[number];

export function isState(value: unknown): value is State {
  return typeof value === "string" && (STATES as readonly string[]).includes(value);
}

/**
 * Every legal move. Anything absent is forbidden.
 *
 * `SAFETY_HOLD` is reachable from every live state and is terminal, as is
 * `COMPLETE`. `REASSESS` can loop back to `OFFER_TOOL` so that someone whose
 * intensity did not move can try something else rather than being told the
 * session is over.
 */
export const TRANSITIONS: Readonly<Record<State, readonly State[]>> = Object.freeze({
  START: ["UNDERSTAND", "SAFETY_HOLD"],
  UNDERSTAND: ["CLARIFY", "NAME_PATTERN", "OFFER_TOOL", "SAFETY_HOLD"],
  CLARIFY: ["CLARIFY", "NAME_PATTERN", "OFFER_TOOL", "SAFETY_HOLD"],
  NAME_PATTERN: ["OFFER_TOOL", "SAFETY_HOLD"],
  OFFER_TOOL: ["IN_TOOL", "REFLECT", "SAFETY_HOLD"],
  IN_TOOL: ["REASSESS", "SAFETY_HOLD"],
  REASSESS: ["OFFER_TOOL", "REFLECT", "COMPLETE", "SAFETY_HOLD"],
  REFLECT: ["COMPLETE", "SAFETY_HOLD"],
  COMPLETE: [],
  SAFETY_HOLD: [],
});

/** States a model turn may propose. `START` is excluded: a turn always follows one. */
export const MODEL_STATES = STATES.filter((state) => state !== "START");

export type ModelState = Exclude<State, "START">;

export function canTransition(from: State, to: State): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(state: State): boolean {
  return TRANSITIONS[state].length === 0;
}

export function allowedNext(from: State): readonly State[] {
  return TRANSITIONS[from];
}

/**
 * Where a turn ends when the model's proposal is illegal or the turn degraded.
 *
 * Two rules:
 *
 *  1. The result is always a **legal** transition from `current`. Holding the
 *     current state is only correct where the machine actually permits a
 *     self-transition, which most states do not.
 *  2. It is never `SAFETY_HOLD`. Entering the safety hold is the gate's
 *     decision and only the gate's: a provider outage or a malformed reply
 *     must never be able to put someone into a crisis redirect.
 *
 * Preference runs least-committal first, so a degraded turn stalls the
 * conversation rather than advancing it somewhere it has not earned.
 */
const FALLBACK_PREFERENCE: readonly ModelState[] = [
  "CLARIFY",
  "NAME_PATTERN",
  "UNDERSTAND",
  "OFFER_TOOL",
  "REASSESS",
  "REFLECT",
  "COMPLETE",
];

export function safeFallbackState(current: State): ModelState {
  for (const candidate of FALLBACK_PREFERENCE) {
    if (canTransition(current, candidate)) return candidate;
  }
  // Only reachable from a terminal state, where a turn is refused upstream.
  return current === "START" ? "UNDERSTAND" : (current as ModelState);
}
