> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 04 — Monetization

**Plain-English summary:** Aeris should be **freemium with a subscription**, sold on the web through Stripe, with a generous free tier and an aggressively priced annual plan. The numbers below show why, and show honestly how slow it will be.

---

## 1. The options, compared

| Model | How it works | Pros | Cons | Verdict |
|---|---|---|---|---|
| **Freemium subscription** | Free basic use; pay monthly/yearly for AI-guided sessions and insights | Standard in the category; users understand it; web + Stripe avoids app store 30% cut | 2–5% conversion; subscription fatigue; churn | **Yes — primary model** |
| **Paid-only (no free tier)** | Pay before you can use it | Filters for serious users; simpler | Nobody pays for an unknown app from an unknown founder; kills word of mouth | No |
| **One-time "lifetime" purchase** | Pay $49–99 once | Users love it; cash up front | Your AI costs are ongoing, so lifetime users become a liability; no recurring revenue | Only as a limited launch offer (first 200 users), never as the main model |
| **Pay-what-you-want / donations** | Free, with a tip jar | Zero friction; good for trust | Not a business; no way to forecast | No, but a "support Aeris" option for free users is harmless |
| **Credits / pay-per-session** | Buy a pack of 10 sessions | Maps to the AI cost exactly | Makes users ration help in the moment they need it; bad feeling | No |
| **B2B2C (employers, universities, insurers)** | Companies buy access for staff/students | Bigger contracts; this is where Woebot and Wysa went | Long sales cycles (6–18 months); demands evidence, security certifications, and a sales person; not a 30-day thing | **Later, not now** (but design the data model so a "team/org" can be added) |
| **Ads** | Free, with ads | Scale | Illegal/ruinous with health data; destroys trust; conflicts with Utah/WA laws | **Never** |
| **Selling data / insights** | Aggregate anonymized data | — | Legally hazardous, ethically wrong, reputation-ending | **Never** |

---

## 2. The recommended pricing

### Free ("Aeris")
- Unlimited **Quick Calm** tools (breathing orb, grounding, body scan). These run with no AI, so they cost you nothing.
- **3 AI-guided Moments per month.** This is the core product. Three is enough to feel it, not enough to live on it.
- Before/after ratings and basic history (last 30 days).
- Crisis resources, always, for everyone, forever.

### Plus ("Aeris Plus")
- **Unlimited AI-guided Moments.**
- **Patterns:** weekly insights, triggers over time, "what helped most."
- Full history and export.
- Personalization: Aeris remembers what works for you.
- Price: **US$7.99/month** or **US$49.99/year** (that is $4.17/month, a 48% saving, and the annual plan is where you make money).

### Why these numbers
- Calm and Headspace sit at ~$70/year. You are unknown and smaller; you must be cheaper. $49.99 feels like "half of Calm."
- $7.99/month is below the $9.99 psychological line while still covering AI cost at any usage level (see Doc 11: a heavy user costs you ~$1.50–3/month in AI at Opus prices).
- Three free sessions a month costs you at most ~$0.36 per free user per month (Opus) or ~$0.18 (Sonnet). Affordable even if free users are 95% of your base.

### Launch offer (optional, first 60 days)
- "Founding member: $29.99 for the first year." Creates urgency, builds a cohort you can talk to, and the cash funds the lawyer. Cap it at 200.

---

## 3. Unit economics (the honest version)

**Assumptions** (all conservative, from category benchmarks; see Doc 01 for sources):

| Item | Value |
|---|---|
| Visitors who sign up | 20% (web; no app store friction) |
| Signups still active at day 30 | 5% (slightly above the 3.3% median because Aeris is more targeted) |
| Active users who go Plus | 4% of all signups (freemium wellness median ~2–5%) |
| Mix: monthly vs. annual | 40% monthly / 60% annual |
| Average monthly revenue per paying user (blended, after Stripe ~3% + $0.30) | ~$5.40 |
| Monthly churn of paying users | 8% monthly plan, ~1.5% annual (annual churns at renewal) |
| AI cost per paying user per month (~12 sessions; written for Opus 5.5 with a wide margin. The recommended Sonnet 5.5 setup is ~$0.30–0.50, Doc 15) | ~$1.50 |
| AI cost per free user per month (3 sessions max, most use 1) | ~$0.12 |

**Scenario table at month 6:**

| | Small | Medium | Good |
|---|---|---|---|
| Total signups by month 6 | 2,000 | 10,000 | 40,000 |
| Paying users (4%) | 80 | 400 | 1,600 |
| Monthly revenue | $430 | $2,160 | $8,640 |
| AI cost (paying + free) | $150 | $700 | $2,800 |
| Fixed tools cost (Doc 11) | $150 | $150 | $200 |
| **Monthly profit before your time** | **~$130** | **~$1,300** | **~$5,600** |

**What this tells you:**
- "Small" is where most apps land. It covers its costs and pays you nothing. That is the realistic outcome of the first 6 months.
- "Medium" needs 10,000 signups in 6 months with *no paid ads*. That means ~55 signups a day from organic content, SEO, Reddit, TikTok, and word of mouth. It is possible but it is a full-time marketing job.
- "Good" is a real small business. Getting there needs either an exceptional organic channel or paid acquisition that works (which needs retention to be well above median).

**The lever that matters most is not price. It is day-30 retention.** Doubling retention from 5% to 10% roughly doubles paying users at the same traffic. Every design choice in Docs 05–07 is aimed at that.

---

## 4. Payment implementation (what Stripe does for you)

Stripe handles: card storage, subscriptions, renewals, failed payments, invoices, taxes (with Stripe Tax), and the customer portal where users cancel. You do not build any of that.

**You build:**
1. A pricing page with two buttons (Monthly, Annual).
2. When a button is clicked, your server asks Stripe for a "Checkout Session" and sends the user to Stripe's hosted page.
3. Stripe sends a message back to your server ("webhook") when payment succeeds, fails, or is cancelled. Your server updates the user's plan in the database.
4. A "Manage subscription" button that sends them to Stripe's Customer Portal.

**Legal requirements Stripe does not do for you:**
- Show the renewal price and cadence clearly before purchase (I include this on the paywall screen).
- Send a reminder email before annual renewal (Resend; a small scheduled function, Doc 08).
- Make cancellation as easy as signup (the portal link in Settings, no "call us to cancel").

---

## 5. Growth channels (ranked by what works for a solo founder with $0)

1. **Reddit** (r/Anxiety, r/panicattacks, r/socialanxiety, r/selfimprovement). Do not spam. Share the product once in the right threads with a genuine story. Answer questions. Expect 50–300 signups from a good post.
2. **Short-form video (TikTok, Instagram Reels, YouTube Shorts).** Show the breathing orb and the "what can I control" screen. Calming visuals perform well. The app's own UI is the content.
3. **SEO content.** "What to do when you can't sleep because you're anxious," "how to stop replaying a conversation." Long tail, slow, compounding. Write 2 articles a week with Claude's help; edit them so they are honest and human.
4. **Product Hunt / Hacker News / Indie Hackers.** One-day spike. Good for early testers and feedback.
5. **Partnerships with therapists and coaches.** "Use between sessions." Low volume, high quality, and it reinforces your positioning as a complement, not a replacement.
6. **Paid ads.** Not before Gate 2 (Doc 01) is passed. Then test $300 and measure cost per subscriber, not cost per install.

---

## 6. Metrics to watch (set these up on Day 9)

| Metric | Why | Good sign in month 1 |
|---|---|---|
| Time from app open to intervention start | Core promise | Under 20 seconds median |
| Session completion rate | Did the flow work | Over 70% |
| Before/after tension delta | Did it help | Median drop of 2+ points on 0–10 |
| Day-7 and Day-30 return rate | The thing that matters | D7 ≥ 20%, D30 ≥ 8% |
| Free → Plus conversion | Business | ≥ 2% in month 1 |
| Crisis screen shown rate | Safety | Track, review every one |
| AI cost per session | Cost control | Within ±30% of Doc 11 estimates |
