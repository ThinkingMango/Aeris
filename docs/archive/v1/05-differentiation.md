> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 05 — Differentiation

**The question to answer:** On a Tuesday at 2 a.m., why would someone open Aeris instead of ChatGPT (free, already installed) or Calm (beautiful, trusted)?

If you cannot answer this in one sentence, the product fails. Here is the sentence:

> **Aeris is the only tool that gets you from "I'm spiralling" to "I'm doing something" in three taps, and then remembers what worked so next time is faster.**

Everything below unpacks that sentence into design decisions.

---

## 1. The five differentiators (and the one that is not)

### D1. Tap, don't type (speed in the moment)
- **The problem with chatbots:** They start with a blank box. A panicking person has to compose a paragraph. That is a cognitive tax at exactly the wrong moment.
- **Aeris:** The first screen is a single question with 6 large tappable chips: *Something tomorrow · A conversation · My body · Money · Someone I love · I don't know*. Then one slider (tension 0–10). Then Aeris is already talking. Typing is always available, never required.
- **Why competitors cannot easily copy it:** ChatGPT is general-purpose; it will not build an anxiety-specific tap flow. Calm and Headspace are content libraries; a tap flow would cannibalize their library model.

### D2. The right intervention, chosen for you (not a library)
- **The problem:** Calm gives you 400 options. ChatGPT gives you a numbered list of 7 techniques. Both put the choice on the user.
- **Aeris:** The AI classifies the moment into one of a small number of *situational* types (not clinical types) and picks **one** intervention from a curated library of ~12. You can swap ("try something else") with one tap, but you never face a menu.
- **The library (MVP):** paced breathing (orb), 5-4-3-2-1 grounding, body scan, "name it to tame it" labelling, worry-sort (control circle), worst/best/most-likely, "postpone the worry" scheduling, self-compassion script, progressive muscle release, physical reset (gentle movement or a change of room; no cold water, see Doc 15), "next smallest step," and a sleep wind-down. Each is a scripted, tested flow. The AI *selects and personalizes*; it does not improvise the exercise. (This is also a safety feature: the AI cannot invent a harmful exercise.)

### D3. Measured outcome (proof, not vibes)
- Every session: tension rating before and after. The user sees "8 → 5. Down 3." over time, "Breathing works for your body moments; worry-sort works for your tomorrow moments."
- **Why it matters:** It is the single strongest driver of belief, and belief drives return. ChatGPT cannot do this. Calm does not do this per-moment.

### D4. Pattern memory (the compounding value)
- Each session leaves behind a tiny structured record: situation type, trigger tags, intervention used, outcome. No essay required.
- After a few sessions, Aeris can say: "This is the fourth 'waiting for a reply' moment this month. Last time, worry-sort helped most. Want to start there?"
- The Patterns screen shows triggers over time, time-of-day, and what helped. This is your retention engine and your paid feature.
- **Why competitors are weak here:** Chatbots have memory but it is unstructured and not surfaced as insight. Journal apps have structure but require writing.

### D5. Quiet, not chatty (tone and restraint)
- Aeris speaks in short sentences. It asks at most two questions before acting. It never sends a wall of text. It does not use exclamation marks. It does not say "Great question!" It does not nag with streaks or badges.
- The interface uses slow motion, low contrast, large type, and a lot of empty space. The visual experience itself is part of the intervention.
- **Why it matters:** The most common complaint about AI chatbots for anxiety is that they are too talkative. Restraint is rare and noticeable.

### What is NOT a differentiator (be honest with yourself)
- "Calming UI." Everyone has one. Necessary, not sufficient.
- "Private." Everyone claims it. Only becomes a differentiator if you *show* it (visible delete button, "what we store" screen, no account required for Quick Calm tools).
- "AI-powered." Everyone is. Users do not care about the technology, only the result.
- "Not a therapist." That is a legal disclosure, not a selling point.

---

## 2. Positioning statement

> For adults who get caught in anxious moments and don't want another meditation library or a chatty bot, **Aeris** is a quiet AI guide that takes you from spiralling to a concrete next step in under five minutes, measures whether it helped, and learns your patterns so each moment gets easier. Unlike ChatGPT, it never makes you type when you can't think. Unlike Calm, it never makes you choose. Aeris is not therapy, and it says so.

---

## 3. Things Aeris will deliberately NOT do (the "no" list)

Saying no is how a small product stays sharp. Each "no" below is a conscious choice.

| We will not… | Because… |
|---|---|
| Have streaks, badges, or "you've missed 3 days" | They create guilt; guilt is anxiety; anxious users already punish themselves |
| Send daily motivational push notifications | Notification fatigue, and it cheapens the moment-based promise. One optional, user-chosen daily check-in time is the maximum |
| Offer a library of hundreds of meditations | That is Calm's business and it is the opposite of our promise |
| Let the AI free-chat without structure | It is slower, less safe, and makes Aeris a worse ChatGPT |
| Use voice input in MVP | Many anxious moments are in bed next to someone, at work, or in public; voice is a v2 option, not a default |
| Have social features, community, or sharing | Privacy, moderation burden, safety risk, and scope |
| Offer a "therapist mode," CBT course, or clinical questionnaires (GAD-7, PHQ-9) | Those are the medical-device line (Doc 03) |
| Build a native iOS/Android app in year one | PWA is faster, cheaper, avoids 30% fees and the app-store health review; revisit when retention is proven |

---

## 4. The "ChatGPT test"

Before any feature ships, ask: **"Could the user get this by typing one sentence into free ChatGPT?"**

- If yes, the feature must be *faster* (fewer taps, no typing) or *remembered* (surfaces across time) or *safer* (structured crisis handling) to earn its place.
- If none of those, cut it.

Examples:
- "Explain why I feel anxious" → ChatGPT does it fine. Cut it. Aeris does not explain; it acts.
- "Guide me through breathing" → ChatGPT can describe it, but the orb animation with haptic pacing is better in the moment. Keep.
- "Tell me what I can control" → ChatGPT can list it, but Aeris makes it a tap-sort with the user's own words and remembers the result. Keep.
- "Weekly summary of my triggers" → ChatGPT cannot do it across sessions without copy-paste. Keep; it is the paid feature.

---

## 5. Naming the moment (the pattern vocabulary)

To stay on the right side of the "no diagnosis" line and still deliver insight, Aeris uses a vocabulary of **situational patterns**, not clinical ones. These are what the AI classifies into and what the Patterns screen reports on.

| Pattern name (shown to user) | What it covers | Default intervention |
|---|---|---|
| **Waiting for tomorrow** | Anticipatory dread about an upcoming event | Worry-sort (control circle) → next smallest step |
| **Replaying a conversation** | Rumination over social interaction | Name-it labelling → worst/best/most-likely |
| **Body first** | Physical sensations leading (racing heart, tight chest) | Paced breathing → grounding. Always includes "seek care if new/severe" |
| **Waiting for news** | Pending result, message, decision outside your control | Postpone-the-worry → self-compassion |
| **Too much at once** | Overwhelm, too many tasks, can't start | Brain-dump → next smallest step |
| **Checking loop** | Repeated checking (symptoms, messages, news) | Name-it → postpone-the-worry → physical reset |
| **Late-night loop** | Can't sleep, mind racing | Body scan → sleep wind-down |
| **Someone I love** | Worry about another person's safety or feelings | Control circle → self-compassion |
| **Money** | Financial worry | Control circle → next smallest step |
| **I don't know** | Diffuse, unnamed anxiety | Grounding → labelling |

Notice none of these is a diagnosis. Anyone can have a "waiting for tomorrow" moment. That is intentional, and it is also more useful to the user than a clinical label would be.
