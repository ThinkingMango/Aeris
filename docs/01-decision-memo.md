# 01 — Decision Memo

**Date.** 31 October 2026. **Status.** Version 2 of the Aeris plan, revised after three external reviews:
- **Version 1** was overconfident, internally inconsistent and in places unsafe ([03](03-review-log.md) Parts A–B).
- **The first v2 draft** had 21 more problems, four of them critical. All are fixed or stated as limits (Part E).
- **A commercial and technical validation** found the plan tested demand and distribution too late. It also found seven code gaps, now fixed and tested (Part F).

---

## The verdict, brutally

**Aeris addresses a real problem. It is not yet a business, and nothing so far shows it will become one.** The engineering and safety thinking are ahead of the evidence that anyone wants the product. So the next money buys **evidence from customers and partners**, not features.

**The bet, stated narrowly:**

> A private three-minute reset, with no typing, before a difficult work conversation. Sort what you control, choose your first sentence.

Recruit first among newly promoted managers, reached through trainers and professional communities.

**Why it might fail** (each is tested before significant money is spent):
1. A general chatbot already helps people prepare conversations, more personally.
2. Headspace's Ebb is pitched for "work stress and burnout", inside a $69.99-a-year subscription (E-MKT-01).
3. People may like it once and never return, or learn the routine and stop needing it.
4. The consumer subscription is weak at base assumptions. A signup is worth about $1.06. At 646 signups a month, the first month with no loss comes in **about year six**. $10,000 a month in revenue would need about 8,300 signups every month (E-BIZ-03).

## The decision

**Fund Stages 1–4 only: about 12 weeks, at most about $5,500, released stage by stage** ([05](05-discovery-and-build-plan.md)).

| Stage | Weeks | Cap (cumulative, lean) | Question | Stop if |
|---|---|---|---|---|
| 1 | 1–2 | $500 | Is the problem frequent and badly served? Will partners show it to their members? | Fewer than 5 of 12 interviewees have the problem |
| 2 | 3–4 | $1,500 | Do people choose Aeris over **their own** current method? Does a channel convert? | 2 or fewer of 8 choose Aeris |
| 3 | 5–9 | $5,000 | Do people come back **unprompted** when the next conversation comes? | Median reuse under 0.2, or under 20% return unprompted |
| 4 | 8–12 | $5,500 | Will people pay and renew, or a partner sponsor? At what cost per paying customer? | Fewer than 3 pay net of refunds, and no partner pays |

**Stage 5 is not funded yet.** Free text and AI cost about $7,700–15,750 more, for screening, a safety evaluation and a crossover pilot. They run only if Stage 4 passes **and** people say the no-typing tool is too generic.

**What this changes from the previous plan.** The previous plan spent about $6,800 before its first real user, all of it on a safety build for free text and AI. Now:
- the first $1,000 answers whether the problem and the advantage are real;
- the first $5,500 answers whether people return and pay;
- the safety programme is unchanged in rigour, but it is paid for only after demand is shown.

## Why, in eight findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **The market is crowded and moving.** Ebb targets work stress. Rosebud retired its free plan. Earkick sells $14.99/month Premium. How We Feel is free. General chatbots are the substitute everyone already has | E-MKT-01 to 06 |
| 2 | **Brief self-guided help is not proven to work.** A no-therapist single-session intervention (500 completed) showed no effect versus placebo. The breathing evidence is for daily practice of a different protocol, with no inactive control | E-EFF-02, E-EFF-03 |
| 3 | **Many work stressors are external.** Coping does not fix bullying or overload, and the product must say so | E-MKT-07; [06](06-pilot-product-spec.md) A6 |
| 4 | **Free text and AI carry most of the risk and cost.** They need crisis screening, a 200-case independent evaluation, provider retention disclosures, and Illinois legal review. A no-typing tool needs none of that to test demand | E-SAF-01, E-SAF-05, E-REG-02, E-SEC-05 |
| 5 | **The law is broad where AI reflects feelings.** Illinois defines "therapeutic communication" in words close to an AI reflection. California allows individual lawsuits at $1,000 or more per violation | E-REG-02, E-REG-03 |
| 6 | **Acquisition and retention decide the business, not AI cost.** About $0.015 a session for AI, against $1.06 of value per signup | E-BIZ-03; [11](11-economics.md) |
| 7 | **Passing tests is not the same as being right.** Each review found problems that every existing test had missed. The code now passes 65 safety tests, 71 database checks under both Supabase defaults with 11 of 11 planted holes caught, 120 of 120 parity checks and 17 harness tests. Each fix names its test | [03](03-review-log.md) Parts E–F |
| 8 | **Our own earlier figures were too rosy.** Examples: "646 signups to break even" without saying it takes six years; "3% conversion is optimistic" from a benchmark with a different denominator; "free" competitors that now charge | [03](03-review-log.md) Part F |

## What you must decide now (founder decisions)

1. **One country and one language.** This sets the law, the crisis lines, the partners and the lawyer.
2. **The segment.** Default: people who manage others, before difficult conversations. Change it in week 2 if the interviews point elsewhere.
3. **The thresholds.** Read every pass, revise and stop number in [04](04-hypotheses-and-experiments.md). Change any you disagree with **before** you see data, and record it in [decisions.md](decisions.md).
4. **Hours.** Stages 1–4 take about 140 hours, roughly 12 a week.

## What is already done and verifiable

| Asset | Check it yourself |
|---|---|
| Pilot database schema covering three things: enrolment and versioned consent; reviewer approval tied to content version; AI off by default, separate AI budgets and aggregate-only deleted safety data | `npm run test:db` (71 checks × 2 Supabase defaults); `npm run test:db:mutations` (11 of 11 planted holes caught) |
| Safety controller and output validation, for Stage 5 | `npm run test:safety` (65 tests) |
| Classifier evaluation with exact statistics and exact-route scoring | `python3 evals/classifier_eval.py --parity` (120/120) |
| Model comparison harness, offline-tested, timing approval on cold calls | `python3 evals/tests/test_bakeoff_offline.py` (17 tests) |
| Cohort economics: break-even, months to break even, revenue targets, three business models | `python3 models/cohort_model.py` |
| Evidence register, review log, staged experiments with pre-set thresholds | [02](02-evidence-register.md), [03](03-review-log.md), [04](04-hypotheses-and-experiments.md) |

## What is not done, and cannot be done by an AI assistant

- Interviews and partner conversations.
- A qualified reviewer's sign-off.
- Legal advice.
- Testing with real people.
- Building the app and testing it end to end: today only its parts are tested.
- Choosing to spend your money and time.

Every gate needs one of these. **The next useful thing is twelve conversations with managers, not more code.**
