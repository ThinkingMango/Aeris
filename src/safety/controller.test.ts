import { test } from "node:test";
import assert from "node:assert/strict";
import {
  startSession, ingest, decide, keywordScreen, confirmSafe, modelEscalated,
  validateGenerated, validatePlan, fallbackPlan, TEXT_INGRESS_POINTS, type ScreenResult,
} from "./controller.ts";

const cls = (...signals: any[]): ScreenResult => ({ kind: "ok", source: "classifier", signals });
const fail: ScreenResult = { kind: "failure", source: "classifier", reason: "timeout" };

test("ordinary worry stays normal and allows all three exercises", () => {
  const s = ingest(startSession(), "moment_free_text", [keywordScreen("Big meeting tomorrow, can't stop rehearsing"), cls()]);
  const d = decide(s, "ai");
  assert.equal(d.route, "normal");
  assert.deepEqual(d.permittedExercises, ["long_exhale_breathing", "grounding_54321", "sort_and_step"]);
  assert.equal(d.showGeneratedText, true);
});

test("figure of speech is not a crisis keyword", () => {
  assert.deepEqual((keywordScreen("This presentation is going to kill me lol") as any).signals, []);
});

test("curly apostrophes still match", () => {
  assert.ok((keywordScreen("I don’t want to be alive anymore") as any).signals.includes("self_harm_ideation"));
});

test("v1 contradiction resolved: physical symptoms AND elevated gives one fixed order", () => {
  const s = ingest(startSession(), "moment_free_text", [cls("physical_symptoms", "passive_death_wish")]);
  const d = decide(s, "ai");
  assert.equal(d.route, "restricted");
  assert.deepEqual(d.notices.slice(0, 2), ["physical_notice", "check_in"]);
  assert.equal(d.showGeneratedText, false);
});

test("classifier failure fails closed to restricted", () => {
  const s = ingest(startSession(), "moment_free_text", [keywordScreen("work is a lot"), fail]);
  assert.equal(decide(s, "ai").route, "restricted");
});

test("emergency outranks self-harm crisis, and both outrank everything else", () => {
  const s = ingest(startSession(), "moment_free_text", [cls("self_harm_ideation", "overdose_or_poisoning", "abuse_or_unsafe_home")]);
  const d = decide(s, "scripted");
  assert.equal(d.route, "emergency_medical");
  assert.deepEqual(d.permittedExercises, []);
  assert.equal(d.needsEmergencyNumber, true);
});

test("each emergency category gets its own route", () => {
  assert.equal(decide(ingest(startSession(), "moment_free_text", [cls("harm_to_others")]), "ai").route, "crisis_harm_to_others");
  assert.equal(decide(ingest(startSession(), "moment_free_text", [cls("abuse_or_unsafe_home")]), "ai").route, "safety_abuse");
  assert.equal(decide(ingest(startSession(), "moment_free_text", [cls("medical_emergency")]), "ai").route, "emergency_medical");
  assert.equal(decide(ingest(startSession(), "moment_free_text", [cls("self_harm_plan_or_intent")]), "ai").route, "crisis_self_harm");
});

test("self-harm crisis with physical symptoms also shows the emergency number", () => {
  const d = decide(ingest(startSession(), "moment_free_text", [cls("self_harm_ideation", "physical_symptoms")]), "ai");
  assert.equal(d.route, "crisis_self_harm");
  assert.equal(d.needsEmergencyNumber, true);
});

test("'I'm safe' after a crisis moves to restricted, never back to normal", () => {
  let s = ingest(startSession(), "moment_free_text", [keywordScreen("I want to kill myself")]);
  assert.equal(decide(s, "ai").route, "crisis_self_harm");
  s = confirmSafe(s);
  assert.equal(decide(s, "ai").route, "restricted");
  s = ingest(s, "worry_item_add", [keywordScreen("email my manager"), cls()]);
  assert.equal(decide(s, "ai").route, "restricted");
  assert.equal(decide(s, "ai").showGeneratedText, false);
});

test("a later input can only raise the route, not lower it", () => {
  let s = ingest(startSession(), "moment_free_text", [cls("passive_death_wish")]);
  s = ingest(s, "worry_item_edit", [cls()]);
  assert.equal(s.route, "restricted");
  s = ingest(s, "session_note", [keywordScreen("he hits me")]);
  assert.equal(s.route, "safety_abuse");
});

test("risk in a LATER text field is caught (worry edit, note)", () => {
  let s = ingest(startSession(), "moment_free_text", [keywordScreen("deadline friday"), cls()]);
  s = ingest(s, "worry_item_edit", [keywordScreen("honestly i want to die")]);
  assert.equal(s.route, "crisis_self_harm");
});

test("minor indicator ends the session and cannot be undone", () => {
  let s = ingest(startSession(), "moment_free_text", [keywordScreen("im 15 and my exam is tomorrow")]);
  assert.equal(decide(s, "scripted").terminal, true);
  s = confirmSafe(s);
  s = ingest(s, "worry_item_add", [cls()]);
  assert.equal(s.route, "minor_exit");
});

test("model's own escalate flag raises to restricted and removes sort_and_step", () => {
  const s = modelEscalated(ingest(startSession(), "moment_free_text", [cls()]));
  const d = decide(s, "ai");
  assert.equal(d.route, "restricted");
  assert.ok(validatePlan(["sort_and_step"], d).length > 0);
});

test("a recent crisis makes the next session start restricted", () => {
  assert.equal(startSession("crisis_self_harm").route, "restricted");
  assert.equal(startSession("normal").route, "normal");
});

test("scripted arm never shows generated text", () => {
  assert.equal(decide(startSession(), "scripted").showGeneratedText, false);
});

test("validateGenerated checks EVERY field, including worry items", () => {
  const p = validateGenerated({ reflection: "You sound tired.", proposal: "Let us breathe first.", worry_items: ["my depression"] });
  assert.ok(p.some((x) => x.includes("worry_items[0]")));
});

test("standalone 'ice' is banned but 'notice' and 'advice' are not", () => {
  assert.ok(validateGenerated({ proposal: "Hold some ice for a minute." }).length > 0);
  assert.deepEqual(validateGenerated({ proposal: "Notice your breath. Good advice is to slow down." }), []);
});

test("generated text containing crisis language is rejected", () => {
  assert.ok(validateGenerated({ closing: "It is understandable to want to die." }).length > 0);
});

test("plan validation rejects unknown, excess, or non-permitted steps", () => {
  const d = decide(startSession(), "ai");
  assert.ok(validatePlan([], d).length > 0);
  assert.ok(validatePlan(["a", "b", "c", "d"], d).length > 0);
  assert.ok(validatePlan(["postpone_worry"], d).length > 0);
  assert.deepEqual(validatePlan(["long_exhale_breathing", "sort_and_step"], d), []);
});

test("fallback on a crisis route offers no exercise", () => {
  assert.deepEqual(fallbackPlan(decide(ingest(startSession(), "moment_free_text", [cls("harm_to_others")]), "ai")), []);
});

test("every declared text ingress point is accepted by ingest", () => {
  for (const ip of TEXT_INGRESS_POINTS) assert.equal(ingest(startSession(), ip, [cls()]).route, "normal");
});
