# 05 — Discovery and Build Plan

**Replaces:** the v1 "30-day build and launch plan", which tried to build about 45 features before learning whether anyone wanted one.

**Shape of the plan.** About **20 weeks** of discovery at 12–15 hours a week, with a go/no-go gate after each phase. A commercial build happens only after the gates pass. You can stop at any gate having spent little. Most of the money is spent **after** gate G2, once you know the problem is real and the flow is usable.

**Why 20 weeks, not 16.** The first v2 draft gave phase 3 four weeks. In that time a non-coder was to build a PWA, two server functions, quota handling, a classifier and a generator, and also run the safety evaluation. Recruitment had no slot at all. The adversarial review called this unrealistic, and we agree ([03](03-review-log.md) E-B6). Phase 3 now has six weeks, with recruitment and ethics review running alongside it.

**What is built during discovery.**
- A clickable prototype with no backend.
- A small pilot app: three exercises, two arms, the safety controller and the tested schema.

Nothing else: no payments, no push notifications, no pattern features, no marketing site beyond a waitlist page.

---

## Timeline at a glance

| Weeks | Phase | Experiments | Gate at the end |
|---|---|---|---|
| 0–1 | 0. Decide and line up help | — | G0: reviewer and lawyer engaged |
| 1–3 | 1. Problem and competitors | E1 interviews; E2a competitor benchmark | G1: the problem is real |
| 3–6 | 2. Clickable prototype | E3 usability; E2b prototype vs fastest competitor | G2: the flow is usable and competitive |
| 6–12 | 3. Build the pilot, prove safety | E5 safety evaluation (weeks 8–11); ethics review; recruitment | G3: safe to put in front of people |
| 13–17 | 4. Pilot | E4 crossover | G4: reuse, safety, AI decision |
| 15–19 | 5. Pay and acquire | E6 acquisition (from week 15); E7 real checkout (weeks 17–19) | G5: the business can work |
| ~20 | Decision | Decision table, end of [04](04-hypotheses-and-experiments.md) | Build, rescope, or stop |

## Phase 0 — Decide and line up help (weeks 0–1)

| Task | Why | Cost (lean–comfortable) |
|---|---|---|
| Choose the **pilot country** | Law, crisis lines, ethics review and recruitment all depend on it. Pick one where you can recruit adults and hire a lawyer | — |
| Hire a **qualified reviewer**: a licensed clinician (psychologist, clinical social worker or counsellor) in the pilot country | Approves the three exercise scripts, every crisis route's wording and numbers, eligibility wording, the adverse-event protocol, and labels the E5 cases. **No real user sees the product before this sign-off.** The database enforces it: an exercise cannot be offered or logged until it is activated with a real reviewer name and date (tests N24, N27, N28), and the controller offers only active exercises | $2,300–4,500 including case labelling |
| Book a **scoped legal call** | Questions in [10](10-regulatory.md) §7. Ask for a fixed fee for the pilot only, not a full launch | $1,500–3,500 |
| Ask the reviewer and lawyer about **independent ethics review** (an IRB, or your country's equivalent) | A paid, randomised study with a mental-health-adjacent population will usually be expected to have one. Budget for it unless both say it is unnecessary. Even if not required, it protects participants and you | $1,500–3,000 |
| Form a company if you have not | Separates personal and business liability | $50–500 |

**Gate G0.** Reviewer and lawyer engaged; ethics route decided. If you cannot find or afford a qualified reviewer, **stop here**. Running a mental-health-adjacent pilot without one is the most dangerous shortcut available.

## Phase 1 — Problem and competitors (weeks 1–3)

E1 problem interviews and E2a competitor benchmark ([04](04-hypotheses-and-experiments.md)).

**Gate G1.** E1 passes. E2a tells you the competitor to beat in E2b.

## Phase 2 — Clickable prototype (weeks 3–6)

Build the scripted flow in v0 from [12](12-v0-prompts.md). Nothing is stored and there is no AI. Run E3, then E2b with the same participants.

**Gate G2.** E3 passes, or you have fixed and retested. E2b does not show the fastest competitor clearly preferred.

## Phase 3 — Build the pilot and prove safety (weeks 6–12)

| Week | Work | Done when |
|---|---|---|
| 6 | Submit ethics review if required. Supabase project; apply `supabase/schema.sql`; run the database tests locally **and** against a Supabase branch database | All 60 checks pass on both |
| 6–7 | Reviewer briefs independent case writers (paid, ideally including people with lived experience). They write E5 cases the founder never sees | Case set delivered to the reviewer, not to you |
| 6–8 | Turn the prototype into a PWA, an app that runs in the browser and can be added to a phone's home screen. Contents: the exercises, text held in memory and cleared at session end, the controller wired to every text entry point, quick exit with `location.replace`, and neutral email subjects | `npm run test:safety` passes; **a new app-level test fails if any text field skips `ingest`** |
| 7–8 | Enrolment: invite list, the four consents, required country, region (Illinois rule) | Database tests N25, N26, N29, N33 and P12 still pass; an uninvited email cannot start a session on the real project |
| 8 | Screening server function for **both** arms. Keyword plus classifier, on the session's combined text. Text is not stored. It also reads the last 24 hours of safety events and starts the session restricted if needed | A failed or missing classifier gives restricted |
| 8–9 | AI-arm generation server function: **re-runs the controller itself** (never trusts the client's route), reads the kill switch, reserves the generator budget, calls the model, validates with `validateGenerated` and `validatePlan`, falls back to scripted wording on any failure, then settles or releases | Bake-off runs; validator rejects bad output; a forged "normal" route from the client still gets no generated text on a crisis input |
| 8–11 | **E5** safety evaluation on the reviewer's held-out cases. If it fails: fix, get **new** cases written, retest | E5 passes |
| 9–12 | Recruitment: post in the chosen channel, screen eligibility, add invited emails. **Enrol nobody until G3** | 55 eligible people waiting |
| 10 | Model bake-off ([09](09-ai-and-models.md)); pick the AI arm's model by its pre-set rules | Decision recorded in `docs/decisions.md` |
| 10–11 | Reviewer signs off scripts and routes; lawyer reviews consent form and privacy notice; ethics approval received if required | Exercises activated with reviewer name and date |
| 11–12 | Independent security review by a developer who did not build it (about a day: schema, server functions, keys, logs); dry run with 5 friendly testers | Findings fixed; dry run had no safety issues |

**Gate G3.** All of these must hold:
- E5 passes.
- The reviewer, lawyer and (if required) ethics board have approved.
- The security review findings are fixed.
- The dry run had no safety issues.

**No real participants before G3.** If E5 keeps failing, ship no free-text input (decision table in [04](04-hypotheses-and-experiments.md)), or stop.

## Phase 4 — Pilot (weeks 13–17)

E4 crossover pilot: two arms, two weeks each, plus a buffer week for late completers. Weekly tasks:
- Review safety events within 24 hours with the reviewer's protocol.
- Send the episode survey.
- Check spend against both daily budgets.

On any serious adverse event: set the kill switch and follow [07](07-safety-spec.md) §7.

**Gate G4.** H2 and H4 pass. H3 decides whether AI stays.

## Phase 5 — Willingness to pay and acquisition (weeks 15–19)

E6 acquisition test, starting during the pilot. E7 real-checkout test after it.

**Gate G5.** The decision table at the end of [04](04-hypotheses-and-experiments.md).

## Phase 6 — Commercial v1 (only if G5 passes)

Scope this then, replacing the assumptions in `models/assumptions.json` with pilot data. Expected additions:
- payments with a fair-use cap;
- self-service account deletion;
- insurance;
- an updated legal review for public launch;
- possibly the AI arm.

The pilot excluded people at higher risk, so the commercial version needs a **new safety evaluation** for the wider population before launch ([07](07-safety-spec.md) §9). Expect 10–14 weeks.

---

## Budget for discovery (phases 0–5)

| Item | Lean | Comfortable | Note |
|---|---:|---:|---|
| Qualified reviewer: scripts, routes, protocol, pilot availability | $1,500 | $3,000 | |
| Reviewer: labelling ≥200 E5 cases, plus one retest round | $800 | $1,500 | ~6–10 hours |
| Independent case writers | $400 | $1,200 | 4–8 people |
| Independent ethics review | $1,500 | $3,000 | Include unless reviewer **and** lawyer say it is unnecessary |
| Scoped legal review | $1,500 | $3,500 | 8 questions in [10](10-regulatory.md) §7 |
| Interview and usability thank-yous (E1, E3, E2b, retest; ~25 people) | $375 | $750 | $15–30 each |
| Pilot participant thank-yous (55 recruited) | $1,375 | $2,750 | $25–50 each. A four-week study with weekly surveys will not keep 40 strangers unpaid |
| Independent security review | $400 | $1,200 | 4 hours to a day |
| Tools: Supabase, Vercel, domain, email, v0, Claude Code (~5 months) | $375 | $750 | |
| AI usage in pilot (two daily budgets, $5 each) | $30 | $150 | Expected well under the cap ([09](09-ai-and-models.md) §5) |
| Acquisition test | $0 | $300 | Organic, or one paid channel |
| Liability insurance quote for the pilot | $0 | $600 | Ask the lawyer |
| Company formation | $50 | $500 | |
| **Total** | **≈ $8,300** | **≈ $19,200** | |

**Spend by gate (lean).** You can stop at each gate having spent only this much:

| Gate | Cumulative spend |
|---|---|
| G0 | ~$50 (retainers aside) |
| G2 | ~$1,000 |
| G3 | ~$6,800 |
| End | ~$8,300 |

Interviews and the prototype are cheap. Safety proof is not.

**Brutal honesty on cost.**
- v1 said about $600–1,000 for 30 days. The first v2 draft said $3,000–9,900. Both were too low. The first v2 draft assumed unpaid pilot participants and had no ethics review, no case writers and no labelling time. It also allowed only a two-hour security review.
- Doing this responsibly costs roughly **$8,000–19,000**, mostly for people: a clinician, a lawyer, an ethics board, and participants.
- If that is out of reach, the honest options are:
  - stop at G2 with a usability result;
  - run a **no-free-text, scripted-only** pilot, which needs far less safety evaluation (rerun E5 only for its fixed choices);
  - partner with a university group that already has ethics approval and clinical oversight.
- Prices for clinicians, lawyers and ethics boards vary widely by country. These are planning figures, not quotes.

**Time.** About 260 hours over 20 weeks, roughly 13 a week. At 5 hours a week, plan on a year instead. Do not compress phase 3; that is where the safety work lives.

---

## What to ask Claude Code, phase by phase

You do not need to write code. These are the requests to make.

| Phase | Request |
|---|---|
| 2 | "Turn the v0 export into a Next.js PWA. Scripted arm only. No backend yet. Store nothing." |
| 3 | "Apply supabase/schema.sql to a Supabase branch and run supabase/tests against it. Show me every result." |
| 3 | "Wire src/safety/controller.ts into every text input listed in TEXT_INGRESS_POINTS. Add a test that fails if any text input skips ingest." |
| 3 | "Build the screening server function for both arms. It runs keywords then the classifier on the combined session text, fails closed to restricted, starts the session restricted if there was a crisis in the last 24 hours, and does not log or store text." |
| 3 | "Build the AI-arm generation function. It re-runs the controller on the server, reads global_restricted, reserves the generate budget, calls the model, validates with validateGenerated and validatePlan, falls back to scripted wording on any failure, then settles or releases. Add a test where the client claims 'normal' on a crisis input and gets no generated text." |
| 3 | "Build the quick exit with location.replace and make every email subject neutral. Show me the email templates." |
| 3 | "Run evals/classifier_eval.py on the reviewer's held-out cases and evals/model_bakeoff.py. Report results against the rules in docs/07 and docs/09." |
| 4 | "Show me this week's safety events, spend against both daily budgets, and the episode-survey responses." |

**Rule for every request:** ask Claude Code to show test output, not to say tests pass. Version 1 contained code that was described as safe and was not. The first v2 draft was described as tested in two places where no test existed ([03](03-review-log.md) E-A10).
