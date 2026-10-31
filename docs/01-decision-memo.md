# 01 — Decision Memo

**Date.** 31 October 2026. **Status.** Version 2 of the Aeris plan, revised after two adversarial reviews:
- An external review of version 1 found it overconfident, internally inconsistent and in places unsafe ([03](03-review-log.md) Parts A–B).
- A red-team review of the first v2 draft found 21 more problems, four of them critical. All are fixed or stated as limits (Part E).

---

## The decision

**Do not build the product described in version 1.** Run a **20-week discovery programme** instead. It tests, cheapest and riskiest first, six questions:

1. Is the problem real and frequent?
2. Does a short scripted flow get used when the problem recurs?
3. Does AI add anything measurable over that scripted flow?
4. Does the safety screen meet a minimum bar on independent cases?
5. Do people pay after real use?
6. Can one channel bring enough users at a cost below what a user is worth?

Build a commercial product only if those gates pass ([04](04-hypotheses-and-experiments.md)).

**Cost of finding out.** About **$8,300 lean to $19,200 comfortable**, and about 260 hours ([05](05-discovery-and-build-plan.md)). Most of the money is spent after gate G2. By then you know the problem is real and the flow is usable, at a cost of about $1,000.

**Cost of being wrong without finding out.** A much larger build budget, plus the risk of harming someone with an unvalidated product.

**On the cost.** Earlier figures were too low. v1 said under $1,000. The first v2 draft said $3,000–9,900, because it assumed unpaid pilot participants and left out ethics review, independent case writers and labelling time. The money goes mainly on people who make it responsible: a clinician, a lawyer, an ethics board, participants. If that is out of reach, [05](05-discovery-and-build-plan.md) lists cheaper honest options. A reckless cheap version is not one of them.

---

## Why, in eight findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **The market is not empty.** Headspace's Ebb already offers in-the-moment support with memory. Rosebud sells pattern reports. Earkick and How We Feel are free. General chatbots are the free substitute everyone already has | E-MKT-01 to 06 |
| 2 | **Brief self-guided help is not proven to work.** A no-therapist single-session online intervention (500 adults completed) showed no effect versus a placebo activity. Long-exhale breathing has support for daily practice, against an active comparison, not for one-off acute relief, and in a different protocol from Aeris's | E-EFF-02, E-EFF-03 |
| 3 | **AI's value is unproven, and its risk is real.** The one positive generative-AI trial had researchers monitoring every reply. In Anthropic's own tests, 60–70% of multi-turn self-harm conversations were handled appropriately through the raw API | E-EFF-04, E-SAF-01 |
| 4 | **The law is broader than v1 said, and in one place broader than our first correction said.** Illinois covers AI services that "improve" mental health, defines "therapeutic communication" in words that match the AI arm's reflection, and fines up to $10,000 per violation. California lets individuals sue for at least $1,000 per violation. The first v2 draft wrongly withdrew that point | E-REG-02, E-REG-03 |
| 5 | **The real FDA question is risk, not wording.** The stress-management positioning fits the guidance's own examples. Automated suicide-risk triage may not count as "low risk" | E-REG-01 |
| 6 | **A keyword list is not a safety net.** Even after we tuned it on the cases (which contaminates them), it routes only 4 of 8 "held-out" crisis cases exactly | E-SAF-05 |
| 7 | **Passing tests is not the same as being right.** v1's database was exploitable: free Plus for anyone, and other users' data readable without signing in. The first v2 draft passed every test and still let one tap turn an overdose screen into a breathing exercise. The current code passes 60 database checks under both Supabase defaults, catches 7 of 7 planted holes, and passes 58 safety tests. Each fix names its test | E-SEC-03, E-SEC-04; [03](03-review-log.md) E-A1 |
| 8 | **The business depends on acquisition, not AI cost.** At base assumptions a signup is worth about **$1.09**. Breaking even on fixed costs needs about **646 organic signups a month**, or about **1,774** to also pay your time. Paying $1 per signup pushes break-even above 10,000 a month. AI costs about a cent and a half a session | E-BIZ-03; [11](11-economics.md) |

## What would make us stop early

| When | Stop or rescope if |
|---|---|
| Week 1 | No qualified reviewer can be found or afforded (G0) |
| Week 3 | Fewer than 5 of 12 interviewees have weekly work-worry episodes they are unhappy with (E1) |
| Week 6 | The fastest free competitor is clearly preferred over the Aeris prototype (E2b) |
| Week 11 | The safety screen cannot pass E5. Then ship no free-text input, or stop |
| Week 17 | People do not reach for Aeris when the worry recurs (E4, H2) |
| Week 19–20 | Fewer than 6 of about 40 pilot completers pay real money, or no channel shows a path to about 650 organic signups a month, or a paid cost under $0.50 per signup (E6, E7) |

**Rule.** The probability that all six questions pass is low. That is normal for a new consumer product, and it is why the plan front-loads the cheap questions. Reaching a stop at week 3 or week 6 for about $1,000 is a good outcome, not a failure.

## What you must decide now (founder decisions)

1. **Pilot country.** It determines law, crisis lines, ethics review and recruitment.
2. **Budget and hours.** Lean or comfortable ([05](05-discovery-and-build-plan.md)), and hours per week.
3. **Thresholds.** Read every pass, revise and stop number in [04](04-hypotheses-and-experiments.md). Change any you disagree with **before** you see data, and record the change in [decisions.md](decisions.md).
4. **Situation.** The plan targets work worry. If your interviews point elsewhere, change it in week 3, not later.

## What is already done and verifiable

| Asset | Check it yourself |
|---|---|
| Secure pilot database schema: invite-only enrolment, consent gate, Illinois rule, reviewer gate, separate AI budgets | `npm run test:db` (60 checks × 2 Supabase defaults); `npm run test:db:mutations` (7 of 7 planted holes caught) |
| Safety controller: routes, flags, resources, fail-closed rules, kill switch, output validation | `npm run test:safety` (58 tests) |
| Classifier evaluation with exact statistics and exact-route scoring | `python3 evals/classifier_eval.py --parity` (101/101) and `--screen keyword` |
| Model comparison harness, offline-tested | `python3 evals/tests/test_bakeoff_offline.py` (11 tests) |
| Cohort economics model, break-even solved from its own simulation | `python3 models/cohort_model.py` |
| Evidence register with "does not support" for every claim | [02](02-evidence-register.md) |
| Every challenge received and its disposition, including our own wrong corrections | [03](03-review-log.md) |

## What is not done, and cannot be done by an AI assistant

- Interviews.
- A qualified reviewer's sign-off.
- Legal advice.
- Ethics review.
- A human security review.
- Testing with real people.
- Building the app and testing it end to end. Today only its parts are tested.
- Choosing to spend your money and time.

Every gate that matters needs one of these.
