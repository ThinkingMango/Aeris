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
| A4 | The "best intervention" query gave every exercise the whole session's improvement | Accepted, reproduced | Our own test showed two runs of one exercise each credited the full five points. The pilot has no pattern feature. Any future display must say "you rated this helpful", not "this works best for you" | [06](06-pilot-product-spec.md) §B7 |

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
| A9 | Elevated and physical-symptom rules contradicted each other; fallbacks lost safety state | Fixed and tested | A deterministic controller decides routes and notices in a fixed order; the model only picks exercises from a permitted list. Failures always move to a stricter route | `src/safety/controller.ts`, 58 tests (revised again after Part E) |
| A10 | Later text inputs (worry edits, notes) had no screening contract | Fixed and tested | Six text entry points are listed; every one must pass through the same screen. A test shows risk typed into a later worry edit is caught. Part E added: unknown entry points now throw, and session text is combined so split risk is read together. **Not yet tested: that the app calls `ingest` at every input** (the app does not exist yet) | `TEXT_INGRESS_POINTS`; [07](07-safety-spec.md) §4 |
| A11 | Self-harm, harm to others, overdose and medical emergencies all went to one crisis screen | Accepted, plan changed | Seven routes with a fixed precedence; each emergency type has its own first action. All route content is draft until a qualified reviewer approves it. "I'm safe" moves to a restricted mode, never back to normal | [07](07-safety-spec.md) §2–3 |
| A12 | Reviewing flagged cases cannot measure misses; 15 crisis cases bound the miss rate only to about 18% | Accepted, plan changed | Verified the 18.1% bound. The classifier must pass at least 59 independent held-out crisis cases before the pilot (raised in Part E to 20 per crisis route, 100 total, scored on exact route and resources). Live misses are tracked through user-reported adverse events, and the plan states this cannot fully measure them | E-SAF-06; [07](07-safety-spec.md) §6–7 |

### 4. Database

All four findings were **reproduced** on PostgreSQL 16 before fixing (E-SEC-03). The real holes were worse than the review stated: a visitor who was **not signed in** could read another user's patterns and the admin view.

| # | Finding | Status | What changed | Tests |
|---|---|---|---|---|
| A13 | Privileged functions callable by anyone | Fixed and tested | All privileged functions moved to a private schema, run by the server only. Default execute rights revoked | N14–N16, N23, C01–C02 |
| A14 | Grants underspecified; column revoke ineffective; users could write server fields; consents editable | Fixed and tested | Explicit grants only. Users get column-level rights, never table-wide update. Server fields set by triggers. Consents are insert-and-read only. No admin view in the public schema | N02–N05, N09–N12, N20, C03–C04 |
| A15 | Child rows not tied to the parent's owner | Fixed and tested | Composite keys on (session, user) | N06–N08, N21 |
| A16 | Quota check and increment were not atomic | Fixed and tested | Reserve-then-settle with a row lock; 20 parallel requests against a limit of 3 grant exactly 3 | K01–K04 |

Each of five re-introduced v1 holes makes the suite fail (`npm run test:db:mutations`). After Part E there are seven planted holes, all caught, and 60 checks under each Supabase default.

### 5. Evaluation script

| # | Probe from the review | Status | Test |
|---|---|---|---|
| A17 | Model escalates but proposes a non-permitted exercise; not caught | Fixed and tested | `evals/tests/test_bakeoff_offline.py` ("escalate=true with a non-permitted exercise is caught"). **Correction:** the first v2 draft claimed an "offline checker probe" that did not exist (Part E, E-A10). The test was added afterwards |
| A18 | Clinical term in worry items; not scanned | Fixed and tested | `evals/tests/test_bakeoff_offline.py` ("clinical term in worry_items is caught"); controller test "every generated field is checked…". Same correction as A17 |
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
| A37 | The review could not re-extract the system-card figures | We extracted them directly from the three PDFs. They stand as quoted in E-SAF-01. The review's interpretive points about them also stand. The Part E reviewer could not find the cards by web search either (E-B7), so a challenger should open the PDFs themselves |
| A38 | Nothing in the review was found to be factually wrong | Every testable claim we checked held up |

---

## Part B — Errors found in our own earlier work (version 1)

These were not all in the external review. They are listed so no challenger has to find them again.

| # | v1 statement | Correction | Source |
|---|---|---|---|
| B1 | Illinois "banned AI from providing therapy", implying wellness tools are clearly outside | The statute defines therapy as services to "improve" mental health, which is broad; only self-help that does not purport to be therapy is excluded | E-REG-02 |
| B2 | ~~California requires a reminder every three hours for all users~~ | **This entry was itself wrong** (Part E, E-A15). v1 attributed the three-hour reminder to **New York**, which is correct for New York. v1 did not make this claim about California. The real California point: the three-hour reminder applies to known minors, while an AI disclosure is owed to **all** users wherever a reasonable person could be misled (§22602(a)) | E-REG-03, E-REG-04 |
| B3 | ~~California SB 243 "gives consumers the right to sue": not verified; removed~~ | **This withdrawal was wrong** (Part E, E-A15). §22605 creates a private right of action: the greater of actual damages or $1,000 per violation, plus attorney's fees. v1 was right. Restored in E-REG-03 and [10](10-regulatory.md) | E-REG-03 |
| B4 | Sonnet 5.5 cache reads cost $0.20 per million tokens | $0.10 | E-AI-01 |
| B5 | Stripe costs 2.9% + $0.30 | Plus 0.7% Stripe Billing on subscriptions | E-BIZ-02 |
| B6 | "A keyword pre-check runs first ... belt and braces" | A keyword list routed 2 of 8 "held-out" crisis cases correctly in the first v2 test; it cannot carry safety alone | E-SAF-05 |
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

---

## Part E — Adversarial review of the first v2 draft (31 October 2026, against commit d86ff25)

**Who and how.** A separate agent reviewed the v2 draft with instructions to break it. It wrote probe scripts against the code. It re-ran every test and checked sources against primary texts. It made no changes. It reported 21 verified problems (here E-A1 to E-A21) and 8 plausible concerns it could not verify (E-B1 to E-B8). **Every test in the draft passed. The problems were in what the tests did not cover.** That is the main lesson. A green test suite proves only what it tests.

**Naming.** Code comments and test names that say "red-team A5" refer to E-A5 here.

**Count.**
- Accepted and fixed: 19.
- Accepted, partly disputed: 1 (E-A13).
- Accepted, documented as a limit: 1 (E-A21).
- Of the 8 concerns, 6 were acted on and 2 are recorded as limits.

### Verified problems

| # | Severity | Finding | Status | What changed | Test or evidence |
|---|---|---|---|---|---|
| E-A1 | Critical | `confirmSafe` lowered **every** crisis route, including overdose and abuse, to restricted | Fixed and tested | Allowed only from `crisis_self_harm`, and only with no emergency, harm-to-others, abuse or minor flag; otherwise throws | "confirmSafe is refused after …" (6 tests), "…on normal and restricted routes", "…plus abuse" |
| E-A2 | Critical | Keyword screen ejected adults as minors ("15 minutes late", "year 9 class") and missed "I want to hurt myself", "k1ll", Cyrillic look-alikes, zero-width characters and "die/disappear" | Fixed and tested | Bare ages and school years removed; self-harm phrases added; NFKD folding, confusable mapping, zero-width stripping, `/` handling; a leet pass that cannot invent ages; "can't breathe" is a physical notice, not an emergency | "no crisis keyword for ordinary work sentence" (4), "keyword screen catches" (8), "leet mapping cannot invent an age statement", "'can't breathe with this workload'…" |
| E-A3 | Critical | Evaluation counted any more severe route as correct (abuse sent to the suicide screen "passed"); the minor flag was lost under a higher route | Fixed and tested | Flags kept separately from the route; resources computed from flags; E5 scores **exact route plus required resources** | "minor plus abuse…", "a minor flag from the classifier alone ends the session"; `classifier_eval.py` scoring |
| E-A4 | High | "Inactive until reviewed" protected nothing: the app hard-coded exercises, the database logged inactive ones, and a blank reviewer passed | Fixed and tested | `decide` offers only exercises the database reports active; inserts of inactive exercises are refused; reviewer name of at least 3 characters and a plausible date | N27, N28, "no exercise is offered until the database reports it active"; mutation "unreviewed exercises loggable" |
| E-A5 | High | Anyone could sign up, get an arm, and drain the AI budget; consent was client-only | Fixed and tested | Enrolment by invite list; sessions refused unless the latest required consents are granted, including after withdrawal | N25, N26, N29, N30, P13; mutation "sessions without a consent check" |
| E-A6 | High | Settling above the estimate failed and left the ledger under-reporting spend; tiny estimates rounded to zero | Fixed and tested | Settle records real cost even above the cap, then new reservations are refused; numeric(12,6) | K05, K06 |
| E-A7 | High | Break-even of 560 signups a month contradicted the model's own simulation (about 677) | Fixed | Break-even is now solved from the simulation itself at steady state, including refunds, free-user AI cost and acquisition spend. New base figure: **646** | `models/cohort_model.py`; [11](11-economics.md) |
| E-A8 | High | The E6 ceiling of $2 per signup was above lifetime value per signup (about $1.10), and acquisition spend was not modelled | Fixed | CAC is now in the model. Lifetime value per signup is $1.09 (base). E6's ceiling is $0.50 | [11](11-economics.md); [04](04-hypotheses-and-experiments.md) E6 |
| E-A9 | High | Docs promised AI "suggested next steps" that no schema, prompt or test produced | Fixed and tested | `suggestions` (exactly 3, 80 characters each) is in the shared schema and prompt, validated, and checked by the bake-off | offline test "discomfort technique in a suggestion is caught"; controller "every generated field is checked…" |
| E-A10 | High | The review log claimed two fixes were tested by an "offline checker probe" that did not exist; one controller test was tautological | Fixed and tested; claim corrected | Both probes now exist as tests. `ingest` throws on unknown entry points, so the old test is no longer tautological. A17 and A18 above are corrected | offline tests 5–6; "unknown ingress point is rejected" |
| E-A11 | Medium | TypeScript/Python "parity" covered only the keyword function; the twins differed on null fields, emoji length, `\x1c`, and an unknown signal "constructor" | Fixed and tested | Shared whitespace class; code-point lengths; null fields not counted; `Object.hasOwn` for signals. Parity now covers keywords, validation and routing | `classifier_eval.py --parity`: 101/101 (61 keyword, 29 validation, 11 routing) |
| E-A12 | Medium | The validator missed "clinically proven", "treat", "cure", "anxiety", "therapist", "trauma", full-width "！", "hair tie"; no length limits on suggestions; duplicate plans accepted | Fixed and tested | Banned list expanded; NFKC check for "!"; length limits on every field; duplicate steps rejected | "validator rejects…" (6), "length limits…", "plan validation rejects…" |
| E-A13 | Medium | E-REG-01 misread the FDA guidance | **Partly accepted, partly disputed** | **Accepted:** the "not general wellness" list sits in the section on non-invasive sensing products, not as a general rule, so "internally inconsistent" was our overreach and is withdrawn. Accepted too: low risk is a second factor, and risk triage goes on the lawyer's list. **Disputed:** the reviewer said the "may help living well with anxiety" example does not exist. It does: it is in the guidance's second-category examples, which we confirmed in the PDF text. The reviewer's extraction missed it | E-REG-01; [10](10-regulatory.md) §2 |
| E-A14 | Medium | The Illinois entry missed three caveats, and "Illinois scripted-only" could not be implemented. The caveats: the exclusion requires self-help "available to the public"; the definition of "therapeutic communication" matches the AI arm's reflection; the scripted arm also sends text to an AI classifier | Fixed and tested | `profiles.region` (ISO 3166-2) plus an arm override set by the database when region is US-IL. All three caveats are in E-REG-02 and on the lawyer's list | P12; E-REG-02; [10](10-regulatory.md) §3 |
| E-A15 | Medium | The California entry missed two things, and our own B2 and B3 were wrong. It missed the all-users disclosure (§22602(a)) and the "evidence-based methods" duty (§22603(d)). B2 misdescribed v1. B3 withdrew a true statement about the private right of action (§22605) | Fixed; claims corrected | E-REG-03 rewritten; B2 and B3 above struck through and corrected | E-REG-03; [10](10-regulatory.md) §3 |
| E-A16 | Medium | Citation and ID errors | Fixed | Five corrections:<ul><li>E-EFF-03 is now cited as Mullarkey … Schleider, JMIR Ment Health 2022;9(4):e33473, with its design caveats.</li><li>E-EFF-02 gains its caveats: no inactive control, young sample, different protocol.</li><li>E-SEC-02 gains the 30 Oct 2026 enforcement note (unverified).</li><li>E-REG-04 gains "emotional recognition algorithms".</li><li>Wrong IDs fixed in `assumptions.json`, `banned_output_terms.json` and the schema header.</li></ul> | [02](02-evidence-register.md) |
| E-A17 | Medium | The AI cost per session ($0.03) was a stale v1 figure for three calls and a long prompt; the prompt is probably too short to cache | Fixed | Recomputed for one read call plus screening: about $0.006 raw, $0.015 planning figure. The speed gate is now measured on cold calls | [09](09-ai-and-models.md) §5; `assumptions.json` |
| E-A18 | Medium | Code and docs contradicted each other in seven places | Fixed and tested | One fix per item:<ul><li>The after-score column was removed (N32).</li><li>The kill switch was added (`global_restricted`; "global kill switch…").</li><li>The harm-to-others screen shows the emergency number ("harm to others shows the emergency number").</li><li>Check-in answers have a controller input (`checkInAnswer`; "check-in 'not sure'…").</li><li>The 24-hour rule moved to the server, read from safety events (spec in [07](07-safety-spec.md) §7; the server function is a build task).</li><li>The feedback rating became optional (P05).</li><li>A keyword-only result fails closed ("keyword-only result … fails closed").</li></ul> | as listed |
| E-A19 | Medium | E2 needed a prototype two weeks before it was built, and used primed interviewees | Fixed | Split into E2a (competitors only, weeks 2–3) and E2b (prototype vs the fastest competitor, weeks 5–6, with fresh E3 participants) | [04](04-hypotheses-and-experiments.md) |
| E-A20 | Medium | The crossover pilot was weaker than presented. Its preference measure was unblinded and recency-biased. It had no non-inferiority margins and an undefined denominator, reuse was undefined for weeks with zero episodes, the outcomes left gaps, and the E7 sample was too small for two prices | Fixed, with residual limits stated | Changes:<ul><li>Per-period ratings plus a final choice with "no preference".</li><li>Exact thresholds by completer count (27/40, 24/35, 21/30).</li><li>Margins: reuse 0.10, 5 seconds, 10 points.</li><li>Illinois excluded from H3.</li><li>Reuse defined per person, with zero-episode weeks dropped.</li><li>Every experiment has pass, revise and stop outcomes.</li><li>E7 uses a single price.</li></ul>Unblinding and carryover remain, and are listed as biases | [04](04-hypotheses-and-experiments.md) E4, E7 |
| E-A21 | Low | The "held-out" keyword cases were not truly held out. Bake-off cases are rewordings of them, and the eval prints them on every run | Accepted, documented as a limit | E-SAF-05 now says so. The held-out score rose from 2/8 to 4/8 only because phrases were added after seeing those cases. That is leakage, not improvement. E5 requires a new held-out set written by someone else | E-SAF-05; `classifier_eval.py` warning |

### Concerns the reviewer could not verify

| # | Concern | Disposition |
|---|---|---|
| E-B1 | 59 cases across five routes is about 12 per route, so the per-route bound is about 22%. Author-written cases are clustered. Risk split across fields is never seen together | **Acted on.** E5 now needs 20 per route (100 total) plus split-field cases. The controller combines session text (`combineForScreening`; test "session text is combined…"). The clustering caveat is stated in [07](07-safety-spec.md) §6 |
| E-B2 | The exclusion criteria remove the people whose crisis input the pilot most needs. Category-only events limit the reviewer. Deletion breaks follow-up. A one-tap "I'm safe" is not an assessment | **Acted on as stated limits plus options.** See [07](07-safety-spec.md) §7, §9 and §10: the tradeoff is stated, an opt-in excerpt option is offered for the reviewer and lawyer to decide, a follow-up timing is proposed, and the "I'm safe" button can be removed if the reviewer objects |
| E-B3 | Abuse victims: the quick exit leaves history; emails reveal participation; device text is readable | **Acted on.** Spec in [07](07-safety-spec.md) §8: `location.replace`, neutral subjects and sender, session text in memory. These are build tasks, not yet built |
| E-B4 | Country defaulted to US, so crisis numbers could be wrong | **Fixed and tested.** No default; a session needs a country (N33) |
| E-B5 | The classifier might share the generator's budget, so exhausting it would force everyone restricted | **Fixed and tested.** Separate budgets and per-user limits by kind (K07) |
| E-B6 | No ethics-review budget; a lean budget assumed unpaid participants; case writing and labelling unbudgeted; legal and security time thin; phase 3 too compressed; no recruitment slot | **Acted on.** [05](05-discovery-and-build-plan.md) now runs about 20 weeks, budgets independent ethics review, incentives, case writing and labelling, adds legal and security time, and gives recruitment its own slot |
| E-B7 | System-card figures, Baumel's "59 of 93", and McBain's "referee" quote could not be confirmed by search | **Recorded.** Baumel's 93/59 figures and the 3.9%/3.3% medians were checked in the paper during v2 and again by this reviewer (listed as accurate). The system-card figures were extracted from the PDFs during v2. Confidence in E-SAF-01 stays "High for the numbers", but a challenger should open the PDFs. The McBain quote is kept, marked for re-checking |
| E-B8 | The generation server might trust the client's route | **Acted on.** [07](07-safety-spec.md) §1 principle 5: the server re-runs the controller on combined session text and its own classifier result. This is a build requirement; it cannot be tested until the server function exists |

### What this review changed about how to read the plan

1. **"Tested" now means a named test you can run.** Every status above names one, or says "not yet built".
2. **Our own corrections can be wrong.** B2 and B3 were. They stay visible, struck through, so a challenger can see the history.
3. **The keyword numbers are not evidence of safety.** They show that keywords are insufficient, which is the only claim they support.

---

## Part F — Third review: commercial and technical validation (31 October 2026, against commit fd695bf)

**Who and how.** An external model reviewed the repository end to end:
- It reran the offline checks: 58 safety tests, 101/101 parity, 11 harness tests, and the cohort model. All reproduced.
- It could not run the database tests, which need PostgreSQL 16 server binaries.
- It checked competitors and sources on the web.

**Overall verdict:** "Aeris addresses a real problem, but it is not yet a validated business. Fund a small, focused demand test, not the full application or the entire 20-week AI pilot." **We accept this verdict.** The plan is restructured around it ([04](04-hypotheses-and-experiments.md), [05](05-discovery-and-build-plan.md)).

**How we checked it.**
- **Code findings:** reproduced in this repository before fixing.
- **Competitor claims:** re-read on the vendors' own pages.
- **Economic figures:** recomputed by adding them to the model.

**Count.**
- Findings: 26. All are accepted, one of them (F-S2) with a qualification.
- Points where we qualify the reviewer's proposal: 3 (F-Q1 to F-Q3).
- Disputed: none.
- Three additions of our own (F-O1 to F-O3).

### Strategy and plan

| # | Finding | Status | What changed |
|---|---|---|---|
| F-S1 | The 20-week plan spends most of the money (about $6,800 lean) on a safety build before testing demand, payment or distribution | Accepted, plan changed | Five stages with spending caps. Stages 1–4 (12 weeks, at most about $5,500) test problem, advantage, repeat use, payment and channel with **no typing and no AI**. Free text and AI are Stage 5, only after demand passes |
| F-S2 | "Adults with work stress" is too broad. Start with one recurring moment: a private three-minute reset before a difficult work conversation, for new managers | Accepted, with a qualification | Segment and job-to-be-done in [04](04-hypotheses-and-experiments.md). **Qualification:** the wedge is narrow, and a general chatbot is a strong substitute for conversation preparation. Both risks are stated, and D3 tests against each person's real alternative |
| F-S3 | The earliest test should be a scripted tool with **no free text**, simpler than our "scripted arm", which still sent text to a classifier | Accepted, plan changed | [06](06-pilot-product-spec.md) Part A: tap-only reset; nothing chosen leaves the phone; no classifier or E5 needed before Stage 5 |
| F-S4 | Distribution is tested too late; partners are the likeliest channel | Accepted, plan changed | D2 partner conversations in week 1–2; D4 landing page with a partner in week 3–4; D7 partner-sponsored pilots |
| F-S5 | Compare against the **preferred** alternative, not the fastest app. Measure first and repeat use. Keep "no preference" and dropouts | Accepted, plan changed | D3 design; "no preference" counts against Aeris; dropouts reported in D5 and E4 |
| F-S6 | Test three business models in order (subscription, partner-sponsored, one-time toolkit) without building three products | Accepted, plan changed | D6 and D7; the model now compares all three ([11](11-economics.md)) |
| F-S7 | Many stressors are external; coping does not fix bullying or overload | Accepted, plan changed | Screen A6 "This is about more than work" with workplace-help links; E-MKT-07 |
| F-S8 | People may learn the routine and stop needing the app, which is good for them and bad for a subscription | Accepted | One-time toolkit is the D6 fallback; stated in [04](04-hypotheses-and-experiments.md) |
| F-S9 | Delay employer-wide sales; no employer access to individual data | Accepted | [11](11-economics.md) "If the subscription fails"; D7 partners see only anonymous counts |
| F-S10 | Separate paid research participants from independently acquired users; count payment net of refunds, then renewal; measure cost per paying customer | Accepted, plan changed | D5, D6 and D8 definitions |

### Evidence and economics

| # | Finding | Status | Evidence |
|---|---|---|---|
| F-E1 | Rosebud's free plan ended on 30 Sep 2026 | **Verified** on help.rosebud.app; E-MKT-02 corrected | "Effective September 30, 2026, the Rosebud free plan will be retired" |
| F-E2 | Earkick now advertises subscriptions | **Verified** on its App Store listing; E-MKT-03 corrected | Premium $14.99/month; annual $44.99–107.99 |
| F-E3 | Headspace/Ebb is bundled at $69.99/year | **Verified**; E-MKT-01 updated | The page also pitches Ebb for "work stress and burnout", Aeris's exact space. That point is ours, and it makes the competitor risk worse, not better |
| F-E4 | The RevenueCat benchmark has a different denominator, so it cannot show our 3% is "optimistic" | **Accepted, claim withdrawn** | E-BIZ-01; `assumptions.json`; [11](11-economics.md) §1 |
| F-E5 | Derived figures: $5.05 a month per subscriber; $10k a month in revenue needs about 1,980 subscribers and about 8,300 signups a month; the annual plan is about 48% off; the full simulation gives $1.06 per signup, not $1.09; break-even is a long-run figure | **Verified**: all reproduced by new model code | `python3 models/cohort_model.py`. We add one figure the reviewer did not give: at 646 signups a month, the first month with no loss is **month 73**; at 800 it is month 14 |
| F-E6 | "Not stored in Aeris's database" is not "never stored"; provider retention has exceptions | Accepted | E-SEC-05 rewritten; [08](08-data-privacy-security.md) and [10](10-regulatory.md) wording |
| F-E7 | Removing a user ID does not make event rows anonymous: timestamps and small cohorts can identify people | **Accepted, fixed and tested** | Deleted accounts' safety events are folded into monthly counts by route and the rows deleted. The summary suppresses cells under 5 (D02, D03; mutation "deleted accounts leave linkable safety-event rows") |

### Technical

| # | Finding | Status | Test or evidence |
|---|---|---|---|
| F-T1 | The latency harness excluded only the first call as "cold", reported the rest, and timed "visible" text before validation | **Confirmed in code, fixed and tested** | The prompt is now sent with no `cache_control`. Each call's cache tokens are recorded, so every call is confirmed cold. The gate is `renderable_s`, taken after every check, over **all** calls (offline tests 15–16) |
| F-T2 | `validateGenerated({})` returned no problems; an invented hostile motive passed | **Confirmed, fixed and tested** | `validateReadShape` and `validateRead` check required fields, types, exactly 3 suggestions and no extra fields. New banned phrases cover attributing motives to others. TypeScript tests "an empty or malformed read is rejected…" and "validator rejects an invented motive…" (4); offline tests 11–13; parity now covers output shape (120/120). **Limit:** a word list catches only obvious cases, so the blind review rubric now asks about invented motives |
| F-T3 | The exercise approval CHECK accepts a NULL approval date, because PostgreSQL passes a CHECK whose result is NULL | **Confirmed, fixed and tested** | Removing the fix makes N24 and N34 fail. Approval is now also tied to the content version: changing the version deactivates the exercise (N35), and approving an older version fails (N39). Mutation "approval passes through a NULL date" |
| F-T4 | "Current consent" ignored document versions | **Confirmed, fixed and tested** | `app_private.required_consents` holds the versions in force. Raising one blocks sessions until re-consent (N36, P14). Mutation "consent to an outdated document version accepted" |
| F-T5 | Region was nullable and could disagree with the country | **Fixed and tested** | Region must belong to the country (N37). It is required before a session where it changes the rules: US by default (N38). Docs now say "self-reported", never "verified location" |
| F-T6 | The pilot document said one-sided; the code and the 27/40 threshold are two-sided | **Confirmed, corrected** | [04](04-hypotheses-and-experiments.md) E4 now pre-registers the exact two-sided test. `evals/stats.py` prints the thresholds and power |
| F-T7 | The blind review omitted the generated next-step suggestions | **Confirmed, fixed and tested** | `review_body` shows every user-visible field (offline test 17) |

### Models

| # | Finding | Status |
|---|---|---|
| F-L1 | Shortlist: Sonnet 5.5 vs GPT-6.1 Terra for generation, Haiku 5.5 vs GPT-6 Luna for classification. Opus as quality reference only; no need for the $10/$50 models | Accepted. [09](09-ai-and-models.md) updated. The harness still calls only the Anthropic API; adding the OpenAI path is a Stage 5 task, not done |
| F-L2 | Writing a safe reply and detecting risk accurately are different tasks | Agreed. Already the basis of the separate classifier evaluation (A7, E5) |

### Where we qualify the review

| # | Point | Our position |
|---|---|---|
| F-Q1 | The reviewer proposed a two-week scripted-use pilot (weeks 5–6) | Too short to observe return for a trigger that comes about twice a month. D5 runs **4 weeks**, and reuse is measured only for people with at least 2 conversations |
| F-Q2 | "Lead with sort it, then one step" alongside "no free text" | These conflict: sorting worries normally means typing them. **Resolved** with pre-written, reviewer-approved cards per conversation type. This is less personal than a chatbot, as [06](06-pilot-product-spec.md) §3 states plainly, and D3 tests whether it is good enough |
| F-Q3 | Stage 1–2 without a clinician | The earlier plan made "no reviewer" a stop at week 1. Interviews about work conversations, and a static prototype with no typing, are not a health service. So the reviewer is engaged at Stage 3, before anyone uses a live tool. A resource sheet covers distress in interviews |

### Our own additions while fixing

| # | Addition | Test |
|---|---|---|
| F-O1 | **The AI arm is off by default** (`ai_arm_enabled = false`). Everyone is scripted until Stage 5 is explicitly started | N40; P16; mutation "AI arm on by default" |
| F-O2 | Conversation situations (`conv_*`) and the `conversation_reset` exercise in the schema, so Stage 3 needs no schema redesign | P15 |
| F-O3 | Months to break-even in the model, which shows that the "646 signups" headline was misleading on its own | `models/cohort_model.py` |

**What this review changed about the plan, in one sentence.** The question is no longer "is the safety programme rigorous?", because it largely is. It is "has anyone shown they want this enough to come back and pay?". No one has yet, so that is what the money now buys first.
