> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 11 — Estimated Development & API Costs

All figures in US dollars, October 2026. Where a price depends on a plan that changed recently (v0 renamed its tiers in July 2026 and is sunsetting its $20 plan), I note it; **check the pricing page on the day you sign up.**

---

## 1. Tools and services (fixed monthly)

| Service | Plan | Monthly | Notes |
|---|---|---|---|
| **v0.app** (screens) | Plus (formerly "Team"), per user | $30 | The legacy $20 Premium plan is being phased out for new users. Free plan has a small one-time credit grant; not enough for a full app. Credits are consumed per generation; expect to use most of the monthly allowance in weeks 1–2, then little. |
| **Claude Code** (backend, logic, tests) | Claude Max | $100 (5× Pro) or $200 (20× Pro) | Pro ($20) is too limited for daily multi-hour build sessions. Max $100 is the realistic floor for the build month. Drop to Pro after launch. |
| **Anthropic API** (the app's own AI calls) | Pay as you go | $5–25 in month 1 | See §3. |
| **Supabase** (database, auth, Edge Functions) | Pro | $25 | Free tier pauses after 7 days of inactivity and lacks daily backups; not acceptable for user data. Pro includes 8 GB database, 100k monthly active users, daily backups. |
| **Vercel** (hosting) | Pro | $20 | Hobby is free but *forbids commercial use*. Pro also gives you analytics and the pause button. |
| **Stripe** | Pay as you go | 2.9% + $0.30 per transaction (US card); ~1.5% + fixed for some regions; +0.5% for Stripe Tax if used | No monthly fee. |
| **Resend** (email) | Free → Pro | $0 → $20 | Free: 3,000 emails/month, 1 domain. Enough until ~1,000 users. |
| **Domain** | — | ~$1.25 (~$15/yr) | Namecheap/Cloudflare. |
| **Privacy-respecting analytics** | Vercel Analytics (included in Pro) or Plausible | $0–9 | Never Google Analytics with user IDs. |
| **Error monitoring** | Sentry free tier | $0 | 5k errors/month free. |
| **Total, build month** | | **~$180–305 + API** | |
| **Total, after launch (Claude Pro, Resend free)** | | **~$100–130 + API** | |

---

## 2. One-time costs

| Item | Low | High | Notes |
|---|---|---|---|
| Company formation (LLC / Ltd) | $50 | $500 | UK Ltd ~£50 online; US LLC varies by state; registered agent ~$100/yr if needed |
| Lawyer review (privacy, terms, marketing language, crisis page) | $1,500 | $5,000 | Ask for a fixed-fee "consumer health-adjacent app launch review." Can be deferred for a closed free beta, **not** for paid launch |
| Trademark search | $0 | $300 | DIY search free; attorney search ~$300 |
| Security review by a freelance developer (2 h) | $150 | $300 | Checks RLS, keys, Edge Functions. Cheapest insurance you will buy |
| Logo / brand touch (optional) | $0 | $300 | v0 and Claude can produce a wordmark; Fiverr/99designs if you want a human |
| Crisis-line verification & test devices | $0 | $0 | Your own phone |
| Insurance (after paying users, annual) | $1,000 | $3,000 | Tech E&O + cyber. Not needed for closed beta |
| **Total one-time to paid public launch** | **~$1,700** | **~$6,400** | **To closed free beta only: ~$200–800** |

---

## 3. AI cost per session (the number that scales)

### How the estimate is built
A typical Moment makes these calls (Doc 08):

| Step | Model | Input tokens (uncached) | Cached input | Output tokens (incl. thinking at low effort) |
|---|---|---|---|---|
| Safety classifier (×1.5 avg) | Haiku 5.5 | 900 | 0 | 60 |
| Read the moment | main | 700 | 3,000 | 450 |
| Worry-sort suggestions (60% of sessions) | main | 400 | 3,000 | 120 |
| Closing line | main | 300 | 3,000 | 80 |
| Nightly tag extraction (40% of sessions have text) | Haiku 5.5 | 600 | 0 | 60 |

**Correction (31 October 2026):** an earlier version said cache writes were negligible. That is only true at high traffic. A cached prompt expires after 5 minutes without use, so at launch most sessions start "cold" and the first call pays the cache-write price (1.25× input). The tables below now show both cases.

### Cost per session by main-model choice

| Main model | Read (warm / cold) | Suggest | Close | Safety + tags (Haiku) | **Per session (warm / cold)** |
|---|---|---|---|---|---|
| **Sonnet 5.5, recommended** ($2 / $10, cache read $0.10, write $2.50) | $0.0062 / $0.0134 | $0.0014 | $0.0017 | $0.0002 | **$0.0095 / $0.0167** |
| **Opus 5.5** ($4 / $20, cache read $0.20, write $5.00) | $0.0124 / $0.0268 | $0.0028 | $0.0034 | $0.0002 | **$0.0188 / $0.0332** |
| **Haiku 5.5** everywhere ($0.10 / $0.50) | $0.0003 / $0.0007 | $0.0001 | $0.0001 | $0.0002 | **$0.0007 / $0.0010** |

Worked example for the Sonnet read, warm: 700 × $2/1M = $0.0014; 3,000 cached × $0.10/1M = $0.0003; 450 × $10/1M = $0.0045. Total $0.0062. Cold: the 3,000 cached tokens are written at $2.50/1M instead, $0.0075, so the read costs $0.0134.

### Add a safety margin
Real usage is messier: retries, guard-fail rewrites, longer free text, users who tap "try something else" three times, and thinking tokens that run longer than estimated. **Multiply by 2.5** for planning:

| Main model | Planning cost per session (warm–cold) | Per user/month (12 sessions) | 1,000 active users/month |
|---|---|---|---|
| **Sonnet 5.5, recommended** | **~$0.024–0.042** | **~$0.28–0.50** | **~$280–500** |
| Opus 5.5 | ~$0.047–0.083 | ~$0.56–1.00 | ~$560–1,000 |
| Haiku 5.5 | ~$0.002–0.003 | ~$0.02–0.03 | ~$20–30 |

**Interpretation:**
- On the recommended Sonnet setup, a Plus subscriber paying $7.99 costs you about 30 to 50 cents in AI. Even on Opus with a cold cache it stays under $1. The margin is healthy.
- A free user capped at 3 sessions costs at most ~$0.13/month on Sonnet with a cold cache. You can afford a lot of free users.
- The weekly reflection (Plus only, Batch API at 50% off) adds ~$0.007 per user per week on Sonnet, ~$0.014 on Opus. Negligible either way.
- **Haiku-everywhere** is about 15× cheaper than Sonnet, but I do not recommend it for user-facing words at launch: Anthropic's own system card says Opus and Sonnet are "strictly better" than Haiku on most honesty measures. Doc 15 explains, and the Day 18 test can revisit it.

### How this choice was made
Doc 15 is the full deep dive. In short: on Anthropic's published mental-health tests the three models are within the margin of error of each other, so the choice rests on honesty, speed, and price, where Sonnet 5.5 is the best balance for user-facing words and Haiku 5.5 is best for everything else. Switching the main model is a one-line change, and the admin view shows cost per session, so you can decide with data in week 1 after launch.

---

## 4. Month-by-month cash plan (first 6 months, "Small" scenario from Doc 04)

| Month | Tools | AI (w/ margin; written for Opus, so conservative for Sonnet) | One-time | Revenue | **Net** |
|---|---|---|---|---|---|
| 1 (build) | $280 | $10 | $300 (company, domain, misc) | $0 | **−$590** |
| 2 (closed beta → launch) | $280 | $30 | $2,500 (lawyer, security review) | $0 | **−$2,810** |
| 3 | $130 | $60 | $0 | $150 | **−$40** |
| 4 | $130 | $90 | $0 | $250 | **+$30** |
| 5 | $130 | $120 | $0 | $350 | **+$100** |
| 6 | $130 | $150 | $0 | $430 | **+$150** |
| **6-month total** | | | | | **≈ −$3,200** |

**If you skip the lawyer and launch a free closed beta only:** 6-month total ≈ −$900. That is the "find out cheaply" path and it is a legitimate choice for the first 60 days.

---

## 5. If you hired this out instead

For comparison, so you understand what the 30-day plan is saving you:

| Approach | Cost | Time |
|---|---|---|
| Freelance full-stack developer (good, Eastern Europe/LatAm/SE Asia) | $8,000–20,000 | 6–10 weeks |
| Freelance developer (US/UK senior) | $25,000–60,000 | 6–10 weeks |
| Small agency, MVP package | $40,000–120,000 | 8–16 weeks |
| You + v0 + Claude Code (this plan) | ~$600–1,000 + your time | 30 days at 3–4 h/day |

The trade-off is honest: you will produce a less polished codebase than a senior developer would, and you will spend more hours. In exchange you keep the money, learn the product deeply, and can change anything the next day. For a 30-day experiment with hard gates, that is the right trade. If Gates 1–3 pass, your first hire is a part-time developer to harden what you built.

---

## 6. Your time (the real cost)

| Phase | Hours |
|---|---|
| Week 1: setup, research, design | 25 |
| Week 2: screens in v0 | 25 |
| Week 3: backend, AI, safety, payments in Claude Code | 30 |
| Week 4: testing, legal, beta, launch | 25 |
| **Total** | **~105 hours** (≈ 3.5 h/day) |

If you can only give 1.5 h/day, double the calendar to 60 days. Do not shorten the testing week to make up time; that is where the safety work lives.
