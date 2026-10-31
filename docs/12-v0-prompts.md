# 12 — v0 Prompts for the Prototype (Phase 2)

**Use.** Paste P0 into a new v0 project, iterate until the look is right, then paste each screen prompt. This builds the **clickable prototype** for experiment E3: scripted arm only, no backend, nothing stored. Screen IDs match [06](06-pilot-product-spec.md) §5.

**Rules to repeat to v0 whenever it drifts.** No red. No streaks, badges or celebrations. No pre-selected feedback values. Mobile first at 390 pixels wide. Text colours only from the "text-safe" tokens.

---

## P0 — Design system

```
Create a design system for "Aeris", a calm stress-management tool for stressful moments at work. Mobile-first (390px). React + Tailwind with CSS variables. Light and dark themes; dark is used automatically from 21:00 to 06:00 unless the user chooses.

Light tokens. TEXT-SAFE (may be used for text and icons): ink #2B2D33, ink-soft #6B6E78 (16px+ only), accent #52708B, sage-ink #597459, clay-ink #946244. DECORATION-ONLY (never text, never a lone indicator or border): sage-tint #8FA98F, clay-tint #C9A18A. Backgrounds: bg #F6F3EE, surface #FDFBF8, line #E6E1DA. Primary buttons: accent fill with surface-colour text.
Dark tokens: bg #14161C, surface #1D2027, ink #E8E4DD, ink-soft #9A9DA6, accent #8FB0CC (button text #14161C), sage #9DBB9D, clay #C9A18A, line #2A2E37.

Type: Fraunces for headlines (24–28px), Inter for everything else (18px body on mobile, never below 14px). Line height 1.5.
Motion: 450ms ease-out cross-fades with a 12px upward drift; no bounces; no spinners (use a slow pulse). Respect prefers-reduced-motion everywhere.
Touch targets at least 56px. Never use colour as the only signal: pair it with a label or icon. No red anywhere.

Components: PrimaryButton, GhostButton, ChoiceButton (large, for situations), BreathingCircle (grows over ~4s on the in-breath, shrinks over ~6s on the out-breath; reduced-motion version fades opacity), SortBoard (three labelled zones "Mine to act on" with a check icon in sage-ink, "Not mine" with a dash icon in ink-soft, "Not today" with a moon icon in clay-ink; tap or drag items in), RatingRow (five buttons 1–5, NONE selected by default), HelpLink ("In danger? Get help now", always visible in the footer), DisclosureLine (small caption).
Show all components on one page in both themes.
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
S12 Settings: Country and region; "About the pilot"; "Privacy notice"; "Report a problem"; "Delete my account and data" in clay-ink text with a two-step confirmation sheet explaining what is deleted and what remains (anonymous counts, provider copies up to 30 days, backups).
```
