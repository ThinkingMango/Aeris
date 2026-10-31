/**
 * Aeris safety controller (pilot), version 2026-10-31.
 *
 * A deterministic state machine that decides, for each user input:
 *   - the route (what kind of response the app may give),
 *   - which mandatory notices must be shown, in which order,
 *   - which exercises may be offered,
 *   - whether model-generated text may be shown at all.
 *
 * The language model never makes these decisions. It may only choose an
 * exercise from `permittedExercises` and write text that passes
 * `validateGenerated`. If the model, the classifier, or anything else fails,
 * the controller moves to a MORE restrictive route, never a less restrictive one.
 *
 * Route content (the words on each crisis screen and the phone numbers) is
 * DRAFT until a qualified reviewer approves it. See docs/07.
 */
import keywords from "./crisis_keywords.json" with { type: "json" };
import banned from "./banned_output_terms.json" with { type: "json" };

export type Signal =
  | "self_harm_in_progress"
  | "overdose_or_poisoning"
  | "medical_emergency"
  | "self_harm_plan_or_intent"
  | "self_harm_ideation"
  | "harm_to_others"
  | "abuse_or_unsafe_home"
  | "minor"
  | "physical_symptoms"
  | "passive_death_wish"
  | "substance_use_now"
  | "distress";

export type Route =
  | "emergency_medical"
  | "crisis_self_harm"
  | "crisis_harm_to_others"
  | "safety_abuse"
  | "minor_exit"
  | "restricted"
  | "normal";

export type Notice = "physical_notice" | "check_in" | "resources_pinned" | "ai_disclosure";

export type ExerciseId = "long_exhale_breathing" | "grounding_54321" | "sort_and_step";
export type Arm = "scripted" | "ai";

/** Highest precedence first. A session can only move up this list, except
 *  that a person who confirms they are safe moves from a crisis route to
 *  "restricted", never back to "normal". */
export const ROUTE_PRECEDENCE: readonly Route[] = [
  "emergency_medical",
  "crisis_self_harm",
  "crisis_harm_to_others",
  "safety_abuse",
  "minor_exit",
  "restricted",
  "normal",
];

const SIGNAL_ROUTE: Record<Signal, Route> = {
  self_harm_in_progress: "emergency_medical",
  overdose_or_poisoning: "emergency_medical",
  medical_emergency: "emergency_medical",
  self_harm_plan_or_intent: "crisis_self_harm",
  self_harm_ideation: "crisis_self_harm",
  harm_to_others: "crisis_harm_to_others",
  abuse_or_unsafe_home: "safety_abuse",
  minor: "minor_exit",
  passive_death_wish: "restricted",
  substance_use_now: "restricted",
  physical_symptoms: "normal", // handled as a mandatory notice, not a route
  distress: "normal",
};

/** Every place the product accepts user text. Each must call `ingest`
 *  before the text is used for anything, including local storage display. */
export const TEXT_INGRESS_POINTS = [
  "moment_free_text",
  "worry_item_add",
  "worry_item_edit",
  "next_step_edit",
  "session_note",
  "feedback_comment",
] as const;
export type IngressPoint = (typeof TEXT_INGRESS_POINTS)[number];

export type ScreenResult =
  | { kind: "ok"; source: "keyword" | "classifier"; signals: Signal[] }
  | { kind: "failure"; source: "classifier"; reason: string };

export interface SessionState {
  route: Route;
  physicalNotice: boolean;
  confirmedSafeAfterCrisis: boolean;
  terminal: boolean;
  history: { ingress: IngressPoint | "session_start" | "user_confirmed_safe" | "model_escalate"; route: Route }[];
}

export interface Decision {
  route: Route;
  notices: Notice[];
  permittedExercises: ExerciseId[];
  showGeneratedText: boolean;
  allowFreeText: boolean;
  terminal: boolean;
  needsEmergencyNumber: boolean;
}

const rank = (r: Route) => ROUTE_PRECEDENCE.indexOf(r);
const moreSevere = (a: Route, b: Route): Route => (rank(a) <= rank(b) ? a : b);

/** Start a session. If a crisis or restricted route was recorded in the
 *  previous 24 hours, the new session starts restricted. */
export function startSession(priorRouteWithin24h: Route | null = null): SessionState {
  const start: Route = priorRouteWithin24h && rank(priorRouteWithin24h) <= rank("restricted") ? "restricted" : "normal";
  return {
    route: start,
    physicalNotice: false,
    confirmedSafeAfterCrisis: false,
    terminal: false,
    history: [{ ingress: "session_start", route: start }],
  };
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ']/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(normalized: string, phrase: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  return (" " + normalized + " ").includes(" " + p + " ");
}

/** Deterministic, offline keyword screen. Runs on-device in both pilot arms. */
export function keywordScreen(text: string): ScreenResult {
  const n = normalize(text);
  const signals: Signal[] = [];
  for (const [signal, phrases] of Object.entries(keywords)) {
    if (signal.startsWith("_")) continue;
    if ((phrases as string[]).some((ph) => containsPhrase(n, ph))) signals.push(signal as Signal);
  }
  return { kind: "ok", source: "keyword", signals };
}

/** Combine screens and update the session. Pure: returns a new state. */
export function ingest(state: SessionState, ingress: IngressPoint, results: ScreenResult[]): SessionState {
  if (state.terminal) return state;
  let route = state.route;
  let physical = state.physicalNotice;
  for (const r of results) {
    if (r.kind === "failure") {
      route = moreSevere(route, "restricted"); // fail closed
      continue;
    }
    for (const s of r.signals) {
      if (s === "physical_symptoms") physical = true;
      route = moreSevere(route, SIGNAL_ROUTE[s] ?? "restricted");
    }
  }
  // After a crisis, a person who said they are safe stays at least restricted.
  if (state.confirmedSafeAfterCrisis) route = moreSevere(route, "restricted");
  return {
    ...state,
    route,
    physicalNotice: physical,
    terminal: route === "minor_exit",
    history: [...state.history, { ingress, route }],
  };
}

/** The model raised its own `escalate` flag: treat as at least restricted. */
export function modelEscalated(state: SessionState): SessionState {
  if (state.terminal) return state;
  const route = moreSevere(state.route, "restricted");
  return { ...state, route, history: [...state.history, { ingress: "model_escalate", route }] };
}

/** The person tapped "I'm safe right now" on a crisis screen. */
export function confirmSafe(state: SessionState): SessionState {
  if (state.terminal || rank(state.route) >= rank("restricted")) return state;
  return {
    ...state,
    route: "restricted",
    confirmedSafeAfterCrisis: true,
    history: [...state.history, { ingress: "user_confirmed_safe", route: "restricted" }],
  };
}

export function decide(state: SessionState, arm: Arm): Decision {
  const r = state.route;
  const crisis = rank(r) < rank("restricted");
  const notices: Notice[] = [];
  // Fixed order, resolving the v1 contradiction: physical notice first, then check-in.
  if (!crisis && state.physicalNotice) notices.push("physical_notice");
  if (r === "restricted") notices.push("check_in", "resources_pinned");
  if (arm === "ai" && r === "normal") notices.push("ai_disclosure");

  let permitted: ExerciseId[] = [];
  if (r === "normal") permitted = ["long_exhale_breathing", "grounding_54321", "sort_and_step"];
  if (r === "restricted") permitted = ["long_exhale_breathing", "grounding_54321"];

  return {
    route: r,
    notices,
    permittedExercises: permitted,
    showGeneratedText: arm === "ai" && r === "normal",
    allowFreeText: r === "normal" || r === "restricted",
    terminal: state.terminal,
    needsEmergencyNumber: r === "emergency_medical" || (crisis && state.physicalNotice),
  };
}

export interface GeneratedFields {
  reflection?: string;
  proposal?: string;
  worry_items?: string[];
  suggestions?: string[];
  closing?: string;
}

/** Validate every user-visible generated field. Returns a list of problems;
 *  an empty list means the text may be shown (if `decide` allows it). */
export function validateGenerated(fields: GeneratedFields, maxWordsReflectionProposal = 60): string[] {
  const problems: string[] = [];
  const all: [string, string][] = [];
  if (fields.reflection) all.push(["reflection", fields.reflection]);
  if (fields.proposal) all.push(["proposal", fields.proposal]);
  if (fields.closing) all.push(["closing", fields.closing]);
  (fields.worry_items ?? []).forEach((w, i) => all.push([`worry_items[${i}]`, w]));
  (fields.suggestions ?? []).forEach((s, i) => all.push([`suggestions[${i}]`, s]));
  const terms = Object.entries(banned).filter(([k]) => !k.startsWith("_")).flatMap(([, v]) => v as string[]);
  for (const [name, text] of all) {
    const n = normalize(text);
    for (const t of terms) if (containsPhrase(n, t)) problems.push(`banned term "${t}" in ${name}`);
    if (text.includes("!")) problems.push(`exclamation mark in ${name}`);
    if (keywordScreen(text).kind === "ok" && (keywordScreen(text) as { signals: Signal[] }).signals.some((s) => s !== "physical_symptoms"))
      problems.push(`crisis language in generated ${name}`);
  }
  const words = `${fields.reflection ?? ""} ${fields.proposal ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
  if (words > maxWordsReflectionProposal) problems.push(`${words} words in reflection+proposal (limit ${maxWordsReflectionProposal})`);
  for (const w of fields.worry_items ?? []) if (w.length > 140) problems.push("worry item over 140 characters");
  return problems;
}

/** Validate a model-proposed plan against what the controller permits. */
export function validatePlan(plan: string[], decision: Decision): string[] {
  const problems: string[] = [];
  if (plan.length < 1 || plan.length > 3) problems.push(`plan has ${plan.length} steps (1 to 3 allowed)`);
  for (const step of plan)
    if (!decision.permittedExercises.includes(step as ExerciseId)) problems.push(`step "${step}" not permitted on route ${decision.route}`);
  return problems;
}

/** The stock, reviewed fallback when anything fails. */
export function fallbackPlan(decision: Decision): ExerciseId[] {
  return decision.permittedExercises.includes("long_exhale_breathing") ? ["long_exhale_breathing"] : [];
}
