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
