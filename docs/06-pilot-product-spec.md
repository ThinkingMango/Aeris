# 06 — Product Specification

**Two products, in order.**
- **Part A, the no-typing conversation reset**, is what Stages 2–4 test ([04](04-hypotheses-and-experiments.md)): a clickable prototype in Stage 2, a live mobile web app in Stage 3, paid in Stage 4.
- **Part B, the free-text, two-arm pilot**, is Stage 5. It is built only if Stages 1–4 pass.

Everything not listed here is out of scope until its gate passes.

**Positioning.** A short, private tool for a specific stressful work moment (E-REG-01). Not therapy, not treatment, not a diagnosis, not for emergencies, and not a "wellbeing companion". Every word on every screen follows the language rules in [10](10-regulatory.md) §5.

---

# Part A — The three-minute reset before a difficult conversation (Stages 2–4)

## 1. Who and when

- **User.** An adult who manages others and has a difficult work conversation coming up: giving hard feedback, asking for something, responding to criticism, or saying no.
- **Moment.** Minutes to hours before the conversation, phone in hand.
- **Outcome.** A calmer start and **one concrete thing to do or say first**.
- **Target.** Under 3 minutes from opening the app to a chosen first step, with no typing. D3 measures it against each person's own current method.

## 2. Design rules

1. **No typing anywhere.** Every input is a tap.
   - **Stage 2 (prototype):** nothing at all is sent anywhere.
   - **Stage 3 (pilot members):** only the conversation type, whether the reset was completed, and the optional rating are recorded, linked to the member's pilot account, because D5 measures reuse per person. That is **not anonymous**, and the screen says so (A1).
   - Card choices, the chosen step and the opener never leave the phone.
   - **All card, step and opener wording comes from one file**, `content/reset_content.json`. It is checked by `src/content/content.test.ts`: every type has content, lengths are checked, and there are no banned words or crisis language.
2. **Lead with the useful output**: sort what you control, then choose a first step. Breathing is optional, offered, never forced.
3. **Help before an account.** Anyone can use it as a guest. Pilot members may add an email to receive one weekly question.
4. **User in control.** Every screen can be skipped. "Stop" is always visible. "Something else" is always available.
5. **No pushing.** No streaks, badges, notifications or celebration. The next step is saved privately on the device and can be deleted.
6. **Honest about limits.** The tool helps with preparing; it cannot fix how someone is being treated. A visible link says so, and points to real help (§3, A6).
7. **Help is one tap away.** "In danger? Get help now" is on every screen and leads to the support screen. "This is about more than work" leads to the limits screen (A6), which links to the support screen.
8. **Theme follows the phone's system setting**, with a manual toggle. The earlier "dark from 9 p.m." rule is dropped: it overrides what people chose and is a common source of web-app bugs.

## 3. Flow and draft copy (for the reviewer)

```
A1 Home: "A difficult conversation ahead?"  [Start the 3-minute reset]   (link: Breathe first, 1 minute)
 ─► A2 "What kind of conversation?"
        [Giving hard feedback] [Asking for something] [Responding to criticism] [Saying no] [Something else]
 ─► A3 "What's weighing on you most?" (pick up to 2, or skip)
        [How they'll react] [Saying it badly] [Not sure what I want] [It feels unfair] [What it means for my job]
 ─► A4 Sort: "Which of these can you control?"  pre-written cards for that conversation type, tap to sort
        into "Mine" / "Not mine"
 ─► A5 One first step: choose one of 3 reviewed options for that conversation type (content/reset_content.json),
        always starting with "Choose your first sentence" (3 opener templates to pick from), e.g. for
        feedback: "Pick your one example", "Decide what you'd like to happen next"
 ─► (optional) A6b one minute of long-exhale breathing
 ─► A7 Done: the chosen step on a quiet card; [Save on this phone] [Done]; optional "Did this help you prepare?"
        (Yes / A bit / No, nothing pre-selected)

Always: footer "In danger? Get help now" ─► support screen
        link "This is about more than work" ─► A6 limits screen
```

| ID | Screen | Draft copy and content |
|---|---|---|
| A1 | Home | "A difficult conversation ahead?" Primary: "Start the 3-minute reset". Small link: "Breathe first (1 minute)". Line, Stage 2: "Private. What you choose stays on this phone." Line, Stage 3 for pilot members: "What you choose stays on this phone. For the pilot we record how often you use it and the type of conversation, never your choices." If a step was saved, it is shown here with "Delete" |
| A2 | Type | Five large buttons. "Something else" leads to a general version of A4 |
| A3 | Weight | Up to two choices, or "Skip". The choices shape the cards on A4: "How they'll react" brings "How they react" and "What I say first" to the top |
| A4 | Sort | 4–6 cards per conversation type. Example, giving hard feedback. **Mine:** "My first sentence", "One clear example", "What I'd like to happen next", "When and where we talk". **Not mine:** "How they react", "Whether they agree today". The reviewer approves every card |
| A5 | First step | Three reviewed options per type, from the content file; the first is always "Choose your first sentence". Opener templates have fill-in brackets the person completes **in their head or on paper**, for example "I'd like to talk about [the report]. I want to be straightforward because I think you can fix it." Copy to clipboard is allowed; typing in the app is not |
| A6 | Limits ("This is about more than work") | "This tool helps you prepare. It can't fix how you're being treated. If you're facing bullying, discrimination or an unsafe workload, these can help: [workplace advice line], [union or employee assistance, if available], [employment-law help]. If you're not safe, get help now." Country-specific links, verified before launch |
| A6b | Breathing (optional) | One minute of long-exhale breathing, as in B2 |
| A7 | Done | "Your first step:" plus the chosen option. "Save on this phone" stores only the option's ID (and the opener's index) locally. "Delete", shown on A1, removes it. The optional "Did this help you prepare?" answer: in Stage 2 it stays in memory only; in Stage 3 it is recorded for pilot members |
| — | Support screen | Emergency number, crisis line, and abuse line for the pilot country. Reached from every screen. **Placeholder numbers can never be dialled**: the button is disabled until a real number is set. Before any real person uses even the prototype (D3), the founder replaces every placeholder with numbers verified on each service's own website. The reviewer re-checks them before Stage 3 |

**Why no typing, given that typing would personalise.** Typing is where the risk and the cost live. It needs crisis screening (E5), a classifier, and a privacy notice about provider retention, and in Illinois it may shade into "therapeutic communication" (E-REG-02). A no-typing tool removes all of that. If people still find it useful, that is the strongest possible result. If they say "it's too generic", that is the evidence for Stage 5.

**What is weaker than a chatbot, stated plainly.** Pre-written cards cannot know the person's situation. A general chatbot with five minutes of typing can be more specific. Aeris bets that three minutes with no typing, a reviewed structure and privacy beat that **for this moment**. D3 tests the bet against the person's real alternative.

## 4. What is stored (Stages 3–4)

| Data | Where | Note |
|---|---|---|
| Chosen step | The device only | Deleted by the person, or by clearing the app |
| Pilot email (optional), consents, country and region | Supabase, `profiles` and `consents` | Consent is to the document versions in force (N36) |
| Session counts: conversation type, completed, optional rating | Supabase, `sessions`, `exercise_runs` and `feedback`, **linked to the pilot account** (not anonymous; A1 says so) | No card choices, no opener text. Situation values `conv_*`; the whole reset is one exercise, `conversation_reset`, which the reviewer activates like any other (P15) |
| Weekly answer: number of difficult conversations | Supabase, or the email tool | A number only |
| Page counters on the landing page | Analytics with no identifiers | Visitor → tried → joined, kept as separate counts |

---

# Part B — The free-text, two-arm pilot (Stage 5 only)

**Scope.** The product used in experiments E5 and E4. One situation family, three exercises, two arms, about 12 screens. Built only after Stages 1–4 pass. In the conversation wedge, Part B adds a free-text box at A3 and an AI-drafted first sentence at A5. The screens below show the general work-worry version they were designed for; adapt the situations to whatever segment Stages 1–4 validated.

## B1. Who and when

- **User.** An adult, 18 or over, with ordinary work-related worry: something tomorrow, replaying something that happened, too much at once.
- **Moment.** Phone in hand, between tasks, or at night before a work day. The target is under 20 seconds from opening the app to the first exercise step (D3).

## B2. The three exercises

All three are inactive in the database until the qualified reviewer approves the final script with a real name and date (tests N24, N28). The app offers only exercises the database reports active (controller test "no exercise is offered until the database reports it active"), and the database refuses to log an inactive one (N27). Wording below is draft.

| ID | Name | What happens | Evidence and limits |
|---|---|---|---|
| `long_exhale_breathing` | Long-exhale breathing | 2 minutes. A circle grows on the in-breath (about 4 seconds) and shrinks on a longer out-breath (about 6 seconds). Reduced-motion version fades instead of scaling | In a trial, daily practice of cyclic sighing, a **different** long-exhale protocol, improved mood more than mindfulness. There was no inactive control (E-EFF-02). Acute, one-off relief is **not** established. Copy must not promise it. The reviewer may prefer the trial's protocol |
| `grounding_54321` | Grounding 5-4-3-2-1 | 2 minutes. Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste. Tap to tick, no typing | Widely used grounding technique; no trial evidence cited here. Present as "a way to bring your attention back", not as treatment |
| `sort_and_step` | Sort it, then one step | 3 minutes. List what is on your mind; sort each item into "mine to act on", "not mine", "not today"; choose one small next step for a "mine" item | Draws on problem-solving and controllability ideas; no Aeris-specific evidence. This is the exercise the AI arm most changes |

No cold-water, ice, or other discomfort-based exercise exists in any mode (E-SAF-02).

## B3. Flow

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

## B4. The two arms

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

## B5. Screens and copy (draft, for the reviewer)

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

## B6. Look and feel

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

**Dark theme.** The v1 dark tokens already passed (ink 14.27:1, ink-soft 6.67:1, sage 8.64:1, clay 7.71:1, button text 7.97:1). Follow the phone's system setting, with a manual toggle.

**Rules.** No red anywhere. Touch targets at least 48 pixels, 56 preferred. Body text 18 pixels on mobile. Respect the phone's reduce-motion setting. Meaning is never carried by colour alone: zones also have labels and icons.

## B7. Explicitly out of scope for the pilot

Payments; push notifications and daily check-ins; history and pattern screens; weekly reflections; multi-turn chat; voice; streaks or badges; sharing; any feature that remembers past conversations. Several of these could pull the product toward the "AI companion" definitions in New York and California law (E-REG-03, E-REG-04). If patterns are ever added, they must use association language such as "sessions with this exercise were rated more helpful". They must never use causal language such as "this works best for you", because the data cannot support it (A4).
