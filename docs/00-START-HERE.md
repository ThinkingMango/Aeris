# Aeris Product Deep Dive — Start Here

**Written:** 30 October 2026
**For:** Lawrence (founder, non-coder)
**Status:** Planning. Nothing has been built yet. No code exists in this repository except these documents.

---

## How to read this

These documents are long on purpose. You asked for a brutally honest, end-to-end deep dive. Read them in order the first time. After that, jump to whichever one you need.

Everything is written so that someone with no coding background can follow it. When a technical word appears, it is explained the first time it is used.

| # | Document | What it answers | Read time |
|---|----------|-----------------|-----------|
| 01 | [Brutal Honesty & Verdict](01-brutal-honesty-and-verdict.md) | Should you build this at all? What will kill it? | 15 min |
| 02 | [Customer Pain Points](02-customer-pain-points.md) | Who hurts, how, and what they actually want | 15 min |
| 03 | [Regulatory Risks](03-regulatory-risks.md) | What the law says about AI + anxiety apps in 2026 | 20 min |
| 04 | [Monetization](04-monetization.md) | How it makes money, with real numbers | 15 min |
| 05 | [Differentiation](05-differentiation.md) | Why anyone would pick Aeris over ChatGPT or Calm | 10 min |
| 06 | [Core Features](06-core-features.md) | The complete feature list, split into MVP / later | 15 min |
| 07 | [MVP Screens & Calming UI](07-mvp-screens-and-design.md) | Every screen, what is on it, and the design system | 25 min |
| 08 | [AI Architecture](08-ai-architecture.md) | How the AI actually works, step by step | 25 min |
| 09 | [Database Design](09-database-design.md) | What data you store and how it is protected | 20 min |
| 10 | [Safety Architecture](10-safety-architecture.md) | How you keep users safe and yourself out of court | 25 min |
| 11 | [Costs](11-costs.md) | Development, tools, and AI costs with worked examples | 15 min |
| 12 | [30-Day Build & Launch Plan](12-thirty-day-plan.md) | Day-by-day what to do, with exact instructions | 30 min |
| 13 | [v0 Prompts](13-v0-prompts.md) | Copy-and-paste prompts to generate each screen in v0 | Reference |
| 14 | [LLM Provider & Model Selection](14-llm-provider-and-model-selection.md) | Claude vs OpenAI vs Gemini vs DeepSeek vs Qwen, and reasoning vs standard, for this app | 25 min |
| 15 | [Most Effective, Most Efficient Model](15-model-deep-dive-effectiveness-efficiency.md) | Opus 5.5 vs Sonnet 5.5 vs Haiku 5.5, grounded in Anthropic's system cards, with corrected costs and test rules | 25 min |
| — | [evals/](../evals/README.md) | The Day 18 model comparison script | Reference |
| — | [supabase/schema.sql](../supabase/schema.sql) | The actual database setup file, ready to run | Reference |

---

## The one-paragraph verdict

Aeris is a **reasonable product idea in a brutal market**. The idea itself is sound: people in an anxious moment need one right next step, not a library. The problems are not the idea. The problems are (1) nobody opens an app when they are anxious unless the app has already become a habit, (2) your real competitor is free ChatGPT, which people already use for exactly this, (3) the law around AI and mental health tightened sharply in 2025–2026 and you would be the least-protected party in the room, and (4) wellness apps lose roughly 97 of every 100 users within a month. **My recommendation is to build it, but build it small, cheap, and de-risked, and treat the first 30 days as an experiment with hard pass/fail gates, not a launch of a business.** Document 01 explains each of these points and the gates.

---

## The 5 decisions only you can make

I have made every routine decision for you in these documents so you can move. These five are yours. Each is explained in the relevant document. You do not need to answer them before reading.

1. **Launch country.** The rules differ a lot between the US, UK, EU, Australia, and elsewhere. I assumed **English-speaking, 18+, starting with one country** and wrote the safety resources for the US, UK, Canada, Australia, Ireland, New Zealand, Hong Kong and Singapore. You must pick one for the first launch. (Doc 03)
2. **Which AI model to use.** After the deep dive in Doc 15, the recommendation is Claude Sonnet 5.5 for every word the user reads and Claude Haiku 5.5 for the safety classifier and background jobs. Opus 5.5 costs twice as much and is only worth it if your Day 18 blind test shows a clear tone win. The decision rules are written down in Doc 15 §7 so the test, not opinion, decides.
3. **Free tier generosity.** I propose 3 AI-guided sessions per month free, unlimited non-AI calming tools. (Doc 04)
4. **Whether to spend on a lawyer before launch.** I strongly recommend yes, about US$1,500–5,000. You can launch a closed beta without it, but not a public paid product. (Doc 03)
5. **Your personal time budget.** The 30-day plan assumes roughly 3–4 hours per day. If you have 1 hour per day, it is a 90-day plan. (Doc 12)
