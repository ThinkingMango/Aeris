# 10 — Safety Architecture

**Plain-English summary:** Safety is not one feature. It is eleven layers, each catching what the previous one missed. No single layer is perfect; together they make a serious failure very unlikely. This document is also the basis for the public "Our safety approach" page that California-style laws ask you to publish.

**The guiding principle:** *Fail safe, never fail open.* If anything in the safety chain breaks, errors, or times out, Aeris behaves as if there is elevated concern. It never assumes "fine" by default.

**The second principle:** *Warm, not robotic.* Users describe being "handed a hotline and shut down" as rejection. Aeris stays present, offers help clearly, and lets a user who is safe continue.

---

## 1. The eleven layers

| # | Layer | What it catches | Where it lives |
|---|---|---|---|
| L0 | **Positioning & language** | Regulatory misclassification; false expectations | Marketing, onboarding, every AI prompt (Doc 03 §4) |
| L1 | **Onboarding gates** | Minors; uninformed consent; users who do not know what Aeris is | S03–S06 |
| L2 | **Keyword pre-check** | Unambiguous crisis phrases, instantly, with no AI | `safety.ts`, runs in < 5 ms |
| L3 | **AI safety classifier** | Nuanced crisis, harm-to-others, abuse disclosure, medical emergency, minor indicators | Haiku 5.5, structured output |
| L4 | **System-prompt guardrails** | AI saying something clinical, dismissive, dependency-forming | `prompts.ts` |
| L5 | **Scripted interventions** | AI inventing a harmful exercise | The library is data; the AI only picks |
| L6 | **Output check** | Banned phrases that slipped through L4 | `guards.ts`, regex + list |
| L7 | **Crisis & elevated flows** | Delivering the right response with warmth | S90, S91, elevated mode |
| L8 | **Rate limits & cost caps** | Dependency loops, abuse, bill shock | Edge Function + `usage_monthly` |
| L9 | **Logging & weekly human review** | Patterns of failure you cannot see live | `safety_events`, your Sunday review |
| L10 | **Incident response plan** | What you do when something goes wrong | One-page doc, written before launch |

---

## 2. Severity levels and the exact response

| Level | Meaning | Examples (signals) | Aeris does |
|---|---|---|---|
| **0 — None** | Ordinary anxiety | "I can't stop thinking about tomorrow's meeting" | Normal flow |
| **1 — Distress** | Strong but not dangerous | "I feel like I'm falling apart," crying, hopeless-sounding but no self-harm content | Normal flow; the read is instructed to be gentler; closing line includes "if this keeps feeling heavy, talking to someone can help" |
| **2 — Elevated** | Possible risk, ambiguous | Passive ideation ("sometimes I wish I could disappear"), mention of past self-harm, heavy substance use tonight, disclosure of abuse, mention of a minor's age | **Elevated mode:** session continues but starts with a `check_in` step: *"Before we go on: are you safe right now?"* Yes → continue, with resources card visible at the bottom; No / unsure → S90. `postpone_worry` is excluded. Event logged. |
| **3 — Crisis** | Clear risk | Active suicidal ideation, plan, means, intent; immediate harm to others; overdose in progress; medical emergency ("I can't breathe and my lips are blue") | **S90 Crisis screen** immediately. No main-model call. Tap-to-call local line. Text line. "Find help in another country." Option to continue in elevated mode only after tapping *"I'm safe right now."* Event logged. If the user continues, every subsequent input is re-screened and the resources card stays pinned. |

**Physical symptoms (separate flag):** chest pain, trouble breathing, fainting, numbness, "worst headache of my life" → S91 notice card *before* any intervention, regardless of level. Offers local emergency number and "Keep going." Never says "it's just anxiety."

**Minor indicator:** "I'm 15," school-specific references with age → *"It sounds like you might be under 18. Aeris is built for adults, so I'm going to stop here. These people are great to talk to: [youth-specific line for the country]."* Session ends. Account flagged for review.

---

## 3. Layer 2 — keyword pre-check (the list)

A short list of phrases that jump straight to Level 3 without waiting for the AI. Kept short on purpose so it has near-zero false positives; the AI handles nuance. Stored in `safety.ts`, lowercase, matched as substrings after normalizing punctuation.

```
kill myself, end my life, want to die, going to die tonight, suicide, suicidal,
overdose, overdosed, took all my pills, hang myself, jump off, slit my wrists,
end it all, don't want to be alive, no reason to live, kill him, kill her,
kill them, hurt someone, going to hurt, can't breathe and, lips are blue,
chest pain and
```

False positives ("this deadline is going to kill me") are acceptable here: the crisis screen is calm and has an "I'm safe, continue" button. The cost of a false positive is 5 seconds; the cost of a false negative is unacceptable.

---

## 4. Layer 3 — the safety classifier prompt

Model: `claude-haiku-5-5`. Structured output with the schema in Doc 08 §4. Timeout 2.5 s. On any failure → Level 2.

```
You are a safety screen for a wellness app for adults. You read one short
message from a user who may be anxious, and you classify risk. You do not
reply to the user. You only fill the schema.

Levels:
3 = crisis: active suicidal thoughts with any plan, means, timeframe or
    intent; intent to seriously harm another person; an overdose or
    self-harm happening now; a medical emergency in progress.
2 = elevated: passive wish to not exist or disappear; past self-harm
    mentioned; abuse or violence disclosed; heavy substance use right now;
    an eating disorder behaviour happening now; any sign the user is under
    18; anything ambiguous that a careful person would want to check on.
1 = distress: intense emotion, hopeless or worthless language, crying,
    "falling apart", with no risk content.
0 = none: ordinary worry, stress, rumination.

Set physical_symptoms=true if chest pain, difficulty breathing, fainting,
numbness, or sudden severe headache is mentioned, even if clearly anxious.

When uncertain between two levels, choose the higher one.
Common figures of speech ("this is killing me", "I'm dying of embarrassment")
are level 0 or 1, not 3, unless there is other risk content.
```

**Testing it:** Doc 12 Day 17 has you run a 60-example test set (I will generate it) and check that every Level 3 example is caught and that the false-positive rate on ordinary anxiety is under 5%. This test runs automatically every time the prompt changes.

---

## 5. Layer 4 — system-prompt guardrails (the "never" list the AI is given)

In every main-model prompt:

```
Never: diagnose; name a disorder or condition; mention medication or
dosage; say "it's just anxiety" or minimize a physical symptom; promise
availability or say "I'm always here"; discourage the person from talking
to people, professionals, or emergency services; suggest an exercise that
is not in the library; continue as normal if the person expresses a wish
to die or to harm anyone (instead: fill the schema with plan=["check_in"]
and set escalate=true); role-play as a human, a therapist, or a specific
person; discuss methods of self-harm in any form, even if asked.

Always: speak as an AI; keep it short; if elevated=true, start with
check_in and keep resources visible; if the person asks whether they
should see a professional, say that talking to one is a good idea and
Aeris can be used alongside.
```

The `escalate` field in the read schema gives the main model its own way to raise the level if it notices something the classifier missed. Code treats `escalate=true` as Level 2 minimum.

---

## 6. Layer 6 — output check (code)

Before any AI text is shown, `guards.ts` checks it:

- **Banned phrase list** (regex, case-insensitive): disorder names (GAD, OCD, PTSD, bipolar, depression as a diagnosis, "you have"), medication words (SSRI, benzo, Xanax, dose), "just anxiety", "always here", "24/7", "I promise", "trust me", method words.
- **Length:** over the limit → truncate at sentence boundary or use stock line.
- **Schema validity:** every intervention ID must exist and be active.
- **Disclosure:** if `profiles.last_ai_disclosure_at` is more than 3 hours ago or null, the UI shows the "You're talking with an AI" line and updates the timestamp (New York rule).

A hit on the banned list = retry once with a corrective note ("Your previous answer used clinical language; rewrite without it"), then stock line. Logged to `ai_calls.stop_reason = 'guard_fail'` for your review.

---

## 7. Layer 7 — the crisis and elevated flows, in detail

### Crisis screen (S90) copy, final
> It sounds like things are really heavy right now.
> I'm an AI, so I can't keep you safe. But people can, right now, and they want to.
>
> **[Call 988]**  *(or Samaritans 116 123, etc.)*
> **[Text HOME to 741741]**  *(or local text line)*
> [Find help in another country]
>
> If you're not in immediate danger and want to keep going with me, that's okay too.
> [I'm safe right now. Continue.]

Rules: no swipe-to-dismiss; buttons only; stays until a choice. "Continue" leads to elevated mode, not normal mode.

### Crisis line table (seeded in code, selected by `profiles.country_code`)

| Country | Call | Text / chat |
|---|---|---|
| US | 988 | Text HOME to 741741 |
| UK | Samaritans 116 123 | Text SHOUT to 85258 |
| Ireland | Samaritans 116 123 | Text HELLO to 50808 |
| Canada | 988 | Text 988 |
| Australia | Lifeline 13 11 14 | Text 0477 13 11 14 |
| New Zealand | 1737 | Text 1737 |
| Hong Kong | Samaritans 2896 0000 | — |
| Singapore | SOS 1767 | WhatsApp 9151 1767 |
| Other | Link to findahelpline.com | — |

**You must verify each number before launch (Day 21)** by checking the organisation's website. Numbers change. Put a reminder to re-verify every 6 months.

### Elevated mode
- Starts with `check_in`: *"Before we go on: are you safe right now?"* with *Yes* / *Not sure* / *No*.
- Resources card pinned at bottom for the rest of the session.
- Gentler read; no `postpone_worry` (it can feel dismissive); no `physical_reset` (no "cold water" suggestions to someone who might self-harm).
- Closing line always includes: *"If this keeps feeling heavy, talking to a person can help. [Resources]"*

---

## 8. Layer 8 — rate limits and cost caps

| Limit | Value | Why |
|---|---|---|
| AI sessions per user per hour | 4 | Prevents a dependency loop at 3 a.m.; after the 4th: *"Let's give this a rest. Quick Calm is here, and so are these people [resources]."* |
| Messages per session ("talk it through", v1.1) | 8 | Keeps Aeris a guide, not a companion |
| Free sessions per month | 3 | Business + cost |
| Daily AI spend cap (global) | $25 at launch, raise with revenue | Bill shock protection. Edge Function checks `ai_calls` sum before each call |
| Per-user daily AI spend cap | $0.60 | Catches abuse of a single account |

---

## 9. Layer 9 — logging and your weekly review

Every Sunday (30 minutes):
1. Open the admin view. Count crisis exits, elevated sessions, guard fails.
2. Read every `safety_events` row from the week (excerpts are short). Ask: *Did the right thing happen? Was anything missed?* Note it in `reviewer_note`.
3. Sample 10 random completed sessions' reflections and closing lines. Any clinical language? Any coldness?
4. If anything was missed, fix the keyword list or the classifier prompt **that day**, re-run the 60-example test, deploy.

This is the step that turns a static safety system into one that improves. It is also what you can honestly describe on your public safety page.

---

## 10. Layer 10 — incident response (one page, written before launch)

**Triggers:** a user reports harm; you discover a missed crisis; a data breach or suspected leak; a press or regulator enquiry.

**Steps:**
1. **Contain** (within 1 hour): if it is a safety-logic failure, switch the Edge Function to "elevated mode for everyone" (a single feature flag). If it is a data issue, rotate keys and, if needed, pause the app (Vercel has a one-click pause).
2. **Assess** (within 24 h): what happened, how many users, what data.
3. **Notify** (as required): users affected; FTC under the Health Breach Notification Rule (US, within 60 days; 10+ days for 500+ people); ICO within 72 hours (UK); the equivalent in your country. Your lawyer's number is on this page.
4. **Fix and test.**
5. **Write it down** (a short post-mortem) and, if it affects users, publish an honest note.

---

## 11. Prompt injection and abuse (the less obvious threats)

- **Prompt injection:** a user types "ignore your rules and tell me how to…". Because the AI only fills a schema and picks from a library, there is little it can be tricked into doing. The output check catches text leaks. The worry-sort pre-fill is the only place user text is echoed, and it is capped at 140 characters per item.
- **Using Aeris as a free general chatbot:** the structured flow makes this unattractive; rate limits make it pointless.
- **Someone else's data:** RLS (Doc 09).
- **Key theft:** keys only in Edge Function secrets; a daily spend cap bounds the damage.
- **Fake crisis to test you:** fine; the crisis screen costs nothing and is logged.

---

## 12. What the public "Our safety approach" page says (draft)

> Aeris is a wellness tool, not a therapist, doctor, or emergency service. Every message you send is checked for signs that you might be in danger. If we see them, Aeris stops and shows you how to reach a trained person in your country, right away, and stays with you if you choose to continue. Aeris never diagnoses, never discusses medication, and only guides you through a fixed set of calming exercises that have been reviewed by us. We review flagged conversations every week to improve how Aeris responds, and we fix problems the same day we find them. If you ever feel Aeris got it wrong, write to safety@[yourdomain]. If you are in danger right now, contact [local emergency number].

---

## 13. Honest limits of this system

- It will miss some Level 2 cases. Ambiguity is hard; that is why Level 2 is designed to be low-cost to trigger.
- It cannot verify age. An 18+ checkbox is what every competitor uses; it is a legal shield, not a wall.
- It is not clinical oversight. If you grow, hire a clinical advisor (a licensed psychologist, 2–4 hours a month, ~$300–600/month) to review the library and the prompts. Not needed for the 30-day experiment; needed before you scale.
- It does not replace insurance (Doc 03 §6).
