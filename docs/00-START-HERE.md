# Aeris — Start Here (version 2, 31 October 2026)

**Aeris** is a proposed private, three-minute, no-typing reset before a difficult work conversation. This repository holds the plan to find out, cheaply and safely, whether it should exist.

**Current decision:** fund a demand test only. Stages 1–4 take about 12 weeks and at most about $5,500, released stage by stage. Free text and AI (Stage 5) are not funded until people have shown they return and pay ([01](01-decision-memo.md)).

**Version 1 is archived** in [archive/v1](archive/v1/). It was challenged by an independent review and found overconfident, inconsistent and in places unsafe. Do not build from version 1.

**Version 2 has been attacked too.** An adversarial review of the first v2 draft found 21 more problems. Four were critical: a crisis route could be lowered by one tap; ordinary work sentences ended sessions; the evaluation scored the wrong crisis screen as correct; and the break-even figure contradicted its own model. All are fixed, and each fix names a test. Every finding, correction and remaining dispute is in the [review log](03-review-log.md), including two of our own corrections that turned out to be wrong.

**A third review** (Part F) concluded that the plan tested demand and distribution too late, and that the subscription economics are weak at base assumptions. We agree, and the plan is now staged around that. It also found seven code gaps, each confirmed and fixed with a test.

---

## Read in this order

| # | Document | Answers | Read time |
|---|---|---|---|
| 01 | [Decision memo](01-decision-memo.md) | What we are doing, why, and what would make us stop | 5 min |
| 02 | [Evidence register](02-evidence-register.md) | Every factual claim, its source, what it supports **and what it does not** | Reference |
| 03 | [Review log](03-review-log.md) | Every challenge received and what happened to it | 10 min |
| 04 | [Hypotheses and experiments](04-hypotheses-and-experiments.md) | The segment, the guesses the business rests on, and staged tests with pass, revise and stop rules set in advance | 15 min |
| 05 | [Discovery and build plan](05-discovery-and-build-plan.md) | Five stages with spending caps: about $5,500 for Stages 1–4, then Stage 5 only if they pass | 10 min |
| 06 | [Product spec](06-pilot-product-spec.md) | Part A: the no-typing conversation reset (Stages 2–4). Part B: the free-text, two-arm pilot (Stage 5) | 10 min |
| 07 | [Safety spec](07-safety-spec.md) | Routes, precedence, screening, evaluation sizes, pilot monitoring, honest limits | 15 min |
| 08 | [Data, privacy and security](08-data-privacy-security.md) | Data map, permission matrix, tests, deletion, incident response | 10 min |
| 09 | [AI and models](09-ai-and-models.md) | AI as a hypothesis; candidates; selection rules fixed in advance; cost | 10 min |
| 10 | [Law and regulation](10-regulatory.md) | What the statutes say, how they might apply, questions for a lawyer | 15 min |
| 11 | [Economics](11-economics.md) | Cohort model: break-even, months to break even, revenue targets, three business models | 10 min |
| 12 | [v0 prompts](12-v0-prompts.md) | Copy-and-paste prompts for the prototype | Reference |
| — | [decisions.md](decisions.md) | Decisions as they are made, with dates and evidence | Living |

## Verify instead of trusting

Everything checkable is checkable with one command. Node 22.6+, Python 3.10+, and the PostgreSQL 16 server binaries are needed for the database tests.

| Claim | Command | Expected |
|---|---|---|
| The safety controller and output validation behave as specified, including every red-team probe | `npm run test:safety` | 65 passing |
| The database blocks every attack from all three reviews, under both Supabase defaults | `npm run test:db` | ALL TESTS PASSED (71 checks × 2) |
| Those database tests are not vacuous | `npm run test:db:mutations` | 11 of 11 planted holes caught |
| Python and TypeScript apply identical text, validation, routing and output-shape rules | `python3 evals/classifier_eval.py --parity` | 120/120 agree |
| A keyword list alone is not a safety net | `python3 evals/classifier_eval.py --screen keyword` | Held-out crisis 4/8 exact (and contaminated; see E-SAF-05) |
| Exact statistics behind the evaluation and pilot sizes | `python3 evals/stats.py` | 0/15 → 18.1%; n ≥ 59 for <5%; crossover needs 27/40 |
| The model harness rejects bad and malformed output, times approval on confirmed-cold calls, and shows every field to reviewers | `python3 evals/tests/test_bakeoff_offline.py` | 17 PASS, ALL PASSED |
| The economics tables | `python3 models/cohort_model.py` | Matches [11](11-economics.md): 646 signups a month, but first month with no loss at month 73; $1.06 per signup; $10k a month in revenue needs about 8,300 signups a month |

## For challengers (ChatGPT, Gemini, Grok, people)

The most useful challenges attack the **evidence register**, the **thresholds**, or the **tests**. Here is where the plan expects to be attacked, and where it answers.

| Likely challenge | Where it is answered |
|---|---|
| "Why would anyone use this instead of free ChatGPT, Ebb or How We Feel?" | Unknown, and the plan says so. D3 tests Aeris against **each person's own** current method in week 3–4, for about $1,000 spent ([04](04-hypotheses-and-experiments.md)) |
| "This is not a business" | Possibly right. At base assumptions the subscription takes about six years to reach a month with no loss. Stage 4 tests payment, renewal, a one-time toolkit and partner sponsorship before anything is built at scale ([11](11-economics.md)) |
| "You test distribution too late" | Fixed: partners in week 1–2, a landing-page funnel in week 3–4, cost per paying customer in Stage 4 |
| "Does AI add value?" | Unknown, and not tested until Stage 5. The crossover then decides, and a tie removes AI (E4, H3) |
| "The pilot is too small" | Yes, for small effects. The power table shows what 40 people can and cannot detect (E-STAT-01) |
| "Is it safe?" | Not claimed. Minimum evaluation sizes (20 per crisis route), fail-closed design, flags that survive higher routes, and stated limits are in [07](07-safety-spec.md) |
| "Is it legal?" | Not claimed. Primary statute text plus questions for a lawyer are in [10](10-regulatory.md) |
| "The numbers are made up" | The economic inputs are assumptions, labelled as such in one file, with the pilot designed to replace them ([11](11-economics.md)). The model solves break-even from its own simulation, so the headline cannot drift from the tables |
| "Your tests pass, so what?" | Agreed: passing tests prove only what they test. The first v2 draft passed every test and still had 21 problems. That is why each claim in [03](03-review-log.md) names a test, or says "not yet built" |
| "The database or safety code is wrong" | Run the tests; add a failing test; we will fix it and log it in [03](03-review-log.md) |
| "A cited source does not say that" | Check the ID in [02](02-evidence-register.md). If you are right, the claim is wrong |

**What the plan still lacks:**
- real user data;
- a qualified reviewer's sign-off;
- legal advice;
- ethics review;
- a human security review;
- customers or partners;
- the app itself. The controller and schema are tested in isolation, but nothing is tested end to end.

An AI assistant cannot supply any of these.
