# 04 — Hypotheses and Experiments

**The idea in one line.** A business is a stack of guesses. Test the guess that would kill it first, as cheaply as possible, and decide in advance what result means "stop".

**About the thresholds.** Every pass/fail number below is a **founder decision**, written down before any data exists so nobody can move the goalposts later. None of them is a research-established cutoff. Change them now if you disagree; do not change them after you see results.

**About sample sizes.** Small tests can only detect big effects. Each experiment says what it can and cannot tell you (E-STAT-01).

---

## The stack of guesses, riskiest first

| # | Hypothesis | Why it could kill Aeris | Tested by |
|---|---|---|---|
| H1 | **Problem.** Adults with ordinary work-related worry have episodes at least weekly, and are not satisfied with what they do now | If the moment is rare or already handled, nothing else matters | E1 |
| H2 | **Scripted solution.** A 2–5 minute scripted guided flow gets used **when the worry recurs**, and is preferred over what people do now | If people do not reach for it in the moment, the product has no reason to exist | E2, E3, E4 |
| H3 | **AI increment.** AI-written words and choices beat the same flow with reviewed fixed wording, enough to justify their cost and risk | If AI adds nothing measurable, it is pure cost, latency and liability | E4 |
| H4 | **Safety.** The screen routes risky text correctly, and generated text never says something harmful | One serious failure can end the company and hurt a person | E5 (gate before any real user) |
| H5 | **Willingness to pay.** After real use, enough people pay | Free tools exist (E-MKT-03, E-MKT-04) | E7 |
| H6 | **Acquisition.** One channel can deliver enough signups at a cost the economics allow | The model needs ~560 signups a month just to cover fixed costs (E-BIZ-03) | E6 |

H1 and H2 come before H3 on purpose. AI is the expensive part, and it is pointless if the problem or the basic flow fails.

---

## E1 — Problem interviews (weeks 1–3)

**Question.** How often does work worry actually strike, what do people do now, and what would they want in that moment?

**Who.** 12–15 adults who say they had a stressful work-worry moment in the last two weeks. Not friends or family, who are polite rather than honest. Recruit through a community you are not part of, such as a professional subreddit or LinkedIn group, with a small thank-you payment.

**How.** A 20-minute call about the **last real episode**, not hypotheticals. The Mom Test rule: ask about the past, never "would you use this?".
1. "Tell me about the last time work worry got to you. When, where, what was going on?"
2. "What did you do? What happened next?"
3. "What else have you tried? Any apps, ChatGPT, people?" *(record names)*
4. "How often does this happen?"
5. "What was the most annoying part of dealing with it?"
6. Only at the end: show a sketch of the flow, then ask "When would you have used this, and when not?"

**Record.** Episodes per week; current coping; tools tried and why they stopped; where they were; whether a phone was in hand.

**Pass, founder decision.** At least 8 of 12 describe a recent episode at least weekly **and** dissatisfaction with current coping.
**Kill or pivot.** Fewer than 5 of 12. Change the situation, for example to sleep worry, and rerun E1 before building anything.
**Cannot tell you.** Whether they will use a product. People's predictions about their own behaviour are unreliable, which is why E4 exists.

---

## E2 — Competitor first-session benchmark (weeks 2–3, in parallel)

**Question.** Is Aeris's first session actually faster or quieter than what already exists?

**Products.** Headspace's Ebb (E-MKT-01), Earkick (E-MKT-03), How We Feel (E-MKT-04), free ChatGPT or Claude, and the Aeris prototype once it exists.

**Method.** One scenario: "You have a hard email to send your manager tomorrow and can't stop rehearsing it." For each product, from a fresh install, record:

| Measure | How |
|---|---|
| Taps to the first exercise step | Count |
| Characters you must type | Count |
| Seconds to the first exercise step | Stopwatch, three runs, take the median |
| Account or paywall before help | Yes or no |
| Data or privacy prompts | List them |
| What the help actually was | One sentence |

Then 5 of the E1 participants each try Aeris and one competitor, in random order, and say which they would open next time and why.

**Pass, founder decision.** Aeris reaches the first exercise in fewer taps and less time than every competitor, and at least 3 of 5 participants prefer it.
**Kill or pivot.** If a free competitor matches Aeris on speed and is preferred, Aeris has no distinct reason to exist in this form.
**Cannot tell you.** Effectiveness; only first-session experience.

---

## E3 — Clickable prototype test (weeks 3–6)

**Question.** Can people get through the flow without help, and where do they hesitate?

**What.** A clickable v0 prototype of the scripted flow ([06](06-pilot-product-spec.md)), with no backend and nothing stored.

**Who.** 8 people, ideally different from E1. Use scenario tasks, not their real distress: "Imagine the email situation and use the app as if it were happening."

**Measure.** Task completion without help; seconds to first exercise step; where they pause; what they misread; one-word reaction at the end.

**Pass, founder decision.** At least 7 of 8 complete the flow unaided, with a median of 20 seconds or less to the first exercise step.
**Fix-and-retest.** Anything below that: change the screens and retest with 5 new people.
**Cannot tell you.** Real-world use, preference over time, or AI value.

---

## E5 — Safety evaluation (gate before any real user, weeks 6–9)

Detailed protocol in [07](07-safety-spec.md) §6. In short:

- **Cases.** At least 59 crisis cases and 100 ordinary-worry cases, written independently of the person who writes the keyword list, and labelled by a qualified reviewer. Held out: nobody tunes the rules while looking at them.
- **Pass, founder decision.** Zero crisis cases under-routed on the held-out set, which bounds the true miss rate below 5% at 95% confidence **if the cases are representative** (E-SAF-06). Over-escalation of ordinary worry at most 10%. Generated text: zero banned-term or crisis-language outputs across three repeats.
- **Fail.** Any held-out crisis miss: change the screen, write **new** held-out cases, retest. Reusing the old held-out cases after looking at them destroys their value.

This is a minimum, not a certificate. It cannot tell you how the system behaves with real people.

---

## E4 — Pilot: scripted versus AI crossover (weeks 10–14)

**Question.** (a) Do people reach for Aeris when work worry recurs? (b) Does the AI version beat the scripted version?

**Design.** Each participant uses **both** versions, two weeks each, in random order. This is a crossover: each person is compared with themselves, which needs far fewer people than two separate groups. Both arms have identical screening, exercises, look and safety routes. The **only** difference: the AI arm shows a one-sentence reflection, a model-chosen plan within the permitted exercises, pre-filled worry items from what the person typed, and three suggested next steps. The scripted arm uses reviewed fixed wording, a fixed situation-to-exercise mapping, and lets the person type their own worry items.

**Who.** Recruit 55 adults to end with about 40 completers. Eligibility and exclusions in [07](07-safety-spec.md) §8. During the pilot, participants located in Illinois use the scripted arm only (E-REG-02).

**Primary measures.**

| Measure | Definition | Why this one |
|---|---|---|
| **Reuse when needed** | Each week: "How many times did work worry get to you this week?" and the app's own count of sessions started. Ratio = sessions ÷ episodes, capped at 1 | Measures the real promise. Not daily opens, which an episodic tool should not chase (A5) |
| **Preference** | At the end: "Which version would you keep?" | The crossover's main comparison |
| **Time to useful action** | Seconds from opening the app to the first exercise step, from app events | The speed promise |
| **Completion** | Share of started sessions that finish an exercise | Whether the flow holds attention |

**Secondary.** "How helpful was that?" (1–5, no pre-filled value); free-text reasons in exit interviews; any adverse experience.

**Pass for H2, founder decision.** Median reuse ratio of at least 0.4, meaning people used Aeris in at least 4 of 10 worry episodes, **and** at least 60% of completers say they would keep using some version.

**Pass for H3, founder decision.** At least 27 of 40 completers (67%) prefer the AI version. This is the exact binomial threshold for p < 0.05 with 40 people, **and** the AI arm is not worse on reuse or time to action.

**What the sample can detect** (E-STAT-01):

| True share preferring AI | Chance the pilot detects it |
|---|---|
| 60% | 21% |
| 70% | 70% |
| 75% | 90% |

So the pilot detects **only a strong preference**. If AI is only mildly better, the pilot will usually call it a tie, and **a tie removes the AI**. That is deliberate. Keeping AI requires clear evidence because it adds cost, latency, privacy exposure and legal risk (A36).

**Stop rule, any time.** Any serious adverse event pauses the pilot until the reviewer has examined it. The definition is in [07](07-safety-spec.md) §7.

**Cannot tell you.** Whether Aeris improves mental health. The pilot is product research, not a clinical trial, and no effectiveness claim may be made from it.

---

## E6 — Acquisition test (weeks 12–16, overlapping)

**Question.** Can one channel deliver signups at a viable rate?

**Method.** Pick **one** channel: a single community, a single content format, or $300 of paid ads to a landing page with a waitlist. Measure visits, waitlist signups, and cost per signup. Run it for 4 weeks.

**Pass, founder decision.** A credible path to 560 signups a month, the base-case figure needed to cover fixed costs (E-BIZ-03), at a cost per signup under $2.
**Kill or pivot.** Under 100 signups a month with no clear way to multiply: the consumer subscription model is unlikely to work. Consider instead a free tool, a B2B route such as employers, or stopping.

---

## E7 — Willingness to pay after real use (weeks 14–16)

**Question.** Will people who actually used it pay?

**Method.** At the end of the pilot, offer participants and waitlist members **paid early access with a real checkout**, refundable within 14 days. Two prices, randomly shown: $4.99/month and $7.99/month, or about $35 and $50 a year. Count completed payments, not clicks or survey answers.

**Pass, founder decision.** At least 15% of pilot completers pay, and at least 2% of waitlist members who see the offer pay.
**Kill or pivot.** Under 5% of completers pay: the product may be valued but not paid for. Consider a free product with a different funder, or stop.

**Why real money.** People say yes to hypothetical prices and then do not pay. Only a completed payment is evidence.

---

## Decision at the end of discovery (about week 16)

| Result | Decision |
|---|---|
| H1, H2, H4, H5, H6 pass and H3 passes | Build commercial v1 with the AI arm ([05](05-discovery-and-build-plan.md) phase 6) |
| H1, H2, H4, H5, H6 pass, H3 does not | Build commercial v1 **without** generative AI. It is cheaper, safer, and simpler legally |
| H1 or H2 fails | Do not build. Re-run E1 for a different situation, or stop |
| H5 or H6 fails | Do not build a consumer subscription. Consider free, B2B, or stop |
| H4 cannot pass | Do not offer free-text input. Ship a no-text, scripted tool, or stop |
