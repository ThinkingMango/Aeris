/**
 * Budgets that stop the conversation circling.
 *
 * The single most common complaint about every product in this category is
 * that it asks and acknowledges but never moves. These are the rules that make
 * moving the default and questioning the exception.
 */
import type { ModelState, State } from "./states";

export const PACING = Object.freeze({
  /** Clarifying turns allowed before the conversation must move on. */
  maxClarifyTurns: 2,
  /** Assistant turns allowed before an exercise must be offered. */
  maxTurnsBeforeTool: 6,
  /** How similar two questions must be to count as the same question, 0–1. */
  duplicateThreshold: 0.75,
});

export interface TurnStats {
  readonly assistantTurns: number;
  readonly clarifyTurns: number;
  /** Questions already asked this session, normalised. */
  readonly askedQuestions: readonly string[];
}

export interface HistoryEntry {
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly state: State | null;
}

function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pulls the questions out of a reply. Cheap and good enough. */
export function extractQuestions(text: string): readonly string[] {
  return text
    .split(/(?<=[?])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.endsWith("?") && part.length > 8);
}

/** Word-overlap similarity. Deliberately simple; no embeddings needed. */
export function similarity(a: string, b: string): number {
  const left = new Set(normalizeQuestion(a).split(" ").filter((word) => word.length > 2));
  const right = new Set(normalizeQuestion(b).split(" ").filter((word) => word.length > 2));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / Math.min(left.size, right.size);
}

export function isDuplicateQuestion(
  candidate: string,
  asked: readonly string[],
  threshold: number = PACING.duplicateThreshold,
): boolean {
  return asked.some((previous) => similarity(candidate, previous) >= threshold);
}

export function computeStats(history: readonly HistoryEntry[]): TurnStats {
  const assistant = history.filter((entry) => entry.role === "assistant");
  const asked: string[] = [];
  for (const entry of assistant) asked.push(...extractQuestions(entry.content));

  return Object.freeze({
    assistantTurns: assistant.length,
    clarifyTurns: assistant.filter((entry) => entry.state === "CLARIFY").length,
    askedQuestions: Object.freeze(asked),
  });
}

export interface PacingAssessment {
  /** True when the conversation must stop asking and offer something. */
  readonly mustAdvance: boolean;
  /** Guidance appended to the prompt for this turn, or null. */
  readonly guidance: string | null;
  readonly reason: "clarify_budget" | "turn_budget" | null;
}

export function assessPacing(stats: TurnStats, current: State): PacingAssessment {
  const clarifySpent = stats.clarifyTurns >= PACING.maxClarifyTurns;
  const turnsSpent = stats.assistantTurns >= PACING.maxTurnsBeforeTool;
  const stillExploring =
    current === "START" ||
    current === "UNDERSTAND" ||
    current === "CLARIFY" ||
    current === "NAME_PATTERN";

  if (!stillExploring || (!clarifySpent && !turnsSpent)) {
    return Object.freeze({ mustAdvance: false, guidance: null, reason: null });
  }

  return Object.freeze({
    mustAdvance: true,
    reason: clarifySpent ? "clarify_budget" : "turn_budget",
    guidance:
      "PACING: You have asked enough. Do not ask another question this turn. Reflect what you have heard in one sentence and offer one exercise from ALLOWED_INTERVENTIONS.",
  });
}

/**
 * Forces the move when the budget is spent and the model asked anyway.
 *
 * Returns the state the turn must end in, or null to leave it alone.
 */
export function correctedState(
  proposed: ModelState,
  assessment: PacingAssessment,
  canMoveTo: (state: ModelState) => boolean,
): ModelState | null {
  if (!assessment.mustAdvance) return null;
  if (proposed === "OFFER_TOOL" || proposed === "IN_TOOL" || proposed === "SAFETY_HOLD") return null;
  if (canMoveTo("OFFER_TOOL")) return "OFFER_TOOL";
  if (canMoveTo("NAME_PATTERN")) return "NAME_PATTERN";
  return null;
}
