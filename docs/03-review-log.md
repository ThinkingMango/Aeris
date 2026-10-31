# 03 — Review Log

**What this is.** Every challenge made to the plan, and what happened to it. A challenger should be able to find their point here and see whether it was accepted, fixed, or disputed, and why.

**Status words.** *Fixed and tested*: changed, with a test you can rerun. *Accepted, plan changed*: the plan now does something different. *Accepted, claim withdrawn*: the earlier statement was wrong or overstated and is gone. *Disputed*: we disagree, with reasons.

---

## Part A — Independent review by GPT-6.1 Sol (31 October 2026, against commit f48823d)

The review's overall conclusion was: do not build or launch Aeris as specified; run a smaller discovery experiment around one guided reset for one situation. **We accept that conclusion.** Version 2 of the plan is built on it.

### 1. Product argument

| # | Finding | Status | What changed | Where |
|---|---|---|---|---|
| A1 | AI's incremental value over a scripted flow was never tested | Accepted, plan changed | The pilot compares a scripted arm with an AI arm in a crossover design. AI is kept only if it beats the scripted arm on pre-set outcomes; a tie removes AI | [04](04-hypotheses-and-experiments.md) H3, E4 |
| A2 | "Only tool" and "competitors cannot copy" were unsupported | Accepted, claim withdrawn | Competitor claims now quote vendors' own pages. A first-session benchmark against four competitors is experiment E2 | [02](02-evidence-register.md) E-MKT-01 to 05; [04](04-hypotheses-and-experiments.md) E2 |
| A3 | A chip plus a score cannot produce a precise personal reflection; specific invented context only sounds personal | Accepted, fixed and tested | The prompt forbids invented details. No-text inputs must return empty worry items. The bake-off has three no-text cases and fails any invented worry | [09](09-ai-and-models.md); `evals/model_bakeoff.py` |
| A4 | The "best intervention" query gave every exercise the whole session's improvement | Accepted, reproduced | Our own test showed two runs of one exercise each credited the full five points. The pilot has no pattern feature. Any future display must say "you rated this helpful", not "this works best for you" | [06](06-pilot-product-spec.md) §7 |

### 2. Research conclusions

| # | Finding | Status | What changed | Where |
|---|---|---|---|---|
| A5 | Exact-day retention was treated as abandonment; only 59 of 93 apps had retention data; Android only | Accepted, claim withdrawn | Verified against the paper. The pilot measures reuse **when the need recurs**, using weekly self-report of episodes | E-RET-01; [04](04-hypotheses-and-experiments.md) E4 |
| A6 | The 2025 suicidologist study measured models **rating** clinician responses, not talking to people | Accepted, claim withdrawn | Verified; the paper itself says "serving as referee is not the same as active engagement" | E-SAF-03 |
| A7 | Harmless-reply rates are not classifier sensitivity; "weaker honesty doesn't matter for the classifier" was unjustified | Accepted, plan changed | The classifier now has its own evaluation, with held-out cases, exact intervals and minimum sizes | [07](07-safety-spec.md) §6; `evals/classifier_eval.py` |
| A8 | Model scores had false precision; an unverified rumour was included; overlapping intervals do not prove equivalence; Terra supports effort "none" | Accepted, claim withdrawn | Scorecards removed. Rumour removed. Terra's "none" setting verified on OpenAI's model page and added to the candidates. Models are candidates to test, not rankings | [09](09-ai-and-models.md); E-AI-03 |

### 3. Safety

| # | Finding | Status | What changed | Where |
|---|---|---|---|---|
| A9 | Elevated and physical-symptom rules contradicted each other; fallbacks lost safety state | Fixed and tested | A deterministic controller decides routes and notices in a fixed order; the model only picks exercises from a permitted list. Failures always move to a stricter route | `src/safety/controller.ts`, 21 tests |
| A10 | Later text inputs (worry edits, notes) had no screening contract | Fixed and tested | Six text entry points are listed; every one must pass through the same screen. A test shows risk typed into a later worry edit is caught | `TEXT_INGRESS_POINTS`; [07](07-safety-spec.md) §4 |
| A11 | Self-harm, harm to others, overdose and medical emergencies all went to one crisis screen | Accepted, plan changed | Seven routes with a fixed precedence; each emergency type has its own first action. All route content is draft until a qualified reviewer approves it. "I'm safe" moves to a restricted mode, never back to normal | [07](07-safety-spec.md) §2–3 |
| A12 | Reviewing flagged cases cannot measure misses; 15 crisis cases bound the miss rate only to about 18% | Accepted, plan changed | Verified the 18.1% bound. The classifier must pass at least 59 independent held-out crisis cases before the pilot. Live misses are tracked through user-reported adverse events, and the plan states this cannot fully measure them | E-SAF-06; [07](07-safety-spec.md) §6–7 |

### 4. Database

All four findings were **reproduced** on PostgreSQL 16 before fixing (E-SEC-03). The real holes were worse than the review stated: a visitor who was **not signed in** could read another user's patterns and the admin view.

| # | Finding | Status | What changed | Tests |
|---|---|---|---|---|
| A13 | Privileged functions callable by anyone | Fixed and tested | All privileged functions moved to a private schema, run by the server only. Default execute rights revoked | N14–N16, N23, C01–C02 |
| A14 | Grants underspecified; column revoke ineffective; users could write server fields; consents editable | Fixed and tested | Explicit grants only. Users get column-level rights, never table-wide update. Server fields set by triggers. Consents are insert-and-read only. No admin view in the public schema | N02–N05, N09–N12, N20, C03–C04 |
| A15 | Child rows not tied to the parent's owner | Fixed and tested | Composite keys on (session, user) | N06–N08, N21 |
| A16 | Quota check and increment were not atomic | Fixed and tested | Reserve-then-settle with a row lock; 20 parallel requests against a limit of 3 grant exactly 3 | K01–K04 |

Each of five re-introduced v1 holes makes the suite fail (`npm run test:db:mutations`).

### 5. Evaluation script

| # | Probe from the review | Status | Test |
|---|---|---|---|
| A17 | Model escalates but proposes a non-permitted exercise; not caught | Fixed and tested | offline checker probe |
| A18 | Clinical term in worry items; not scanned | Fixed and tested | offline checker probe; controller test 16 |
| A19 | Standalone "ice" not banned, unlike the docs | Fixed and tested | controller test 17 |
| A20 | Both flags: no valid order | Fixed by design | The model no longer orders notices; controller test 4 |
| A21 | "First text" measured at the first JSON byte | Fixed and tested | `evals/tests/test_bakeoff_offline.py` test 1 |
| A22 | Complete JSON with `stop_reason=max_tokens` accepted | Fixed and tested | offline test 2. Minor in practice, because complete JSON is usually usable, but now rejected for consistency |
| A23 | Harness differed from production settings; one run only | Fixed | Output budget matches production; repeats default to 3; cold and warm calls reported separately |

### 6. Business case

| # | Finding | Status | What changed |
|---|---|---|---|
| A24 | Scenario AI costs did not follow from the stated inputs ($150 listed; $350 implied) | Accepted, claim withdrawn | Replaced by a cohort model with every input in one file ([11](11-economics.md)) |
| A25 | Same-model calls do not share a cache unless prefixes are identical | Accepted, claim withdrawn | Cost model treats each call type as separately cached (E-AI-05) |
| A26 | "Healthy margin at any usage" unsupported; $0.60/day cap allowed $18/month | Accepted, plan changed | Heavy-user tail table; fair-use cap of 60 sessions/month for any paid plan |
| A27 | Distribution was activities, not a measured channel | Accepted, plan changed | Acquisition test E6 is a gate before building a commercial version |

### 7. Privacy and regulation

| # | Finding | Status | What changed |
|---|---|---|---|
| A28 | "Delete everything" conflicted with retained safety excerpts | Accepted, plan changed | The server stores no user text at all in the pilot. Safety events keep no text and become anonymous counts on deletion, and the privacy notice says so (test D01–D02) |
| A29 | Legal advice too categorical | Accepted, plan changed | [10](10-regulatory.md) is rewritten from primary statutes, separates what the text says from how it might apply, and lists questions for a lawyer |
| A30 | FTC breach timing outdated | Accepted, claim withdrawn | Corrected from the FTC's guidance (E-REG-05) |

### 8. User experience and scope

| # | Finding | Status | What changed |
|---|---|---|---|
| A31 | First AI session required sign-in and onboarding before relief | Accepted, plan changed | Guest breathing path with no account. Pilot participants sign in once at enrolment |
| A32 | The after-slider was pre-set to the before value and celebrated a drop | Accepted, plan changed | Neutral optional feedback; no pre-filled value; no "down 3" celebration |
| A33 | Contrast claims false | Fixed | Verified; darker text variants that pass (E-DES-02) |
| A34 | 45 features and 26 screens in about 105 hours; missing push storage; non-existent table referenced | Accepted, plan changed | Pilot is about 12 screens, three exercises, no push notifications, no pattern feature, no payments |

### 9. Points where we add to or qualify the review

| # | Point | Our position |
|---|---|---|
| A35 | "Preserve the same safety baseline in both variants" | Agreed, and made concrete: **both arms run identical screening** (on-device keywords plus the server classifier). Only what the user sees differs. Our keyword test (E-SAF-05) shows a keyword list alone would leave the scripted arm unsafe |
| A36 | "If the scripted experience is just as useful, remove the AI" | Agreed. A 40-person pilot cannot prove two arms are equal; it can only fail to find a large difference (E-STAT-01). So the burden is on AI: it stays only if it shows a clear advantage |
| A37 | The review could not re-extract the system-card figures | We extracted them directly from the three PDFs. They stand as quoted in E-SAF-01. The review's interpretive points about them also stand |
| A38 | Nothing in the review was found to be factually wrong | Every testable claim we checked held up |

---

## Part B — Errors found in our own earlier work (version 1)

These were not all in the external review. They are listed so no challenger has to find them again.

| # | v1 statement | Correction | Source |
|---|---|---|---|
| B1 | Illinois "banned AI from providing therapy", implying wellness tools are clearly outside | The statute defines therapy as services to "improve" mental health, which is broad; only self-help that does not purport to be therapy is excluded | E-REG-02 |
| B2 | California requires a reminder every three hours for all users | Only for users the operator knows are minors | E-REG-03 |
| B3 | California SB 243 "gives consumers the right to sue" | Not verified in this review; removed | — |
| B4 | Sonnet 5.5 cache reads cost $0.20 per million tokens | $0.10 | E-AI-01 |
| B5 | Stripe costs 2.9% + $0.30 | Plus 0.7% Stripe Billing on subscriptions | E-BIZ-02 |
| B6 | "A keyword pre-check runs first ... belt and braces" | A keyword list caught 2 of 8 held-out crisis cases; it cannot carry safety alone | E-SAF-05 |
| B7 | Cold water in the physical reset exercise | Removed; named as a self-harm substitute to avoid | E-SAF-02 |
| B8 | A 30-day build to public launch with ~45 features | Replaced by a staged discovery plan with gates | [05](05-discovery-and-build-plan.md) |
| B9 | Opus-vs-Sonnet "you'd tell them apart less than one in five times" | No evidence; withdrawn in v1 doc 15 and not repeated | — |
| B10 | Breathing exercise apps help because breathing helps | Breathing has trial support for daily practice (E-EFF-02); a single brief session has a null trial (E-EFF-03); acute relief is unproven | E-EFF-02, E-EFF-03 |

## Part C — Bugs found while building version 2

| # | Bug | Found by | Fixed |
|---|---|---|---|
| C1 | Exercise ID pattern rejected digits | Schema load failure | Pattern widened |
| C2 | Installing `pgcrypto` in the public schema exposed about 35 functions to every caller | Catalogue test C01 | Extension removed; Postgres has `gen_random_uuid` built in |
| C3 | Test runner dropped the result line when the user ID was blank | Concurrency tests reporting 0 grants while the ledger showed spend | Output parsing fixed |

## Part D — What we kept from version 1

Short, tap-first sessions; optional typing; a small fixed exercise library; a guest path; clear AI disclosure; secrets only on the server; data minimisation; easy exit and deletion; reduced-motion support; explicit go/no-go gates. The review endorsed these as useful directions.
