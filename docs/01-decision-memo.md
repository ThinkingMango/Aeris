# 01 — Decision Memo

**Date.** 31 October 2026. **Status.** Version 2 of the Aeris plan. It replaces version 1, which an independent review showed to be overconfident, internally inconsistent, and in places unsafe (review log, [03](03-review-log.md)).

---

## The decision

**Do not build the product described in version 1.** Run a 16-week discovery programme instead. It tests, cheapest and riskiest first, whether:

1. the problem is real and frequent;
2. a short scripted flow gets used when the problem recurs;
3. AI adds anything measurable over that scripted flow;
4. the safety screen meets a minimum bar;
5. people pay after real use;
6. one channel can bring enough users.

Build a commercial product only if those gates pass ([04](04-hypotheses-and-experiments.md)).

**Cost of finding out:** about $3,000 lean to $9,900 comfortable, and about 200 hours ([05](05-discovery-and-build-plan.md)). **Cost of being wrong without finding out:** a much larger build budget, plus the risk of harming someone with an unvalidated product.

---

## Why, in seven findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **The market is not empty.** Headspace's Ebb already offers in-the-moment support with memory. Rosebud sells pattern reports. Earkick and How We Feel are free | E-MKT-01 to 04 |
| 2 | **Brief self-guided help is not proven to work.** A no-therapist single-session online intervention for anxiety in 500 adults showed no effect. Long-exhale breathing has support for daily practice, not for one-off acute relief | E-EFF-02, E-EFF-03 |
| 3 | **AI's value is unproven, and its risk is real.** The one positive generative-AI trial had researchers monitoring every reply. Anthropic's own tests show 60–70% appropriate multi-turn self-harm responses through the raw API | E-EFF-04, E-SAF-01 |
| 4 | **Illinois law is broader than v1 said.** It covers services that "improve" mental health through AI, with up to $10,000 per violation; scripted self-help sits more clearly in its exclusion | E-REG-02 |
| 5 | **A keyword list is not a safety net.** Ours caught 2 of 8 held-out crisis cases | E-SAF-05 |
| 6 | **v1's database was exploitable.** Free Plus for anyone; other users' data readable without signing in. v2 closes the tested holes, and 46 checks prove it under both Supabase defaults | E-SEC-03, E-SEC-04 |
| 7 | **The business depends on acquisition, not AI cost.** About 560 signups a month are needed just to cover fixed costs at base assumptions; about 1,530 to also pay your time | E-BIZ-03 |

## What would make us stop early

- **Week 1.** No qualified reviewer can be found or afforded (gate G0).
- **Week 3.** Fewer than 5 of 12 interviewees have weekly work-worry episodes they are unhappy with (E1).
- **Week 9.** The safety screen cannot pass E5. Then ship no free-text input, or stop.
- **Week 14.** People do not reach for Aeris when the worry recurs (E4, H2).
- **Week 16.** Fewer than 5% of pilot completers pay, or no channel shows a path to hundreds of signups a month (E6, E7).

## What you must decide now (founder decisions)

1. **Pilot country.** It determines law, crisis lines and recruitment.
2. **Budget and hours.** Lean or comfortable ([05](05-discovery-and-build-plan.md)), and hours per week.
3. **Thresholds.** Read every pass/fail number in [04](04-hypotheses-and-experiments.md) and change any you disagree with **before** you see data.
4. **Situation.** The plan targets work worry. If your interviews point elsewhere, change it in week 3, not later.

## What is already done and verifiable

| Asset | Check it yourself |
|---|---|
| Secure pilot database schema | `npm run test:db` (46 checks, both Supabase defaults) and `npm run test:db:mutations` (5 planted holes, all caught) |
| Safety controller | `npm run test:safety` (21 tests) |
| Classifier evaluation with exact statistics | `python3 evals/classifier_eval.py --parity` and `--screen keyword` |
| Model comparison harness, offline-tested | `python3 evals/tests/test_bakeoff_offline.py` |
| Cohort economics model | `python3 models/cohort_model.py` |
| Evidence register with "does not support" for every claim | [02](02-evidence-register.md) |

## What is not done, and cannot be done by an AI assistant

Interviews; a qualified reviewer's sign-off; legal advice; a human security review; testing with real people; and choosing to spend your money and time. Every gate that matters needs one of these.
