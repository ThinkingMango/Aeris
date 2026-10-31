> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 07 — MVP Screens & Calming Design System

Two parts: **Part A** is the design system (colours, type, motion, the rules that make Aeris feel calm). **Part B** is every MVP screen, what is on it, and the exact words. Doc 13 turns these into copy-and-paste v0 prompts.

---

## Part A — Design system: "Dusk"

### A1. Design principles (the why)
1. **Slow.** Nothing moves faster than a breath. Transitions are 400–600 ms, eased. No bounces. No spinners (use a slow pulse instead).
2. **Spacious.** Lots of empty space. One idea per screen. Never more than one primary button.
3. **Low contrast, high legibility.** Soft backgrounds, warm near-black text. No pure white, no pure black. Body text is large (18 px minimum on mobile).
4. **Tappable.** Minimum touch target 56 px. Chips are big. Sliders have fat thumbs. A shaking hand must succeed.
5. **Quiet voice.** Sentence case. No exclamation marks. Short sentences. No emoji in the AI's voice (one optional subtle icon per card is fine).
6. **Dark by default at night.** The app auto-switches to the dark theme between 9 p.m. and 6 a.m. local time (user can override). The 3 a.m. user should never be hit with a bright screen.
7. **Reduced motion respected.** If the phone's "reduce motion" setting is on, the orb fades instead of scaling, and all parallax is off.

### A2. Colour tokens

Light theme ("Morning"):

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F6F3EE` | Page background (warm sand) |
| `surface` | `#FDFBF8` | Cards |
| `ink` | `#2B2D33` | Primary text (warm charcoal) |
| `ink-soft` | `#6B6E78` | Secondary text |
| `accent` | `#5B7C99` | Primary button, orb (dusk blue) |
| `accent-soft` | `#DCE5EE` | Chips, selected states |
| `sage` | `#8FA98F` | Positive delta, "mine to handle" |
| `clay` | `#C9A18A` | "Not today," gentle warnings |
| `line` | `#E6E1DA` | Dividers |

Dark theme ("Night"):

| Token | Hex | Use |
|---|---|---|
| `bg` | `#14161C` | Page background (deep navy-charcoal) |
| `surface` | `#1D2027` | Cards |
| `ink` | `#E8E4DD` | Primary text (warm off-white) |
| `ink-soft` | `#9A9DA6` | Secondary text |
| `accent` | `#8FB0CC` | Primary button, orb |
| `accent-soft` | `#283442` | Chips, selected states |
| `sage` | `#9DBB9D` | Positive |
| `clay` | `#C9A18A` | Gentle warning |
| `line` | `#2A2E37` | Dividers |

Crisis screen uses the same palette with the `accent` replaced by a slightly warmer blue (`#7A9BBF` dark / `#4F6E8C` light). **No red anywhere in the app.** Red raises arousal. Warnings use clay.

Contrast: all text pairs above meet WCAG AA (4.5:1) for body text. v0 will be told to keep it that way.

### A3. Typography
- **Display (headlines, the AI's first line):** *Fraunces* (a soft, slightly old-style serif, free on Google Fonts), weight 400–500, optical size tuned for warmth. Sizes: 28 / 24 px.
- **Body & UI:** *Inter* (free), weight 400/500. Sizes: 18 px body on mobile, 16 px secondary, 14 px captions minimum.
- Line height 1.5. Max line length ~60 characters.
- Why a serif for the AI's voice: it reads as "a person who has thought about this," not "a system message." It is also unusual in wellness apps, which are mostly geometric sans-serifs.

### A4. Motion
- **The orb:** A soft radial-gradient circle (accent to accent-soft) that scales from 0.6 to 1.0 over the inhale and back over the exhale, with a slight blur halo. Timing follows the chosen pattern (4-6 default: 4 s in, 6 s out). A single thin ring expands and fades on each exhale.
- **Screen transitions:** 450 ms cross-fade with a 12 px upward drift. Never slide horizontally (feels like a wizard; too "app-like").
- **Slider:** Thumb grows on touch; track colour shifts from sage (low) through accent to clay (high) subtly, never red.
- **AI text:** Fades in line by line (not typewriter character-by-character, which feels like waiting).
- **Nothing loops forever** except the orb during breathing.

### A5. Components (the reusable pieces v0 will build)
`Orb`, `TensionSlider`, `SituationChip`, `AICard` (the AI's speech card, serif text, soft surface), `PrimaryButton` (one per screen), `GhostButton` (secondary), `Timer` (thin arc), `SortBoard` (three drop zones for worry-sort), `DeltaBadge` ("8 → 5 · down 3"), `PatternTile`, `CrisisBanner`, `DisclosureLine` (small, calm, the legal text), `BottomNav` (Home · History · Patterns · Settings; icons only with labels, 4 items max).

### A6. Accessibility checklist (MVP)
- All interactive elements labelled for screen readers.
- Keyboard navigable on desktop.
- `prefers-reduced-motion` honoured.
- `prefers-color-scheme` honoured (plus the night auto-switch).
- Colour never the only signal (deltas have text, chips have check marks).
- Text scales with system font size.

---

## Part B — The screens

Each screen lists: purpose, elements, copy (exact words), states, and what happens next. Screen IDs (S01…) are used in Doc 12 and Doc 13.

### S01 — Landing (public web page)
- **Purpose:** Explain the promise in 10 seconds; let someone try the orb with no account.
- **Elements:** Live orb (slowly breathing in the hero), headline, sub-line, two buttons, three short "how it works" cards, footer disclosures.
- **Copy:**
  - Headline: *A calmer next step.*
  - Sub: *When your mind is racing, Aeris guides you from spiralling to something you can actually do. In about five minutes. Quietly.*
  - Button 1 (primary): *Start*
  - Button 2 (ghost): *Try a Quick Calm — no account needed*
  - Cards: *Tell it what's up (one tap)* · *Do one thing that fits (2–5 min)* · *See what helps, over time*
  - Footer: *Aeris is a wellness tool, not a therapist, doctor, or emergency service. If you're in danger, contact your local emergency number. [Crisis resources] [Privacy] [Terms] [Our safety approach]*
- **Next:** Start → S03. Quick Calm → S02.

### S02 — Quick Calm (no account)
- **Purpose:** Immediate help with zero friction.
- **Elements:** Two large cards: *Breathe with me (2 min)* and *Ground myself (5-4-3-2-1)*. Below: *Want Aeris to guide you through what's going on? [Start]*.
- **States:** Works offline once installed.
- **Next:** Each card → S10 (orb) or S11 (grounding) in "guest mode" (nothing stored). At the end: tension-after slider optional, then a soft invitation to create an account.

### S03 — Sign in / Sign up
- **Elements:** Email field, one button, small line.
- **Copy:** *Enter your email and we'll send you a link. No password to remember.* Button: *Send me a link.* Line: *By continuing you confirm you're 18 or older.*
- **States:** Sent state: *Check your email. The link works for 15 minutes.* Error: *That didn't work. Try again?*
- **Next:** Click link → S04 (first time) or S20 (returning).

### S04 — Welcome & what Aeris is (onboarding 1 of 3)
- **Copy:** Headline: *Hi. I'm Aeris.* Body: *I'm an AI guide for anxious moments. I'm not a person, a therapist, or a doctor, and I can't help in an emergency. What I can do is help you settle and find a next step, and remember what works for you.* Button: *Okay*
- **Next:** S05.

### S05 — Your data (onboarding 2 of 3)
- **Copy:** Headline: *What I keep, and what I don't.* Three lines with icons: *I keep what you tell me in a Moment, encrypted, so I can notice patterns.* · *I never sell it, share it with advertisers, or use it to target you.* · *You can export or delete everything in Settings, any time.*
  Toggle (must be on to continue): *I agree to Aeris storing my wellbeing information so it can help me.* Small links: Privacy · Terms.
- **Next:** S06.

### S06 — If things get heavy (onboarding 3 of 3)
- **Copy:** Headline: *If things get heavy.* Body: *If you're ever in danger or thinking about harming yourself, please reach a human right away. I'll always show these when it matters, and you can find them in Settings.* Country picker (defaults from browser locale). Shows two lines for the chosen country (call line, text line). Button: *Got it*
- **Next:** S07.

### S07 — Add Aeris to your home screen
- **Copy:** *So I'm one tap away at 3 a.m.* iOS: *Tap Share, then "Add to Home Screen."* Android: *Tap the menu, then "Install app."* Buttons: *Done* · *Later*
- **Next:** S20 Home.

### S20 — Home
- **Elements:** Greeting (time-aware: *Good evening*), one big primary button, two Quick Calm shortcuts, a pattern nudge line (only if 3+ sessions), usage meter for free users, bottom nav.
- **Copy:** Button: *Something's up.* Shortcuts: *Breathe* · *Ground.* Nudge example: *Sunday evenings have been heavier lately. Want to look at that?* Meter: *2 of 3 free Moments left this month.*
- **Next:** Button → S30.

### S30 — What's going on? (Moment, step 1)
- **Elements:** AI card: *What's going on?* Six chips: *Something tomorrow* · *A conversation* · *My body* · *Money* · *Someone I love* · *I don't know* + a seventh *Something else* that reveals a text box. Below chips: optional text box *Say more if you want (optional)*. Exit "×" top-right always.
- **Disclosure line (small, bottom):** *You're talking with an AI, not a person.*
- **Next:** S31.

### S31 — How tense are you right now? (Moment, step 2)
- **Elements:** TensionSlider 0–10, label updates (*0 Settled · 5 Tight · 10 Overwhelmed*), button *Next*.
- **Next:** Input goes through the safety check. Level 3 → S90 Crisis. Level 2 → S32 with safety-first script. Else → S32.

### S32 — Aeris reads the moment (Moment, step 3)
- **Elements:** AI card, text fades in line by line. Then two buttons.
- **Copy (AI-generated, within this template):** *[1 sentence reflecting what you said]. [1 sentence naming the pattern: "This sounds like a 'waiting for tomorrow' moment."] [1 sentence proposing: "Let's take two minutes to settle your body, then sort what's actually yours to handle."]* Buttons: *Let's do it* · *Try something else*
- **States:** Loading = slow pulse on the card, text *One moment.* Error = *I lost the thread. Want to try again?* with retry.
- **Next:** S10–S16 (intervention screens) in the sequence chosen.

### S10 — Breathing orb
- **Elements:** Full-screen orb, pattern label (*In 4 · Out 6*), thin arc timer, text cue (*In…* / *Out…*), toggles for sound and haptics (small, top), *I'm done* ghost button after 60 s, × exit.
- **Length:** 90 s default; AI may set 60–180.
- **Next:** Next intervention step or S40.

### S11 — Grounding (5-4-3-2-1)
- **Elements:** One step at a time, serif prompt: *Name 5 things you can see.* Five small chips the user taps as they go (no typing). Then 4 hear, 3 touch, 2 smell, 1 taste. Progress as five faint dots.
- **Next:** S40.

### S12 — Name it
- **Copy:** *Let's name what this is. Which fits best?* Chips (AI-ordered): *Fear of what might happen* · *Replaying what happened* · *Feeling out of control* · *Feeling judged* · *Something else.* Then: *Naming it is already a step. Notice if it loosens, even slightly.* 15-second pause with a soft ring animation.
- **Next:** S40 or next step.

### S13 — Worry-sort (control circle) — **the signature screen**
- **Elements:** Top: *What's on your mind about this?* AI pre-fills 2–4 short items from what the user said (editable), plus *+ add*. Below: SortBoard with three zones: *Mine to handle* (sage) · *Not mine* (ink-soft) · *Not today* (clay). User drags or taps each item into a zone. When all sorted: AI card: *[n] things are yours. The rest isn't yours tonight.* Then: *What's the smallest step on "[top mine item]"?* with a text field and 3 AI-suggested chips. Button: *That's my step.*
- **Next:** S40.

### S14 — Worst, best, most likely
- **Copy:** Three cards in sequence: *What's the worst that could realistically happen?* · *What's the best?* · *What's most likely?* Short text each, AI reflects: *Most-likely is where you'll probably live. Let's plan for that.*
- **Next:** S13 or S40.

### S15 — Postpone the worry
- **Copy:** *This worry can have your attention — later. When?* Chips: *Tomorrow morning* · *This evening* · *Pick a time.* Then: *I'll hold it until then. Right now, let's give your body a minute.* → S10 (60 s).
- **Next:** S40. (Creates an optional check-in at that time.)

### S16 — Body scan / sleep wind-down
- **Elements:** Slow, guided text one region at a time (*feet… legs… hands…*), each 15 s, dimmed screen, optional very soft tone.
- **Next:** S40 (or screen dims to black with *Rest. I'll be here.* if it is the night script).

### S40 — How tense now?
- **Elements:** TensionSlider again, pre-set to the before value so the user moves it. Then DeltaBadge appears: *8 → 5 · down 3.* If no change or worse: *Still an 8. That's honest, and it's okay. Want to try one more thing?* with *One more* · *I'm done.*
- **Next:** S41.

### S41 — Closing card
- **Elements:** AI card: *[One-line acknowledgement]. [Next step if any, as a single line: "Tomorrow: send the email before 10."]* Thumbs up/down: *Did this help?* Optional note field: *Anything you want to remember?* Button: *Done.*
- **Copy rule:** No "Great job!" No streak. Example: *You came here at 2:40 a.m. and did something. That counts. Rest if you can.*
- **Next:** S20.

### S50 — History
- **Elements:** List of cards: date/time, pattern name, DeltaBadge, intervention icon. Tap → S51 detail (what you said, what you sorted, your note). Empty state: *Your Moments will show up here.*

### S60 — Patterns (Plus)
- **Elements:** Three tiles: *Most common lately: Waiting for tomorrow (5 of 8)* · a small bar chart by weekday/time (no red) · *What helps most: Worry-sort, average down 3.* Below: *Triggers you've named* as a chip cloud. Empty/locked state for free users: calm preview with *Aeris Plus* link, not a hard wall.

### S70 — Settings
- Name / how to address you · Country (crisis lines) · Daily check-in time (off by default) · Appearance (auto/light/dark) · Reduce motion · Sounds · Subscription (Manage via Stripe portal) · Export my data · Delete my account and data · Privacy · Terms · Our safety approach · *Aeris is not a therapist, doctor, or emergency service.* · Crisis resources.

### S80 — Pricing / paywall
- **Elements:** Two cards: Monthly $7.99 · Annual $49.99 (*$4.17/mo*). Clear line: *Renews automatically. Cancel any time in Settings.* Button per card. Below: *Keep using Quick Calm and 3 Moments a month, free, always.*
- **Trigger:** After the 3rd free Moment of the month ends, not before it starts (never block someone mid-spiral; let the 3rd complete, then show).

### S90 — Crisis screen
- **Design:** Same calm palette. No alarm. Full screen but soft. Not dismissible by swiping; has explicit buttons.
- **Copy:** *It sounds like things are really heavy right now. I'm an AI and I'm not able to keep you safe, but people are, right now.* Big buttons: *Call [988 / Samaritans 116 123 / …]* (tap-to-call) · *Text [line]* · *Find help in another country.* Then: *If you're not in immediate danger and want to keep going with me, that's okay too.* Ghost button: *I'm safe right now. Continue.* (continues in elevated-concern mode).
- **Logging:** Event stored with minimal content (Doc 10).

### S91 — Physical symptoms notice (inline card, not a full screen)
- **Copy:** *A quick note: I can't tell what's happening in your body. If this is new, severe, or you're worried it's medical, please get medical help now. If you've felt this with anxiety before and want to settle, we can keep going.* Buttons: *Get help* (local emergency number) · *Keep going.*

### S95 — Daily check-in (from notification)
- **Elements:** Just the TensionSlider and *Done.* Optional: *Anything on your mind?* chip row. 10 seconds total. No AI.

### Admin (private, not designed in v0; a simple table page)
- Counts and medians as listed in Doc 06 §5.1.

---

## Screen count

MVP: 26 screens/states. Of these, 18 are static or form screens v0 builds in a session each; 5 are intervention screens that share components; 3 involve the AI (S32, S13's suggestions, S41's line). Doc 12 schedules them.
