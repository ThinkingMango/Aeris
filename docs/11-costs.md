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

Cache writes cost 1.25× input price on the first call of a prompt version; amortized across thousands of sessions it is negligible, so it is excluded.

### Cost per session by main-model choice

| Main model | Read | Suggest | Close | Safety + tags (Haiku) | **Per session** | **Per user/month at 12 sessions** |
|---|---|---|---|---|---|---|
| **Opus 5.5** ($4 / $20, cache $0.20) | $0.0124 | $0.0027 | $0.0034 | $0.0002 | **≈ $0.019** | **≈ $0.23** |
| **Sonnet 5.5** ($2 / $10, cache $0.20) | $0.0065 | $0.0014 | $0.0018 | $0.0002 | **≈ $0.010** | **≈ $0.12** |
| **Haiku 5.5** everywhere ($0.10 / $0.50) | $0.0003 | $0.0001 | $0.0001 | $0.0002 | **≈ $0.0007** | **≈ $0.01** |

Worked example for the Opus read: 700 × $4/1M = $0.0028; 3,000 cached × $0.20/1M = $0.0006; 450 × $20/1M = $0.0090. Total $0.0124.

### Add a safety margin
Real usage is messier: retries, guard-fail rewrites, longer free text, users who tap "try something else" three times, and thinking tokens that run longer than estimated. **Multiply by 2.5** for planning:

| Main model | Planning cost per session | Per user/month (12 sessions) | 1,000 active users/month |
|---|---|---|---|
| Opus 5.5 | **~$0.05** | **~$0.60** | **~$600** |
| Sonnet 5.5 | **~$0.025** | **~$0.30** | **~$300** |
| Haiku 5.5 | **~$0.002** | **~$0.02** | **~$20** |

**Interpretation:**
- Even on Opus, a Plus subscriber paying $7.99 costs you well under $1 in AI. The margin is healthy.
- A free user capped at 3 sessions costs at most ~$0.15/month on Opus. You can afford a lot of free users.
- The weekly reflection (Plus only, Batch API at 50% off) adds ~$0.01–0.02 per user per week on Opus. Negligible.
- **Haiku-everywhere** is 25× cheaper but I do not recommend it for the "read" step: the one sentence that names the pattern and proposes the plan is the product. Test it yourself on Day 18 and decide.

### What Anthropic's own guidance says about this choice
Their guidance to builders is to default to Opus 5.5 and to treat downgrading for cost as the product owner's decision after measuring on real requests, because lower effort on the newest model often matches a cheaper model at high effort. I have built the plan so that switching the main model is a one-line change and the admin view shows cost per session, so you can decide with data in week 1 after launch.

---

## 4. Month-by-month cash plan (first 6 months, "Small" scenario from Doc 04)

| Month | Tools | AI (Opus, w/ margin) | One-time | Revenue | **Net** |
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
