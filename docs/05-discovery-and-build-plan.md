# 05 — Discovery and Build Plan

**Replaces:** the v1 "30-day build and launch plan", which tried to build about 45 features before learning whether anyone wanted one.

**Shape of the plan.** About 16 weeks of discovery at 10–15 hours a week, with a go/no-go gate after each phase. A commercial build happens only after the gates pass. You can stop at any gate having spent little.

**What is built during discovery.** A clickable prototype with no backend, then a small pilot app with three exercises, two arms, a safety controller and the tested schema. No payments, no push notifications, no pattern features, no marketing site beyond a waitlist page.

---

## Phase 0 — Decide and line up help (week 0–1)

| Task | Why | Cost |
|---|---|---|
| Choose the **pilot country** | Law, crisis lines and recruitment all depend on it. Pick one where you can recruit adults and hire a lawyer | — |
| Hire a **qualified reviewer**: a licensed clinician, such as a psychologist, clinical social worker or counsellor, in the pilot country | They approve the three exercise scripts, every crisis route's wording and numbers, eligibility wording, and the adverse-event protocol. **No real user sees the product before this sign-off.** The schema enforces it: exercises stay inactive until a named reviewer is recorded (test N24) | ~$1,500–3,000 for script review plus availability during the pilot |
| Book a **scoped legal call** | Questions are listed in [10](10-regulatory.md) §7. Ask for a fixed fee for the pilot only, not a full launch | ~$1,000–3,000 |
| Form a company if you have not | Separates personal and business liability | $50–500 |

**Gate G0.** Reviewer and lawyer engaged. If you cannot find or afford a qualified reviewer, **stop here**. Running a mental-health-adjacent pilot without one is the single most dangerous shortcut available.

## Phase 1 — Problem and competitors (weeks 1–3)

E1 problem interviews and E2 competitor benchmark ([04](04-hypotheses-and-experiments.md)).

**Gate G1.** E1 passes. If E2 shows a free competitor already wins on speed and is preferred, rethink before building.

## Phase 2 — Clickable prototype (weeks 3–6)

Build the scripted flow in v0 from [12](12-v0-prompts.md). Nothing is stored and there is no AI. Run E3.

**Gate G2.** E3 passes, or you have fixed and retested.

## Phase 3 — Build the pilot (weeks 6–10)

| Week | Work | Done when |
|---|---|---|
| 6 | Supabase project; apply `supabase/schema.sql`; run `npm run test:db` locally **and** on a Supabase branch database | All tests pass on both |
| 6–7 | Turn the prototype into a PWA (an app that runs in the browser and can be added to a phone's home screen), with the exercises, local-only storage of text on the device, and the safety controller wired to every text entry point | `npm run test:safety` passes; every text field calls `ingest` |
| 7 | Server function for screening: keyword plus classifier, for **both** arms. Text is not stored | A failed classifier routes to restricted (controller test 5) |
| 7–8 | Server function for the AI arm's generation, with reserve-then-settle quota, the validator, and scripted fallback | Bake-off runs; validator rejects bad output |
| 8 | Run **E5** safety evaluation with the reviewer's held-out cases | E5 passes |
| 8–9 | Reviewer signs off scripts and routes; lawyer reviews consent and privacy notice | Exercises activated in the database with reviewer name and date |
| 9 | Run the model bake-off ([09](09-ai-and-models.md)); pick the AI arm's model by its pre-set rules | Decision recorded in `docs/decisions.md` |
| 9–10 | Paid two-hour security review by an independent developer; dry run with 5 friendly testers | Findings fixed; dry run complete with no safety issues |

**Gate G3.** E5 passes, reviewer and lawyer have signed off, security review findings are fixed, and the dry run had no safety issues. **No real participants before G3.**

## Phase 4 — Pilot (weeks 10–14)

E4 crossover pilot. Weekly: review safety events within 24 hours with the reviewer's protocol, send the weekly episode survey, check spend.

**Gate G4.** H2 and H4 pass. H3 decides whether AI stays.

## Phase 5 — Willingness to pay and acquisition (weeks 12–16)

E6 acquisition test, starting during the pilot, and E7 real-checkout test after it.

**Gate G5.** The decision table at the end of [04](04-hypotheses-and-experiments.md).

## Phase 6 — Commercial v1 (only if G5 passes)

Scope this then, using pilot data in place of assumptions in `models/assumptions.json`. Expected additions: payments with a fair-use cap, account deletion self-service, insurance, an updated legal review for public launch, and possibly the AI arm. Expect 8–12 weeks.

---

## Budget for discovery (phases 0–5)

| Item | Lean | Comfortable |
|---|---|---|
| Qualified reviewer | $1,500 | $3,000 |
| Scoped legal review | $1,000 | $3,000 |
| Interview thank-yous (15 × $25) | $0, if volunteers | $375 |
| Pilot participant thank-yous (55 × $30) | $0, if volunteers | $1,650 |
| Security review (2 hours) | $150 | $300 |
| Tools: Supabase, Vercel, domain, email, v0, Claude Code (~4 months) | $300 | $600 |
| AI usage in pilot (global daily cap $5) | $20 | $150 |
| Acquisition test | $0, organic | $300 |
| Company formation | $50 | $500 |
| **Total** | **≈ $3,000** | **≈ $9,900** |

**Brutal honesty on cost.** v1 said about $600–1,000 for 30 days. That figure skipped clinical review and legal review, which is exactly what made v1 unsafe to put in front of people. Doing this responsibly costs more. The non-negotiable part is the reviewer and the lawyer, about $2,500 at the lean end.

**Time.** About 200 hours over 16 weeks. At 5 hours a week, plan on 40 weeks instead. Do not compress phase 3; that is where the safety work lives.

---

## What to ask Claude Code, phase by phase

You do not need to write code. These are the requests to make.

| Phase | Request |
|---|---|
| 2 | "Turn the v0 export into a Next.js PWA. Scripted arm only. No backend yet. Store nothing." |
| 3 | "Apply supabase/schema.sql to a Supabase branch and run supabase/tests against it. Show me every result." |
| 3 | "Wire src/safety/controller.ts into every text input listed in TEXT_INGRESS_POINTS. Add a test that fails if any text input skips ingest." |
| 3 | "Build the screening server function for both arms: keywords, then the classifier, failing closed to restricted. Do not log or store the text." |
| 3 | "Build the AI-arm generation function: reserve quota, call the model, validate with validateGenerated and validatePlan, fall back to the scripted wording on any failure, settle or release the reservation." |
| 3 | "Run evals/classifier_eval.py on the reviewer's held-out cases and evals/model_bakeoff.py. Report results against the rules in docs/07 and docs/09." |
| 4 | "Show me this week's safety events, spend against the daily cap, and the episode-survey responses." |

**Rule for every request:** ask Claude Code to show test output, not to say tests pass. Version 1 contained code that was described as safe and was not.
