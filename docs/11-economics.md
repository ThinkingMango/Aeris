# 11 — Economics

**What this answers.** Can Aeris become a business, and which numbers decide it?

**Short answer, brutally.** As a consumer subscription at base assumptions, **barely, slowly, and only with cheap acquisition**.
- **Acquisition decides it.** About 646 organic signups a month cover fixed costs **in the long run**, but at that rate the first month with no loss comes after **about six years** (month 73). At 800 a month it comes at about month 14; at 1,000, about month 10.
- **Revenue per subscriber is small.** At the steady-state plan mix it averages **$5.05 a month** at list price. The annual plan is 48% cheaper than twelve monthly payments, and most of the paying base is annual.
- **What $10,000 a month in revenue takes.** About **1,980 paying subscribers**, sustained by about **8,300 new signups every month**. This is a derived scenario, not a forecast.
- **The money you can spend on a signup.** At most about **$1.06** each, after the AI cost of serving free users. Per paying customer, the most is about $66. Paying $1 per signup pushes break-even above 10,000 signups a month.
- **Even the high scenario is a small business.** 1,500 signups a month at 5% conversion makes under $1,000 a month after a modest allowance for your time, two years in.
- **AI cost is not the problem.** It is about a cent and a half a session.

So the consumer subscription is the weakest of the three models unless Stage 4 shows much better conversion or retention than assumed. That is why Stage 4 also tests a one-time toolkit and partner-sponsored access ([04](04-hypotheses-and-experiments.md) D6–D8).

**Where the numbers come from.** `models/cohort_model.py`, with every input in `models/assumptions.json`.
- Each input is labelled as an assumption or tied to a source in [02](02-evidence-register.md).
- The tables below are pasted from the model's output.
- Break-even is solved by running the cohort simulation itself.

To change an assumption, edit the file and rerun:

```bash
python3 models/cohort_model.py
```

**This model is for the commercial phase only.** The discovery stages have their own budget in [05](05-discovery-and-build-plan.md) and earn nothing.

---

## 1. Key assumptions and how weak they are

| Assumption | Base value | Basis | Weakness |
|---|---|---|---|
| Paid conversion of activated users | 3% | Assumption | **The direction of error is unknown.** RevenueCat's 2.9% median is download-to-paid for app-store Health & Fitness apps with trial flows (E-BIZ-01). Aeris's denominator is activated users, a subset of downloads, which would make the rate higher. Aeris is also a web app with no trial, which may make it lower. The earlier claim that 3% is "optimistic" did not follow, and is withdrawn ([03](03-review-log.md) Part F). Stage 4 measures it |
| Activation (completes a first session) | 55% | Assumption | Stage 2 and 3 measure it |
| Free users still active by month | 30%, 20%, 15%, then shrinking 15% a month | Assumption | Baumel 2019 measured exact-day opens and cannot be plugged in (E-RET-01) |
| Monthly-plan churn | 12% a month | Assumption | Unknown. A tool people can learn and stop needing may churn faster |
| Annual-plan renewal | 35% | Assumption | Unknown; renewal often disappoints in consumer wellness |
| Prices | $7.99/month, $49.99/year | v1 choice | The market has moved: Rosebud **retired its free plan** on 30 Sep 2026 and charges $12.99/month (E-MKT-02); Earkick sells Premium at $14.99/month or $44.99–107.99/year (E-MKT-03); Headspace's Ebb is in a $69.99/year subscription (E-MKT-01). How We Feel stays free (E-MKT-04). Stage 4 tests $7.99 monthly with real money |
| Fees | 2.9% + $0.30 per charge, 0.7% Stripe Billing, 1.5% extra on 20% international | stripe.com (E-BIZ-02) | Confirm for your country; tax not modelled |
| AI cost per session | $0.015 | [09](09-ai-and-models.md) §5: one Sonnet 5.5 read plus two Haiku 5.5 screens, ×2.5 margin | **$0** for the no-typing product of Stages 2–4 |
| Fixed costs | $686/month | Tools about $86, reviewer retainer $400, insurance $150, bookkeeping $50 | The reviewer and insurance are what make it responsible; they dominate |
| Acquisition cost (CAC) | Shown at $0, $0.50, $1 and $2 per signup | Not yet known | Stage 4 (D8) measures it, counting founder hours |

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

| Scenario | Per signup, after the AI cost of serving free users | Most you can pay per PAYING customer |
|---|---:|---:|
| low | $0.42 | $66.32 |
| base | $1.06 | $66.32 |
| high | $2.12 | $66.32 |

The annual plan is 48% cheaper than twelve monthly payments. Average list-price revenue per subscriber per month at the steady-state mix: $5.05.

## What a revenue target requires (base, steady state)

| Monthly recurring revenue (list price) | Paying subscribers | New signups needed every month |
|---:|---:|---:|
| $1,000 | 198 | 833 |
| $5,000 | 990 | 4,164 |
| $10,000 | 1,980 | 8,328 |

At base conversion (1.65% of signups pay) and an average paid life of 14.4 months.

## How long until a month breaks even (base, fixed costs only, zero acquisition cost)

| Signups every month | First month with operating result >= 0 |
|---:|---:|
| 646 | month 73 |
| 800 | month 14 |
| 1,000 | month 10 |
| 1,500 | month 3 |
| 2,000 | month 2 |

Break-even signups are a long-run rate, not a promise of breaking even soon after reaching it.

## Three business models compared (to test, not validated)

| Model | Value per paying customer | Paying customers per month to cover fixed costs | Signups/month at base conversion |
|---|---:|---:|---:|
| Subscription $7.99/mo or $49.99/yr | $66.32 lifetime | base of 146 subscribers | 646 |
| One-time toolkit $29 | $27.57 once | 25 buyers | 1,509 |
| Partner pilot $500 per cohort | $486 per partner | 2 partners | n/a |

A one-time toolkit beats the subscription only if it converts about 2.4x as many signups into buyers. Partner fees are sales work, not passive revenue.

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

1. **A subscriber contributes about $4.69 a month at steady state**, from $5.05 of list-price revenue. Annual subscribers stay longer, so they are 77% of the paying base even though they are 60% of new sales.
2. **A signup is worth about $1.06** at base, once the AI cost of serving free users is counted ($1.09 before it). That is the most you could ever pay to acquire one, before fixed costs. The Stage 4 ceiling is half of what a paying customer is worth: about $33 per payer, or about $0.55 per signup.
3. **"Break-even signups" is a long-run rate.** At 646 a month the base case takes about six years to reach its first month with no loss, because the paying base builds slowly. Planning should use the months-to-break-even table, not the steady-state figure alone.
4. **The base scenario loses money for two years.** 400 signups a month reach about 84 paying subscribers by month 24, still about $300 a month short of fixed costs.
5. **The high scenario works, but small.** It needs 1,500 signups a month **and** 5% conversion, both unproven, and still makes under $1,000 a month after a $1,200 allowance for your time.
6. **"Organic" is not free.** Content, community work and partner selling take your hours. Stage 4 counts them at $30 an hour.
7. **AI cost is not the problem.** Even a user at the 60-session fair-use cap costs $0.90 a month against $3.98 of annual-plan revenue. Conversion and retention matter far more than a fraction of a cent per call.

## Levers, in order of power

| Lever | Effect | How you would learn it |
|---|---|---|
| Signups per month, and their cost | Decisive. Any CAC above about $1 a signup makes the base case unviable | D4, D8 |
| Conversion | Linear, and raises the CAC you can afford | D6 |
| Retention and renewal | Large. 35% to 60% annual renewal raises paid lifetime from 14.4 to about 21 months | D6 shows month-2 renewal; annual renewal only after a year |
| Business model | A partner paying $500 per cohort covers fixed costs with 2 partners a month; a one-time toolkit must convert 2.4× as many people as the subscription | D6, D7 |
| Fixed costs | The reviewer and insurance are hard to cut responsibly | — |
| Removing generative AI | Saves about $0.014 a session; small next to fixed costs | E4 decides |
| Price | Moderate, and constrained by free competitors | D6 |

## Entitlements, stated honestly

There is no "unlimited" plan. Any paid plan has a **fair-use limit of 60 guided sessions a month**, stated on the pricing page. The no-typing reset has no AI cost, so it needs no limit.

## If the consumer subscription fails

In the order Stage 4 tests them:
1. **One-time toolkit**, about $29 for a reviewed set of situation routines. It fits occasional use, and people who learn the routine are not punished for it.
2. **Partner-sponsored access**: trainers or professional communities pay a fixed fee for a cohort. Fewer, larger customers, and real sales work.
3. **Employer-wide sales, later and only with usage evidence.** These bring procurement, security reviews, outcome reporting, and an employee-trust problem. No employer may ever see an individual's choices.
4. **Free, with a different funder**, as How We Feel does (E-MKT-04).
5. **Stop**, having spent a few thousand dollars rather than a build budget.
