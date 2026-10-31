> **SUPERSEDED (31 October 2026).** This is version 1 of the plan, kept for the record. It contains known errors and overclaims, listed with their corrections in [docs/03-review-log.md](../../03-review-log.md). Do not build from this file. The current plan starts at [docs/00-START-HERE.md](../../00-START-HERE.md).

# 08 — AI Architecture

**Plain-English summary:** Aeris does *not* send the user's words to an AI and show whatever comes back. That is a chatbot, and it is slow, unsafe, and generic. Instead, Aeris runs a short **pipeline** (a series of small, specific steps). The AI is used only where it adds something: understanding the situation, choosing the intervention, personalizing a few sentences, and later extracting the pattern. The exercises themselves are **scripted screens**, not AI improvisation.

This is the architecture that delivers your stated goal: *Moment → Intervention → Outcome → Pattern → Personalization* rather than *Prompt → LLM → Response.*

---

## 1. Vocabulary (one-time explanations)

- **LLM (large language model):** The AI that reads and writes text. Claude, in our case.
- **Edge Function:** A tiny program that runs on Supabase's servers, not on the user's phone. It holds the secret AI key so the key never reaches the browser. The phone talks to the Edge Function; the Edge Function talks to Claude.
- **System prompt:** The standing instructions we give the AI before every conversation ("You are Aeris. You are not a therapist. Keep replies under 60 words…").
- **Structured output:** Asking the AI to answer in a fixed form (like a filled-in form with specific boxes) instead of free text, so our code can read it reliably.
- **Prompt caching:** Claude can remember the long, unchanging system prompt between calls so we are not charged full price for it every time. Cache reads cost about 5% of the normal input price.
- **Tokens:** The units the AI bills in. Roughly 1 token = 0.75 English words.
- **Classifier:** A small, fast AI call that answers one narrow question ("Is there a crisis signal in this text? Answer with a level 0–3").

---

## 2. The pipeline (what happens in one Moment)

```
User taps a chip + slides tension + (optional) types a sentence
        │
        ▼
[Step 1] SAFETY SCREEN  ──── level 3 ──▶ Crisis screen (S90). Stop.
   fast classifier                 level 2 ──▶ continue, "elevated" flag on
        │ level 0–1
        ▼
[Step 2] READ THE MOMENT
   main model, structured output:
   { pattern, reflection, proposal, intervention_id, alternatives[], worry_items[] }
        │
        ▼
[Step 3] OUTPUT CHECK (code, not AI): banned phrases? length ok? intervention_id valid?
        │
        ▼
[Step 4] SCRIPTED INTERVENTION SCREENS (no AI, or tiny AI fills)
   e.g. orb 90s → worry-sort (AI pre-filled items, AI suggests 3 next steps)
        │
        ▼
[Step 5] AFTER-RATING + FEEDBACK (no AI)
        │
        ▼
[Step 6] CLOSING LINE (main model, 1 short call) + save structured session record
        │
        ▼
[Step 7] (later, in batch, nightly/weekly) PATTERN EXTRACTION & WEEKLY REFLECTION
```

**Number of AI calls per Moment:** 1 safety classifier call per user text input (usually 1–2), 1 main "read" call, optionally 1 small call inside worry-sort, 1 closing call. **About 3–5 calls, 2–3 of them tiny.**

---

## 3. Which model does what (and why)

**Updated 31 October 2026 after the model deep dive (Doc 15).** The default for every user-facing call is now **Claude Sonnet 5.5**. Anthropic's system cards show Sonnet 5.5 and Opus 5.5 are equally safe on mental-health tests within the margin of error, and Sonnet is half the price and in a faster speed class. Opus 5.5 remains the upgrade path if the Day 18 blind test shows a clear tone win. Prices (first-party API, verified 31 October 2026):

| Model | Input per 1M tokens | Output per 1M tokens | Cache read per 1M | Use in Aeris |
|---|---|---|---|---|
| Claude Sonnet 5.5 `claude-sonnet-5-5` | $2.00 | $10.00 | $0.10 | **Default** for Step 2 (read the moment), the worry-sort suggestions, Step 6 (closing), Step 7 (weekly reflection, via batch) |
| Claude Opus 5.5 `claude-opus-5-5` | $4.00 | $20.00 | $0.20 | Upgrade path for Step 2 if the Day 18 blind test shows a clear tone win (Doc 15 §7) |
| Claude Haiku 5.5 `claude-haiku-5-5` | $0.10 | $0.50 | $0.01 | Step 1 safety classifier; Step 7 bulk pattern tagging |

**Why Sonnet for the "read":** This is the one sentence that makes or breaks the session. It must be warm, precise, short, and must choose the right intervention. Doc 15 compares the three Claude models on Anthropic's published safety, honesty, speed, and price evidence. Sonnet 5.5 matches Opus 5.5 on safety within the error bars, is close on honesty, is labelled "Fast" where Opus is "Moderate", can turn thinking off entirely, and costs half as much. Switching the model is a one-line environment variable, so the Day 18 test can overrule this.

**Why Haiku for safety:** The safety classifier runs on *every* input and must be fast (under 1 second). It answers a narrow question. Haiku 5.5 is labelled "Fastest", scored highest of the three on Anthropic's single-turn self-harm test (99.61% harmless on the API), and is 20× cheaper than Sonnet. Its output is a form no user reads, so its weaker honesty scores do not matter in this role. **But:** Haiku has no server-side refusal fallback, so the code treats any error or non-answer from the classifier as "level 2, elevated" (fail safe, never fail open).

### Model settings (so Claude Code sets them right)
- Sonnet 5.5 (read, suggestions, closing): set **`output_config.effort: "low"`** explicitly (the model's default is `high`, which thinks before almost every reply and delays the first word). For the suggestion and closing calls, turn thinking off with `thinking: {type: "between_tools"}`. For the read, test both "low" and "off" on Day 18 (Doc 15 §7, rule 5). Enable server-side **`fallbacks: "default"`** (beta header `server-side-fallback-2026-07-01`); it rarely triggers for Aeris, because none of Anthropic's blocking classifiers target mental-health text, but it costs nothing. Always check `stop_reason` before reading content; a `refusal` stop reason means show a gentle retry, never a raw error.
- Haiku 5.5 (classifier): **`thinking: {type: "disabled"}`** with `effort: "low"`. Haiku thinks by default, and thinking counts toward `max_tokens`, so without this a small cap can be used up before any answer appears. Do not send `fallbacks` to Haiku; it does not support them.
- Never send `temperature`, `top_p`, or `top_k`. All three models reject them.
- If Opus 5.5 is ever swapped in: thinking cannot be turned off, effort default is `medium`, set `low` explicitly.
- Streaming for the read call so the first line appears within ~1 second; the UI fades lines in.
- Structured outputs (`output_config.format` with a JSON schema) for Step 2 and Step 7, so the code gets exact fields.
- Prompt caching: the system prompt + intervention library description (~3,000 tokens) is placed first and marked with `cache_control` so repeat calls pay 5% of the input price for it. **Caches are model-specific and expire after 5 minutes without use**, so keep every user-facing call on one model, and expect cold caches at launch traffic (Doc 15 §5).
- `max_tokens`: 1,000 for the read (about 150 tokens of JSON plus room for brief thinking), 400 for suggestions and closing, 512 for the classifier.

---

## 4. Step 1 — Safety classifier (detailed)

**Input:** the user's free text (if any) + selected chip + tension score + the last 2 turns if in a chat.
**Model:** Haiku 5.5, thinking disabled, effort low, structured output.
**Output schema:**

```json
{
  "level": 0,                // 0 none, 1 distress, 2 elevated concern, 3 crisis
  "signals": ["none"],       // e.g. "self_harm_ideation", "self_harm_plan", "harm_to_others",
                             //      "abuse_disclosure", "medical_emergency", "minor_indicator",
                             //      "substance_overdose", "eating_disorder_acute"
  "physical_symptoms": false,// chest pain, can't breathe, fainting, numbness → S91 notice
  "confidence": 0.0
}
```

**Rules in code (not left to the AI):**
- `level 3` → crisis screen immediately; no main-model call; log event.
- `level 2` → continue, but the main prompt receives `elevated: true`, which switches it to a safety-first script (checks in, offers resources, avoids interventions like "postpone the worry").
- `physical_symptoms: true` → S91 card shown before any intervention.
- `minor_indicator` → gentle end of session with age-appropriate resources; flag account.
- Classifier error, timeout (>2.5 s), or malformed output → treat as `level 2`.
- A **keyword pre-check in code** (a short list of unambiguous crisis phrases) runs *before* the classifier and jumps straight to level 3 if it hits. Belt and braces.

The full system prompt for the classifier is in Doc 10 §4.

---

## 5. Step 2 — Read the moment (detailed)

**Input to the model (in this order, for caching):**
1. *Cached block:* System prompt (identity, rules, tone, the pattern vocabulary from Doc 05 §5, the intervention library with IDs and when each fits, the output schema).
2. *Per-user block (small):* personalization memory, e.g. `{"preferred_name":"L","helped_before":{"worry_sort":+3,"breathing":+1},"disliked":["body_scan"],"recent_patterns":["waiting_for_tomorrow","waiting_for_tomorrow","late_night_loop"],"local_time":"02:41","elevated":false}`.
3. *User turn:* chip, tension, free text.

**Output schema:**

```json
{
  "pattern": "waiting_for_tomorrow",
  "reflection": "You're lying awake with tomorrow's email already playing out.",
  "proposal": "Let's take two minutes to settle your body, then sort what's actually yours to handle.",
  "plan": ["breathe_90", "worry_sort"],
  "alternatives": [["grounding", "next_smallest_step"], ["postpone_worry", "breathe_60"]],
  "worry_items": ["Sending the email", "How my manager will react", "Whether I'll sleep"],
  "escalate": false,
  "disclosure_needed": true
}
```

**Code enforces:** every `plan` entry exists in the library; no more than 3 steps; `reflection` + `proposal` under 60 words combined; banned-phrase check; if `elevated` was true, the plan must start with a check-in step. If any rule fails, retry once with a corrective note; if it fails again, fall back to a safe default plan (`grounding` → `breathe_90`) with a neutral stock reflection. **The user never sees an error from this step.**

### The system prompt (abridged; Claude Code will hold the full version in `supabase/functions/_shared/prompts.ts`)

```
You are Aeris, a quiet AI guide for anxious moments. You are not a person,
therapist, doctor, or emergency service, and you never imply otherwise.

Your job in this step: read what the person shared, reflect it back in one
short sentence, name the situational pattern from the list below in one
sentence, and propose one plan (1–3 steps) from the intervention library.
Then fill the JSON schema exactly.

Voice: calm, plain, warm, brief. Sentence case. No exclamation marks. No
emoji. No praise ("great job"). No questions in this step. Never more than
60 words across reflection and proposal.

Never: diagnose, name a condition or disorder (including depression),
mention medication, say "it's just anxiety", promise availability ("I'm
always here"), or suggest an exercise that is not in the library.

Wellbeing rules (adapted from Anthropic's published claude.ai prompt; see
Doc 15 §6 for why each line is here):
- Validate how the person feels. Do not validate untrue beliefs or
  harmful behaviours.
- Reflect only what the person actually said. Do not add feelings,
  motives, or causes they did not name. Do not reflect in a way that
  amplifies the negative experience.
- Never suggest substitutes for self-harm that use discomfort, pain, or
  sensory shock, such as ice, rubber bands, cold water, or sour food.
- Never say self-harm works or helps, even if the person says it does.
- If the person talks about wanting to die or not wanting to be here, do
  not say the wish makes sense. You can say the pain is real without
  agreeing with the wish. Set escalate=true and plan=["check_in"].
- If the person is reluctant to seek help, do not validate the
  reluctance. Acknowledge the feeling and gently encourage reaching a
  person.
- In a crisis, do not ask questions that pull the person deeper. Be a
  calm, stabilizing presence.

If the input mentions physical symptoms (chest pain, trouble breathing,
fainting, numbness), the plan must begin with "physical_notice".

If elevated=true, the plan must begin with "check_in" and must not include
"postpone_worry" or "physical_reset".

Set escalate=true if you notice any sign of risk that the input flags did
not mention.

Patterns: waiting_for_tomorrow, replaying_conversation, body_first,
waiting_for_news, too_much_at_once, checking_loop, late_night_loop,
someone_i_love, money, unnamed.

Intervention library: [id — when it fits — duration]
breathe_60 / breathe_90 / breathe_180 — body activation, racing heart — 1–3 min
grounding — dissociation, "I don't know", panic edge — 2 min
name_it — diffuse fear, replaying — 1 min
worry_sort — anticipatory, control confusion, money, someone_i_love — 3 min
worst_best_likely — catastrophizing a specific event — 2 min
postpone_worry — rumination late at night, checking loops — 1 min
self_compassion — self-criticism, shame — 2 min
muscle_release — physical tension — 3 min
physical_reset — stuck arousal (gentle movement, change of room) — 1 min
next_smallest_step — overwhelm, avoidance — 2 min
body_scan — late night, winding down — 3 min
sleep_wind_down — late_night_loop end — 3 min
check_in / physical_notice — safety steps, see rules
```

---

## 6. Step 4 — Scripted interventions with tiny AI fills

Each intervention is a sequence of screens stored as data (in the `interventions` table, Doc 09). Example for `worry_sort`:

```json
{
  "id": "worry_sort",
  "steps": [
    {"type": "list_edit", "prompt": "What's on your mind about this?", "prefill_from": "worry_items"},
    {"type": "sort", "zones": ["Mine to handle", "Not mine", "Not today"]},
    {"type": "ai_fill", "template": "{n_mine} things are yours. The rest isn't yours tonight.", "ai": false},
    {"type": "ai_suggest", "prompt_key": "smallest_step", "max_tokens": 120}
  ]
}
```

The `ai_suggest` step is the only AI call inside an intervention: given the top "mine" item, suggest 3 tiny next steps (≤8 words each). Opus 5.5 (or Sonnet) at low effort, ~150 tokens out. Everything else is deterministic UI.

**Why this design is safer and cheaper:** The AI cannot invent an exercise, cannot ramble, cannot be prompt-injected into skipping safety steps, and each session costs cents, not dollars.

---

## 7. Step 6 — Closing line

One short call: given pattern, before/after, the chosen next step, local time → one acknowledgement sentence and (if applicable) the next step restated. Schema: `{"acknowledgement": "...", "next_step": "..." | null}`. Max 40 words. Banned-phrase check. If it fails, a stock line is used ("You came here and did something. That counts.").

---

## 8. Step 7 — Pattern extraction & weekly reflection (asynchronous)

**Nightly job** (Supabase scheduled Edge Function, 03:00 in your server's timezone):
- For each session completed that day that has free text, run **Haiku 5.5** to extract up to 5 short trigger tags (`"manager"`, `"email"`, `"sleep"`), normalized to lowercase, from a controlled vocabulary plus free tags. Store in `session_triggers`. (Many sessions have no free text; those get tags from the chip only, no AI call.)

**Weekly job** (Sunday evening):
- For each Plus user with 2+ sessions that week, build a compact summary of structured records (no raw text needed) and ask the main model for a 4-sentence reflection + one suggestion. Use the **Message Batches API** (50% discount; results within hours; nobody is waiting).
- Deliver in-app (S60) and by email if opted in (Resend).

**Personalization memory** is recomputed weekly from `intervention_runs` and `outcome_ratings` with plain SQL (no AI): average delta per intervention per user, thumbs up/down counts, last 5 patterns. Stored in `profiles.personalization` as JSON and injected into Step 2.

---

## 9. Where the code lives (so you know what Claude Code will build)

```
supabase/
  functions/
    moment-read/        # Step 1 + 2 + 3, streams the reflection to the client
    moment-suggest/     # the tiny ai_suggest call inside worry_sort
    moment-close/       # Step 6
    nightly-tags/       # Step 7a (scheduled)
    weekly-reflection/  # Step 7b (scheduled, batch API)
    stripe-webhook/     # payments (Doc 04)
    _shared/
      prompts.ts        # all system prompts, versioned
      safety.ts         # keyword list, classifier call, level rules
      guards.ts         # banned phrases, schema validation, plan validation
      anthropic.ts      # one client, caching, fallbacks, streaming helpers
      library.ts        # intervention IDs and metadata
  migrations/
    0001_init.sql       # Doc 09 schema
app/ (Next.js, generated by v0 then refined in Claude Code)
```

**Every prompt is versioned** (`prompt_version` saved on each session) so you can see whether a prompt change helped.

---

## 10. Latency targets (what "fast" means)

| Step | Target | How |
|---|---|---|
| Safety classifier | < 1.0 s | Haiku, 256 max tokens, no thinking needed |
| First line of the read visible | < 1.5 s | Streaming, cached system prompt, effort low |
| Full read complete | < 4 s | Short output, structured |
| Worry-sort suggestions | < 2 s | Tiny call |
| Closing line | < 2 s | Tiny call |

If the read is slower than 6 s, the UI shows the orb breathing with "One moment." It never shows a spinner.

---

## 11. Failure handling (what the user sees when something breaks)

| Failure | User sees | Code does |
|---|---|---|
| Classifier fails | Nothing different | Treat as level 2 |
| Read fails after retry | *"I lost the thread for a second. Let's start with your body."* → grounding + breathing | Default plan; log error |
| Model refusal (`stop_reason: refusal`) | Same as above | Fallbacks beta handles most; else default plan |
| Rate limit (429) | Same as above | Exponential backoff ×2 then default |
| Daily cost cap hit | *"Aeris is resting for a bit. Quick Calm still works."* | Edge Function returns 503; Quick Calm is client-only |
| Supabase down | *"Can't save right now. Quick Calm still works."* | Client-only tools continue |

**Principle:** The non-AI calming tools must always work, even when every server is down. That is why they are built into the PWA with no server dependency.

---

## 12. Things I considered and rejected

- **Letting the AI run an open-ended conversation as the core loop.** Rejected: slower, costlier, less safe, and makes Aeris a worse ChatGPT. Kept a *bounded* "talk it through" for v1.1.
- **Retrieval-augmented generation (RAG) over a therapy-technique corpus.** Rejected for MVP: the library has 12 items; it fits in the prompt. RAG is for thousands of documents.
- **Fine-tuning a model.** Rejected: expensive, slow, and you have no data yet. Prompt + structured outputs is the right tool.
- **Emotion detection from voice or face.** Rejected: EU AI Act sensitivity, privacy, accuracy, and it is creepy. Aeris asks; it does not infer.
- **Running a local/on-device model for privacy.** Rejected for MVP: quality is not there for the "read" step on phones in a browser. Revisit in a year.
