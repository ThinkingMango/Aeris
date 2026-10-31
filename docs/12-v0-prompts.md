# 12 — v0 Prompts

**Revised 31 October 2026** after a whole-plan consistency review ([03](03-review-log.md) Part G). The earlier Stage 2 prompts had four problems:
- They gave content for only one of the five conversation types, so v0 would have invented the other four.
- They mixed in Stage 5 components.
- They let analytics and saved choices contradict the "nothing leaves this phone" promise.
- They could ship fake help-line numbers to real participants.

## How to use these prompts

1. **Put the rules where v0 always sees them.** Paste the **Rules block** below into your v0 project's instructions or knowledge, if your plan has that feature. Otherwise paste it as your first message and again whenever v0 drifts.
2. **Paste the prompts in order, one per message**: P0, R0, R1, R2, R3, R4, R5, and R6 last. Check each result against the rules before sending the next.
3. **Leave R5 (the landing page) until D4.** D3 needs only the reset itself.
4. **P0b and P1–P8 are Stage 5 only.** Do not use them now.
5. **Do not show the prototype to Stage 1 interviewees** ([04](04-hypotheses-and-experiments.md) D1).
6. **When the look and flow are right, push to a new GitHub branch** (for example `v0-prototype`), not `main`, and ask Claude Code to review it against [06](06-pilot-product-spec.md) Part A and run `npm run test:safety`.

## Rules block (paste into project instructions)

```
AERIS RULES, apply to every screen and every change, no exceptions:
1. NO TEXT INPUTS in the reset. Every input is a tap. The ONLY input in the whole site is the email field on the landing page (R5).
2. NOTHING YOU CHOOSE LEAVES THE PHONE. No analytics, network requests, cookies or logging inside /reset, /help or /more. All choices live in React state. The only browser storage allowed is localStorage key "aeris.savedStep" holding a step id and, for an opener, its selected index. Read inside useEffect; wrap every storage access in try/catch.
3. All wording for cards, steps and openers comes from content/reset_content.json. Never invent, reword or add content.
4. No red anywhere, including Stop, Delete and errors. No alarm icons.
5. Nothing pre-selected. No streaks, badges, confetti, praise, scores, countdown pressure or celebratory animation.
6. Every screen shows the footer "In danger? Get help now" (to /help) and "This is about more than work" (to /more). "Stop" is visible on every reset step and returns to the reset start without asking "are you sure".
7. No sign-up, account, paywall or cookie banner before or during the reset.
8. Text colours only from the text-safe tokens. ink-soft only at 16px or larger. Body 18px on mobile, never below 14px.
9. Touch targets at least 56px tall. Visible focus rings. Toggles use aria-pressed; single-choice groups use role radiogroup. Meaning never by colour alone.
10. Respect prefers-reduced-motion: no movement, fades only. No spinners; use a slow pulse.
11. Language: never use anxiety, panic, therapy (except "Not therapy"), therapist, treatment, cure, diagnose, symptoms, clinically, proven, AI, or chatbot (except "Not a chatbot"). Do not promise outcomes.
12. Fonts through next/font, which serves them from this site. No third-party scripts, embeds or trackers.
```

---

## P0 — Design system (Stage 2)

```
Create the design system for "Aeris": a private, three-minute, no-typing reset before a difficult work conversation. Mobile-first at 390px. Next.js App Router, TypeScript, Tailwind with CSS variables. shadcn/ui components are fine, restyled to these tokens. Follow the AERIS RULES.

Theme: follow the phone's system setting (prefers-color-scheme) with a small manual toggle in a settings menu. Do not switch by time of day.
Light tokens. TEXT-SAFE (text and icons): ink #2B2D33, ink-soft #6B6E78 (16px+ only), accent #52708B, sage-ink #597459, clay-ink #946244. DECORATION-ONLY (never text, never a lone indicator or border): sage-tint #8FA98F, clay-tint #C9A18A. Backgrounds: bg #F6F3EE, surface #FDFBF8, line #E6E1DA. Primary buttons: accent fill with surface-colour text.
Dark tokens: bg #14161C, surface #1D2027, ink #E8E4DD, ink-soft #9A9DA6, accent #8FB0CC (button text #14161C), sage #9DBB9D, clay #C9A18A, line #2A2E37.
Type: Fraunces for headlines (24-28px), Inter for everything else (18px body on mobile, never below 14px), line height 1.5, via next/font.
Motion: 300-450ms ease-out cross-fades with a small upward drift; no bounces; reduced-motion users get fades only.

Components (show all on one page, both themes):
- PrimaryButton, GhostButton, TextLink.
- ChoiceButton: large, full-width, for one choice.
- Chip: toggle with aria-pressed and a check icon when on; a parent can cap how many are on.
- SortCard: a card's text plus two clear buttons, "Mine" (check icon, sage-ink) and "Not mine" (dash icon, ink-soft). The chosen state is shown by an icon and a label as well as colour. Tapping is enough; no dragging needed.
- OptionCard: a large selectable card that can expand to show children.
- StepCard: a quiet surface card with a sage-ink border, showing the chosen step.
- ChoiceRow: three buttons in a radiogroup, NONE selected by default.
- BreathingCircle: duration prop. It grows over about 4s on the in-breath and shrinks over about 6s on the out-breath, with "In..." / "Out..." cues. The reduced-motion version fades opacity.
- ProgressDots: quiet, for "step 2 of 5". No percentages, no countdown.
- StopButton: GhostButton labelled "Stop".
- HelpFooter: two small links, "In danger? Get help now" and "This is about more than work".
- SupportButton: a large tel: or sms: link. If its number is missing or contains "[", it shows "Number to be confirmed" and is disabled.
```

## R0 — Content file (paste the JSON with this message)

```
Create content/reset_content.json with EXACTLY the JSON below, and content/helplines.ts exporting { country: "[pilot country]", emergencyNumber: "[emergency number]", crisisLine: "[crisis line]", abuseLine: "[abuse line]", workplaceAdvice: { label: "[workplace advice service]", url: "" }, unionOrEAP: { label: "[union or employee assistance]", url: "" }, employmentLaw: { label: "[employment-law help]", url: "" } }. Card, step and opener wording comes from content/reset_content.json; support numbers and link labels come from content/helplines.ts. Other interface copy must match R1–R4 exactly. Do not invent or reword any of it.
<paste the full contents of content/reset_content.json from the Aeris repository here>
```

**Before any real person uses the prototype** (D3), replace every bracketed value in `helplines.ts` with your pilot country's real numbers and links. Verify each on the service's own website. The prototype's SupportButton refuses to dial a placeholder, but a participant who needs help must get a real number. The clinician re-checks them all before Stage 3 ([07](07-safety-spec.md) §0).

## R1 — App shell, safety screens first

```
Follow the AERIS RULES. Build the shell and the two always-available screens BEFORE any reset step, so every later screen inherits them.
Routes: "/" redirects to "/reset" until the landing page is built in R5 (never leave "/" blank), "/reset" (the whole reset flow as ONE route with in-page state; never put choices in the URL), "/help", "/more".
A layout that always shows HelpFooter at the bottom and, on /reset, StopButton top-left and ProgressDots top-right.
/help, the support screen: headline "Help is available now." Three SupportButtons from content/helplines.ts: "Call [emergency number]" (emergency), "Call or text [crisis line]", "Call [abuse line]". Caption "These are free and confidential." A "Back" GhostButton. Calm, no red, no alarm icons.
/more, the limits screen: headline "This tool helps you prepare. It can't fix how you're being treated." Body: "If you're facing bullying, discrimination or an unsafe workload, these can help:" then three link rows from helplines.ts (workplaceAdvice, unionOrEAP, employmentLaw); show the label with no link if the url is empty. Then TextLink "If you're not safe, get help now" to /help, and GhostButton "Back to the reset" to /reset.
```

## R2 — A1 start, A2 conversation type, A3 what weighs most

```
Follow the AERIS RULES. Build the first three steps inside /reset, reading all words from content/reset_content.json.
A1 Start: Fraunces headline "A difficult conversation ahead?"; PrimaryButton "Start the 3-minute reset"; GhostButton "Breathe first (1 minute)"; caption "Private. What you choose stays on this phone." If localStorage "aeris.savedStep" holds a step id that exists in the content, show it above the buttons in a StepCard titled "Your saved step" with a TextLink "Delete" that removes it.
A2: headline "What kind of conversation?" One ChoiceButton per item in content.types, in file order, showing its label. Tapping one moves to A3.
A3: headline "What's weighing on you most?", caption "Pick up to two, or skip." One Chip per content.worries item; at most two can be on. PrimaryButton "Next" and GhostButton "Skip", the same size.
A "Back" TextLink on A2 and A3 goes one step back. Stop returns to A1 and clears the choices.
```

## R3 — A4 sort and A5 first step

```
Follow the AERIS RULES. Build steps four and five inside /reset.
A4: headline "Which of these can you control?" caption "Tap Mine or Not mine for each." Show the chosen type's cards as SortCards. Order: cards whose "worries" include any A3 choice come first, in file order; then the rest, in file order. PrimaryButton "Next" is enabled once every card is sorted; GhostButton "Skip" is always available. There are no right answers: never mark a choice as correct or wrong.
A5: headline "One first step." Show the type's three steps as OptionCards (title, then detail in smaller text). The step with id "opener" expands to show the type's three openers as selectable rows, each with a "Copy" GhostButton that copies the opener text to the clipboard and briefly shows "Copied" (no toast animation). PrimaryButton "That's my step" is enabled once a step (and, for "opener", one opener) is chosen. TextLink "One minute of breathing first" opens the breathing step, then returns here.
```

## R4 — Breathing, A7 done

```
Follow the AERIS RULES. Build the remaining steps inside /reset.
Breathing (from A1's "Breathe first" or A5's link): BreathingCircle for 60 seconds, then "That's a minute." with PrimaryButton "Start the reset" (from A1) or "Back to your step" (from A5), and a GhostButton "Done". Stop is visible throughout.
A7 Done: headline "Your first step:" then a StepCard with the chosen step's title, and the chosen opener if there is one. GhostButton "Save on this phone" writes only the step id (and the opener's index, if any) to localStorage "aeris.savedStep", inside try/catch; if storage fails, say "Couldn't save on this phone" quietly. PrimaryButton "Done" returns to A1. Below, optional: "Did this help you prepare?" as a ChoiceRow Yes / A bit / No, NONE pre-selected; the answer stays in memory only and is never sent anywhere. No praise, no confetti, no "well done".
```

## R5 — Landing page (D4 only; do not build until D4)

```
Follow the AERIS RULES. Build the landing page at "/".
Headline "A difficult conversation ahead?" Subline "Take three minutes to pause, sort what matters, and choose your next step." PrimaryButton "Try the three-minute reset" to /reset. Three short lines: "Not therapy." "Not a chatbot." "What you choose stays on your phone."
Section "Join the 4-week pilot": "For adults 18 or over in [pilot country]. We'll email you once when it starts, then once a week with one question." An email field (the ONLY input on the site), a required checkbox "I'm 18 or over", a link "How we use your email" to /privacy, and a button "Join". Submit through a server action that sends the address to the email list configured by the environment variable EMAIL_LIST_ENDPOINT. Never store it in the page, the browser or the logs. Show "Thanks. We'll be in touch." on success.
/privacy: a short plain page. Content: what we collect (your email); why (pilot invitations and one weekly question); who processes it ([email provider]); how long we keep it (until the pilot ends, then deleted); how to be removed (reply "remove" or email [contact]); and "Your choices in the reset never leave your phone."
Analytics: privacy-friendly page-view counts with no cookies or identifiers, ONLY on "/" and on the first load of "/reset". Nothing on /help, /more or inside the reset steps.
```

**Your part for R5.** Choose the email provider and its list endpoint. The stack already includes Resend. Put the key in Vercel's environment variables, never in a prompt or in code. The privacy page is a draft: the lawyer reviews it in Stage 3. Until then, collect only what R5 lists.

## R6 — Self-check (paste last, after any big change)

```
Audit the whole project against the AERIS RULES and docs, and list every violation with its file and line. Check especially: any <input>, <textarea>, contenteditable or search field outside the landing-page email field; any red or red-like colour; any analytics, fetch, cookie or storage use inside /reset, /help or /more; any wording not from content/reset_content.json; any pre-selected option; any text under 14px or ink-soft under 16px; any touch target under 56px; missing reduced-motion handling; missing HelpFooter on any screen. Then fix them.
```

---

# Stage 5 prompts (do not use before gate G5a)

P1–P8 assume free text and two arms. Paste **P0b** first: it adds the Stage 5 components to the Stage 2 design system.

## P0b — Stage 5 components

```
Add to the Aeris design system. Stage 5 changes three AERIS RULES, and only for the screens the Stage 5 spec lists: rule 1 (text inputs are allowed where the spec says), rule 2 (typed text is sent to the server for screening and, in the AI arm, generation; it is never stored by the app), and rule 11 (the required line "Some words here are written by AI." is allowed). Every other rule stays. Components: SortBoard with a `zones` prop (Stage 5 uses three: "Mine to act on" with a check icon in sage-ink, "Not mine" with a dash icon in ink-soft, "Not today" with a moon icon in clay-ink); RatingRow (five buttons 1-5 with end labels, role radiogroup, NONE selected by default); DisclosureLine (14px caption in ink, not ink-soft); TextArea (only for Stage 5 screens that the spec says accept text, with a quiet character counter).
```


## P1 — S1 Home and guest breathing

```
Use the Aeris design system. Build two screens.
S1 Home: greeting "Work feeling heavy?" in Fraunces; one PrimaryButton "Something at work"; a GhostButton "Breathe now" below; footer HelpLink. Lots of space.
Guest breathing: full-screen BreathingCircle for 2 minutes with cue text "In…" / "Out…", a thin progress arc, a "Stop" GhostButton always visible. At the end: "That's two minutes." and a small line "Aeris is a stress-management tool, not therapy or an emergency service." No sign-up wall before or during the exercise.
```

## P2 — S2 Situation and S3 Say more

```
Use the Aeris design system. Build two screens with a × exit top-right.
S2: headline "Which is closest?" Four ChoiceButtons stacked: "Something tomorrow", "Replaying something that happened", "Too much at once", "Something else". Optional row below: "How tense, 0–10? (optional)" as eleven small number buttons, none selected.
S3: headline "Want to say more?" caption "You can skip this." A text box (max 280 characters, quiet counter). Two buttons of EQUAL size and weight side by side: "Skip" and "Next". Footer HelpLink.
```

## P3 — S4 Plan

```
Use the Aeris design system. Build the plan screen.
A surface card with one or two short Fraunces sentences, for example "Let's settle your body first, then sort what's yours to act on." Under it, the planned steps as small labelled chips with icons (breathing, grounding, sort). Buttons: PrimaryButton "Start", GhostButton "Something else". Provide a variant prop `aiArm` that adds a DisclosureLine "Some words here are written by AI." under the card.
```

## P4 — S5 Breathing, S6 Grounding

```
Use the Aeris design system. Build two exercise screens with "Stop" always visible.
S5: BreathingCircle, 2 minutes, cue text, progress arc.
S6: one sense at a time: "Name 5 things you can see." with five empty circles that fill (sage-ink check) when tapped; then 4 hear, 3 touch, 2 smell, 1 taste. Five faint dots show progress. No typing.
```

## P5 — S7 Sort and step

```
Use the Aeris design system. Build the sort-and-step screen.
Part 1: "What's on your mind about this?" an editable list (each item max 140 characters) with "+ add". In the scripted arm the list starts empty.
Part 2: SortBoard with the three labelled zones. Items move by tap (shows three zone buttons) or drag.
Part 3 (after sorting): "One small step for this?" showing the first "Mine to act on" item, three suggestion chips (each at most 80 characters; passed in as a `suggestions` prop so the scripted arm can pass fixed ideas and the AI arm can pass model-written ones), and a text box. PrimaryButton "That's my step". If nothing is in "Mine to act on": "Nothing here is yours to act on right now. That's allowed." with PrimaryButton "OK".
Provide a variant prop `aiArm`: when true, worry items may arrive pre-filled from props and stay fully editable, and a DisclosureLine "Some words here are written by AI." appears under the suggestions.
```

## P6 — S8 Feedback and S9 Done

```
Use the Aeris design system. Build two screens.
S8: "How helpful was that?" RatingRow 1–5 with labels "Not at all" and "Very" at the ends and NOTHING pre-selected. Then "Would you use this again for a moment like this?" with three buttons Yes / No / Not sure. A "Skip" link. No before/after comparison, no score animation.
S9: "That's it for now." If a next step was chosen, show it in a quiet sage-ink-bordered row. PrimaryButton "Done". No streaks, no confetti, no praise.
```

## P7 — S10 Check-in and S11 Crisis screens

```
Use the Aeris design system. Same calm palette, no red, no alarm icons. These are DRAFT copy pending clinical review.
S10 Check-in: "Before we go on: are you safe right now?" three large buttons: "Yes", "Not sure", "No". A small persistent card at the bottom: "Support is available any time" with a "Get help" link.
S11: one component with five variants via a `route` prop, plus a `resources` array prop (emergency_number, crisis_line, abuse_line, youth_line, quick_exit) that adds any extra required resources as secondary buttons, so a screen can show, for example, the abuse line AND the youth line. Each variant has a headline, ONE large primary action button (tel: or sms: link from props), and optional secondary content:
- emergency_medical: "This sounds like an emergency." / "Call {emergencyNumber}".
- crisis_self_harm: "It sounds like things are really heavy right now." then "I'm an AI tool and can't keep you safe, but people can, right now." / "Call or text {crisisLine}" / secondary GhostButton "I'm safe right now".
- crisis_harm_to_others: "It sounds like you might hurt someone." / "Call {emergencyNumber}" / secondary "{crisisLine}".
- safety_abuse: "You deserve to be safe." / "{abuseLine}" / a "Quick exit" button fixed top-right that calls window.location.replace() to a neutral weather page (replace, not push, so Back does not return) and clears this app's session storage.
- minor_exit: "Aeris is built for adults." / "{youthLine}" / "Thanks for trying it."
Not dismissible by swipe; only by the buttons shown.
```

## P8 — S0 Enrolment and S12 Settings

```
Use the Aeris design system. Build two screens.
S0 Enrolment (one scrolling screen): "Aeris pilot" headline; a plain-language box: "Aeris is a pilot of a stress tool for work moments. It is not therapy, medical care, or an emergency service. You must be 18 or over." Then separate toggles, all OFF by default: "I agree to the terms", "I've read the privacy notice", "I agree to take part in the pilot", "I'm 18 or over", and an optional one "You may contact me for a short interview". A REQUIRED country picker with no default, and a state or region picker that appears for countries where it matters (for example US states). PrimaryButton "Join" enabled only when the four required toggles are on and a country is chosen.
S12 Settings: Country and region; "About the pilot"; "Privacy notice"; "Report a problem"; "Delete my account and data" in clay-ink text with a two-step confirmation sheet explaining what is deleted and what remains: monthly counts of safety events with no link to the person; copies of typed text held by the AI provider under its retention terms (usually up to 30 days, longer in stated exceptions); backups until they expire.
```
