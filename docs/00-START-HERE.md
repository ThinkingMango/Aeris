# Aeris — Start Here (version 2, 31 October 2026)

**Aeris** is a proposed stress-management tool for stressful moments at work. This repository holds the plan to find out, cheaply and safely, whether it should exist.

**Version 1 is archived** in [archive/v1](archive/v1/). It was challenged by an independent review and found overconfident, inconsistent and in places unsafe. Every finding and correction is in the [review log](03-review-log.md). Do not build from version 1.

---

## Read in this order

| # | Document | Answers | Read time |
|---|---|---|---|
| 01 | [Decision memo](01-decision-memo.md) | What we are doing, why, and what would make us stop | 5 min |
| 02 | [Evidence register](02-evidence-register.md) | Every factual claim, its source, what it supports **and what it does not** | Reference |
| 03 | [Review log](03-review-log.md) | Every challenge received and what happened to it | 10 min |
| 04 | [Hypotheses and experiments](04-hypotheses-and-experiments.md) | The six guesses the business rests on, and the tests with pass/fail rules set in advance | 15 min |
| 05 | [Discovery and build plan](05-discovery-and-build-plan.md) | 16 weeks, phase by phase, with gates, budget and hours | 10 min |
| 06 | [Pilot product spec](06-pilot-product-spec.md) | One situation, three exercises, two arms, about 12 screens, accessible colours | 10 min |
| 07 | [Safety spec](07-safety-spec.md) | Routes, precedence, screening, evaluation sizes, pilot monitoring, honest limits | 15 min |
| 08 | [Data, privacy and security](08-data-privacy-security.md) | Data map, permission matrix, tests, deletion, incident response | 10 min |
| 09 | [AI and models](09-ai-and-models.md) | AI as a hypothesis; candidates; selection rules fixed in advance; cost | 10 min |
| 10 | [Law and regulation](10-regulatory.md) | What the statutes say, how they might apply, questions for a lawyer | 15 min |
| 11 | [Economics](11-economics.md) | Cohort model; the number that decides viability (signups per month) | 10 min |
| 12 | [v0 prompts](12-v0-prompts.md) | Copy-and-paste prompts for the prototype | Reference |
| — | [decisions.md](decisions.md) | Decisions as they are made, with dates and evidence | Living |

## Verify instead of trusting

Everything checkable is checkable with one command. Node 22.6+, Python 3.10+, and the PostgreSQL 16 server binaries are needed for the database tests.

| Claim | Command | Expected |
|---|---|---|
| The safety controller behaves as specified | `npm run test:safety` | 21 passing |
| The database blocks every attack from the review, under both Supabase defaults | `npm run test:db` | ALL TESTS PASSED (46 checks × 2) |
| Those database tests are not vacuous | `npm run test:db:mutations` | 5 of 5 planted holes caught |
| Python and TypeScript apply identical text rules | `python3 evals/classifier_eval.py --parity` | 34/34 agree |
| A keyword list alone is not a safety net | `python3 evals/classifier_eval.py --screen keyword` | Held-out crisis 2/8 |
| Exact statistics behind the evaluation sizes | `python3 evals/stats.py` | 0/15 → 18.1%; n ≥ 59 for <5% |
| The model harness rejects bad output and times visible text | `python3 evals/tests/test_bakeoff_offline.py` | ALL PASSED |
| The economics tables | `python3 models/cohort_model.py` | Matches [11](11-economics.md) |

## For challengers (ChatGPT, Gemini, Grok, people)

The most useful challenges attack the **evidence register**, the **thresholds**, or the **tests**. Here is where the plan expects to be attacked, and where it answers.

| Likely challenge | Where it is answered |
|---|---|
| "Why would anyone use this instead of free ChatGPT or How We Feel?" | Unknown, and the plan says so. E1 and E2 test it before building ([04](04-hypotheses-and-experiments.md)) |
| "Does AI add value?" | Unknown. The pilot crossover tests it, and a tie removes AI (E4, H3) |
| "The pilot is too small" | Yes, for small effects. The power table shows what 40 people can and cannot detect (E-STAT-01) |
| "Is it safe?" | Not claimed. Minimum evaluation sizes, fail-closed design and stated limits are in [07](07-safety-spec.md) |
| "Is it legal?" | Not claimed. Primary statute text plus questions for a lawyer are in [10](10-regulatory.md) |
| "The numbers are made up" | The economic inputs are assumptions, labelled as such in one file, with the pilot designed to replace them ([11](11-economics.md)) |
| "The database or safety code is wrong" | Run the tests; add a failing test; we will fix it and log it in [03](03-review-log.md) |
| "A cited source does not say that" | Check the ID in [02](02-evidence-register.md). If you are right, the claim is wrong |

**What the plan still lacks, by design:** real user data, a qualified reviewer's sign-off, legal advice, and a human security review. An AI assistant cannot supply any of these.
