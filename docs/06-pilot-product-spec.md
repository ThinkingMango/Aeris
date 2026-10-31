# 06 — Pilot Product Specification

**Scope.** The product used in experiments E3 (prototype) and E4 (pilot). One situation, three exercises, two arms, about 12 screens. This is deliberately small. Everything not listed here is out of scope until the gates in [04](04-hypotheses-and-experiments.md) pass.

**Positioning.** A stress-management tool for stressful moments at work (E-REG-01). Not therapy, not treatment, not a diagnosis, not for emergencies. Every word on every screen follows the language rules in [10](10-regulatory.md) §5.

---

## 1. Who and when

- **User.** An adult, 18 or over, with ordinary work-related worry: something tomorrow, replaying something that happened, too much at once.
- **Moment.** Phone in hand, between tasks, or at night before a work day. The target is under 20 seconds from opening the app to the first exercise step (E3).

## 2. The three exercises

All three are inactive in the database until the qualified reviewer approves the final script with a real name and date (tests N24, N28). The app offers only exercises the database reports active (controller test "no exercise is offered until the database reports it active"), and the database refuses to log an inactive one (N27). Wording below is draft.

| ID | Name | What happens | Evidence and limits |
|---|---|---|---|
| `long_exhale_breathing` | Long-exhale breathing | 2 minutes. A circle grows on the in-breath (about 4 seconds) and shrinks on a longer out-breath (about 6 seconds). Reduced-motion version fades instead of scaling | In a trial, daily practice of cyclic sighing, a **different** long-exhale protocol, improved mood more than mindfulness. There was no inactive control (E-EFF-02). Acute, one-off relief is **not** established. Copy must not promise it. The reviewer may prefer the trial's protocol |
| `grounding_54321` | Grounding 5-4-3-2-1 | 2 minutes. Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste. Tap to tick, no typing | Widely used grounding technique; no trial evidence cited here. Present as "a way to bring your attention back", not as treatment |
| `sort_and_step` | Sort it, then one step | 3 minutes. List what is on your mind; sort each item into "mine to act on", "not mine", "not today"; choose one small next step for a "mine" item | Draws on problem-solving and controllability ideas; no Aeris-specific evidence. This is the exercise the AI arm most changes |

No cold-water, ice, or other discomfort-based exercise exists in any mode (E-SAF-02).

## 3. Flow

```
Open app
  ├─ Guest (no account): "Breathe now" ─► long_exhale_breathing ─► resources line ─► invite to join pilot
  └─ Pilot participant (signed in once at enrolment)
       ─► S1 Home: one button "Something at work"
       ─► S2 Which is closest? [Tomorrow] [Replaying something] [Too much at once] [Something else]
       ─► S3 Want to say more? (optional text) ─── every text field passes the safety screen ([07](07-safety-spec.md))
       ─► Safety controller decides the route (and the server re-checks it before any AI call)
             ├─ normal ─► S4 Plan ─► S5–S7 exercise(s) ─► S8 Feedback ─► S9 Done
             ├─ restricted ─► S10 Check-in ("Are you safe right now?") ─► breathing or grounding only, crisis line pinned, no AI text
             └─ crisis routes ─► S11 Crisis screen for that route ([07](07-safety-spec.md) §3)
```

The tension score is **optional** and asked only once, before the plan. There is no after-score in the pilot, because a before/after pair invites the person to report improvement (A32). The database has no after-score column (test N32).

## 4. The two arms

Everything is identical except the rows marked **differs**.

| Part | Scripted arm | AI arm |
|---|---|---|
| Screening | Keywords on the device, then the server classifier | Same |
| Routes, notices, permitted exercises | Safety controller | Same |
| S4 plan wording | **Differs.** Fixed reviewed sentence per situation, e.g. "Let's settle your body first, then sort what's yours to act on." | **Differs.** One reflection sentence plus one proposal sentence, written by the model, validated, at most 60 words |
| Exercise choice | **Differs.** Fixed mapping (below) | **Differs.** Model chooses 1–3 from the permitted list; validated |
| Worry items in `sort_and_step` | **Differs.** Person types their own | **Differs.** Pre-filled from what they typed; empty if they typed nothing; editable |
| Next-step ideas | **Differs.** Three fixed reviewed ideas per situation | **Differs.** Three model-written ideas, at most 80 characters each, returned in the same call as the reflection (`suggestions` in `src/ai/read_schema.json`) and validated |
| On any AI failure | — | Shows the scripted wording and logs a fallback, so the arm is never broken |
| AI disclosure | — | "Some words here are written by AI." on S4, every session |

**Scripted mapping.** Each step is used only if the controller permits it on the current route **and** the exercise is active. If no step survives, the plan falls back to `fallbackPlan` (breathing if permitted, otherwise nothing).

| Situation | Tension 7 or more, or not given | Tension under 7 |
|---|---|---|
| Tomorrow | breathing, then sort_and_step | sort_and_step |
| Replaying something | grounding, then sort_and_step | sort_and_step |
| Too much at once | breathing, then sort_and_step | sort_and_step |
| Something else | breathing | grounding |

## 5. Screens and copy (draft, for the reviewer)

| ID | Screen | Draft copy |
|---|---|---|
| S0 | Enrolment, once | "Aeris is a pilot of a stress tool for work moments. It is not therapy, not medical care, and not for emergencies. You must be 18 or over." Consent toggles for terms, privacy, pilot participation, 18+, and optional research contact, all off by default. **Country is required** and sets the crisis lines (test N33). Region (for example US state) is asked where it changes the rules, such as Illinois (P12). Only invited email addresses can enrol (N26) |
| S1 | Home | Button: "Something at work". Small link: "Breathe now". Footer: "In danger? [Get help now]" |
| S2 | Situation | "Which is closest?" Four large buttons |
| S3 | Say more | "Want to say more? You can skip this." Text box. "Skip" and "Next" equally prominent |
| S4 | Plan | Scripted or AI wording (§4). Buttons: "Start" and "Something else" |
| S5 | Breathing | Circle, cue text "In… / Out…", 2-minute arc, "Stop" always visible |
| S6 | Grounding | One sense at a time, tap to tick |
| S7 | Sort and step | Items, three zones, then "One small step for this?" with three ideas and a text box |
| S8 | Feedback | "How helpful was that?" 1–5 buttons with **no** default selected; "Would you use this again for a moment like this?" Yes, No, Not sure. Either question may be answered alone (P05). Skippable |
| S9 | Done | "That's it for now." Optional: the next step they chose. No streaks, no celebration |
| S10 | Check-in | "Before we go on: are you safe right now?" [Yes] [Not sure] [No]. The answer goes to `checkInAnswer`. "Not sure" and "No" go to the self-harm crisis screen; "Yes" stays restricted |
| S11 | Crisis screens | One per route; content in [07](07-safety-spec.md) §3. The resources shown come from the controller's `resources` list, so co-occurring risks (a minor who is also unsafe at home) show everything required. The abuse screen's quick exit uses `location.replace` so Back does not return ([07](07-safety-spec.md) §8) |
| S12 | Settings | Country and region, delete my account and data, privacy notice, about the pilot, help line. Emails (sign-in link, weekly survey) use a neutral sender and subjects that do not mention stress or safety |

## 6. Look and feel

Calm visual design is necessary but is **not** a differentiator; every competitor has one.

**Colour tokens, light theme.** Contrast checked against WCAG 2.1 (E-DES-01, E-DES-02).

| Token | Hex | Use | Contrast on background #F6F3EE |
|---|---|---|---|
| `bg` | #F6F3EE | Page | — |
| `surface` | #FDFBF8 | Cards | — |
| `ink` | #2B2D33 | Body text | 12.43:1 |
| `ink-soft` | #6B6E78 | Secondary text, 16px or larger | 4.60:1 |
| `accent` | #52708B | Primary button fill, with `surface` text at 5.02:1 | 4.69:1 |
| `sage-ink` | #597459 | Text or icons meaning "yours to act on" | 4.67:1 |
| `clay-ink` | #946244 | Text or icons meaning "not today" | 4.64:1 |
| `sage-tint` | #8FA98F | **Decoration only** (fills behind text, never text or a lone indicator) | 2.30:1, not for text or UI boundaries |
| `clay-tint` | #C9A18A | **Decoration only** | 2.12:1, not for text or UI boundaries |

**Dark theme.** The v1 dark tokens already passed (ink 14.27:1, ink-soft 6.67:1, sage 8.64:1, clay 7.71:1, button text 7.97:1). Switch automatically between 9 p.m. and 6 a.m. unless the user chooses.

**Rules.** No red anywhere. Touch targets at least 48 pixels, 56 preferred. Body text 18 pixels on mobile. Respect the phone's reduce-motion setting. Meaning is never carried by colour alone: zones also have labels and icons.

## 7. Explicitly out of scope for the pilot

Payments; push notifications and daily check-ins; history and pattern screens; weekly reflections; multi-turn chat; voice; streaks or badges; sharing; any feature that remembers past conversations. Several of these could pull the product toward the "AI companion" definitions in New York and California law (E-REG-03, E-REG-04). If patterns are ever added, they must use association language such as "sessions with this exercise were rated more helpful". They must never use causal language such as "this works best for you", because the data cannot support it (A4).
