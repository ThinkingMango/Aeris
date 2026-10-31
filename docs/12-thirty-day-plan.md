# 12 — 30-Day Build & Launch Plan

**How this plan works.** Each day has: a goal, what *you* do (step by step), what you ask *Claude Code* or *v0* to do (with the exact words), and a "done when" check. Days are ~3.5 hours. Weekends are included; if you need days off, the plan becomes 36–40 days, which is fine.

**Tools, and what each is for:**
- **v0.app** → generates the screens (the visual part) from the design system in Doc 07 and the prompts in Doc 13. Think of it as a designer who also writes the front-end code.
- **Claude Code** (this tool) → everything else: database setup, Edge Functions, safety logic, Stripe, email, tests, deployment, fixing v0's code. Think of it as your engineer.
- **Supabase** → database + login + server functions.
- **Vercel** → hosting (where the website lives).
- **Stripe, Resend** → payments, email.

**One rule:** do the days in order. Day 17 (safety tests) and Day 24 (break-it day) are not skippable.

---

## Week 1 — Foundations (Days 1–7)

### Day 1 — Accounts, company, repo
**Goal:** Every account exists; nothing is built.

You do:
1. Create accounts (use one email, turn on two-factor authentication on each): **Vercel**, **v0.app**, **Supabase**, **Anthropic Console** (console.anthropic.com → API Keys), **Stripe** (test mode is fine for now), **Resend**, **GitHub** (you have this), a domain registrar (buy `aeris[something].com` or whatever is free; ~$15).
2. Start company formation online (UK: Companies House; US: your state's site or a service like Northwest). It takes days; start now.
3. In Supabase: *New project* → name `aeris-prod` → choose the region for your launch country (Doc 09 §5) → save the database password in a password manager.
4. In Supabase → *Project Settings* → *API*: note that there is an `anon` key (safe for the browser) and a `service_role` key (never in the browser). Do not copy them anywhere yet.
5. In Anthropic Console: create an API key named `aeris-prod`. Set a **monthly spend limit of $50** in the billing settings. Save the key in your password manager.

Tell Claude Code:
> "Set up the Aeris repository: Next.js 15 app with TypeScript, Tailwind, PWA support (next-pwa or the built-in manifest + service worker), a `supabase/` folder with the `schema.sql` from the repo, `.env.example` listing every variable we need (Supabase URL, anon key, service role key for server only, Anthropic key, Stripe keys, Resend key), a `.gitignore` that excludes `.env*`, and a README that explains how to run it. Do not commit any secrets."

Done when: all accounts exist; Claude Code has pushed the skeleton; you have a domain.

### Day 2 — Legal groundwork & trademark
You do:
1. Search your country's trademark database for "Aeris" in classes 9 (software) and 44 (health/wellness services). US: USPTO TESS. UK: IPO search. EU: EUIPO. If there is a live mark for software/wellness, pick a backup name today (keep "Aeris" as the working name; the code does not care).
2. Read Doc 03 §4 (language rules) twice. Write the 10 banned words on a sticky note.
3. Find a lawyer: search "digital health startup lawyer [your city]" or use a fixed-fee platform. Email three: *"I'm launching a consumer wellness web app with an AI guide for anxious moments (not therapy). I need a fixed-fee review of privacy policy, terms, marketing language, and a published crisis protocol before a paid launch in ~4 weeks. What would you charge?"* You want this booked for Day 22.

Tell Claude Code:
> "Draft a privacy policy and terms of service for Aeris based on docs/03 and docs/09: consumer wellness app, 18+, AI-guided, health-data consent, data stored in Supabase in [region], AI processed by Anthropic as a processor, Stripe for payments, Resend for email, deletion within 30 days and from backups within 7 days, no sale or sharing with advertisers, plain language, with a section for [US state laws / UK GDPR / GDPR as applicable]. Mark every spot a lawyer must confirm with [LAWYER]."

Done when: trademark result known; lawyer emails sent; drafts exist in `legal/`.

### Day 3 — Talk to five people
You do: run the interview script in Doc 02 §6 with five people. 15 minutes each. Write down answers verbatim in `research/interviews.md` (Claude Code can create the file).

Then tell Claude Code:
> "Here are my five interview notes [paste]. Summarize what they confirm or contradict in docs/02 and docs/05, and recommend any change to the six situation chips or the intervention library before I build screens."

Done when: you have adjusted the chips/library (or confirmed them).

### Day 4 — Design system into v0
You do:
1. Open v0.app → *New project* → name "Aeris".
2. Paste **Prompt P0 (Design System)** from Doc 13. Review the result: colours, serif headline, orb breathing. Iterate with short instructions ("softer," "slower," "larger text") until it feels right. Spend at most 2 hours; perfection comes later.
3. Save/pin this chat as the design-system reference. Every later screen prompt begins with "Use the Aeris design system from this project."

Done when: v0 shows a breathing orb and a sample AI card in both light and dark themes that you would be happy to look at at 3 a.m.

### Day 5 — Database live
You do:
1. Supabase → *SQL Editor* → *New query* → paste the full contents of `supabase/schema.sql` → *Run*. You should see "Success."
2. *Table Editor* → confirm `profiles`, `sessions`, `interventions` exist and `interventions` has 16 rows.
3. *Authentication* → *Providers* → enable **Email** with **magic link** (passwordless). *Authentication* → *URL Configuration* → set Site URL to your Vercel preview URL for now (Claude Code will tell you it).
4. *Authentication* → *SMTP settings* → set Resend as the email sender (Resend dashboard → *Domains* → add your domain → add the DNS records at your registrar → wait for "Verified"; then *API Keys* → create one).

Tell Claude Code:
> "Supabase is live and the schema is applied. Wire the Next.js app to Supabase: auth helpers (magic link sign-in, sign-out, session), a typed client using the anon key in the browser and the service role only in server code, and generate TypeScript types from the schema. Add a /health page that shows 'connected' if the app can read the interventions table. Deploy to Vercel preview and give me the URL."

Done when: you open the preview URL `/health` and see "connected."

### Day 6 — Intervention scripts
Tell Claude Code:
> "Write the `steps` JSON for all 16 interventions in docs/08 §6 format, following the screen specs in docs/07 (S10–S16, check_in, physical_notice). Include timings, prompts, chip options, and the reduced-motion variant for the orb. Write a seed script that upserts them into the interventions table. Keep every prompt in the Aeris voice: short, sentence case, no exclamation marks."

You do: read every script as if you were anxious at 3 a.m. Edit anything that sounds cheerful, clinical, or long. Then run the seed (Claude Code tells you the command).

Done when: `interventions.steps` is filled for all 16 rows and you have personally read them all.

### Day 7 — Rest, review, and plan the screens
You do: half day. Re-read Doc 07 Part B. Make a checklist of the 26 screens. Decide the order for Week 2 (I suggest: S20, S30, S31, S32, S10, S13, S40, S41 first: that is the whole core loop).

---

## Week 2 — Screens in v0 (Days 8–14)

**Daily rhythm:** paste the screen's prompt from Doc 13 → iterate 3–5 times → when happy, click *Add to codebase* / export → tell Claude Code: *"Integrate the new v0 screen [S-id] into the app at route [/path], keep the design system, replace any placeholder data with the real Supabase calls, and deploy a preview."*

### Day 8 — S20 Home, S03 Sign in
### Day 9 — S30 What's going on, S31 Tension slider
Also tell Claude Code: *"Add privacy-respecting analytics (Vercel Analytics) with custom events: session_started, read_shown, intervention_started, intervention_completed, after_rated, session_completed, crisis_shown. No user identifiers in events."*
### Day 10 — S10 Orb (with reduced-motion fallback), S11 Grounding
### Day 11 — S13 Worry-sort (the hardest screen; give it the whole day)
### Day 12 — S32 AI read card (with loading pulse and error state), S40 After-slider + DeltaBadge, S41 Closing
### Day 13 — S04–S07 Onboarding (4 screens), S90 Crisis, S91 Physical notice
### Day 14 — S50 History, S60 Patterns (with empty & locked states), S70 Settings, S80 Pricing, S02 Quick Calm, S01 Landing

**Gate 1 check (Day 14 evening):** Put the preview link in front of 10 friends. The AI is not wired yet, so Claude Code will stub S32 with a fixed reflection. Ask them to go through a full Moment and rate "felt calmer" 0–10. **Pass: 7 of 10 complete it and rate ≥ 6.** If fewer, spend Days 15–16 on the flow instead of moving on; the AI will not fix a flow people abandon.

---

## Week 3 — AI, safety, money (Days 15–21)

### Day 15 — The read function
Tell Claude Code:
> "Build the `moment-read` Supabase Edge Function per docs/08 §2–5 and docs/10: keyword pre-check, Haiku 5.5 safety classifier with structured output and 2.5 s timeout failing to level 2, then Claude Sonnet 5.5 at effort low (model set by a MODEL_READ environment variable) with the cached system prompt including the wellbeing rules in docs/15 §6, structured output matching the schema, server-side fallbacks enabled, streaming the reflection to the client, guards.ts validation (plan IDs, length, banned phrases, retry once then default plan), write the session row and an ai_calls row with cost, enforce can_start_ai_session and the per-user and global daily spend caps. Store all prompts in _shared/prompts.ts with a version string. Put the Anthropic key in Supabase Edge Function secrets, never in the client."

You do: in Supabase → *Edge Functions* → *Secrets*, add `ANTHROPIC_API_KEY`. Claude Code deploys. Test from the app: tap a chip, slide, see a real reflection stream in.

### Day 16 — Suggest, close, and the session record
Tell Claude Code:
> "Build `moment-suggest` (3 next-step chips for the top 'mine' item, ≤8 words each) and `moment-close` (acknowledgement + next step, schema and guards per docs/08 §7). Wire S13 and S41 to them. Make sure intervention_runs, worry_items, tension_after, helped, and user_note are all saved, and that session status moves through the enum correctly, including abandoned on exit."

### Day 17 — Safety test day (mandatory)
Tell Claude Code:
> "Create a safety test set of 60 inputs: 15 clear level-3, 15 level-2, 15 level-1, 15 level-0, including figures of speech ('this deadline is killing me'), physical-symptom cases, and minor indicators. Write a test script that runs the keyword pre-check and classifier on all 60 and reports misses. Run it. Every level-3 must be caught; false positives on level-0 must be under 5%. Also test the output guard with 20 AI-style responses containing banned phrases. Fix the prompt or lists until it passes, and make the test runnable with one command."

You do: read the 60 inputs. Add 10 of your own in your own words. Run again. Then **manually** go through S90 on your phone: does tap-to-call actually dial? Does "I'm safe, continue" lead to elevated mode?

Done when: the test passes and you have personally seen the crisis screen work on a real phone.

### Day 18 — Model comparison & cost check
Tell Claude Code:
> "Copy the final read system prompt from supabase/functions/_shared/prompts.ts into evals/model_bakeoff.py, then run evals/model_bakeoff.py. Show me the summary table and any rule failures."

You do: open the blind review file and rank A to D for each case before opening the key. Apply the decision rules in Doc 15 §7. Record the decision in `docs/decisions.md`. Set the spend caps (Doc 10 §8).

### Day 19 — Stripe
You do: Stripe → *Products* → create "Aeris Plus" with two prices: $7.99/month, $49.99/year. Copy the two price IDs. *Developers* → *Webhooks*: Claude Code will give you the endpoint URL to add, and you paste the signing secret into Supabase secrets. Turn on the *Customer Portal* in Stripe settings with "cancel immediately or at period end" allowed.

Tell Claude Code:
> "Implement Stripe: a server route that creates a Checkout Session for the chosen price with the user's Supabase ID in metadata; a `stripe-webhook` Edge Function that verifies the signature and upserts `subscriptions` and sets `profiles.plan` on checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed; a Customer Portal link in Settings; the usage meter on Home; and the S80 paywall after the third free session completes. Use test mode. Write a test that simulates the webhook events."

Done when: you buy Plus with Stripe's test card `4242 4242 4242 4242`, your plan flips to Plus, and cancelling in the portal flips it back.

### Day 20 — Email, check-in, PWA
Tell Claude Code:
> "Set up Resend: magic-link template (already via Supabase SMTP), welcome email after first session, deletion confirmation, annual renewal reminder 7 days before (scheduled function reading subscriptions), all in the Aeris voice, plain and short. Then: daily check-in notification using Web Push (VAPID keys in secrets, subscription stored per user, send at profiles.checkin_time in the user's timezone via a scheduled function), opening S95. Then: finish PWA: manifest with icons, offline caching of S02/S10/S11 so Quick Calm works offline, and the S07 install prompt with iOS/Android instructions."

You do: install the app on your phone from Safari/Chrome. Turn on airplane mode. Open it. Quick Calm must work.

### Day 21 — Legal pages, crisis lines, export/delete
You do:
1. Verify every crisis number in Doc 10 §7 on the organisations' own websites. Fix any that changed.
2. Publish the privacy policy, terms, and the "Our safety approach" page (Doc 10 §12) as pages in the app (Claude Code: *"Add /privacy, /terms, /safety pages from legal/ drafts, and link them from S01 footer, S05, and S70."*).

Tell Claude Code:
> "Implement Export my data (JSON of all user-owned tables) and Delete my account (calls a server function that writes a deletion_requests row with a hashed user id, deletes the auth user so cascades run, and emails a confirmation). Add the nightly-tags and weekly-reflection scheduled functions per docs/08 §8 (weekly uses the Batch API), and the weekly compute_personalization job. Add the safety excerpt purge job."

Done when: you export your own data and see it; you delete a test account and it is gone from every table.

---

## Week 4 — Harden, beta, launch (Days 22–30)

### Day 22 — Lawyer review
You do: the booked call. Bring: the three legal pages, the landing page copy, the onboarding copy, the crisis screen, and Doc 03. Ask specifically: (1) Is our language safely on the wellness side? (2) Do our disclosures satisfy [NY / CA / UT / WA / UK] rules? (3) Anything in the privacy policy that does not match what we actually do? Apply their edits the same day with Claude Code.

### Day 23 — Admin view & cost alerts
Tell Claude Code:
> "Build a private /admin page (only my user ID, checked server-side) showing the admin_daily view, last 7 days of safety_events, ai_calls cost by day and by step, and signups/sessions/completion/median delta. Add an alert email to me when daily AI spend passes 80% of the cap or when any level-3 event occurs."

### Day 24 — Break-it day (mandatory)
Tell Claude Code:
> "Act as an attacker and a tired user. Try to: read another user's sessions via the API with a second test account; set my own plan to plus from the browser; call the Edge Functions without a login; send 10,000-character inputs; send prompt-injection inputs; start 20 sessions in a minute; call the webhook with a bad signature; break the orb by rotating the phone mid-breath; use the app with reduced motion and with a screen reader. Report every finding and fix what you can; list what you cannot."

You do: book the freelance developer security review (2 hours, ~$150–300) for Day 26. Platforms: Upwork, Toptal, or a Supabase community recommendation. Brief: *"Review RLS policies, Edge Function auth, secret handling, and the Stripe webhook of a Next.js + Supabase app. Written findings."*

### Day 25 — Polish pass
You do: use the app for real, three times today, at different times (morning, afternoon, late night with the dark theme). Note every rough edge. Give the list to Claude Code and v0. Typical fixes: copy that sounds chirpy, a 300 ms transition that feels fast, a chip that is too small.

### Day 26 — Security review & fixes
You do: the review call. Claude Code applies fixes the same day. Re-run the safety test and the break-it checklist.

### Day 27 — Closed beta (20–30 people)
You do: invite your Day-3 interviewees plus 15–25 others (friends, a community you are part of, a Reddit DM list). Send a plain email: what it is, what it is not, 18+, that it is a beta, how to give feedback (a simple form or reply-to-email), and the crisis line. Watch the admin page.

### Day 28 — Beta fixes
Fix the top 5 issues. Re-deploy. Check: median time-to-intervention, completion rate, before/after delta (Doc 04 §6).

### Day 29 — Launch prep
You do:
1. Switch Stripe from test mode to live; re-enter live keys in secrets; re-test one real purchase with your own card and refund it.
2. Point your domain at Vercel (Claude Code gives you the DNS records). Set the Supabase Site URL and Resend domain to the real domain.
3. Write the launch posts (Reddit, a short video of the orb and worry-sort, a Product Hunt listing). Claude can draft; you rewrite in your own voice. Honest tone: "I built this because…"
4. Turn the Anthropic monthly spend limit up to $100 and the global daily cap to $25.

### Day 30 — Launch
You do: post. Watch admin. Reply to every comment. Do not change prompts on launch day unless safety requires it.

Evening: write down the Day-30 numbers. Set a calendar reminder for **Day 44 (Gate 2)** and **Day 60 (Gate 3)** from Doc 01.

---

## After Day 30 (the first 14 days)

- **Daily (15 min):** admin page; any level-3 events; any guard fails; cost.
- **Sunday (30 min):** the safety review in Doc 10 §9.
- **Do not build new features.** Fix what people hit. Talk to 3 users a week.
- **Day 44:** Gate 2. If ≥15% of launch-week signups came back in week 2, start v1.1 (talk-it-through, weekly reflection email, personalization). If under 8%, stop building and go back to Day 3: interviews.

---

## What to send me (Claude Code) each day

A short message is enough:
1. What you did today (two lines).
2. What is blocked, with the exact error text pasted inside triple backticks.
3. The next day's prompt from this plan, copied in.

I will tell you exactly what to click when you need to do something in a dashboard, and I will never ask you to paste a secret key into the chat.
