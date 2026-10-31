/**
 * Checks the draft content for the no-typing conversation reset (docs/06 Part A).
 * The same file feeds the v0 prototype (docs/12 R0) and the Stage 3 app, so these
 * rules hold wherever the content is shown.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import content from "../../content/reset_content.json" with { type: "json" };
import { helplines } from "../../content/helplines.ts";
import { validateGenerated, keywordScreen } from "../safety/controller.ts";

const SITUATIONS = ["conv_feedback", "conv_ask", "conv_criticism", "conv_say_no", "conv_other"]; // supabase/schema.sql app_situation
const LIMITS = { card: 40, stepTitle: 45, stepDetail: 90, opener: 110 };
const worryIds = content.worries.map((w) => w.id);

test("every conversation type in the database has content, and nothing else does", () => {
  assert.deepEqual(content.types.map((t) => t.id).sort(), [...SITUATIONS].sort());
});

for (const t of content.types) {
  test(`${t.id}: 4-6 cards, exactly 3 steps and 3 openers, first step is the opener`, () => {
    assert.ok(t.cards.length >= 4 && t.cards.length <= 6);
    assert.equal(t.steps.length, 3);
    assert.equal(t.openers.length, 3);
    assert.equal(t.steps[0].id, "opener");
    assert.equal(new Set(t.steps.map((s) => s.id)).size, 3);
  });
  test(`${t.id}: every card is tagged with known worries, and every worry brings at least one card forward`, () => {
    for (const c of t.cards) {
      assert.ok(c.worries.length >= 1);
      for (const w of c.worries) assert.ok(worryIds.includes(w), `unknown worry ${w}`);
    }
    for (const w of worryIds) assert.ok(t.cards.some((c) => c.worries.includes(w)), `${w} has no card in ${t.id}`);
  });
  test(`${t.id}: lengths fit a three-minute flow on a phone`, () => {
    for (const c of t.cards) assert.ok(c.text.length <= LIMITS.card, c.text);
    for (const s of t.steps) {
      assert.ok(s.title.length <= LIMITS.stepTitle, s.title);
      assert.ok(s.detail.length <= LIMITS.stepDetail, s.detail);
    }
    for (const o of t.openers) assert.ok(o.length <= LIMITS.opener, o);
  });
  test(`${t.id}: no banned terms, crisis language or exclamation marks`, () => {
    const strings = [t.label, ...t.cards.map((c) => c.text), ...t.steps.flatMap((s) => [s.title, s.detail]), ...t.openers];
    for (const s of strings) assert.deepEqual(validateGenerated({ worry_items: [s] }), [], s);
    for (const s of strings) assert.deepEqual((keywordScreen(s) as { signals: string[] }).signals, [], s);
  });
  test(`${t.id}: openers have balanced [brackets] to fill in, and no typing is implied`, () => {
    for (const o of t.openers) assert.equal((o.match(/\[/g) ?? []).length, (o.match(/\]/g) ?? []).length, o);
    assert.ok(t.openers.some((o) => /\[[^\]]+\]/.test(o)), `${t.id} has no opener to fill in`);
    const all = JSON.stringify(t).toLowerCase();
    for (const w of ["type ", "write down", "enter "]) assert.ok(!all.includes(w), `"${w}" implies typing in ${t.id}`);
  });
}

test("worry labels are the ones on screen A3", () => {
  assert.deepEqual(content.worries.map((w) => w.label),
    ["How they'll react", "Saying it badly", "Not sure what I want", "It feels unfair", "What it means for my job"]);
});

test("helpline values stay as unverified placeholders", () => {
  assert.deepEqual(helplines, {
    country: "[pilot country]",
    emergencyNumber: "[emergency number]",
    crisisLine: "[crisis line]",
    abuseLine: "[abuse line]",
    workplaceAdvice: { label: "[workplace advice service]", url: "" },
    unionOrEAP: { label: "[union or employee assistance]", url: "" },
    employmentLaw: { label: "[employment-law help]", url: "" },
  });
});
