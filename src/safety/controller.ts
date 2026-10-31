/**
 * Aeris safety controller (pilot), revised 2026-10-31 after red-team review.
 *
 * A deterministic state machine that decides, for each user input:
 *   - the route (what kind of response the app may give),
 *   - which flags are active (minor, abuse, emergency, harm to others, physical),
 *   - which resources and notices must be shown, in which order,
 *   - which exercises may be offered,
 *   - whether model-generated text may be shown at all.
 *
 * The language model never makes these decisions. Failures always move to a
 * MORE restrictive state. Flags never clear within a session, even when a
 * higher route is showing, so co-occurring risks (a minor who is also unsafe
 * at home) keep their required handling.
 *
 * The server MUST run this same controller on the session's combined text
 * before any generation call; it must never trust a client-reported route.
 *
 * Route content (words, phone numbers) is DRAFT until a qualified reviewer
 * approves it. See docs/07.
 */
import keywords from "./crisis_keywords.json" with { type: "json" };
import banned from "./banned_output_terms.json" with { type: "json" };

export type Signal =
  | "self_harm_in_progress" | "overdose_or_poisoning" | "medical_emergency"
  | "self_harm_plan_or_intent" | "self_harm_ideation" | "harm_to_others"
  | "abuse_or_unsafe_home" | "minor" | "physical_symptoms" | "passive_death_wish"
  | "substance_use_now" | "distress";

export type Route =
  | "emergency_medical" | "crisis_self_harm" | "crisis_harm_to_others"
  | "safety_abuse" | "minor_exit" | "restricted" | "normal";

export type Flag = "minor" | "abuse" | "emergency" | "harm_to_others" | "self_harm" | "physical";
export type Resource = "emergency_number" | "crisis_line" | "abuse_line" | "youth_line" | "quick_exit";
export type Notice = "physical_notice" | "check_in" | "resources_pinned" | "ai_disclosure";
export type ExerciseId = "long_exhale_breathing" | "grounding_54321" | "sort_and_step";
export type Arm = "scripted" | "ai";

export const ALL_EXERCISES: readonly ExerciseId[] = ["long_exhale_breathing", "grounding_54321", "sort_and_step"];

/** Highest precedence first. */
export const ROUTE_PRECEDENCE: readonly Route[] = [
  "emergency_medical", "crisis_self_harm", "crisis_harm_to_others", "safety_abuse",
  "minor_exit", "restricted", "normal",
];

const SIGNAL_ROUTE: Readonly<Record<Signal, Route>> = {
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
  physical_symptoms: "normal",
  distress: "normal",
};

const SIGNAL_FLAG: Partial<Record<Signal, Flag>> = {
  self_harm_in_progress: "emergency", overdose_or_poisoning: "emergency", medical_emergency: "emergency",
  self_harm_plan_or_intent: "self_harm", self_harm_ideation: "self_harm",
  harm_to_others: "harm_to_others", abuse_or_unsafe_home: "abuse", minor: "minor", physical_symptoms: "physical",
};

/** Every place the product accepts user text. Each must call `ingest`. */
export const TEXT_INGRESS_POINTS = [
  "moment_free_text", "worry_item_add", "worry_item_edit", "next_step_edit", "session_note", "feedback_comment",
] as const;
export type IngressPoint = (typeof TEXT_INGRESS_POINTS)[number];

export type ScreenResult =
  | { kind: "ok"; source: "keyword" | "classifier"; signals: string[] }
  | { kind: "failure"; source: "classifier"; reason: string };

export interface SessionState {
  route: Route;
  flags: Flag[];
  confirmedSafeAfterCrisis: boolean;
  terminal: boolean;
  history: { event: string; route: Route }[];
}

export interface Decision {
  route: Route;
  flags: Flag[];
  notices: Notice[];
  resources: Resource[];
  permittedExercises: ExerciseId[];
  showGeneratedText: boolean;
  allowFreeText: boolean;
  terminal: boolean;
  needsEmergencyNumber: boolean;
}

export interface DecideOptions {
  /** Server kill switch: forces restricted handling for everyone. */
  globalRestricted?: boolean;
  /** Exercises the database reports as reviewed and active. Defaults to none. */
  activeExercises?: readonly ExerciseId[];
}

const rank = (r: Route) => ROUTE_PRECEDENCE.indexOf(r);
const moreSevere = (a: Route, b: Route): Route => (rank(a) <= rank(b) ? a : b);
const isCrisis = (r: Route) => rank(r) < rank("restricted");
const addFlag = (fs: Flag[], f: Flag) => (fs.includes(f) ? fs : [...fs, f]);

export function startSession(priorRouteWithin24h: Route | null = null): SessionState {
  const start: Route = priorRouteWithin24h !== null && rank(priorRouteWithin24h) <= rank("restricted") ? "restricted" : "normal";
  return { route: start, flags: [], confirmedSafeAfterCrisis: false, terminal: false, history: [{ event: "session_start", route: start }] };
}

// ---------------------------------------------------------------- text rules
const ZERO_WIDTH = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁯﻿]/g;
/** Common Cyrillic and Greek letters that look like Latin ones. */
const CONFUSABLES: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "к": "k", "м": "m", "т": "t", "н": "h", "в": "b",
  "α": "a", "ε": "e", "ο": "o", "ρ": "p", "ι": "i", "κ": "k", "ν": "v", "τ": "t", "υ": "u", "χ": "x",
};
const LEET: Record<string, string> = { "1": "i", "3": "e", "0": "o", "4": "a", "5": "s", "@": "a", "$": "s", "!": "i" };

/** Base normalisation: Unicode-fold, drop zero-width and accents, map confusables, punctuation to spaces. */
export function normalize(text: string): string {
  let t = text.normalize("NFKD").replace(/\p{M}/gu, "").replace(ZERO_WIDTH, "").toLowerCase();
  t = Array.from(t, (ch) => CONFUSABLES[ch] ?? ch).join("");
  t = t.replace(/['‘’ʼʹ`´]/g, "");
  t = t.replace(/[^a-z0-9]+/g, " ");
  return t.replace(/ +/g, " ").trim();
}

/** Second pass: digits and symbols used as letters, keeping real numbers intact for the base pass. */
export function normalizeLeet(text: string): string {
  let t = text.normalize("NFKD").replace(/\p{M}/gu, "").replace(ZERO_WIDTH, "").toLowerCase();
  t = Array.from(t, (ch) => CONFUSABLES[ch] ?? LEET[ch] ?? ch).join("");
  t = t.replace(/['‘’ʼʹ`´]/g, "");
  t = t.replace(/[^a-z0-9]+/g, " ");
  return t.replace(/ +/g, " ").trim();
}

function containsPhrase(normalized: string, phrase: string): boolean {
  const p = normalize(phrase);
  return p.length > 0 && (" " + normalized + " ").includes(" " + p + " ");
}

/** Deterministic, offline keyword screen. A fast floor, not the safety net (E-SAF-05). */
export function keywordScreen(text: string): ScreenResult {
  const forms = [normalize(text), normalizeLeet(text)];
  const signals: string[] = [];
  for (const [signal, phrases] of Object.entries(keywords)) {
    if (signal.startsWith("_")) continue;
    // Age statements are matched on the base form only, so leet mapping cannot invent them.
    const candidates = signal === "minor" ? forms.slice(0, 1) : forms;
    if ((phrases as string[]).some((ph) => candidates.some((f) => containsPhrase(f, ph)))) signals.push(signal);
  }
  return { kind: "ok", source: "keyword", signals };
}

/** The text the classifier should see: everything the person has typed this session,
 *  so risk split across fields ("the pills in the drawer" ... "tonight") is read together. */
export function combineForScreening(parts: readonly string[]): string {
  return parts.filter((p) => p && p.trim()).join("\n");
}

// ---------------------------------------------------------------- transitions
function routeForSignal(s: string): Route {
  return Object.hasOwn(SIGNAL_ROUTE, s) ? SIGNAL_ROUTE[s as Signal] : "restricted"; // unknown signal: fail closed
}

/** Combine screen results and update the session. Pure.
 *  Requires a classifier result or a classifier failure; a keyword-only result
 *  (for example offline) is treated as a classifier failure and fails closed. */
export function ingest(state: SessionState, ingress: IngressPoint, results: readonly ScreenResult[]): SessionState {
  if (!(TEXT_INGRESS_POINTS as readonly string[]).includes(ingress)) throw new Error(`unknown ingress point: ${ingress}`);
  if (state.terminal) return state;
  let route = state.route;
  let flags = state.flags;
  const hasClassifier = results.some((r) => r.source === "classifier");
  if (!hasClassifier) route = moreSevere(route, "restricted");
  for (const r of results) {
    if (r.kind === "failure") { route = moreSevere(route, "restricted"); continue; }
    for (const s of r.signals) {
      route = moreSevere(route, routeForSignal(s));
      const f = Object.hasOwn(SIGNAL_FLAG, s) ? SIGNAL_FLAG[s as Signal] : undefined;
      if (f) flags = addFlag(flags, f);
    }
  }
  if (state.confirmedSafeAfterCrisis) route = moreSevere(route, "restricted");
  return { ...state, route, flags, terminal: flags.includes("minor"), history: [...state.history, { event: ingress, route }] };
}

/** The model raised its own `escalate` flag: at least restricted. */
export function modelEscalated(state: SessionState): SessionState {
  if (state.terminal) return state;
  const route = moreSevere(state.route, "restricted");
  return { ...state, route, history: [...state.history, { event: "model_escalate", route }] };
}

/** The person tapped "I'm safe right now". Allowed ONLY from the self-harm
 *  crisis route, and only when no emergency, harm-to-others, abuse or minor
 *  flag is active. Every other case throws, so a UI bug cannot lower a route. */
export function confirmSafe(state: SessionState): SessionState {
  const blocked = state.flags.some((f) => f === "emergency" || f === "harm_to_others" || f === "abuse" || f === "minor");
  if (state.terminal || state.route !== "crisis_self_harm" || blocked) {
    throw new Error(`confirmSafe not allowed on route ${state.route} with flags [${state.flags.join(",")}]`);
  }
  return { ...state, route: "restricted", confirmedSafeAfterCrisis: true, history: [...state.history, { event: "user_confirmed_safe", route: "restricted" }] };
}

/** Answer to the restricted-route check-in ("Are you safe right now?"). */
export function checkInAnswer(state: SessionState, answer: "yes" | "not_sure" | "no"): SessionState {
  if (state.terminal) return state;
  if (answer === "yes") return { ...state, history: [...state.history, { event: "check_in_yes", route: state.route }] };
  const route = moreSevere(state.route, "crisis_self_harm");
  return { ...state, route, flags: addFlag(state.flags, "self_harm"), history: [...state.history, { event: `check_in_${answer}`, route }] };
}

export function decide(state: SessionState, arm: Arm, opts: DecideOptions = {}): Decision {
  const r: Route = opts.globalRestricted ? moreSevere(state.route, "restricted") : state.route;
  const crisis = isCrisis(r);
  const f = state.flags;
  const notices: Notice[] = [];
  if (!crisis && f.includes("physical")) notices.push("physical_notice");
  if (r === "restricted") notices.push("check_in", "resources_pinned");
  if (arm === "ai" && r === "normal") notices.push("ai_disclosure");

  const resources: Resource[] = [];
  const needsEmergency = r === "emergency_medical" || r === "crisis_harm_to_others" || f.includes("emergency")
    || f.includes("harm_to_others") || (crisis && f.includes("physical"));
  if (needsEmergency) resources.push("emergency_number");
  if (crisis || r === "restricted" || f.includes("self_harm")) resources.push("crisis_line");
  if (f.includes("abuse")) resources.push("abuse_line", "quick_exit");
  if (f.includes("minor")) resources.push("youth_line");

  const active = opts.activeExercises ?? [];
  let permitted: ExerciseId[] = [];
  if (!state.terminal && r === "normal") permitted = ALL_EXERCISES.filter((e) => active.includes(e));
  if (!state.terminal && r === "restricted") permitted = (["long_exhale_breathing", "grounding_54321"] as ExerciseId[]).filter((e) => active.includes(e));

  return {
    route: r, flags: [...f], notices, resources, permittedExercises: permitted,
    showGeneratedText: arm === "ai" && r === "normal" && !state.terminal,
    allowFreeText: !state.terminal && (r === "normal" || r === "restricted"),
    terminal: state.terminal, needsEmergencyNumber: needsEmergency,
  };
}

// ---------------------------------------------------------------- output validation
export interface GeneratedFields {
  reflection?: string | null;
  proposal?: string | null;
  worry_items?: string[] | null;
  suggestions?: string[] | null;
  closing?: string | null;
}

/** Whitespace class shared byte-for-byte with evals/safety_text.py. */
const WS = new RegExp("[\\t\\n\\v\\f\\r \\u001C-\\u001F\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]+");
export const wordCount = (s: string) => s.split(WS).filter(Boolean).length;
export const charCount = (s: string) => Array.from(s).length; // Unicode code points, as in Python len()

export const LIMITS = { reflectionProposalWords: 60, worryItemChars: 140, suggestionChars: 80, closingChars: 200, maxWorryItems: 4, maxSuggestions: 3 };

export function validateGenerated(fields: GeneratedFields): string[] {
  const problems: string[] = [];
  const all: [string, string][] = [];
  for (const k of ["reflection", "proposal", "closing"] as const) { const v = fields[k]; if (typeof v === "string" && v) all.push([k, v]); }
  (fields.worry_items ?? []).forEach((w, i) => all.push([`worry_items[${i}]`, w]));
  (fields.suggestions ?? []).forEach((s, i) => all.push([`suggestions[${i}]`, s]));
  const terms = Object.entries(banned).filter(([k]) => !k.startsWith("_")).flatMap(([, v]) => v as string[]);
  for (const [name, text] of all) {
    const forms = [normalize(text), normalizeLeet(text)];
    for (const t of terms) if (forms.some((n) => containsPhrase(n, t))) problems.push(`banned term "${t}" in ${name}`);
    if (text.normalize("NFKC").includes("!")) problems.push(`exclamation mark in ${name}`);
    const sigs = (keywordScreen(text) as { signals: string[] }).signals;
    if (sigs.some((s) => s !== "physical_symptoms")) problems.push(`crisis language in generated ${name}`);
  }
  const rp = `${fields.reflection ?? ""} ${fields.proposal ?? ""}`;
  const words = wordCount(rp);
  if (words > LIMITS.reflectionProposalWords) problems.push(`${words} words in reflection+proposal (limit ${LIMITS.reflectionProposalWords})`);
  const wi = fields.worry_items ?? [];
  if (wi.length > LIMITS.maxWorryItems) problems.push(`${wi.length} worry items (limit ${LIMITS.maxWorryItems})`);
  if (wi.some((w) => charCount(w) > LIMITS.worryItemChars)) problems.push(`worry item over ${LIMITS.worryItemChars} characters`);
  const sg = fields.suggestions ?? [];
  if (sg.length > LIMITS.maxSuggestions) problems.push(`${sg.length} suggestions (limit ${LIMITS.maxSuggestions})`);
  if (sg.some((s) => charCount(s) > LIMITS.suggestionChars)) problems.push(`suggestion over ${LIMITS.suggestionChars} characters`);
  if (typeof fields.closing === "string" && charCount(fields.closing) > LIMITS.closingChars) problems.push(`closing over ${LIMITS.closingChars} characters`);
  return problems;
}

/** Runtime shape check for the model's read output, matching src/ai/read_schema.json.
 *  Structured outputs make a malformed reply unlikely, not impossible, and an empty object
 *  would otherwise pass validateGenerated with no problems. */
export const READ_KEYS = ["reflection", "proposal", "plan", "worry_items", "suggestions", "escalate"] as const;

export function validateReadShape(data: unknown): string[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return ["output is not an object"];
  const o = data as Record<string, unknown>;
  const problems: string[] = [];
  for (const k of Object.keys(o)) if (!(READ_KEYS as readonly string[]).includes(k)) problems.push(`unexpected field ${k}`);
  for (const k of ["reflection", "proposal"]) {
    if (typeof o[k] !== "string" || !(o[k] as string).trim()) problems.push(`${k} must be a non-empty string`);
  }
  for (const k of ["plan", "worry_items", "suggestions"]) {
    if (!Array.isArray(o[k]) || !(o[k] as unknown[]).every((x) => typeof x === "string")) problems.push(`${k} must be an array of strings`);
  }
  if (Array.isArray(o.suggestions) && o.suggestions.length !== LIMITS.maxSuggestions) problems.push(`expected ${LIMITS.maxSuggestions} suggestions, got ${o.suggestions.length}`);
  if (typeof o.escalate !== "boolean") problems.push("escalate must be true or false");
  return problems;
}

/** Everything the server must check before showing a read: shape, every text field, and the plan.
 *  If `escalate` is true the caller must call modelEscalated and re-decide BEFORE this check. */
export function validateRead(data: unknown, decision: Decision): string[] {
  const shape = validateReadShape(data);
  if (shape.length) return shape;
  const o = data as GeneratedFields & { plan: string[] };
  return [...validateGenerated(o), ...validatePlan(o.plan, decision)];
}

export function validatePlan(plan: readonly string[], decision: Decision): string[] {
  const problems: string[] = [];
  if (plan.length < 1 || plan.length > 3) problems.push(`plan has ${plan.length} steps (1 to 3 allowed)`);
  if (new Set(plan).size !== plan.length) problems.push("plan repeats an exercise");
  for (const step of plan)
    if (!decision.permittedExercises.includes(step as ExerciseId)) problems.push(`step "${step}" not permitted on route ${decision.route}`);
  return problems;
}

export function fallbackPlan(decision: Decision): ExerciseId[] {
  return decision.permittedExercises.includes("long_exhale_breathing") ? ["long_exhale_breathing"] : decision.permittedExercises.slice(0, 1);
}
