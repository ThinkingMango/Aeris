> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 06 — Core Features (complete list)

**How to read this:** Features are grouped by *stage* of the user journey. Each has a priority:

- **MVP** — must exist at Day 30 launch. Without it, the product does not work or is not safe.
- **v1.1** — first 60 days after launch, if Gate 2 passes.
- **Later** — only after retention and revenue are proven.

Every MVP feature maps to the "3 a.m. story" in Doc 02. If you are tempted to add something, ask the ChatGPT test from Doc 05.

---

## Stage 0 — Arrive (first 60 seconds)

| # | Feature | What it does | Priority | Why |
|---|---|---|---|---|
| 0.1 | **Landing page** | One screen: promise, a live demo of the breathing orb, "Try a Quick Calm (no account)," "Start." Disclosures in footer. | MVP | First impression; organic traffic lands here |
| 0.2 | **Quick Calm without an account** | The breathing orb and 5-4-3-2-1 grounding work with zero signup. | MVP | Removes friction; shows privacy; lets a panicking person get help in 2 taps |
| 0.3 | **Sign up / sign in (email magic link)** | No passwords. Enter email, click link in email, done. Supabase Auth + Resend. | MVP | Simplest, safest; no password resets to support |
| 0.4 | **18+ confirmation** | A single checkbox with date-of-birth-free "I confirm I am 18 or older." | MVP | Legal (Doc 03) |
| 0.5 | **Consent screen** | Plain-language: what Aeris is and is not; "we store what you tell us, encrypted; you can delete it any time"; explicit health-data consent toggle. | MVP | GDPR/WA MHMDA/Utah; also builds trust |
| 0.6 | **Crisis resources shown once at onboarding** | "If you're in danger right now, here's who to contact." Country picker sets the right numbers. | MVP | Legal and ethical |
| 0.7 | **Add to home screen prompt** | Gentle instruction to install the PWA, with iOS/Android-specific steps. Dismissible. | MVP | Without this, PWA retention collapses |
| 0.8 | **Social sign-in (Apple/Google)** | — | v1.1 | Convenience; needs Apple developer account ($99/yr) |

## Stage 1 — The Moment (the core loop)

| # | Feature | What it does | Priority | Why |
|---|---|---|---|---|
| 1.1 | **"What's going on?" chips** | Six large tappable situation chips + "something else" text option. | MVP | D1: tap, don't type |
| 1.2 | **Tension slider (before)** | 0–10 slider, large thumb, haptic ticks, colour shifts subtly. | MVP | D3: measured outcome |
| 1.3 | **Optional "say more" box** | One text field, 280-char hint, voice-to-text via the phone keyboard. Skippable. | MVP | Gives AI context without requiring it |
| 1.4 | **Safety screen (invisible)** | Every user input is checked for crisis signals before the AI responds. (Doc 10.) | MVP | Non-negotiable |
| 1.5 | **AI situation read + pattern naming** | Aeris replies in 2–3 short sentences: reflects what it heard, names the situational pattern, proposes one intervention. "I'm an AI, not a person" disclosure on first message. | MVP | D2, D5; legal disclosure |
| 1.6 | **One-tap accept / "try something else"** | Accept starts the intervention. "Something else" swaps to the next best in the library. | MVP | Choice without a menu |
| 1.7 | **Intervention library (12 scripted flows)** | See Doc 05 §1 D2. Each is a sequence of screens with timers, animations, and short prompts. AI personalizes phrasing only. | MVP (at least 8 of 12 at launch; the rest by v1.1) | The actual help |
| 1.8 | **Breathing orb** | Expanding/contracting circle with 4-6 or 4-7-8 pacing, optional haptics, optional soft tone, reduced-motion fallback. | MVP | The signature visual; works with no AI |
| 1.9 | **Worry-sort (control circle)** | User types or taps the things they are worried about (AI pre-fills from what they said); drags each into "mine to handle," "not mine," "not today." Ends with one next smallest step for the "mine" pile. | MVP | Your core promise ("identify what they can actually control"); most differentiated screen |
| 1.10 | **Tension slider (after)** | Same slider. Shows delta: "8 → 5. Down 3." | MVP | D3 |
| 1.11 | **"Did this help?" micro-feedback** | Thumbs up/down on the intervention + optional one-tap reason. | MVP | Feeds personalization |
| 1.12 | **Closing card** | One next step (if any), a gentle "you can come back any time," and the option to save a note. No streak. No confetti. | MVP | Closure; D5 restraint |
| 1.13 | **Session summary stored** | Structured record: pattern, triggers, intervention, before/after, note. | MVP | D4; database (Doc 09) |
| 1.14 | **Mid-session "I need to stop"** | Always-visible exit; saves partial session; shows the after-slider optionally. | MVP | Respect; safety |
| 1.15 | **"Talk it through" free-form turns** | After the intervention, user can continue in a short structured chat (max ~6 turns) for reflection. | v1.1 | Useful, but scope; also where chat-law obligations get heavier |
| 1.16 | **Voice input / voice guidance** | — | Later | Scope; context issues (Doc 05 "no" list) |
| 1.17 | **Haptic pacing & soundscape options** | — | v1.1 | Polish |

## Stage 2 — Between moments

| # | Feature | What it does | Priority | Why |
|---|---|---|---|---|
| 2.1 | **Home screen with one big button** | "Something's up" (start a Moment) + Quick Calm shortcuts + a one-line pattern nudge ("Sunday evenings have been heavy lately"). | MVP | Speed; keeps patterns visible |
| 2.2 | **Daily check-in (optional, user-chosen time)** | One notification per day at a time the user picks: "How's your tension right now?" → slider → done (10 seconds). No AI. | MVP (basic) | The habit hook that fixes the retention problem (Doc 01 §1). Costs nothing to run |
| 2.3 | **History list** | Past Moments as cards: date, pattern, before→after. Tap to see detail. | MVP | Proof over time |
| 2.4 | **Patterns screen (basic)** | Three tiles: most common pattern, best time-of-day/weekday chart, what helped most. Requires 3+ sessions; shows a calm empty state before that. | MVP (basic), Plus feature | D4; the paid value |
| 2.5 | **Weekly reflection (AI-written)** | Every Sunday, a 4-sentence reflection generated from the week's structured records: patterns, wins, one suggestion. Delivered in-app and by email (opt-in). | v1.1, Plus feature | Retention; uses the Batch API at half price |
| 2.6 | **Personalization memory** | Aeris remembers: what interventions you rated up/down, your preferred pacing, your name/preferred form of address, your typical patterns. Used to pre-select interventions. | v1.1 | D4; makes repeat use faster |
| 2.7 | **Export my data (JSON/CSV)** | One tap in Settings. | MVP | GDPR; trust |
| 2.8 | **Delete everything** | One tap + confirm. Deletes within minutes; account gone. | MVP | GDPR/WA MHMDA; trust |
| 2.9 | **Share with my therapist (PDF summary)** | A tidy one-page summary of patterns the user can bring to a session. | Later | Reinforces "complement, not replacement" positioning |

## Stage 3 — Safety (runs across everything)

| # | Feature | What it does | Priority |
|---|---|---|---|
| 3.1 | **Input safety classifier** | Fast AI check of every message for self-harm, harm to others, abuse, medical emergency, minor indicators. Returns a level 0–3. | MVP |
| 3.2 | **Crisis screen (level 3)** | Warm, non-abrupt. Stays on screen. Shows local crisis line as a tap-to-call button, text line, and "I'm safe right now, continue" option. Logged. | MVP |
| 3.3 | **Elevated-concern mode (level 2)** | Aeris continues but with a safety-first script: checks in, offers resources, avoids interventions that require being alone with intense feelings. | MVP |
| 3.4 | **Physical-symptom branch** | Any chest pain / breathing difficulty / fainting mention triggers "if this is new or severe, seek medical help now" plus the option to continue with grounding. | MVP |
| 3.5 | **Output check** | The AI's reply is checked before display for banned phrases (diagnosis language, medication advice, dismissiveness). | MVP |
| 3.6 | **Rate limits** | Per-user caps on sessions/hour and messages/session to prevent dependency loops and cost blowups. | MVP |
| 3.7 | **Safety event log and weekly review** | Every flagged event stored (minimal content), you review weekly. | MVP |
| 3.8 | **AI disclosure, recurring** | At session start, and every 3 hours of continuous use (New York law). | MVP |
| 3.9 | **Published crisis protocol page** | On the website. | MVP |

## Stage 4 — Account & money

| # | Feature | What it does | Priority |
|---|---|---|---|
| 4.1 | **Settings** | Name, country (sets crisis lines), check-in time, reduced motion, sound, data export, delete, subscription, legal links. | MVP |
| 4.2 | **Pricing page + paywall** | Shown when free sessions run out. Honest, no dark patterns. Monthly/annual. | MVP |
| 4.3 | **Stripe Checkout & Customer Portal** | Payment, renewal, cancel. | MVP |
| 4.4 | **Usage meter** | "2 of 3 free Moments used this month." | MVP |
| 4.5 | **Transactional email (Resend)** | Magic link, welcome, receipt (Stripe sends its own), renewal reminder, deletion confirmation. | MVP |
| 4.6 | **Founding member offer** | — | Optional at launch |
| 4.7 | **Organisation / team plans** | — | Later |

## Stage 5 — You, the operator

| # | Feature | What it does | Priority |
|---|---|---|---|
| 5.1 | **Admin view (private)** | Counts: signups, sessions, completion, before/after median, crisis events, AI spend. Built as a Supabase SQL view + a protected page. | MVP (basic) |
| 5.2 | **Cost guardrails** | Daily AI spend cap in the Edge Function; alert email at 80%. | MVP |
| 5.3 | **Error alerts** | Vercel + Supabase alerts to your email. | MVP |
| 5.4 | **Intervention editor** | Edit scripts without redeploying (stored in the database). | v1.1 |
| 5.5 | **A/B testing of interventions** | — | Later |

---

## MVP feature count check

MVP items: roughly 45. That sounds like a lot for 30 days, but notice that most are *screens with no AI*, and the AI parts are only three: the safety classifier, the situation read, and the post-session structured record. v0 generates screens quickly; Claude Code writes the three AI functions. The plan in Doc 12 sequences all of this.
