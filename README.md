# Aeris

**An AI that learns your anxiety patterns and helps you interrupt them when they happen.**

Aeris is a wellness self-help product for adults with anxious thoughts, overthinking and uncertainty. At the moment anxiety hits, it asks what is happening, notices the likely thinking pattern in plain language, guides one short evidence-based exercise, checks whether it helped, and over weeks learns when, about what, and with which tools the person's anxiety tends to show up and ease. It is not therapy, not diagnosis, and not an emergency service, and it is built so that it cannot pretend to be.

## What this repository is

This repository holds the **founding product documents** for Aeris: the market and regulatory deep dive, the MVP specification and current-state audit, and the 30-day build-and-launch plan.

The **application code** lives in a separate repository, `ThinkingMango/aeris-calm-foundation`, which is connected to Lovable and deployed on Vercel. That codebase is substantially built: authentication, onboarding, the conversation engine, a tested safety layer, five interventions, session summaries and pattern aggregation, Paddle billing, a Privacy Center with export and deletion, retention enforcement, and release-candidate gating. The documents here were written against a direct audit of that code on 13 September 2026.

## Documents

| Document | What it answers |
|---|---|
| [`docs/01-product-deep-dive.md`](docs/01-product-deep-dive.md) | Is this a viable business, against whom, under which rules? Market reality, competitor teardown with real user complaints, clinical grounding for the toolkit, regulatory boundaries for the US, UK, EU, Hong Kong and Singapore, platform policies, monetization and unit economics, positioning, risks. |
| [`docs/02-mvp-spec.md`](docs/02-mvp-spec.md) | What is actually built, what is missing against the five MVP capabilities, and the specification of only the gaps: the Personal Anxiety Map, effectiveness-aware intervention selection, streaming feel, voice input, safety coverage, legal documents, analytics. Includes the conversation contract, intervention library, AI architecture and cost model, database schema and safety architecture as built. |
| [`docs/03-30-day-launch-plan.md`](docs/03-30-day-launch-plan.md) | Day-by-day plan from the current release state to a certified, legally launchable, paid product: unblock and decide, RC4 certification gates, compliance and safety coverage, the Anxiety Map, private beta, Paddle go-live, launch. With Lovable prompt templates, budget, risk register, and what not to do. |
| [`docs/research/`](docs/research/) | The two source memos (competitor teardown, regulatory landscape) with links for every claim. |

## The five MVP capabilities

1. **Help me now.** Text (and browser voice) conversation → 1–10 intensity → understand → name the pattern → one 2–5 minute tool → reassess → summary. Built.
2. **A journal that needs almost no journaling.** Trigger, thought, what helped and next step are extracted from the conversation and confirmed by the person. Built.
3. **Personal anxiety map.** When, about what, which thinking patterns, which tools help, intensity over time. Data foundation built; screen is the main open item.
4. **Personalized intervention engine.** What has actually helped this person is measured and fed back into selection. Measured; ranking is a small open item.
5. **Safety and escalation.** Deterministic risk floors plus a classifier, approved copy for medication, reality-sensitive, violence and relational turns, locale-aware crisis resources, safety never paywalled. Built and evaluated on 311 cases.

## Positioning in one paragraph

The consumer market for mental-wellness subscriptions is contracting and the best-funded direct competitor is free. Aeris does not compete on content or on being a companion. It competes on the five things every chatbot user complains about and no product fixes: it responds instead of acknowledging, it moves to action instead of looping, it refuses to manufacture reassurance, it remembers your patterns transparently and lets you correct them, and it handles the wide middle ground of distress that is neither "fine" nor "call a hotline". Launch markets are Hong Kong, Singapore, the United Kingdom and Australia.

## Status

Founding documents v1, 13 September 2026. The application is at release candidate `rc-2026-09-11-03` plus a post-hardening checkpoint; RC4 production certification is the first phase of the plan.
