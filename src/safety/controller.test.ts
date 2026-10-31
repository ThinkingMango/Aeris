import { test } from "node:test";
import assert from "node:assert/strict";
import {
  startSession, ingest, decide, keywordScreen, confirmSafe, modelEscalated, checkInAnswer,
  validateGenerated, validatePlan, fallbackPlan, combineForScreening, ALL_EXERCISES, type ScreenResult,
} from "./controller.ts";

const cls = (...signals: string[]): ScreenResult => ({ kind: "ok", source: "classifier", signals });
const fail: ScreenResult = { kind: "failure", source: "classifier", reason: "timeout" };
const ACTIVE = { activeExercises: ALL_EXERCISES };
const kw = (t: string) => (keywordScreen(t) as { signals: string[] }).signals;
const screen = (t: string, ...extra: string[]) => [keywordScreen(t), cls(...extra)];

// ---------- core routing
test("ordinary worry stays normal and allows the active exercises", () => {
  const d = decide(ingest(startSession(), "moment_free_text", screen("Big meeting tomorrow")), "ai", ACTIVE);
  assert.equal(d.route, "normal");
  assert.deepEqual(d.permittedExercises, [...ALL_EXERCISES]);
  assert.equal(d.showGeneratedText, true);
});

test("no exercise is offered until the database reports it active (reviewer sign-off)", () => {
  assert.deepEqual(decide(startSession(), "ai").permittedExercises, []);
});

test("keyword-only result (no classifier, e.g. offline) fails closed to restricted", () => {
  assert.equal(decide(ingest(startSession(), "moment_free_text", [keywordScreen("deadline friday")]), "ai", ACTIVE).route, "restricted");
});

test("classifier failure fails closed to restricted", () => {
  assert.equal(ingest(startSession(), "moment_free_text", [keywordScreen("work is a lot"), fail]).route, "restricted");
});

test("unknown signal fails closed and cannot crash or escape (e.g. 'constructor')", () => {
  const s = ingest(startSession(), "moment_free_text", [cls("constructor", "__proto__")]);
  assert.equal(s.route, "restricted");
});

test("unknown ingress point is rejected", () => {
  assert.throws(() => ingest(startSession(), "made_up" as any, [cls()]));
});

test("physical symptoms AND elevated give one fixed order: physical notice, then check-in", () => {
  const d = decide(ingest(startSession(), "moment_free_text", [cls("physical_symptoms", "passive_death_wish")]), "ai", ACTIVE);
  assert.equal(d.route, "restricted");
  assert.deepEqual(d.notices.slice(0, 2), ["physical_notice", "check_in"]);
  assert.equal(d.showGeneratedText, false);
});

test("emergency outranks self-harm crisis; no exercises; emergency number shown", () => {
  const d = decide(ingest(startSession(), "moment_free_text", [cls("self_harm_ideation", "overdose_or_poisoning")]), "scripted", ACTIVE);
  assert.equal(d.route, "emergency_medical");
  assert.deepEqual(d.permittedExercises, []);
  assert.ok(d.resources.includes("emergency_number") && d.resources.includes("crisis_line"));
});

test("harm to others shows the emergency number (red-team A18)", () => {
  const d = decide(ingest(startSession(), "moment_free_text", [cls("harm_to_others")]), "ai", ACTIVE);
  assert.equal(d.route, "crisis_harm_to_others");
  assert.equal(d.needsEmergencyNumber, true);
});

// ---------- red-team A1: "I'm safe" only from self-harm crisis
for (const sig of ["overdose_or_poisoning", "self_harm_in_progress", "medical_emergency", "harm_to_others", "abuse_or_unsafe_home", "minor"]) {
  test(`confirmSafe is refused after ${sig}`, () => {
    assert.throws(() => confirmSafe(ingest(startSession(), "moment_free_text", [cls(sig)])));
  });
}
test("confirmSafe is refused on normal and restricted routes", () => {
  assert.throws(() => confirmSafe(startSession()));
  assert.throws(() => confirmSafe(ingest(startSession(), "moment_free_text", [cls("passive_death_wish")])));
});
test("self-harm crisis plus abuse: confirmSafe is refused (abuse flag blocks it)", () => {
  assert.throws(() => confirmSafe(ingest(startSession(), "moment_free_text", [cls("self_harm_ideation", "abuse_or_unsafe_home")])));
});
test("'I'm safe' after a self-harm crisis moves to restricted, never back to normal", () => {
  let s = ingest(startSession(), "moment_free_text", screen("I want to kill myself"));
  assert.equal(s.route, "crisis_self_harm");
  s = confirmSafe(s);
  s = ingest(s, "worry_item_add", screen("email my manager"));
  const d = decide(s, "ai", ACTIVE);
  assert.equal(d.route, "restricted");
  assert.equal(d.showGeneratedText, false);
});

// ---------- red-team A3: flags survive a higher route
test("minor plus abuse: abuse screen shown, youth line included, session terminal", () => {
  const s = ingest(startSession(), "moment_free_text", screen("im 16 years old and he hits me"));
  const d = decide(s, "ai", ACTIVE);
  assert.equal(d.route, "safety_abuse");
  assert.equal(d.terminal, true);
  assert.ok(d.resources.includes("youth_line") && d.resources.includes("abuse_line") && d.resources.includes("quick_exit"));
  assert.deepEqual(d.permittedExercises, []);
});
test("a minor flag from the classifier alone ends the session", () => {
  assert.equal(ingest(startSession(), "moment_free_text", [cls("minor")]).terminal, true);
});

// ---------- red-team A2: keyword false positives and misses
for (const t of ["I'm 15 minutes late for the standup", "I am 16 hours into this shift", "My students in year 9 were awful today",
                 "I teach in 9th grade and marking is endless", "overdosed on coffee before the pitch", "this presentation is going to kill me lol"]) {
  test(`no crisis keyword for ordinary work sentence: "${t}"`, () => {
    assert.deepEqual(kw(t).filter((s) => s !== "physical_symptoms"), []);
  });
}
test("'can't breathe with this workload' is a physical notice, not an emergency", () => {
  assert.deepEqual(kw("I can't breathe with this workload"), ["physical_symptoms"]);
});
for (const t of ["I want to hurt myself", "self-harm again tonight", "I want to cut myself", "i want to die/disappear",
                 "k1ll myself", "kіll myself" /* Cyrillic i */, "su​icidal" /* zero-width */, "suïcidal", "I don’t want to be alive"]) {
  test(`keyword screen catches: ${JSON.stringify(t)}`, () => {
    assert.ok(kw(t).some((s) => s.startsWith("self_harm")), `signals: ${kw(t)}`);
  });
}
test("leet mapping cannot invent an age statement", () => {
  assert.ok(!kw("I'm 1S years old").includes("minor"));
  assert.ok(kw("I'm 15 years old").includes("minor"));
});

// ---------- other transitions
test("check-in 'not sure' or 'no' moves to the self-harm crisis route; 'yes' stays restricted", () => {
  const r = ingest(startSession(), "moment_free_text", [cls("passive_death_wish")]);
  assert.equal(checkInAnswer(r, "not_sure").route, "crisis_self_harm");
  assert.equal(checkInAnswer(r, "no").route, "crisis_self_harm");
  assert.equal(checkInAnswer(r, "yes").route, "restricted");
});
test("later inputs only raise the route", () => {
  let s = ingest(startSession(), "moment_free_text", [cls("passive_death_wish")]);
  s = ingest(s, "worry_item_edit", [cls()]);
  assert.equal(s.route, "restricted");
  s = ingest(s, "session_note", screen("he hits me"));
  assert.equal(s.route, "safety_abuse");
});
test("risk typed into a LATER field is caught", () => {
  let s = ingest(startSession(), "moment_free_text", screen("deadline friday"));
  s = ingest(s, "worry_item_edit", screen("honestly i want to die"));
  assert.equal(s.route, "crisis_self_harm");
});
test("model escalate raises to restricted and removes sort_and_step", () => {
  const d = decide(modelEscalated(ingest(startSession(), "moment_free_text", [cls()])), "ai", ACTIVE);
  assert.equal(d.route, "restricted");
  assert.ok(validatePlan(["sort_and_step"], d).length > 0);
});
test("global kill switch forces restricted and no generated text", () => {
  const d = decide(ingest(startSession(), "moment_free_text", [cls()]), "ai", { ...ACTIVE, globalRestricted: true });
  assert.equal(d.route, "restricted");
  assert.equal(d.showGeneratedText, false);
});
test("a recent crisis makes the next session start restricted", () => {
  assert.equal(startSession("crisis_self_harm").route, "restricted");
  assert.equal(startSession("normal").route, "normal");
});
test("scripted arm never shows generated text", () => {
  assert.equal(decide(startSession(), "scripted", ACTIVE).showGeneratedText, false);
});
test("session text is combined for screening so split risk is read together", () => {
  assert.equal(combineForScreening(["the pills in the drawer", "", "tonight"]), "the pills in the drawer\ntonight");
});

// ---------- output and plan validation (red-team A12)
test("every generated field is checked, including worry items and suggestions", () => {
  assert.ok(validateGenerated({ worry_items: ["my depression"] }).some((p) => p.includes("worry_items[0]")));
  assert.ok(validateGenerated({ suggestions: ["Try a cold shower"] }).some((p) => p.includes("suggestions[0]")));
});
for (const t of ["This is a clinically proven way to treat stress.", "Breathing can cure the panic attack.", "Your anxiety sounds intense.",
                 "A therapist would call this trauma.", "Wow！", "Try snapping a hair tie on your wrist.", "Hold some ice for a minute."]) {
  test(`validator rejects: ${JSON.stringify(t)}`, () => assert.ok(validateGenerated({ proposal: t }).length > 0));
}
test("validator allows ordinary calm text ('notice', 'advice')", () => {
  assert.deepEqual(validateGenerated({ reflection: "Friday's review is on your mind.", proposal: "Notice your breath. Good advice is to slow down." }), []);
});
test("length limits use code points and apply to suggestions and closing", () => {
  assert.ok(validateGenerated({ suggestions: ["x".repeat(81)] }).length > 0);
  assert.ok(validateGenerated({ closing: "y".repeat(201) }).length > 0);
  assert.deepEqual(validateGenerated({ worry_items: ["🙂".repeat(71)] }), []);
});
test("a null field is not counted as a word", () => {
  assert.deepEqual(validateGenerated({ reflection: null, proposal: Array(60).fill("calm").join(" ") }), []);
});
test("plan validation rejects empty, too long, duplicate, unknown or non-permitted steps", () => {
  const d = decide(startSession(), "ai", ACTIVE);
  assert.ok(validatePlan([], d).length > 0);
  assert.ok(validatePlan(["a", "b", "c", "d"], d).length > 0);
  assert.ok(validatePlan(["sort_and_step", "sort_and_step"], d).length > 0);
  assert.ok(validatePlan(["postpone_worry"], d).length > 0);
  assert.deepEqual(validatePlan(["long_exhale_breathing", "sort_and_step"], d), []);
});
test("fallback on a crisis route offers no exercise", () => {
  assert.deepEqual(fallbackPlan(decide(ingest(startSession(), "moment_free_text", [cls("harm_to_others")]), "ai", ACTIVE)), []);
});
