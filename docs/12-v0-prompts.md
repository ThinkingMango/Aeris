# 12 — v0 Prompts

**Use.**
1. Paste P0 into a new v0 project and iterate until the look is right.
2. **For Stage 2, paste R1–R4.** They build the clickable **no-typing conversation reset** for D3 and D4. There is no backend, nothing is stored, and there are no text inputs anywhere. Screen IDs match [06](06-pilot-product-spec.md) §3.
3. Prompts P1–P8 build the Stage 5 free-text product (screen IDs in [06](06-pilot-product-spec.md) §B5). Do not use them before Stage 5.

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

## R1 — Stage 2: A1 Home and A2 conversation type

```
Use the Aeris design system. IMPORTANT: this product has NO text inputs of any kind. Every input is a tap. Build two screens.
A1 Home: Fraunces headline "A difficult conversation ahead?"; PrimaryButton "Start the 3-minute reset"; small GhostButton "Breathe first (1 minute)"; caption "Private. Nothing you choose leaves this phone."; footer HelpLink "In danger? Get help now" and a second small link "This is about more than work".
A2: headline "What kind of conversation?" Five large ChoiceButtons: "Giving hard feedback", "Asking for something", "Responding to criticism", "Saying no", "Something else". A "Stop" GhostButton top-left; footer links as on A1. Store the choice in component state only.
```

## R2 — A3 What weighs most, and A4 Sort

```
Use the Aeris design system. No text inputs. Build two screens with "Stop" always visible.
A3: headline "What's weighing on you most?" caption "Pick up to two, or skip." Five toggle chips: "How they'll react", "Saying it badly", "Not sure what I want", "It feels unfair", "What it means for my job". PrimaryButton "Next", GhostButton "Skip". Allow at most two selected.
A4: headline "Which of these can you control?" Show 4–6 pre-written cards from a `cards` prop keyed by conversation type (use this sample for "Giving hard feedback": "My first sentence", "One clear example", "What I'd like to happen next", "When and where we talk", "How they react", "Whether they agree today"). Two zones "Mine" (check icon, sage-ink) and "Not mine" (dash icon, ink-soft). Tap a card to choose its zone, or drag. Cards related to the A3 choices appear first. PrimaryButton "Next" once every card is placed; "Skip" always available.
```

## R3 — A5 First step and A6 limits

```
Use the Aeris design system. No text inputs. Build two screens.
A5: headline "One first step." Three large option cards from a `steps` prop for the conversation type. Sample for "Giving hard feedback": (1) "Choose your first sentence" which expands to three opener templates with [brackets] the person fills in their head, e.g. "I'd like to talk about [the report]. I want to be straightforward because I think you can fix it."; (2) "Pick your one example"; (3) "Ask for 15 minutes instead of raising it in passing". Selecting one shows it on a quiet surface card with a "Copy" GhostButton for templates. PrimaryButton "That's my step". Optional small link "One minute of breathing first".
A6 (opened from "This is about more than work" anywhere): headline "This tool helps you prepare. It can't fix how you're being treated." Body: "If you're facing bullying, discrimination or an unsafe workload, these can help:" then three link rows from props {workplaceAdvice, unionOrEAP, employmentLaw}. Then a HelpLink "If you're not safe, get help now". GhostButton "Back to the reset".
```

## R4 — A7 Done, support screen and the landing page

```
Use the Aeris design system. No text inputs. Build three things.
A7: headline "Your first step:" the chosen step on a quiet sage-ink-bordered card. Buttons "Save on this phone" (GhostButton, saves only the step's id in localStorage, wrapped in try/catch) and PrimaryButton "Done". Optional "Did this help you prepare?" with three buttons Yes / A bit / No, NONE pre-selected, skippable. No streaks, praise or confetti.
Support screen (from every HelpLink): calm, no red. Large buttons from props: emergencyNumber (tel:), crisisLine (tel: or sms:), abuseLine (tel:). Caption "These are free and confidential." Not dismissible by swipe.
Landing page (separate route "/"): headline "A difficult conversation ahead?", subline "Take three minutes to pause, sort what matters, and choose your next step." PrimaryButton "Try the three-minute reset" linking to A1. Below: three short lines on what it is NOT ("Not therapy. Not a chatbot. Nothing you choose leaves your phone."), and an email field to "Join the 4-week pilot" (this is the ONLY input on the site, on the landing page only, and it accepts only an email address). Count page views and "tried the reset" clicks with a simple counter that stores no identifiers.
```

**Stage 5 prompts follow.** P1–P8 assume free text and two arms; use them only after gate G5a.

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
