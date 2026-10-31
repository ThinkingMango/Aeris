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
