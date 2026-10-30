# 01 — Brutal Honesty & Verdict

You asked me to challenge your ideas. This document does that. It is not a list of reasons not to build Aeris. It is a list of the things that will actually kill it, so you can decide with open eyes and design around them.

I have ordered these from most dangerous to least dangerous.

---

## 1. The retention problem (the thing that actually kills wellness apps)

**What the evidence says.** The best independent study of mental-health app usage (Baumel et al., 2019, published in the Journal of Medical Internet Research, covering 93 apps with real usage data rather than self-reported data) found:

| Measure | Median across mental health apps |
|---|---|
| Still using the app 15 days after install | 3.9% |
| Still using the app 30 days after install | 3.3% |
| 30-day retention for breathing-exercise apps specifically | **0.0%** |

Read that last line again. Breathing apps, which is a big part of what Aeris does in the "intervention" step, had a median 30-day retention of zero. Peer-support, meditation, and mood-tracker apps did better, but still single digits.

**Why this matters for your hypothesis.** Your core hypothesis is: *"When someone becomes anxious, a context-aware AI system that guides them through a relevant 2–5 minute intervention will be more useful than generic content."* That might be true. But "more useful" does not matter if the person does not open the app in the anxious moment. And here is the uncomfortable truth about anxious moments:

- When people are anxious, they do not go looking for a tool. They scroll, text a friend, Google their symptom, or freeze.
- Opening a specific app in a specific moment is a **habit**. Habits take weeks to form. Most users leave before that happens.
- The apps that survive (Calm, Headspace) survived by becoming a **daily routine** (sleep stories, morning meditation), not by being there in the crisis.

**What this means for the design.** Aeris cannot only be a "break glass in emergency" tool. It must also have a small, low-effort daily touchpoint that keeps it in the user's mind, so that when the anxious moment comes, Aeris is the first thing they think of. Document 06 includes a "daily check-in" feature for exactly this reason, and I argue it is not optional.

**Honest grade for your hypothesis as stated:** Plausible but incomplete. The intervention quality is maybe 30% of the problem. Getting opened is 70%.

---

## 2. Your real competitor is free ChatGPT, not Calm

You said Aeris "should feel less like ChatGPT." Good instinct. But understand what you are up against:

- Millions of people already type "I'm having a panic attack, help me" into ChatGPT, Claude, or Gemini. It is free, it is already installed, it already knows them, and the answers are decent.
- Headspace launched an AI companion ("Ebb") in 2024. Calm, Wysa, Youper, Earkick, Rosebud, and dozens of others already offer AI-guided anxiety support. Many have millions in funding and clinical advisors.
- Replika, Character.ai, and the general-purpose chatbots have become the de facto "AI companion" layer for lonely or anxious people, for better and worse.

**So what is left for Aeris?** Document 05 answers this in full. The short version: Aeris wins only if it is *faster and more structured* than a chatbot in the moment (tap, do not type), and *remembers your patterns* better than a chatbot across time. If it ends up being "a chat box with a calming colour scheme," it loses to free ChatGPT every time, and it deserves to.

---

## 3. The law moved against you in 2025–2026, and you are the least-protected person in the room

This is the second thing that can genuinely kill the business, not just stall it.

**What happened recently (verified, see Doc 03 for sources):**

- **Woebot**, the best-funded, most clinically-validated AI mental-health chatbot in the world, **shut down its consumer app on 30 June 2025**. Its founder told STAT News the main reason was the cost and difficulty of meeting US FDA requirements, and the lack of clear rules for AI chat tools.
- **Illinois and Nevada banned AI from providing therapy** in 2025. **Utah** requires disclosures and data limits for mental-health chatbots. **New York's** AI companion law (effective 5 November 2025) requires crisis detection and a reminder every 3 hours that the user is talking to a machine. **California's SB 243** (effective 1 January 2026) requires crisis protocols, AI disclosure, and gives consumers the right to sue. **Oregon, Tennessee, Washington** and others followed in 2026.
- **Lawsuits:** families have sued OpenAI and Character.ai after deaths they connected to chatbot conversations. Whatever the legal outcomes, these cases set the public mood.

**Why this is worse for you than for Headspace.** Headspace has lawyers, insurance, clinical advisors, and millions in cash. If a user is harmed and the family sues, Headspace survives. You are one person with a hotmail address. If something goes wrong, there is no cushion.

**The honest conclusion:** You can still build Aeris. The law does *not* ban wellness tools that help people calm down. But:

1. Every word of your marketing must stay on the "wellness" side of the line (Doc 03 has a do/don't list).
2. The safety system (Doc 10) is not a nice-to-have. It is the product.
3. You need a lawyer's one-hour review of your terms, privacy policy, and marketing copy before a public paid launch. Budget US$1,500–5,000.
4. You should form a limited company before launch so your personal assets are separate. (US LLC: about $50–500 depending on state. UK Ltd: about £50.)

---

## 4. Your "pattern data is the asset" hypothesis is half right and half dangerous

You wrote: *"The user's accumulated anxiety patterns become more valuable than any individual AI conversation."*

**The half that is right:** For the *user*, yes. Seeing "your anxiety spikes on Sunday nights and is almost always about Monday's work" is genuinely valuable. It creates a reason to stay. It is the thing ChatGPT does not do well. This is your best retention lever.

**The half that is dangerous:** If "valuable" means valuable to the *business* as a data asset, stop. Health data, including anxiety patterns, is:

- "Consumer health data" under Washington's My Health My Data Act, with a private right of action (people can sue you directly).
- "Special category data" under the EU and UK GDPR, which carries the highest penalties.
- Exactly the kind of data that the US Federal Trade Commission fined BetterHelp US$7.8 million for sharing with advertisers.

You cannot sell it, cannot use it for ads, cannot share it with "partners," and should not even think of it as an asset you own. Think of it as something you are holding for the user. The business value is *retention and willingness to pay*, not the data itself.

**Reframe:** "The user's accumulated patterns are the reason they stay subscribed." That version is true and safe.

---

## 5. Freemium maths for a solo founder are harsh

Document 04 has the full model. The short brutal version:

- Typical free-to-paid conversion for wellness apps: **2–5%**.
- Typical price users will pay: **US$5–10/month** or **$40–70/year**. Calm and Headspace both sit at about $70/year.
- Typical cost to acquire one install via paid ads in the anxiety space: **$3–15**, because the keywords are expensive and competition is high.

Work it through: 10,000 installs (which costs $30,000–150,000 in ads or many months of organic content) → ~330 still around at day 30 → ~300 subscribers at ~$6/month net → **about $1,800/month** in revenue. That is not a business yet. That is a hobby with a Stripe account.

**This does not mean do not build it.** It means:

- Do not spend on paid ads in the first 6 months. Organic only (Reddit, TikTok, SEO, communities).
- Price the annual plan aggressively to lock in revenue.
- Keep monthly costs under $150 so you can survive on tiny revenue while you learn.
- Decide now what number at day 30 means "keep going" and what number means "stop." I propose gates below.

---

## 6. A non-coder building a safety-critical app is a real risk, and I will not pretend otherwise

You can absolutely build the *screens* with v0. v0 is excellent at that. The risk is the parts you cannot see:

- **Row Level Security (RLS)** in Supabase: the rule that says "a user can only read their own data." If one line is wrong, every user can read every other user's anxiety journal. This has happened to real apps built with AI tools in 2025.
- **Edge Functions** (small server programs that call the AI): if the AI key leaks into the browser, anyone can run up your bill.
- **The safety classifier**: if it silently fails, the app will happily chat with someone in crisis without showing the crisis screen.

**Mitigation, which I have built into the plan:**

- I will write the database schema and security rules for you (Doc 09 and `supabase/schema.sql`). You will run them, not write them.
- I will write the Edge Functions and safety logic in Claude Code, with tests. v0 does the screens only.
- Day 24 of the plan is a dedicated "try to break it" day with a checklist.
- Before public launch, you pay a freelance developer for a 2-hour security review (~$150–300). It is the cheapest insurance you will ever buy.

---

## 7. Smaller challenges you should still hear

**"Identify the underlying anxiety pattern" is dangerously close to assessment.** If the app says "this looks like health anxiety" or "this is a catastrophizing pattern," a regulator could read that as diagnosis-like. Fix: Aeris names *situational* patterns ("this is a 'waiting for news' moment"), never clinical ones. Doc 05 and Doc 08 use this framing throughout.

**PWA (web app you can add to your home screen) is a good choice for cost and avoiding app-store fees, but it has costs.** No app store means no app store discovery. Push notifications work on iPhone only after the user adds the app to their home screen. You will spend design effort teaching users that step. The trade is still worth it for an MVP. Note: Apple's app store review for mental-health apps is strict and would be a hurdle later anyway.

**The name "Aeris" is used by other companies** (at least one AI company and several consumer brands). Do a trademark search in your launch country before printing anything. Budget 30 minutes and about $0–300.

**"Very attractive calming UI" is table stakes, not a differentiator.** Every competitor has one. Doc 07 gives you a distinctive one anyway, because an ugly one would be fatal, but do not expect it to win customers on its own.

**You listed three AI coding tools (v0, Claude Code, Codex).** Use two: v0 for screens, Claude Code for everything else. Adding a third tool adds confusion for a non-coder with no benefit. I have dropped Codex from the plan.

---

## The verdict

**Build it. Build it small. Decide with numbers, not hope.**

Aeris is worth 30 days and roughly US$500–1,000 of your money to find out whether anyone comes back. It is not yet worth your savings, a loan, or quitting a job.

### Pass/fail gates (decide these now, while you are calm)

| Gate | When | Pass | Fail |
|---|---|---|---|
| Gate 1: Does the moment flow work? | Day 14, 10 friends/testers | 7 of 10 complete a full session and rate it 6/10 or higher for "felt calmer" | Fewer than 5 of 10 |
| Gate 2: Do strangers come back? | Day 30 + 14 days (so day 44), 100+ strangers | 15% or more open the app again in week 2 | Under 8% |
| Gate 3: Will anyone pay? | Day 60 | 2% or more of active users start a paid plan | Under 1% |
| Gate 4: Is it safe? | Continuous | Zero unflagged crisis conversations in your review sample | Any unflagged crisis conversation triggers an immediate fix before anything else |

If you pass Gates 1–3, you have a real signal and it is time to talk about lawyers, insurance, and a bigger plan. If you fail Gate 2, do not spend another dollar until you understand why. Failing Gate 2 is the most likely outcome and that is fine; it costs you one month and $1,000, not your future.

---

## Sources for this document

- Baumel A. et al., "Objective User Engagement With Mental Health Apps: Systematic Search and Panel-Based Usage Analysis," JMIR 2019. https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720
- STAT News, "Woebot therapy chatbot shuts down; founder says AI moving faster than regulators," July 2025. https://www.statnews.com/2025/07/02/woebot-mental-health-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/
- Manatt, "AI Use in Mental Health: What Tech Companies Need to Know About How States Are Legislating." https://www.manatt.com/insights/newsletters/ai-use-in-mental-health-what-tech-companies-need-to-know-about-how-states-are-legislating
- Orrick, "2026 State Chatbot Laws: Key Provisions and Regulatory Trends." https://www.orrick.com/en/Insights/2026/04/2026-State-Chatbot-Laws-Key-Provisions-and-Regulatory-Trends
- MultiState, "State AI Chatbot Regulation Tackles Disclosure and Safety in 2026." https://www.multistate.ai/updates/vol-85-state-ai-chatbot-regulation-laws
