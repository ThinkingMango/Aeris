# 11 — Economics

**What this answers.** Can Aeris become a business, and which number decides it?

**Short answer.** At realistic conversion rates, **acquisition decides it**. Price and AI cost matter far less.

- **Organic signups needed.** At the base assumptions, covering fixed costs needs about **646 signups every month**, all organic. Also paying 40 hours a month of your time at $30/hour needs about **1,774**.
- **Paid acquisition.** Each signup is worth only about **$1.09** over its lifetime. Paying $1 per signup pushes break-even above 10,000 signups a month, and paying $2 never breaks even.

So the business case depends on cheap, organic acquisition that nothing in the plan has yet shown. That is why E6 is a gate ([04](04-hypotheses-and-experiments.md)).

**Where the numbers come from.** `models/cohort_model.py`, with every input in `models/assumptions.json`. Each input is labelled as an assumption or tied to a source in [02](02-evidence-register.md). The tables below are pasted from the model's output. Break-even is solved by running the cohort simulation itself to steady state. That replaces a shortcut formula the red-team showed was about 20% optimistic ([03](03-review-log.md) part E). To change an assumption, edit the file and rerun:

```bash
python3 models/cohort_model.py
```

**This model is for the commercial phase only.** The discovery phase has its own budget in [05](05-discovery-and-build-plan.md) and earns nothing.

---

## 1. Key assumptions and how weak they are

| Assumption | Base value | Basis | Weakness |
|---|---|---|---|
| Paid conversion of activated users | 3% | RevenueCat's 2.9% median download-to-paid for Health & Fitness app-store apps (E-BIZ-01) | That benchmark is for app-store apps with trial flows; Aeris is a web app, so **3% of activated users is optimistic** |
| Activation (completes a first session) | 55% | Assumption | Unknown; E3 and E4 measure it |
| Free users still active by month | 30%, 20%, 15%, then shrinking 15% a month | Assumption | Baumel 2019 measured exact-day opens and cannot be plugged in (E-RET-01) |
| Monthly-plan churn | 12% a month | Assumption | Unknown |
| Annual-plan renewal | 35% | Assumption | Unknown; renewal often disappoints in consumer wellness |
| Prices | $7.99/month, $49.99/year | v1 choice | Rosebud charges $12.99/month, or $8.99/month billed annually (E-MKT-02); How We Feel and much of Earkick are free (E-MKT-03, E-MKT-04). E7 tests the price with real money |
| Fees | 2.9% + $0.30 per charge, 0.7% Stripe Billing, 1.5% extra on 20% international | stripe.com (E-BIZ-02) | Confirm for your country; tax not modelled |
| AI cost per session | $0.015 | [09](09-ai-and-models.md) §5: one Sonnet 5.5 read plus two Haiku 5.5 screens, ×2.5 margin | About $0.001 if the AI arm is removed |
| Fixed costs | $686/month | Tools about $86, reviewer retainer $400, insurance $150, bookkeeping $50 | The reviewer and insurance are what make it responsible; they dominate |
| Acquisition cost (CAC) | Shown at $0, $0.50, $1 and $2 per signup | Not yet known | E6 measures it |

---

## Unit economics per paying subscriber per month

| Item | Value |
|---|---:|
| Monthly plan, net of fees | $7.38 |
| Annual plan, net of fees, per month | $3.98 |
| Annual share of NEW subscribers / of the steady-state BASE | 60% / 77% |
| Mean AI sessions per paying user per month (capped lognormal) | 6.7 |
| Contribution per subscriber at steady state, after fees and AI | $4.69 |
| Average paid lifetime, months | 14.4 |
| Fixed costs per month | $686 |
| Founder time, if paid (40 h at $30/h) | $1200 |

## Lifetime value and the most you can pay for a signup

| Scenario | Lifetime contribution per paying subscriber | Per signup (x activation x conversion) |
|---|---:|---:|
| low | $66.32 | **$0.45** |
| base | $66.32 | **$1.09** |
| high | $66.32 | **$2.16** |

Paying more than the per-signup figure to acquire a user loses money on every signup, before fixed costs.

## Signups needed per month to break even (from the simulation, steady state)

Solved by running the cohort simulation for 240 months and finding the smallest signup rate with a non-negative monthly result. Includes refunds, free-user AI cost and acquisition spend. Reaching steady state takes years.

| Scenario | Covers | CAC $0 | CAC $0.5 | CAC $1 | CAC $2 |
|---|---|---:|---:|---:|---:|
| low | fixed costs | 1,625 | never | never | never |
| low | + founder time | 4,466 | never | never | never |
| base | fixed costs | 646 | 1,219 | 10,826 | never |
| base | + founder time | 1,774 | 3,349 | 29,756 | never |
| high | fixed costs | 324 | 424 | 614 | 5,771 |
| high | + founder time | 891 | 1,166 | 1,686 | 15,860 |

## Heavy-user tail (does the top user lose money?)

| User percentile | Sessions/month | AI cost/month | Annual-plan net/month | Margin |
|---|---:|---:|---:|---:|
| p50 | 4 | $0.06 | $3.98 | $3.92 |
| p90 | 15 | $0.22 | $3.98 | $3.75 |
| p99 | 44 | $0.66 | $3.98 | $3.32 |
| p99.9 | 60 | $0.90 | $3.98 | $3.08 |

At the fair-use cap of 60 sessions a user costs $0.90/month in AI against $3.98 net on the annual plan. The v1 per-user cap of $0.60/day allowed $18/month.

## Scenarios at zero acquisition cost (commercial phase, months after paid launch)

| Scenario | Signups/mo | Activation | Paid conv. | Paying at m12 | Paying at m24 | Op. profit m24/mo | Cumulative cash m24 | After founder time m24/mo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| low | 150 | 45% | 1.5% | 10 | 13 | $-629 | $-15,383 | $-1,829 |
| base | 400 | 55% | 3.0% | 62 | 84 | $-304 | $-9,133 | $-1,504 |
| high | 1500 | 65% | 5.0% | 461 | 623 | $2,176 | $38,467 | $976 |

## Base scenario, month by month (first 12)

| Month | Paying | Free active | Net revenue | AI cost | Fixed | Operating | Cumulative |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 4 | 220 | $120 | $5 | $686 | $-572 | $-572 |
| 2 | 10 | 286 | $190 | $7 | $686 | $-503 | $-1,075 |
| 3 | 16 | 330 | $224 | $9 | $686 | $-471 | $-1,545 |
| 4 | 22 | 363 | $238 | $10 | $686 | $-457 | $-2,003 |
| 5 | 27 | 391 | $251 | $11 | $686 | $-446 | $-2,449 |
| 6 | 33 | 415 | $262 | $12 | $686 | $-436 | $-2,885 |
| 7 | 38 | 435 | $272 | $12 | $686 | $-427 | $-3,312 |
| 8 | 43 | 452 | $280 | $13 | $686 | $-419 | $-3,731 |
| 9 | 48 | 467 | $288 | $14 | $686 | $-413 | $-4,144 |
| 10 | 53 | 479 | $294 | $15 | $686 | $-407 | $-4,550 |
| 11 | 58 | 490 | $300 | $15 | $686 | $-401 | $-4,952 |
| 12 | 62 | 499 | $305 | $16 | $686 | $-397 | $-5,348 |

---

## What these tables mean

1. **A subscriber contributes about $4.69 a month at steady state.** Annual subscribers stay longer, so they are 77% of the paying base even though they are 60% of new sales. The v1 figure of $5.20 weighted by new sales and was too high (red-team A7).
2. **A signup is worth about $1.09 at base.** That figure is the most you could ever pay to acquire one, before any fixed costs. The v1 E6 threshold of "$2 per signup" was above it, which would have meant losing money on every signup (red-team A8). E6 now uses $0.50.
3. **AI cost is not the problem.** Even a user at the 60-session fair-use cap costs $0.90 a month against $3.98 of annual-plan revenue.
4. **The base scenario loses money for two years.** 400 signups a month reach about 84 paying subscribers by month 24, still about $300 a month short of covering fixed costs.
5. **The high scenario works**, but it needs 1,500 signups a month **and** 5% conversion. Both are unproven.
6. **Your time is the largest cost.** Counting it at even $30 an hour nearly triples the signups needed.

## Levers, in order of power

| Lever | Effect | How you would learn it |
|---|---|---|
| Organic signups per month | Linear: double signups, roughly double subscribers | E6 |
| Acquisition cost | Decisive: any CAC above about $1 makes the base case unviable | E6 |
| Conversion | Linear, and raises the CAC you can afford | E7 |
| Annual renewal | Large: 35% to 60% renewal raises paid lifetime from 14.4 to about 21 months | Only after year one |
| Fixed costs | Reviewer and insurance are hard to cut responsibly | — |
| Removing generative AI | Saves about $0.014 a session; small next to fixed costs | E4 decides |
| Price | Moderate, and constrained by free competitors | E7 |

## Entitlements, stated honestly

There is no "unlimited" plan. Any paid plan has a **fair-use limit of 60 guided sessions a month**, stated on the pricing page. Breathing and grounding without AI are unlimited, because they cost almost nothing to run.

## Alternatives if the consumer subscription fails (E6 or E7)

- **A free product with a different funder**, for example grants or a nonprofit model, as How We Feel does (E-MKT-04).
- **Employer or B2B sales**: fewer, larger customers, but long sales cycles and security questionnaires.
- **Stop**, having spent the discovery budget rather than a build budget.
