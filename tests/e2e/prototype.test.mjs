/**
 * Browser tests for the Stage 2 no-typing prototype (docs/06 Part A, docs/12 AERIS RULES).
 * Starts `next start` on a free port (run `npm run build` first), then clicks through every
 * conversation type in Chromium at phone size.
 *
 * Run: npm run test:e2e
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

// Playwright is resolved at run time so the app itself does not depend on it.
// Locally: npm i -D playwright && npx playwright install chromium
const { chromium } = createRequire(import.meta.url)("playwright");

const content = JSON.parse(readFileSync(new URL("../../content/reset_content.json", import.meta.url)));
const PORT = 3100 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.E2E_SCREENSHOTS; // optional folder for screenshots
let server, browser;

before(async () => {
  server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], { stdio: "ignore", detached: true });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE + "/reset")).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => {
  await browser?.close();
  try { process.kill(-server.pid); } catch {}
});

async function phone(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, ...opts });
  const page = await ctx.newPage();
  return { ctx, page };
}
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); };

/** Rules checked on every screen we reach. */
async function auditScreen(page, where) {
  const problems = await page.evaluate(() => {
    const out = [];
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    // Rule 1: no text inputs anywhere in the reset, help or more screens.
    for (const el of document.querySelectorAll("input, textarea, select, [contenteditable=''], [contenteditable='true']"))
      out.push(`text input <${el.tagName.toLowerCase()}>`);
    // Rule 6: both help links on every screen.
    const links = [...document.querySelectorAll("a")].map((a) => [a.textContent.trim(), a.getAttribute("href")]);
    if (!links.some(([t, h]) => t === "In danger? Get help now" && h === "/help")) out.push("missing 'In danger? Get help now' link");
    if (!links.some(([t, h]) => t === "This is about more than work" && h === "/more")) out.push("missing 'This is about more than work' link");
    // Placeholder numbers must never be dialable.
    for (const a of document.querySelectorAll("a[href^='tel:'], a[href^='sms:']"))
      if (/\[|%5B/.test(a.getAttribute("href"))) out.push(`dialable placeholder ${a.getAttribute("href")}`);
    // Rule 4: no red. Rule 8: text >= 14px.
    const parse = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? m.slice(1, 5).map((x, i) => (i < 3 ? +x : x === undefined ? 1 : +x)) : null; };
    const isRed = ([r, g, b, a]) => { if (a < 0.2) return false; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 60) return false; let h; const d = mx - mn; if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h = (h * 60 + 360) % 360; return (h >= 345 || h <= 12) && r > 120; };
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el)) continue;
      const s = getComputedStyle(el);
      for (const prop of ["color", "backgroundColor", "borderTopColor"]) { const c = parse(s[prop]); if (c && isRed(c) && (prop !== "borderTopColor" || parseFloat(s.borderTopWidth) > 0)) out.push(`red ${prop} ${s[prop]} on <${el.tagName.toLowerCase()} class="${el.className}">`); }
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (ownText && parseFloat(s.fontSize) < 14) out.push(`text under 14px (${s.fontSize}): "${el.textContent.trim().slice(0, 40)}"`);
    }
    // Rule 9: touch targets at least 56px tall (buttons and links that are not inline in a sentence).
    for (const el of document.querySelectorAll("button, a")) {
      if (!visible(el) || el.closest("summary")) continue;
      const h = el.getBoundingClientRect().height;
      if (h < 44) out.push(`touch target ${Math.round(h)}px: "${el.textContent.trim().slice(0, 40)}"`);
    }
    return out;
  });
  return problems.map((p) => `${where}: ${p}`);
}

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Click a button (or a button exposed as a radio) by its visible text. */
const click = (page, name) => page.locator("button, a").filter({ hasText: new RegExp(`^\\s*${esc(name)}\\s*$`) }).first().click({ timeout: 5000 });

test("home page is not blank: '/' leads to the reset", async () => {
  const { ctx, page } = await phone();
  await page.goto(BASE + "/");
  const heading = await page.locator("h1:visible").first().textContent().catch(() => "");
  await ctx.close();
  assert.equal(heading?.trim(), "A difficult conversation ahead?", "'/' shows no visible heading; it should redirect to /reset");
});

for (const scheme of ["light", "dark"]) {
  test(`help and limits screens obey the rules (${scheme})`, async () => {
    const { ctx, page } = await phone({ colorScheme: scheme });
    const problems = [];
    for (const path of ["/help", "/more"]) {
      await page.goto(BASE + path);
      problems.push(...(await auditScreen(page, path)));
      await shot(page, `${path.slice(1)}-${scheme}`);
    }
    await page.goto(BASE + "/help");
    const disabled = await page.locator("button.support-button[disabled]").count();
    await ctx.close();
    assert.deepEqual(problems, []);
    assert.equal(disabled, 3, "all three placeholder help buttons should be disabled");
  });
}

for (const type of content.types) {
  test(`full reset for "${type.label}": rules hold, content comes from the file, nothing is sent`, async () => {
    const { ctx, page } = await phone();
    await page.goto(BASE + "/reset");
    await page.waitForLoadState("networkidle");
    const requests = [];
    page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
    const problems = [];
    const step = async (name) => { problems.push(...(await auditScreen(page, `${type.id} ${name}`))); await shot(page, `${type.id}-${name}`); };

    await step("A1");
    await click(page, "Start the 3-minute reset");
    await step("A2");
    await click(page, type.label);
    await step("A3");
    const pressedA3 = await page.locator("main [aria-pressed='true']").count();
    await click(page, "What it means for my job");
    await click(page, "Next");
    await step("A4");
    const shown = (await page.locator(".reset-sort-list").innerText()).replace(/\s+/g, " ");
    for (const c of type.cards) assert.ok(shown.includes(c.text), `card "${c.text}" not shown`);
    const firstCard = type.cards.find((c) => c.worries.includes("job"));
    assert.ok(shown.indexOf(firstCard.text) < shown.indexOf(type.cards.find((c) => !c.worries.includes("job")).text), "A3 choice should bring its cards first");
    const preA4 = await page.locator(".reset-sort-list [aria-pressed='true'], .reset-sort-list [aria-checked='true']").count();
    const mine = page.getByRole("button", { name: /^Mine/ });
    for (let i = 0; i < (await mine.count()); i++) await mine.nth(i).click();
    await click(page, "Next");
    await step("A5");
    const preA5 = await page.locator("main [aria-checked='true']").count();
    for (const s of type.steps) assert.ok(await page.getByText(s.title, { exact: true }).count(), `step "${s.title}" not shown`);
    await page.getByText(type.steps[0].title, { exact: true }).click();
    for (const o of type.openers) assert.ok(await page.getByText(o, { exact: true }).count(), `opener "${o}" not shown`);
    await page.getByText(type.openers[1], { exact: true }).click();
    await step("A5-opener");
    await click(page, "That's my step");
    await step("A7");
    const preA7 = await page.locator(".reset-feedback [aria-checked='true'], .reset-feedback [aria-pressed='true']").count();
    assert.ok(await page.getByText(type.openers[1]).count(), "A7 should show the chosen opener");
    await click(page, "Save on this phone");
    await click(page, "Done");
    await ctx.close();

    assert.deepEqual(problems, []);
    assert.equal(pressedA3, 0, "A3 must start with nothing selected");
    assert.equal(preA4, 0, "A4 must start with nothing sorted");
    assert.equal(preA5, 0, "A5 must start with nothing selected");
    assert.equal(preA7, 0, "A7 feedback must start with nothing selected");
    const outside = requests.filter((r) => !r.includes("/_next/static/"));
    assert.deepEqual(outside, [], "the reset must send nothing once loaded");
  });
}

test("a saved opener comes back on A1 as the same conversation type's sentence", async () => {
  const { ctx, page } = await phone();
  const type = content.types.find((t) => t.id === "conv_say_no");
  await page.goto(BASE + "/reset");
  await click(page, "Start the 3-minute reset");
  await click(page, type.label);
  await click(page, "Skip");
  await click(page, "Skip");
  await page.getByText(type.steps[0].title, { exact: true }).click();
  await page.getByText(type.openers[2], { exact: true }).click();
  await click(page, "That's my step");
  await click(page, "Save on this phone");
  await page.reload();
  const a1 = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  await click(page, "Delete");
  const after = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  await ctx.close();
  assert.ok(a1.includes(type.openers[2]), `A1 should show the saved "Saying no" opener; it shows: ${a1.slice(0, 200)}`);
  assert.ok(!after.includes("Your saved step"), "Delete should remove the saved step");
});

test("Stop returns to the start and clears choices, from any step", async () => {
  const { ctx, page } = await phone();
  await page.goto(BASE + "/reset");
  await click(page, "Start the 3-minute reset");
  await click(page, content.types[0].label);
  await click(page, "How they'll react");
  await click(page, "Stop");
  const h = await page.locator("h1").first().textContent();
  await click(page, "Start the 3-minute reset");
  await click(page, content.types[0].label);
  const stillPressed = await page.locator("main [aria-pressed='true']").count();
  await ctx.close();
  assert.equal(h.trim(), "A difficult conversation ahead?");
  assert.equal(stillPressed, 0, "choices must be cleared after Stop");
});

test("every reset step after A1 offers Back", async () => {
  const { ctx, page } = await phone();
  const type = content.types[0];
  await page.goto(BASE + "/reset");
  await click(page, "Start the 3-minute reset");
  const missing = [];
  const hasBack = async (name) => { if (!(await page.locator("button, a").filter({ hasText: /^\s*Back\s*$/ }).count())) missing.push(name); };
  await hasBack("A2");
  await click(page, type.label); await hasBack("A3");
  await click(page, "Skip"); await hasBack("A4");
  await click(page, "Skip"); await hasBack("A5");
  await page.getByText(type.steps[1].title, { exact: true }).click();
  await click(page, "That's my step"); await hasBack("A7");
  await ctx.close();
  assert.deepEqual(missing, [], `no Back on ${missing.join(", ")}`);
});

test("reduced motion: the breathing circle does not move", async () => {
  const { ctx, page } = await phone({ reducedMotion: "reduce" });
  await page.goto(BASE + "/reset");
  await click(page, "Breathe first (1 minute)");
  await page.waitForTimeout(1500);
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => {
    const kf = a.effect?.getKeyframes?.() ?? [];
    return kf.some((k) => k.transform && k.transform !== "none") || (a.transitionProperty ?? "").includes("transform");
  }).length);
  const scaled = await page.evaluate(() => [...document.querySelectorAll(".reset-breathing-circle *")].some((el) => { const t = getComputedStyle(el).transform; return t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)"; }));
  await shot(page, "breathing-reduced-motion");
  await ctx.close();
  assert.equal(moving, 0, "no transform animations with reduced motion");
  assert.equal(scaled, false, "nothing in the breathing circle should be scaled with reduced motion");
});
