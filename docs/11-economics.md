# 11 — Economics

**What this answers.** Can Aeris become a business, and which number decides it?

**Short answer.** At realistic conversion rates, **acquisition volume decides it**. Price and AI cost matter far less. With the base assumptions, covering fixed costs needs about **560 signups every month** at steady state. Also paying 40 hours a month of your time at $30/hour needs about **1,530**. Nothing in the plan yet shows a channel that delivers that, which is why E6 is a gate ([04](04-hypotheses-and-experiments.md)).

**Where the numbers come from.** `models/cohort_model.py` with every input in `models/assumptions.json`. Each input is labelled as an assumption or tied to a source in [02](02-evidence-register.md). The tables below are pasted from the model's output, so they always match the code. To change an assumption, edit the file and rerun:

```bash
python3 models/cohort_model.py
```

**This model is for the commercial phase only.** The discovery phase has its own budget in [05](05-discovery-and-build-plan.md) (≈ $3,000 lean, ≈ $9,900 comfortable) and earns nothing.

---

## 1. Key assumptions and how weak they are

| Assumption | Base value | Basis | Weakness |
|---|---|---|---|
| Paid conversion of activated users | 3% | RevenueCat's 2.9% median download-to-paid for Health & Fitness app-store apps (E-BIZ-01) | That benchmark is for app-store apps with trial flows. Aeris is a web app, so **3% of activated users is optimistic** |
| Activation (completes a first session) | 55% | Assumption | Unknown; E3 and E4 measure it |
| Free users still active by month | 30%, 20%, 15%, then shrinking 15% a month | Assumption | Baumel 2019 measured exact-day opens and cannot be plugged in (E-RET-01) |
| Monthly-plan churn | 12% a month | Assumption | Unknown |
| Annual-plan renewal | 35% | Assumption | Unknown; renewal often disappoints in consumer wellness |
| Prices | $7.99/month, $49.99/year | v1 choice | Rosebud charges $12.99 or $8.99/month billed annually (E-MKT-02); How We Feel and much of Earkick are free (E-MKT-03, E-MKT-04). E7 tests prices with real money |
| Fees | 2.9% + $0.30 per charge, 0.7% Stripe Billing, 1.5% extra on 20% international | stripe.com (E-BIZ-02) | Confirm for your country; tax not modelled |
| AI cost per session | $0.03 | [09](09-ai-and-models.md) §5 | Falls to about $0.001 if the AI arm is removed |
| Fixed costs | $686/month | Tools ~$86, reviewer retainer $400, insurance $150, bookkeeping $50 | The reviewer and insurance are what make it responsible; they dominate |

---

## Unit economics per paying subscriber per month

| Item | Value |
|---|---:|
| Monthly plan, net of fees | $7.38 |
| Annual plan, net of fees, per month | $3.98 |
| Mean AI sessions per paying user per month (capped lognormal) | 6.7 |
| Blended contribution after AI cost | $5.20 |
| Fixed costs per month | $686 |
| Subscribers to cover fixed costs | **133** |
| Subscribers to also pay founder time (40 h at $30/h) | **363** |
| Average paid lifetime, months (blended monthly churn and annual renewal) | 14.4 |

## Signups needed per month to break even at steady state

Steady-state paying subscribers = new paying per month x average paid lifetime. Reaching steady state takes roughly one lifetime.

| Activation x conversion | Signups/month to cover fixed costs | ...and founder time |
|---|---:|---:|
| low: 45% x 1.5% = 0.68% | 1,368 | 3,732 |
| base: 55% x 3.0% = 1.65% | 560 | 1,527 |
| high: 65% x 5.0% = 3.25% | 284 | 776 |

## Heavy-user tail (does the top user lose money?)

| User percentile | Sessions/month | AI cost/month | Annual-plan net/month | Margin |
|---|---:|---:|---:|---:|
| p50 | 4 | $0.12 | $3.98 | $3.86 |
| p90 | 15 | $0.45 | $3.98 | $3.53 |
| p99 | 44 | $1.32 | $3.98 | $2.66 |
| p99.9 | 60 | $1.80 | $3.98 | $2.18 |

At the fair-use cap of 60 sessions with cold caches ($0.042/session) a user costs $2.52/month against $3.98 net. The v1 per-user cap of $0.60/day allowed $18/month.

## Scenarios (commercial phase, months after paid launch)

| Scenario | Signups/mo | Activation | Paid conv. | Paying at m12 | Paying at m24 | Op. profit m24/mo | Cumulative cash m24 | After founder time m24/mo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| low | 150 | 45% | 1.5% | 10 | 13 | $-634 | $-15,474 | $-1,834 |
| base | 400 | 55% | 3.0% | 62 | 84 | $-322 | $-9,477 | $-1,522 |
| high | 1500 | 65% | 5.0% | 461 | 623 | $2,078 | $36,668 | $878 |

## Base scenario, month by month (first 12)

| Month | Paying | Free active | Net revenue | AI cost | Fixed | Operating | Cumulative |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 4 | 220 | $120 | $10 | $686 | $-577 | $-577 |
| 2 | 10 | 286 | $190 | $14 | $686 | $-510 | $-1,087 |
| 3 | 16 | 330 | $224 | $17 | $686 | $-479 | $-1,566 |
| 4 | 22 | 363 | $238 | $19 | $686 | $-467 | $-2,034 |
| 5 | 27 | 391 | $251 | $21 | $686 | $-457 | $-2,490 |
| 6 | 33 | 415 | $262 | $23 | $686 | $-448 | $-2,938 |
| 7 | 38 | 435 | $272 | $25 | $686 | $-440 | $-3,377 |
| 8 | 43 | 452 | $280 | $26 | $686 | $-433 | $-3,810 |
| 9 | 48 | 467 | $288 | $28 | $686 | $-426 | $-4,236 |
| 10 | 53 | 479 | $294 | $29 | $686 | $-421 | $-4,657 |
| 11 | 58 | 490 | $300 | $30 | $686 | $-416 | $-5,074 |
| 12 | 62 | 499 | $305 | $31 | $686 | $-412 | $-5,486 |

---

## What these tables mean

1. **Each subscriber contributes about $5 a month** after fees and AI. That figure is driven by the 60% annual mix: an annual subscriber nets about $3.98 a month.
2. **AI cost is small and is not the problem.** Even a heavy user at the fair-use cap stays margin-positive. The v1 cap allowed $18 a month per user, which was loss-making (A26).
3. **The base scenario loses money for two years.** 400 signups a month at a 1.65% combined activation-and-conversion rate reaches only about 84 paying subscribers by month 24, against 133 needed.
4. **The high scenario works**, but it needs 1,500 signups a month **and** 5% conversion. Both are unproven.
5. **Your time is the largest cost.** Counting it at even $30/hour roughly triples the subscribers needed.

## Levers, in order of power

| Lever | Effect | How you would learn it |
|---|---|---|
| Signups per month | Linear: double signups, roughly double subscribers | E6 acquisition test |
| Conversion | Linear | E7 real-checkout test |
| Annual renewal | Large: 35% to 60% renewal raises paid lifetime from 14.4 to about 21 months | Only after year one |
| Fixed costs | Reviewer and insurance are hard to cut responsibly | — |
| Removing generative AI | Saves about $0.03 a session; small next to fixed costs | E4 decides |
| Price | Moderate, and constrained by free competitors | E7 |

## Entitlements, stated honestly

There is no "unlimited" plan. Any paid plan has a **fair-use limit of 60 guided sessions a month**, stated on the pricing page. Breathing and grounding without AI are unlimited, because they cost nothing to run.

## Alternatives if the consumer subscription fails (E6 or E7)

- **Free product, funded differently**, for example by grants or a nonprofit model, as How We Feel does (E-MKT-04).
- **Employer or B2B sales**: fewer, larger customers, but long sales cycles and security questionnaires.
- **Stop**, having spent the discovery budget rather than a build budget.
