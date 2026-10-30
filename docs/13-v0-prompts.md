# 13 — v0 Prompts (copy and paste)

**How to use:** In v0.app, create one project called "Aeris." Paste **P0** first and iterate until the design system feels right. Then, for each screen, paste its prompt. Every screen prompt starts with the same first line so v0 reuses the design system. After each screen looks right, export to the codebase and let Claude Code wire the data.

**Iteration tips for a non-coder:**
- Give one change at a time: "Make the headline serif larger." Not five things at once.
- Use feelings and references: "slower," "quieter," "more space," "like a dimmed bedroom at night."
- If v0 adds something you did not ask for (a badge, a confetti animation, a red button), say "Remove the [thing]. Aeris never uses red or celebrations."
- Say "mobile first, 390 px wide" if it drifts to desktop layouts.

---

## P0 — Design system ("Dusk")

```
Create a design system for "Aeris", a calm, private AI guide for anxious moments. Mobile-first (390px), also fine on desktop. Build it as reusable React components with Tailwind and CSS variables.

Principles: slow (transitions 450–600ms, ease-out, no bounces, no spinners), spacious (one idea per screen, one primary button max), low-contrast but WCAG AA legible, large touch targets (min 56px), quiet voice (sentence case, no exclamation marks, no emoji), no red anywhere, no streaks or badges, respects prefers-reduced-motion and prefers-color-scheme.

Color tokens — light "Morning": bg #F6F3EE, surface #FDFBF8, ink #2B2D33, ink-soft #6B6E78, accent #5B7C99, accent-soft #DCE5EE, sage #8FA98F, clay #C9A18A, line #E6E1DA.
Dark "Night": bg #14161C, surface #1D2027, ink #E8E4DD, ink-soft #9A9DA6, accent #8FB0CC, accent-soft #283442, sage #9DBB9D, clay #C9A18A, line #2A2E37.
Auto-switch to dark between 21:00 and 06:00 local time unless the user overrides.

Typography: Fraunces (Google Fonts) for headlines and the AI's spoken lines, weight 400–500, 28/24px. Inter for body and UI, 18px body on mobile, 16px secondary, 14px captions. Line height 1.5, max ~60 characters per line.

Components to build and showcase on one demo page:
1. Orb: a soft radial-gradient circle (accent → accent-soft) with a blurred halo that scales 0.6→1.0 over an inhale and back over an exhale; default 4s in / 6s out; a thin ring expands and fades on each exhale; text cue "In…" / "Out…"; reduced-motion variant fades opacity instead of scaling.
2. TensionSlider: 0–10, fat thumb that grows on touch, track color shifting sage→accent→clay (never red), labels "0 Settled · 5 Tight · 10 Overwhelmed", haptic-style tick marks.
3. SituationChip: large pill, 56px tall, selectable with a subtle check, accent-soft when selected.
4. AICard: a surface card with Fraunces text that fades in line by line (not typewriter), optional slow pulse loading state with the text "One moment."
5. PrimaryButton (one per screen) and GhostButton.
6. DeltaBadge: shows "8 → 5 · down 3" in sage; neutral if no change; clay if higher, with no alarm.
7. DisclosureLine: small calm caption, e.g. "You're talking with an AI, not a person."
8. BottomNav: Home · History · Patterns · Settings, icons with labels, 4 items.
9. SortBoard: three drop zones labeled "Mine to handle" (sage), "Not mine" (ink-soft), "Not today" (clay); items can be dragged or tapped into a zone.
10. Timer arc: thin circular progress.

Show the demo page in both themes side by side. Accessibility: labels on all controls, keyboard focus states, no color-only signals.
```

## P1 — S20 Home

```
Use the Aeris design system from this project. Build the Home screen (mobile-first).

Top: time-aware greeting in Fraunces ("Good evening"). Center: one large PrimaryButton "Something's up." Below: two small shortcut cards "Breathe" and "Ground" with a tiny orb icon and a hand icon. Below that, an optional one-line nudge in ink-soft, shown only if a `nudge` prop is provided, e.g. "Sunday evenings have been heavier lately. Want to look at that?" with a subtle chevron. Below: a usage meter for free users: "2 of 3 free Moments left this month" as a thin bar in accent-soft. BottomNav at the bottom with Home selected.

Lots of whitespace. Nothing moves except a very slow 10-second ambient gradient drift in the background (disabled under reduced motion). Provide light and dark previews.
```

## P2 — S30 What's going on?

```
Use the Aeris design system from this project. Build the "What's going on?" screen, step 1 of a Moment.

Top-right: a small "×" exit. AICard with the single line "What's going on?" Below: six SituationChips in a 2-column grid: "Something tomorrow", "A conversation", "My body", "Money", "Someone I love", "I don't know", plus a seventh full-width chip "Something else" that, when tapped, reveals a text area. Below the chips: an optional text area with placeholder "Say more if you want (optional)", max 280 characters with a quiet counter. PrimaryButton "Next" becomes enabled when a chip is selected. Bottom DisclosureLine: "You're talking with an AI, not a person."

Selecting a chip should feel soft: 450ms background fade, a small check mark. No haptic buzz animations, no bounce.
```

## P3 — S31 How tense are you?

```
Use the Aeris design system from this project. Build the "How tense are you right now?" screen, step 2 of a Moment.

AICard: "How tense are you right now?" Then the TensionSlider centered, large, with the current value shown in Fraunces above it (e.g. "7") and the label beneath ("Tight"). PrimaryButton "Next". "×" exit top-right. The slider thumb should be easy to grab with a shaking hand (at least 32px). Light and dark.
```

## P4 — S32 Aeris reads the moment

```
Use the Aeris design system from this project. Build the "read" screen, step 3 of a Moment.

AICard that supports three states via props: loading (slow pulse, text "One moment."), ready (three short lines fading in one after another with 400ms stagger: a reflection line, a pattern line like "This sounds like a 'waiting for tomorrow' moment.", and a proposal line like "Let's take two minutes to settle your body, then sort what's actually yours to handle."), and error ("I lost the thread for a second. Let's start with your body." with a GhostButton "Okay"). Under the card in the ready state: PrimaryButton "Let's do it" and GhostButton "Try something else". Keep the DisclosureLine at the bottom on first display. Fraunces for the card text.
```

## P5 — S10 Breathing orb

```
Use the Aeris design system from this project. Build the full-screen breathing screen.

Center: the Orb at ~60% of screen width, breathing with the pattern given by props (default 4s in, 6s out). Above: a small pattern label "In 4 · Out 6". Around the orb: a thin Timer arc for total duration (default 90s). Below the orb: the cue text "In…" / "Out…" switching in sync, Fraunces, soft. Top-left: two small toggles (sound, haptics), top-right "×". After 60 seconds a GhostButton "I'm done" fades in at the bottom. Background slightly darker than the page bg to focus attention. Under prefers-reduced-motion, the orb fades between 70% and 100% opacity instead of scaling. Light and dark.
```

## P6 — S11 Grounding 5-4-3-2-1

```
Use the Aeris design system from this project. Build the grounding screen.

One step at a time. AICard with "Name 5 things you can see." Below: five empty rounded chips that fill with a sage check when tapped (no typing). Five faint dots at the bottom show progress through the steps: see (5), hear (4), touch (3), smell (2), taste (1). Each step transitions with a 450ms cross-fade and 12px upward drift. Final card: "You're here. Take one slow breath." then PrimaryButton "Done". "×" exit top-right.
```

## P7 — S13 Worry-sort (signature screen)

```
Use the Aeris design system from this project. Build the "Sort what's yours" screen. This is the most important screen in the app; make it feel calm and clear.

Section 1: AICard "What's on your mind about this?" with an editable list of 2–4 short items (pre-filled from props, max 140 characters each), each with a small "×" to remove, and a "+ add" ghost row.
Section 2: SortBoard with three zones stacked vertically on mobile: "Mine to handle" (sage tint), "Not mine" (ink-soft tint), "Not today" (clay tint). Items can be dragged into a zone, or tapped to show three small zone buttons. When every item is placed, the board settles (zones softly expand) and an AICard appears: "{n} things are yours. The rest isn't yours tonight."
Section 3 (appears after all sorted): AICard "What's the smallest step on '{top mine item}'?" with a text field and three suggested chips (from props), PrimaryButton "That's my step." If no items are in "Mine", show instead: "Nothing here is yours tonight. That's allowed." with PrimaryButton "Okay".
"×" exit top-right. Light and dark.
```

## P8 — S40 After-slider and S41 Closing

```
Use the Aeris design system from this project. Build two screens.

Screen A "How tense now?": AICard "How tense are you now?" TensionSlider pre-set to a `before` value from props; when the user moves it, a DeltaBadge animates in beneath ("8 → 5 · down 3"). If the value is equal or higher, show the text "Still an 8. That's honest, and it's okay." with GhostButton "One more thing" and PrimaryButton "I'm done". Otherwise PrimaryButton "Next".

Screen B "Closing": AICard with an acknowledgement line (Fraunces) and, if provided, a single next-step line in a subtle sage-bordered row, e.g. "Tomorrow: send the email before 10." Below: "Did this help?" with two quiet icon buttons (up/down) and, if down is tapped, three reason chips: "Too long", "Didn't fit", "Felt robotic". Optional note field "Anything you want to remember?" PrimaryButton "Done". No confetti, no streaks, no "great job".
```

## P9 — S04–S07 Onboarding

```
Use the Aeris design system from this project. Build a four-step onboarding flow with a cross-fade between steps and four faint dots for progress.

Step 1 "Hi. I'm Aeris." Body: "I'm an AI guide for anxious moments. I'm not a person, a therapist, or a doctor, and I can't help in an emergency. What I can do is help you settle and find a next step, and remember what works for you." Button "Okay".
Step 2 "What I keep, and what I don't." Three lines with small icons: "I keep what you tell me in a Moment, encrypted, so I can notice patterns." / "I never sell it, share it with advertisers, or use it to target you." / "You can export or delete everything in Settings, any time." A toggle, off by default, labeled "I agree to Aeris storing my wellbeing information so it can help me." Button "Continue" enabled only when the toggle is on. Small links "Privacy" and "Terms".
Step 3 "If things get heavy." Body: "If you're ever in danger or thinking about harming yourself, please reach a human right away. I'll always show these when it matters, and you can find them in Settings." A country select (default from props) and two resource rows (call, text) populated from props. Button "Got it".
Step 4 "So I'm one tap away at 3 a.m." Instructions with two tabs iOS / Android: iOS "Tap Share, then 'Add to Home Screen.'" Android "Tap the menu, then 'Install app.'" Buttons "Done" and GhostButton "Later".
```

## P10 — S90 Crisis screen and S91 Physical notice

```
Use the Aeris design system from this project. Build two components. Keep the same calm palette; no red; no alarm icons.

S90 Crisis (full screen, not dismissible by swipe): Fraunces text "It sounds like things are really heavy right now." then "I'm an AI, so I can't keep you safe. But people can, right now, and they want to." Two large PrimaryButtons stacked: "Call {callLabel}" (tel: link) and "Text {textLabel}" (sms: link), then a GhostButton "Find help in another country". Below, in ink-soft: "If you're not in immediate danger and want to keep going with me, that's okay too." and a GhostButton "I'm safe right now. Continue." All labels from props.

S91 Physical notice (inline card above the intervention): "A quick note: I can't tell what's happening in your body. If this is new, severe, or you're worried it's medical, please get medical help now. If you've felt this with anxiety before and want to settle, we can keep going." Buttons: PrimaryButton "Get help" (tel: {emergencyNumber}) and GhostButton "Keep going".
```

## P11 — S50 History and S60 Patterns

```
Use the Aeris design system from this project. Build two screens with BottomNav.

History: a vertical list of cards, each with date and time in ink-soft, the pattern name in Fraunces ("Waiting for tomorrow"), a DeltaBadge, and a small intervention icon. Tap opens a detail sheet: what you said (if any), your sorted items in their zones, your note. Empty state: a faint orb and "Your Moments will show up here."

Patterns: three tiles — "Most common lately" (pattern name and "5 of 8"), a small bar chart by weekday using accent and accent-soft only (no red), and "What helps most" ("Worry-sort · average down 3"). Below: "Triggers you've named" as a chip cloud. Two extra states via props: `empty` ("After a few Moments, patterns will appear here.") and `locked` (the same tiles blurred softly with a calm card "Patterns are part of Aeris Plus" and a GhostButton "See plans"; not a hard wall).
```

## P12 — S70 Settings and S80 Pricing

```
Use the Aeris design system from this project. Build two screens.

Settings: grouped rows — Profile (name field "How should I address you?"), Country (select; note "Sets your crisis resources"), Daily check-in (time picker, off by default, caption "One quiet question a day. No streaks."), Appearance (Auto / Light / Dark), Reduce motion (toggle), Sounds (toggle), Subscription (row showing plan and a "Manage" link), Data ("Export my data", "Delete my account and data" in clay text with a two-step confirm sheet), Legal (Privacy, Terms, Our safety approach), and a footer line "Aeris is not a therapist, doctor, or emergency service." with a "Crisis resources" link.

Pricing: headline "Aeris Plus". Two cards: Monthly $7.99 and Annual $49.99 with "$4.17 a month" in sage, the annual card gently emphasized. Each card has a bullet list: Unlimited Moments, Patterns and weekly reflections, Full history and export, Aeris remembers what helps. Under the cards in ink-soft: "Renews automatically. Cancel any time in Settings." Then a calm line: "Keep using Quick Calm and 3 Moments a month, free, always." No countdown timers, no fake scarcity.
```

## P13 — S01 Landing and S02 Quick Calm

```
Use the Aeris design system from this project. Build the public landing page and the Quick Calm page, responsive (mobile first, nice on desktop).

Landing: hero with the Orb slowly breathing on the right (below on mobile), headline "A calmer next step." in Fraunces, sub-line "When your mind is racing, Aeris guides you from spiralling to something you can actually do. In about five minutes. Quietly." PrimaryButton "Start" and GhostButton "Try a Quick Calm — no account needed". Three small cards: "Tell it what's up (one tap)", "Do one thing that fits (2–5 min)", "See what helps, over time." Footer: "Aeris is a wellness tool, not a therapist, doctor, or emergency service. If you're in danger, contact your local emergency number." with links Crisis resources · Privacy · Terms · Our safety approach.

Quick Calm: two large cards "Breathe with me (2 min)" and "Ground myself (5-4-3-2-1)". Below in ink-soft: "Want Aeris to guide you through what's going on?" with GhostButton "Start". Works without an account.
```

---

## After v0: the handoff line for Claude Code

Each time you export a screen, send me:

> "Integrate v0 screen [S-id] at route [/path]. Keep the design tokens. Replace placeholder data with Supabase per docs/09. Keep accessibility. Deploy a preview and send me the link."
