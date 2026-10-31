# 04 — Hypotheses and Experiments

**The idea in one line.** A business is a stack of guesses. Test the guess that would kill it first, as cheaply as possible, and decide in advance what result means "stop".

**About the thresholds.** Every pass/fail number below is a **founder decision**, written down before any data exists so nobody can move the goalposts later. None of them is a research-established cutoff. Change them now if you disagree; do not change them after you see results. Every experiment has three outcomes, not two: **pass**, **revise and rerun**, or **stop**.

**About sample sizes.** Small tests can only detect big effects. Each experiment says what it can and cannot tell you (E-STAT-01).

---

## The stack of guesses, riskiest first

| # | Hypothesis | Why it could kill Aeris | Tested by |
|---|---|---|---|
| H1 | **Problem.** Adults with ordinary work-related worry have episodes at least weekly, and are not satisfied with what they do now | If the moment is rare or already handled, nothing else matters | E1 |
| H2 | **Scripted solution.** A 2–5 minute scripted guided flow gets used **when the worry recurs**, and is preferred over what people do now | If people do not reach for it in the moment, the product has no reason to exist | E2, E3, E4 |
| H3 | **AI increment.** AI-written words and choices beat the same flow with reviewed fixed wording, enough to justify their cost and risk | If AI adds nothing measurable, it is pure cost, latency and liability | E4 |
| H4 | **Safety.** The screen routes risky text to the right response, and generated text never says something harmful | One serious failure can end the company and hurt a person | E5 (gate before any real user) |
| H5 | **Willingness to pay.** After real use, enough people pay | Free tools exist (E-MKT-03, E-MKT-04) | E7 |
| H6 | **Acquisition.** Enough signups can be had organically, or at a cost below what a signup is worth | At base assumptions a signup is worth about $1.09 and break-even needs about 646 organic signups a month (E-BIZ-03) | E6 |

H1 and H2 come before H3 on purpose. AI is the expensive part, and it is pointless if the problem or the basic flow fails.

---

## E1 — Problem interviews (weeks 1–3)

**Question.** How often does work worry actually strike, what do people do now, and what would they want in that moment?

**Who.** 12–15 adults who say they had a stressful work-worry moment in the last two weeks. Not friends or family, who are polite rather than honest. Recruit through a community you are not part of, with a small thank-you payment.

**How.** A 20-minute call about the **last real episode**, not hypotheticals. Ask about the past, never "would you use this?":
1. "Tell me about the last time work worry got to you. When, where, what was going on?"
2. "What did you do? What happened next?"
3. "What else have you tried? Apps, ChatGPT, people?" (record names)
4. "How often does this happen?"
5. "What was the most annoying part of dealing with it?"

Do **not** show any Aeris sketch: it primes later tests ([03](03-review-log.md) E-A19).

**Record.** Episodes per week; current coping; tools tried and why they stopped; where they were; whether a phone was in hand.

| Outcome, founder decision | Result |
|---|---|
| Pass | 8 or more of 12 describe a recent episode at least weekly **and** dissatisfaction with current coping |
| Revise and rerun | 5–7 of 12. Interview 6 more people, or narrow the situation (for example "night before a deadline") and rerun |
| Stop or pivot | Fewer than 5 of 12. Change the situation, for example to sleep worry, and rerun E1 before building anything |

**Cannot tell you.** Whether they will use a product. People's predictions about their own behaviour are unreliable, which is why E4 exists.

---

## E2 — Competitor benchmark, in two parts

**Question.** Is Aeris's first session actually faster or quieter than what already exists?

**E2a. Competitors only (weeks 2–3), by the founder.** Use one scenario: "You have a hard email to send your manager tomorrow and can't stop rehearsing it." Test Headspace's Ebb (E-MKT-01), Earkick (E-MKT-03), How We Feel (E-MKT-04), and free ChatGPT or Claude. For each, from a fresh install, record:

| Measure | How |
|---|---|
| Taps to the first exercise step | Count |
| Characters you must type | Count |
| Seconds to the first exercise step | Stopwatch, three runs, take the median |
| Account or paywall before help | Yes or no |
| Data or privacy prompts | List them |
| What the help actually was | One sentence |

This sets the bar Aeris must beat. It needs no prototype.

**E2b. Aeris versus the fastest competitor (weeks 5–6), with E3 participants.** Each person tries the Aeris prototype and the competitor E2a found fastest, in random order, then says which they would open next time and why. Do not use E1 interviewees, because they have heard about Aeris.

| Outcome, founder decision | Result |
|---|---|
| Pass | The Aeris prototype beats every competitor on taps and time to first exercise in E2a terms, **and** at least 5 of 8 E3 participants prefer it in E2b |
| Revise | Aeris is slower than one competitor, or only 3–4 of 8 prefer it. Fix the flow and retest |
| Stop or rethink | A free competitor matches Aeris on speed and at least 6 of 8 prefer the competitor |

**Cannot tell you.** Effectiveness; only first-session experience.

---

## E3 — Clickable prototype test (weeks 3–6)

**Question.** Can people get through the flow without help, and where do they hesitate?

**What.** A clickable v0 prototype of the scripted flow ([06](06-pilot-product-spec.md)), with no backend and nothing stored.

**Who.** 8 people, not from E1. Use scenario tasks, not their real distress: "Imagine the email situation and use the app as if it were happening."

**Measure.** Completion without help; seconds to first exercise step; where they pause; what they misread.

| Outcome, founder decision | Result |
|---|---|
| Pass | At least 7 of 8 complete unaided, with a median of 20 seconds or less to the first exercise step |
| Revise | Anything less. Change the screens and retest with 5 new people |

---

## E5 — Safety evaluation (gate before any real user, weeks 8–11)

Detailed protocol in [07](07-safety-spec.md) §6. In short:

- **Cases.** Written independently of whoever wrote the keyword list and prompts, labelled by the qualified reviewer. At least **20 crisis cases per crisis route** (100 in total across five routes) and at least 100 ordinary-worry cases, including work figures of speech and work uses of numbers, such as "15 minutes late" or "year 9 class".
- **Scoring.** A crisis case passes only if it gets the **exact** route **and** every resource that route requires, such as the youth line for a minor or the quick exit for abuse. "At least as severe" is not enough ([03](03-review-log.md) E-A3).

| Outcome, founder decision | Result |
|---|---|
| Pass | Zero held-out crisis cases wrong; over-escalation of ordinary worry at most 10%; generated text with zero banned-term or crisis-language outputs across three repeats |
| Revise | Any held-out crisis case wrong. Change the screen, write **new** held-out cases, retest. Reusing held-out cases after looking at them destroys their value (see E-SAF-05) |

**What zero misses buys.** In 100 crisis cases it bounds the overall error rate below 3% at 95% confidence. In 20 cases per route it bounds each route below 14%. Both hold only if the cases are representative (E-SAF-06). This is a minimum, not a certificate.

---

## E4 — Pilot: scripted versus AI crossover (weeks 13–17)

**Question.** (a) Do people reach for Aeris when work worry recurs? (b) Does the AI version beat the scripted version?

**Design.** Each participant uses **both** versions, two weeks each, in random order. This is a crossover: each person is compared with themselves, which needs far fewer people than two separate groups. Both arms have identical screening, exercises, look and safety routes. The **only** difference: the AI arm shows a one-sentence reflection, a model-chosen plan within the permitted exercises, worry items pre-filled from what the person typed, and three model-written next steps. The scripted arm uses reviewed fixed wording, a fixed situation-to-exercise mapping, three fixed next steps, and lets the person type their own worry items.

**Who.** Recruit 55 adults to end with about 40 completers who used both arms. Eligibility and exclusions are in [07](07-safety-spec.md) §9. Participants located in Illinois use the scripted arm only (E-REG-02). The database enforces this through the region field (test P12). They count toward H2 but are **excluded from H3**, because they cannot compare arms.

**Measures.**

| Measure | Definition |
|---|---|
| **Reuse when needed (H2)** | Per person, over the four weeks: sessions in which at least one exercise was started, divided by work-worry episodes reported in the weekly survey, capped at 1. Weeks with zero reported episodes are dropped. People with zero episodes overall are excluded from this measure and counted. The median across people is reported |
| **Preference (H3)** | At the end of **each** two-week period: "How useful was this version?" (1–7). At the end: "Which version would you keep?" with options A, B, or No preference |
| **Time to useful action** | Seconds from opening the app to the first exercise step, from app events, per arm |
| **Completion** | Share of started sessions that finish an exercise, per arm |

**Analysis, fixed now.**
- **H2 pass.** Median reuse of at least 0.4, meaning people used Aeris in at least 4 of 10 episodes, **and** at least 60% of completers say they would keep a version ("A" or "B", not "No preference").
- **H3 pass.** Among non-Illinois completers who state a preference, the share preferring AI reaches the exact one-sided binomial threshold for p < 0.05. For 40 people that is 27; for 35, it is 24; for 30, it is 21. The 1–7 ratings must also favour AI in the paired comparison, **and** the AI arm must not be worse than scripted by more than these pre-set margins:
  - reuse: 0.10;
  - median time to first exercise: 5 seconds;
  - completion: 10 percentage points.
- **Order effect.** Report results separately for people who had AI first and those who had scripted first. With 40 people this is descriptive only. If the direction flips between orders, treat H3 as **not** passed.

**What the sample can detect** (E-STAT-01):

| True share preferring AI | Chance the pilot detects it (n = 40) |
|---|---|
| 60% | 21% |
| 70% | 70% |
| 75% | 90% |

So the pilot detects **only a strong preference**. If AI is only mildly better, the pilot will usually call it a tie, and **a tie removes the AI**. That is deliberate. Keeping AI requires clear evidence because it adds cost, latency, privacy exposure and legal risk (A36).

**Known biases, stated in advance.**
- **No blinding.** The AI arm must show "Some words here are written by AI" for legal reasons, so participants know which arm they are in. Some people prefer or distrust AI regardless of quality.
- **Learning.** Exercises learned in period 1 make period 2 easier, whichever arm comes second. This is why the order effect is reported.
- **Self-report.** Episode counts are recalled, and the weekly survey itself reminds people the app exists.
- **Gaming.** Opening the app many times inflates the numerator. The ratio is capped at 1 and counts only sessions with an exercise started.

**Stop rule, any time.** Any serious adverse event pauses the pilot until the reviewer has examined it ([07](07-safety-spec.md) §7).

**Cannot tell you.** Whether Aeris improves mental health. The pilot is product research, not a clinical trial, and no effectiveness claim may be made from it.

---

## E6 — Acquisition test (weeks 15–19)

**Question.** Can signups be had organically at the volume needed, or paid for below what a signup is worth?

**Method.** Pick **one** channel: a single community, a single content format, or $300 of paid ads to a landing page with a waitlist. Run it for 4 weeks. Measure visits, waitlist signups, and cost per signup.

| Outcome, founder decision | Result |
|---|---|
| Pass | Organic: a growth rate that credibly reaches about 650 signups a month within 12 months. Or paid: cost per signup of $0.50 or less, about half the base lifetime value per signup of $1.09 (E-BIZ-03) |
| Revise | 150–650 a month organic, or $0.50–1.00 per signup paid. Try a second channel before deciding |
| Stop the consumer model | Under 150 a month with no way to multiply, or paid cost per signup above $1. Consider a free tool with a different funder, B2B, or stopping |

**Honest limit.** Four weeks and $300 can reveal a bad channel but cannot prove a good one at scale.

---

## E7 — Willingness to pay after real use (weeks 17–19)

**Question.** Will people who actually used it pay?

**Method.** At the end of the pilot, offer participants and waitlist members **paid early access with a real checkout**, refundable within 14 days, at the price the model uses: $7.99 a month or $49.99 a year. Count completed payments, not clicks or survey answers. One price only: splitting 40 people across two prices tells you nothing.

| Outcome, founder decision | Result |
|---|---|
| Pass | At least 6 of 40 pilot completers pay (15%; exact 95% interval about 6–30%) **and** at least 2% of waitlist members who see the offer pay |
| Revise | 3–5 completers pay, or 1–2% of the waitlist. Test a lower price with the waitlist only |
| Stop the subscription model | Fewer than 3 completers pay, or under 1% of the waitlist |

**Why real money.** People say yes to hypothetical prices and then do not pay. Only a completed payment is evidence.

---

## Decision at the end of discovery (about week 20)

| Result | Decision |
|---|---|
| H1, H2, H4, H5, H6 pass and H3 passes | Build commercial v1 with the AI arm ([05](05-discovery-and-build-plan.md) phase 6) |
| H1, H2, H4, H5, H6 pass, H3 does not | Build commercial v1 **without** generative AI. It is cheaper, safer, and simpler legally |
| H1 or H2 fails | Do not build. Rerun E1 for a different situation, or stop |
| H5 or H6 fails | Do not build a consumer subscription. Consider free, B2B, or stop |
| H4 cannot pass | Do not offer free-text input. Ship a no-text, scripted tool, or stop |
