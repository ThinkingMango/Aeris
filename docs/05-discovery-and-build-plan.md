# 05 — Discovery and Build Plan

**Replaces:** the v1 "30-day build and launch plan", and the earlier v2 plan that spent about $6,800 on a safety build before learning whether anyone wanted the product.

**Shape of the plan.** Five stages. Money is released **one stage at a time**, each with a spending cap, and only after the previous gate passes.

| Stage | Weeks | Question | Cumulative cap (lean) | What is built |
|---|---|---|---|---|
| 1 | 1–2 | Is the problem real, and can we reach the people who have it? | $500 | Nothing |
| 2 | 3–4 | Do people prefer Aeris to what they do now? Does a channel convert? | $1,500 | Clickable prototype and a landing page |
| 3 | 5–9 | Do people come back on their own? | $5,000 | No-typing mobile web app |
| 4 | 8–12 | Will people or partners pay, and renew? At what acquisition cost? | $5,500 | A checkout |
| 5 | +10–12 | Do free text and AI add enough to justify their cost and risk? | +$8,000–14,000 | Screening, AI arm, safety evaluation |

**Why this order.** The third review ([03](03-review-log.md) Part F) pointed out that the earlier plan tested distribution and payment only after the most expensive work. A stage that fails at week 2 or week 4 now costs hundreds of dollars, not thousands. Stage 5's safety work is unchanged in rigour. It is simply no longer paid for before there is evidence of demand.

**What is never built in Stages 1–4:**
- free-text input;
- generated text;
- push notifications;
- streaks;
- memory of past sessions;
- employer dashboards;
- anything that sends what a person is worried about to a server.

---

## Week 0 — Decide (no spend)

1. **One country and one language.** This sets the law, the crisis lines, the partners and the lawyer.
2. **One segment.** Default: people who manage others, facing difficult conversations ([04](04-hypotheses-and-experiments.md)).
3. **Read every threshold** in [04](04-hypotheses-and-experiments.md). Change any you disagree with now, in [decisions.md](decisions.md).
4. **Prepare a one-page resource sheet** for interviews: the local crisis line, and where people can get workplace advice (union, employee assistance, employment-law help).
5. **List 10 candidate partners**: trainers, communities and newsletters that reach the segment.

## Stage 1 — Problem and partners (weeks 1–2)

D1 interviews and D2 partner conversations ([04](04-hypotheses-and-experiments.md)).

| Item | Lean | Note |
|---|---:|---|
| Interview thank-yous (15 × $20) | $300 | |
| Scheduling, recording and transcription tools | $50 | Ask consent to record |
| **Stage total (cap $500)** | **$350** | |

**No clinician or lawyer yet.** These are interviews with adults about work conversations, not a health service. The resource sheet covers the rare case where someone becomes distressed.

**Gate S1.** D1 passes, and D2 passes or is revising.

## Stage 2 — Advantage and the first funnel (weeks 3–4)

1. Run the founder's competitor benchmark (half a day).
2. **Revise the draft content** in `content/reset_content.json` using the words D1 interviewees actually used: the cards, steps and openers. Rerun `npm run test:safety`, which checks the content.
3. Build the **clickable no-typing prototype** in v0 from [12](12-v0-prompts.md) (P0, R0–R4, R6). It sends nothing. The chosen step is stored on-device only if the person chooses Save; all other choices stay in memory. Push v0's code to a branch, not `main`, and have Claude Code review it against [06](06-pilot-product-spec.md) Part A.
4. **Before the first D3 session**, replace every placeholder help-line number and link with your pilot country's real ones, verified on each service's own website. The prototype will not dial a placeholder.
5. Run D3: prototype versus each person's preferred alternative.
6. Build the landing page (R5) and run D4 with one partner. It collects email addresses, so publish the short privacy page first and collect nothing else. The lawyer reviews it in Stage 3.

| Item | Lean | Note |
|---|---:|---|
| D3 thank-yous (8 × $25) | $200 | |
| v0, domain, hosting, email list | $75 | v0's free tier may be enough; a paid month is about $20 |
| Optional small paid test of the landing page | $0–300 | Only to compare against the partner channel |
| **Cumulative (cap $1,500)** | **≈ $625–925** | |

**Gate S2.** D3 passes, and D4 passes or is revising.

## Stage 3 — Repeat use in real life (weeks 5–9)

**Approvals first (week 5):**

| Approval | What exactly | Lean cost |
|---|---|---:|
| **Qualified reviewer** (licensed clinician in the pilot country) | Approves four things: the reset scripts, the "Get help" screen and its numbers, the "this tool can't fix how you're being treated" screen, and the eligibility wording. In the database, each approval is tied to an exercise's content version (tests N34, N35, N39) | $1,000 |
| **Lawyer**, short scoped call | Consent text, privacy notice and marketing claims, for a no-typing tool in one country | $750 |
| **Ethics review**, if the reviewer or lawyer says it is needed | Independent board review of D5 | $0 or $1,500 |

**Build (weeks 5–6), with Claude Code:**
- Turn the prototype into a mobile web app on Vercel.
- **No free text anywhere.** The chosen next step is stored only on the device.
- Optional sign-in by email link (Supabase) for pilot members. It applies `supabase/schema.sql` with the AI arm **off**: `ai_arm_enabled` defaults to false, so everyone is scripted (test N40). Members give the four consents, at the versions in force (N36, P14).
- Sessions are logged with the `conv_*` situations and the `conversation_reset` exercise (test P15). They record only the tap choices' category, never their text.
- One weekly email question, using neutral subjects ([07](07-safety-spec.md) §8).
- A persistent "In danger? Get help now" link, and a "This is about more than work" link to the support screen.

**Run D5 (weeks 6–9):** four weeks with 30–40 people from 2–3 partner communities.

| Item | Lean | Note |
|---|---:|---|
| Reviewer, lawyer | $1,750 | |
| Ethics review, if needed | $0–1,500 | |
| Exit-interview thank-yous (40 × $15) | $600 | Paid for the interview only, not for use |
| Supabase, Vercel, email for 5 weeks | $100 | |
| Company formation | $50 | Before taking any payment in Stage 4 |
| Independent security check of the deployed app (4 hours) | $400 | Much smaller surface than Stage 5: no text, no AI |
| **Cumulative (cap $5,000)** | **≈ $3,500–5,000** | |

**Gate S3.** D5 passes.

## Stage 4 — Payment and distribution (weeks 8–12)

Overlaps the end of Stage 3:
- **D6**, real checkout: monthly only, refundable for 14 days, with renewal observed at month 2.
- **D7**, partner-sponsored cohort pilots.
- **D8**, cost per paying customer, including founder hours.

| Item | Lean | Note |
|---|---:|---|
| Stripe setup | $0 | Fees per payment only |
| Partner demonstration materials | $100 | |
| One paid channel test, only if partners fail | $0–300 | |
| **Cumulative (cap $5,500)** | **≈ $3,600–5,400** | |

**Gate S4.** The decision table after Stage 4 in [04](04-hypotheses-and-experiments.md).

**What a pass at week 12 means, honestly.** It shows that a small group returns to the tool, that some pay, and that one channel works at small scale. It does **not** show product–market fit or a sustainable business. At base assumptions, about 800 signups a month are needed to break even within about 14 months ([11](11-economics.md)). Stage 4 cannot prove that volume; it can only show whether the path is credible.

---

## Stage 5 — Free text and AI (only if Stage 4 passes and typing is still worth testing)

The earlier v2 programme, condensed. Every safety requirement stays. **No participant may type free text before gate G5a.**

| Week | Work | Done when |
|---|---|---|
| 1 | Reviewer and lawyer re-engaged for free text and AI; ethics review submitted; case writers briefed by the reviewer | Case set delivered to the reviewer, not to the founder |
| 1–2 | Apply the schema to a Supabase branch database and run the tests there as well as locally | All checks pass on both |
| 2–3 | Wire `src/safety/controller.ts` into every text input; the quick exit; neutral emails | **A new app-level test fails if any text field skips `ingest`** |
| 3–4 | Screening server function for both arms, on the session's combined text, starting restricted after a recent crisis | A failed or missing classifier gives restricted |
| 4–5 | Generation server function. It re-runs the controller, reads the kill switch, and reserves the generator budget. It **buffers the reply**, validates it with `validateRead` (shape, every field, plan), falls back to scripted wording on any failure, then settles or releases | A forged "normal" route from the client still gets no generated text; an empty or malformed reply never renders |
| 3–6 | **E5** safety evaluation on the reviewer's held-out cases | E5 passes |
| 6 | Model bake-off ([09](09-ai-and-models.md) §4), now including an OpenAI path (Terra, Luna) | Decision recorded in `docs/decisions.md` |
| 6–7 | Independent security review (a day); dry run with 5 friendly testers | Findings fixed; no safety issues |
| — | **Gate G5a**: E5 passed; reviewer, lawyer and ethics approvals; security findings fixed; dry run clean. Then set `ai_arm_enabled = true` | |
| 8–12 | E4 crossover pilot, with weekly safety-event review | Decision table after Stage 5 in [04](04-hypotheses-and-experiments.md) |

| Stage 5 item | Lean | Comfortable |
|---|---:|---:|
| Reviewer: routes, protocol, labelling ≥200 cases | $2,300 | $4,500 |
| Independent case writers | $400 | $1,200 |
| Ethics review (free text, randomised) | $1,500 | $3,000 |
| Legal review for free text and AI | $1,000 | $2,500 |
| Participant thank-yous (55) | $1,375 | $2,750 |
| Security review | $800 | $1,200 |
| Tools, AI usage | $300 | $600 |
| **Stage 5 total** | **≈ $7,700** | **≈ $15,750** |

---

## Totals, honestly

| Path | Lean | When you know |
|---|---:|---|
| Stop after Stage 1 | ≈ $350 | Week 2 |
| Stop after Stage 2 | ≈ $1,000 | Week 4 |
| Stop after Stage 4 (no-typing product validated or rejected) | ≈ $3,600–5,400 | Week 12 |
| Through Stage 5 (free text and AI tested) | ≈ $11,300–13,100 | About week 24 |

The earlier plan put everything at $8,300–19,200 up front. The full path now costs about the same or a little more, because a no-typing pilot runs first. But the questions most likely to stop the business (problem, advantage, repeat use, payment, channel) are answered for **about a third of the money**, and the expensive part becomes optional.

**Time.**
- Stages 1–4: about 140 hours over 12 weeks.
- Stage 5: about 130 more.
- At 5 hours a week, double the calendar time.

---

## What to ask Claude Code, stage by stage

You do not need to write code. These are the requests to make.

| Stage | Request |
|---|---|
| 2 | "Build the no-typing conversation reset from docs/06 section 3 as a clickable v0 prototype. No text inputs anywhere. Store nothing. Add the persistent 'In danger? Get help now' link." |
| 2 | "Make a one-page landing page with the D4 message, page-view and 'tried the reset' counters with no identifiers, and a list signup." |
| 3 | "Turn the prototype into a Next.js mobile web app on Vercel. Save the chosen next step on the device only. Add optional email sign-in with Supabase using supabase/schema.sql, with ai_arm_enabled left false. Run the database tests against a Supabase branch and show me every result." |
| 3 | "Build the weekly one-question email with a neutral subject, and a report of reuse and unprompted return exactly as docs/04 D5 defines them." |
| 4 | "Add a Stripe checkout for $7.99 monthly with a 14-day refund, and report payments net of refunds and month-2 renewals." |
| 5 | "Wire src/safety/controller.ts into every text input; build the screening and generation server functions exactly as docs/05 Stage 5 and docs/07 describe; add the forged-route and malformed-reply tests." |
| 5 | "Run evals/classifier_eval.py on the reviewer's held-out cases and evals/model_bakeoff.py. Report results against the rules in docs/07 and docs/09." |

**Rule for every request:** ask Claude Code to show test output, not to say tests pass. Version 1 contained code that was described as safe and was not. The first v2 draft was described as tested in two places where no test existed ([03](03-review-log.md) E-A10).
