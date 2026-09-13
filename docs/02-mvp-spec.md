# Aeris MVP Specification and Current-State Audit

Status: founding document, v1 (13 September 2026)
Companion documents: `01-product-deep-dive.md` (market, competitors, regulation) and `03-30-day-launch-plan.md` (execution)

---

## 0. Read this first

This is not a greenfield specification. The Aeris application already exists as the Lovable project **aeris-calm-foundation** (GitHub `ThinkingMango/aeris-calm-foundation`, Vercel `smartmango/thinkingmango.aeris`), and it is far further along than "design tokens". This document audits what is actually built, measures it against the five MVP capabilities, and specifies only the gaps.

Evidence base for the audit: direct reads of the Lovable project source at commit `7826799` on 13 September 2026, its `roadmap.md`, `docs/`, database types, migrations list, and the Supabase and Vercel identities recorded in its deployment contract.

**Headline finding.** Four of the five MVP capabilities are built and tested to a standard well above a typical vibe-coded MVP. The fifth, the Personal Anxiety Map, is a placeholder screen. The product is blocked from launch not by missing features but by three operational gates: a verified production backend, legal documents, and billing go-live. Those are the critical path, and `03-30-day-launch-plan.md` is built around them.

---

## 1. Current-state audit

### 1.1 Stack as built

| Layer | Choice | Notes |
|---|---|---|
| Framework | TanStack Start 1.168 + TanStack Router 1.170, React 19, Vite 8, TypeScript 5.8 | SSR, file-based routes under `src/routes/` |
| Styling | Tailwind 4, shadcn/ui primitives, custom `aeris-*` components | Design language "Ambient Minimalism", tokens in `.lovable/ambient-minimalism.md` |
| Backend | Supabase (Postgres 17, Auth, RLS, `pg_cron`) | 26 migrations applied |
| AI gateway | Lovable AI Gateway (`ai.gateway.lovable.dev/v1/responses`), OpenAI Responses API shape | Default model `openai/gpt-6-astra`, reasoning effort `low`, strict JSON schema output |
| Billing | Paddle (Merchant of Record), Paddle Node SDK 3.10 | Sandbox verified end to end; live disabled by kill switch |
| Hosting | Vercel (production), Lovable preview (staging) | `APP_ENV` is server-authoritative |
| Tests | Vitest, 70 files, 785 tests at last checkpoint; typecheck and build clean | Live Auth/RLS scripts in `tests/` run against staging only |
| Agent surface | MCP server at `/mcp` (OAuth-protected, four read-only tools) | Returns 404 in production by design |

### 1.2 Environments and identities

| Environment | Backend | Ref | State |
|---|---|---|---|
| Production | Supabase `supabase-aeris-production` via Vercel | `jrbovbevoulmtggoqtxt` | All 26 migrations present (applied by an automatic integration on 12 Sep, incident documented), zero Auth users, billing disabled, CSP report-only. **RC4 not certified.** |
| Staging | Lovable Cloud backend | `vwixekspyuhhokadgdly` | Serves preview and current published app. `APP_ENV=staging`. |
| Unattached | Supabase project "Aeris" in Lawrence's own org, region `ap-northeast-2` (Seoul), created 11 Sep | `yepdhlofnvrlfntgpakm` | **Empty**: no tables, no functions, no edge functions. Not referenced anywhere in the codebase. Either the intended future self-owned production backend, or an orphan. Decision needed (see plan, Day 1). |

Observed on 13 Sep: the Lovable preview URL renders the app-level error state ("This page didn't load"). Root cause not diagnosed in this audit. It is the first item on the plan because nothing else can be verified through the preview until it is fixed.

### 1.3 Release state

| Candidate | Commit | What it certified |
|---|---|---|
| `rc-2026-09-11-01` | `e5000c3` | Gate 0 closure: retention rules, purge job, sandbox billing lifecycle, portal, profile, safety placeholders removed, export, deletion, tombstones, analytics gating |
| `rc-2026-09-11-02` | 7B hardening | Fail-closed payment, AI and webhook configuration |
| `rc-2026-09-11-03` | `87ec94a` | Server-authoritative environment identity, CSP and security headers, cross-environment webhook rejection, production mock-AI refusal |
| Post-hardening checkpoint (not RC4) | `817e84d` | Backend contract, billing kill switch, CSP report sink hardening, migration audit |

RC4 is explicitly blocked until: real backend isolation is verified at runtime, Auth email works on the production sender domain, JWT isolation both directions, two-user RLS and IDOR probes, one explicit AI provider, the safety journey, privacy export and deletion, retention, MCP denial, and CSP enforcement with billing disabled.

### 1.4 Route inventory (what a user can reach today)

| Route | Purpose | Status |
|---|---|---|
| `/` | Marketing landing | Built |
| `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password` | Supabase Auth | Built |
| `/onboarding/welcome` → `/boundaries` → `/personalization` → `/tone` | Age confirmation, product-boundary consent, trigger contexts, tone preference; persisted to `profiles` and `consents` | Built |
| `/app` | Authenticated home with quick-start trigger chips | Built |
| `/app/help` → `/app/help/intensity` | "Help me now" entry and 1–10 intensity capture | Built |
| `/app/session/$sessionId` | The conversation: chat, choices, intervention card, intervention player, reassessment, session summary | Built |
| `/app/toolkit` | Direct access to the five interventions without AI | Built |
| `/app/insights` | Anxiety map | **Placeholder** ("Gentle patterns about your experience will live here in a later step") |
| `/app/you` | Settings hub | Built |
| `/app/settings/profile`, `/app/settings/subscription` | Profile, billing status | Built |
| `/app/plan`, `/app/upgrade`, `/app/billing/processing` | Plus comparison, Paddle checkout, post-checkout reconciliation | Built (sandbox) |
| `/app/privacy` | Privacy Center: personalization, history and analytics toggles, export, delete conversations, reset anxiety history, delete account | Built |
| `/app/safety/support`, `/safety` | Crisis resources with country override | Built (US, DE, HK curated; generic fallback) |
| `/api/anxiety-chat` | The conversation turn pipeline | Built |
| `/api/safety-classify`, `/api/session-summary` | Safety classification, session summary | Built |
| `/api/public/payments/webhook`, `/api/public/create-checkout` | Paddle | Built |
| `/api/public/hooks/retention-purge` | Authenticated on-demand purge | Built |
| `/api/public/environment`, `/api/public/csp-report` | Deployment diagnostic, CSP sink | Built |
| `/mcp`, `/.well-known/oauth-protected-resource` | Agent integration | Built (staging only) |
| `/design-system`, `/dev/supabase-check` | Dev references | Stubbed out in production |

### 1.5 Conversation engine as built

The engine is a server-held state machine. The client renders state and reports events; it can never choose the next state.

```
START → UNDERSTAND → CLARIFY (loops, anti-loop budgeted) → IDENTIFY_PATTERN
      → SELECT_INTERVENTION → INTERVENTION → REASSESS → REFLECT → COMPLETE
Any active state → SAFETY_REDIRECT (terminal, decided only by the safety gate)
```

Per turn (`/api/anxiety-chat`), in order:

1. Bearer token validated against Supabase Auth; identity never comes from the body.
2. Session ownership check (non-existent and foreign sessions answer identically).
3. Idempotent replay on `client_event_id`.
4. User message stored first, so concurrent bursts count each other.
5. Rate limit; safety classification still runs on a rate-limited turn.
6. **Safety gate** (deterministic rules → classifier → merge). High-certainty deterministic risk never reaches the model. Risk 3–4 bypasses generation entirely. Medication, reality-sensitive, violence/abuse and relational bids are answered from approved copy, not the model.
7. Ordinary generation with a strict JSON contract (`user_facing_response`, `next_state`, `trigger`, `patterns[≤3]`, `needs_more_context`, `follow_up_question`, `recommended_intervention`, `ui`). Output is validated, then checked for duplicate questions, unsupported certainty (anti-reassurance), anti-loop budgets, output safety rules and, where wording alone cannot settle it, a lightweight model review. One regeneration, then deterministic rewrite or safe fallback.
8. Provider failure degrades to app-owned tools; the state holds; nothing is invented.
9. Classification persisted server-side (trigger, primary pattern, provisional session patterns). Terminal states close the session; history-off accounts have transcripts purged at terminal state.

Context sent to the model is bounded: 12 recent messages, 4 confirmed prior summaries, up to 8 patterns with confidence ≥0.5, and aggregated intervention effectiveness. With personalization off, no historical reads are even issued.

### 1.6 Domain vocabulary as built

- **Trigger categories** (profile, 10): work, relationships, health, money, social, sleep, uncertainty, decisions, overthinking, other.
- **Conversation triggers** (engine, 13): work, relationship, social, money, health_worry, family, sleep, decision, uncertainty, future, past_event, physical_sensation, unknown.
- **Anxiety patterns** (13): catastrophizing, rumination, intolerance_of_uncertainty, mind_reading, fear_of_failure, social_evaluation, physical_arousal, avoidance, reassurance_seeking, decision_paralysis, sleep_worry, general_overwhelm, unknown. Every one has a plain-language, non-clinical label.
- **Interventions** (5, content owned by the app, never the model): grounding, slow_breathing (4 in / 6 out, no hold), reality_check, control_circle, next_useful_action. Routing from pattern to intervention is a deterministic map.
- **Safety**: risk 0–4, categories self_harm, harm_to_others, medical_emergency, abuse, substance_crisis, out_of_scope (plus classifier-side medication, mania, eating, psychosis handling). 311-case evaluation set passes 311/311 after fixes; 10/10 live end-to-end scenarios.

### 1.7 Commercial model as built

| | Free | Aeris Plus |
|---|---|---|
| Price | 0 | US$9.99/month or US$79.99/year (Paddle, sandbox) |
| Guided AI sessions | 5 per calendar month (UTC), enforced by `consume_guided_session` | Unlimited |
| History | 7 days | Full |
| Anxiety map, personalized insights, advanced toolkit | Off | On |
| Data export, account deletion, safety support | Always on | Always on |

Entitlements fail closed to Free. `past_due` keeps access during the retry window. Safety is never budgeted, rate-limited or paywalled.

### 1.8 Privacy and retention as built

Approved and nightly-enforced: safety events 12 months, safety metrics 24 months, closed usage periods 24 months, billing webhook events 400 days, deletion tombstones 7 years. Life-of-account for all wellness data with user controls (history toggle, delete conversations, reset anxiety history, delete account with re-auth). Export is generated in-request and never stored. Open decisions: consent evidence after account deletion, application-log window, backup window.

Note: `docs/safety-data-handling.md` in the Lovable project is stale. It still says retention enforcement, export and deletion are "not yet implemented"; `docs/data-retention.md` and the roadmap show they are. The plan includes deleting or rewriting it so the two documents cannot be cited against each other in a review.

---

## 2. Gap analysis against the five MVP capabilities

| # | Capability | Built | Gap | Severity |
|---|---|---|---|---|
| 1 | "Help me now" conversational intervention | Text conversation, intensity before/after, five interventions with players, reassessment, summary, degraded mode | No voice input. No streaming of the reply (turn latency is a full round trip with reasoning on). | Medium. Voice is a Plus feature promise; streaming is a felt-quality issue at 1:30 a.m. |
| 2 | Journal with near-zero journaling | `session_summaries` (trigger, thought, helpful, next action) generated from the transcript, user-confirmable; `session_patterns`; `intervention_results`; history view | No physical-sensation or emotion field in the summary. The "You" and history views are functional, not reflective. | Low |
| 3 | Personal anxiety map | Data foundation only: `user_patterns` with evidence counts and strength thresholds (2 possible, 3 emerging, 5 recurring); `anxiety_sessions` has `started_at`, `trigger_category`, `intensity_before/after` | **`/app/insights` is a placeholder.** No time-of-day or day-of-week analysis. No trigger-frequency view. No "what tends to help you" view. No local-time capture (sessions store UTC and the profile stores a timezone, but nothing computes local hour). | **High. This is the differentiator and the reason to pay.** |
| 4 | Personalized intervention engine | Effectiveness aggregated per intervention (completions, mean intensity change, helpfulness trend) and injected into the prompt context | Effectiveness is context for the model, not a ranking rule. The deterministic router ignores it. Nothing surfaces "grounding tends to bring your intensity down by 3" to the user. | High. Cheap to close; large perceived value. |
| 5 | Safety and escalation | Deterministic tiers plus classifier, output validation, crisis registry with provenance, session hold, age confirmation, product-boundary consent, safety never gated by billing | Curated crisis resources for only US, DE, HK. No multi-turn escalation tests. No human tone review. Classifier and conversation share one provider (correlated outage; mitigated by deterministic floors). No published safety page for app-store reviewers. | Medium. Coverage, not design. |

Cross-cutting gaps that are not features:

- **Production is not certified** (RC4 blocked) and there are two candidate production backends.
- **Legal pages** (terms, privacy policy, product boundary) exist as consent version constants but the documents themselves are not written or hosted.
- **Paddle live** requires seller verification, an approved production domain and legal pages.
- **Preview is currently erroring.**
- **No analytics provider** is wired (in-process only), so launch metrics have nowhere to go.
- **No app-store or PWA packaging.** The product is a responsive web app.

---

## 3. Specification of the gaps

Only the work required to reach a launchable v1 is specified. Everything else is listed in section 9 as explicitly deferred.

### 3.1 Insights: the Personal Anxiety Map (capability 3)

**Promise to the user.** "After a few weeks, Aeris can show you when anxiety tends to show up, what it tends to be about, which thinking patterns recur, and which tools have actually helped you." Every statement is tentative, non-causal and dismissible, following the wording rules already encoded in `pattern-strength.ts`.

**Minimum data.** Everything needed already exists except local time. Add to `anxiety_sessions`:

```sql
alter table public.anxiety_sessions
  add column local_hour smallint check (local_hour between 0 and 23),
  add column local_dow smallint check (local_dow between 0 and 6),
  add column tz_at_start text;
```

Populated server-side at session creation from the profile timezone (fallback: browser-reported IANA zone passed with the create call; fallback: UTC and flagged). Never back-filled by guessing.

**Aggregations** (server function, RLS-scoped, personalization must be on):

| Insight | Rule | Shown when |
|---|---|---|
| Time of day | Sessions bucketed into night (23–05), morning (05–11), afternoon (11–17), evening (17–23) | ≥6 sessions and one bucket holds ≥40% |
| Day of week | Sessions by `local_dow` | ≥8 sessions and one day holds ≥30% |
| What it tends to be about | Top 3 `trigger_category` by count | ≥4 sessions |
| Thinking patterns | `user_patterns` with strength ≥ possible, using existing phrases | Already defined |
| What helps | Per intervention: completions, mean intensity change, helpfulness trend | ≥2 completions of that intervention |
| Intensity over time | Weekly mean of `intensity_before` | ≥3 weeks with data |

**Screen** (`/app/insights`, Plus-gated with a Free preview that shows the section headings and one example in the empty state):

1. Header: "Your patterns" with a one-line boundary ("Observations, not conclusions. You can hide anything that isn't true for you.")
2. Cards in the order above, each rendered with the existing `insight` surface. Each pattern card carries "Not true for me" (already supported by `hidden_by_user`).
3. Empty state per card stating exactly what has to happen for it to appear ("Shows after 6 sessions").
4. No charts in v1 except the weekly intensity line, drawn with the existing `chart.tsx` (Recharts) in the muted palette.

**Copy rules.** Never "you are", always "tends to", "has come up", "may be". Never percentages; use "most often", "often", "sometimes".

**Effort.** 2–3 days including the migration, the aggregation function, tests and the screen.

### 3.2 Effectiveness-aware intervention selection (capability 4)

Today the router returns the deterministic candidate list for the detected patterns, and the model picks one with effectiveness only as prompt context. Change:

1. Server computes `InterventionEffectiveness` (already exists) and sorts candidates by a score: `−meanIntensityChange × 2 + helpfulnessScore`, ties broken by canonical order; interventions with <2 completions keep canonical order and sit after scored ones.
2. The sorted list is what goes to the model as `ALLOWED_INTERVENTIONS`, with a one-line instruction: "The list is ordered by what has helped this person before. Prefer earlier entries unless the current situation clearly calls for another."
3. The intervention card shows a quiet line when evidence exists: "This has helped you before" (≥2 completions, mean change ≤ −2).
4. Reassessment stores what it already stores; nothing else changes.

**Effort.** 1 day.

### 3.3 Streaming replies (capability 1, felt quality)

The gateway already streams SSE and the code already parses deltas. The strict JSON contract means the text field cannot be shown incrementally without a partial-JSON parser. Two options; pick the first:

- **Option A (recommended).** Keep strict JSON, and show a state-aware "thinking" surface within 300 ms that names the stage ("Reading what you wrote", "Choosing a tool"), then render the full reply. Effort: half a day. Latency unchanged, perceived latency much better.
- **Option B.** Two-call design: stream a plain-text reply, then a second cheap call classifies it into the contract. Doubles calls and re-opens the output-validation path. Not for v1.

### 3.4 Voice input (capability 1, Plus promise)

Defer voice **output**. Add voice **input** only as browser speech-to-text (Web Speech API where available, with a plain fallback to typing). Transcribed text enters the same pipeline, so safety and validation are unchanged. Effort: 1 day. Do not ship server-side transcription in v1: it adds a second AI provider path and audio data to the retention document.

### 3.5 Safety coverage (capability 5)

1. **Crisis registry.** Add curated entries, each with a named source and verification date, for: UK, Australia, Canada, Singapore, Ireland, New Zealand. Six countries, one day, and the registry rules already forbid inferred numbers.
2. **Multi-turn escalation tests.** Extend `tests/safety-e2e.mjs` with five scenarios where risk emerges at turn 3–5 after ordinary turns, and two where a person de-escalates after a redirect (expected: the session stays held, a new session works).
3. **Human tone review.** 30 real-shaped transcripts through the live pipeline, read by two people who are not the builder, scored on a three-point scale for warmth, brevity and non-clinical wording. Results recorded in `docs/`.
4. **Safety page.** A public `/safety` page already exists; ensure it states what Aeris is and is not, the crisis routing behaviour, and links the registry countries. App-store reviewers look for this.
5. **Provider decorrelation (optional for v1).** The safety classifier can run on a different model ID from the conversation model via `AERIS_SAFETY_MODEL_ID`. Set it, so an outage or a quality regression in one does not silently hit both. The deterministic floors already make a total classifier outage fail safe.

### 3.6 Legal and consent documents

Three documents are required by the consent constants and are not yet written: product boundary (`2026-09-boundaries-v1`), terms (`2026-09-terms-v1`), privacy (`2026-09-privacy-v1`). Section 3 of `01-product-deep-dive.md` sets out what each must contain by market. They are hosted as static routes and linked from onboarding, the footer and Paddle's checkout configuration.

### 3.7 Launch analytics

Wire one privacy-respecting provider (PostHog EU or self-hosted) behind the existing consent gate and allowlist. Events already defined in `src/lib/analytics/events.ts`. The launch metrics in section 8 depend on this.

---

## 4. Screens

### 4.1 Existing screens, unchanged

Landing, auth, onboarding (4), home, help entry, intensity, session, toolkit, you, profile, subscription, plan, upgrade, billing processing, privacy, safety support.

### 4.2 Screens changed or added

| Screen | Change |
|---|---|
| `/app/insights` | Replace placeholder with the Anxiety Map (3.1) |
| `/app/session/$sessionId` | Add the staged "thinking" surface (3.3), "This has helped you before" line on the intervention card (3.2), microphone affordance on the composer where supported (3.4) |
| `/app` (home) | Add one Insights teaser card once the first insight exists; otherwise nothing |
| `/terms`, `/privacy`, `/boundaries` | New static document routes (3.6) |
| `/safety` | Content review (3.5) |

No other new screens for v1.

---

## 5. Conversation flow specification

The flow is built and tested. This section records the behavioural contract so that prompt or model changes can be checked against it.

| State | Model may | Model may not | Server enforces |
|---|---|---|---|
| UNDERSTAND | Reflect, ask one question, propose patterns | Recommend an intervention | Exactly the allowed transitions |
| CLARIFY | Ask one different question | Repeat a question already asked | Duplicate detection; clarify-turn budget; forced advance when the budget is spent |
| IDENTIFY_PATTERN | Name a pattern in plain language | Use a clinical label; diagnose | Pattern enum; labels come from `ANXIETY_PATTERN_LABELS` |
| SELECT_INTERVENTION | Recommend one slug from the allowed list | Invent or recommend outside the list | `isAllowedIntervention` |
| INTERVENTION | Hand off to the app-owned player | Generate exercise steps | Content lives in `interventions/content.ts` |
| REASSESS | Ask intensity again | Reassure about outcomes | Anti-reassurance rewrite |
| REFLECT / COMPLETE | Summarise, offer next action | Extend the conversation | Summary schema; session closed server-side |
| SAFETY_REDIRECT | Nothing; the app speaks | Anything | Gate decides; terminal per session |

Length: 20–80 words typical, hard ceiling 1,200 characters. One question per turn. Choices ≤4, each ≤120 characters.

---

## 6. Intervention library

### 6.1 As built (5)

| Slug | Type | Duration | Evidence family |
|---|---|---|---|
| grounding | grounding | 2–3 min | Sensory grounding (5-4-3-2-1 lineage) |
| slow_breathing | breathing | 1–3 min | Slow breathing, extended exhale (4 in / 6 out, no hold) |
| reality_check | cognitive | ~4 min | Cognitive restructuring (evidence for/against, alternative explanations) |
| control_circle | cognitive | ~4 min | Circle of control / problem-solving orientation |
| next_useful_action | behavioural | ~3 min | Behavioural activation, smallest next step |

### 6.2 Recommended additions for v1.1 (not v1)

Each is a static, app-owned script like the existing five and slots into the router by pattern. Evidence citations are in `01-product-deep-dive.md`, section 4.

| Slug | Type | Routes from | Why |
|---|---|---|---|
| physiological_sigh | breathing | physical_arousal, general_overwhelm | Fastest-acting breath pattern in controlled comparison; 1 minute |
| worry_postponement | cognitive | rumination, sleep_worry | Standard treatment component for uncontrollable worry; fits the 1:30 a.m. case |
| thought_defusion | cognitive | rumination, catastrophizing, mind_reading | Distance from the thought when disputing it does not land |
| wind_down_note | behavioural | sleep_worry | Write tomorrow's first step and the worry list; then bed. Not a CBT-I protocol. |

Explicitly excluded, as before: exposure, interoceptive exposure, EMDR, trauma processing, any medication content, any diagnostic screening instrument.

---

## 7. AI architecture

### 7.1 As built

Three model calls exist, all through the Lovable AI Gateway with the OpenAI Responses API shape, strict JSON schema, `store: false`, reasoning effort low:

| Operation | Model | Input per call (approx.) | Output |
|---|---|---|---|
| Safety classification | `AERIS_SAFETY_MODEL_ID` or default | ~700 tokens (instructions + one message) | ~30 tokens |
| Conversation turn | `AERIS_CONVERSATION_MODEL_ID` or default | ~1,200 prompt + up to 12 messages + context ≈ 2,000–3,000 | ~150 |
| Output safety review (conditional) | same | ~500 | ~20 |
| Session summary | same | transcript ≈ 2,000–4,000 | ~100 |

Cost telemetry, per-user and global daily budgets, and circuit breakers exist. Budget breaches shed optional AI (summaries, personalization) and, at the extreme, guided generation. Safety is never shed.

The provider abstraction (`conversation-model.ts`, `mock-conversation-model.server.ts`, `openai-conversation-model.server.ts`) means a second provider adapter is a contained change.

### 7.2 Decisions to make

1. **Provider concentration.** Everything runs through one gateway and one vendor. This is acceptable for launch because the deterministic safety floors make a total outage fail safe and the degraded mode hands over to app-owned tools. It should not remain true past the first paying cohort. Add a second adapter behind the same contract (Anthropic Claude is the natural candidate; the contract's strict JSON maps to structured outputs) and put the safety classifier on it first, so the two halves of the safety story fail independently.
2. **Model tier.** The default is a lower-cost model at low reasoning effort. That is the right launch choice for a US$9.99 product; upgrade the conversation model only when tone review (3.5) shows a quality gap.
3. **Prompt caching.** The 1,200-token baseline prompt and the tool-free context are stable prefixes. Whichever provider is used, place the cache boundary after the baseline prompt and before `RUNTIME CONTEXT`. On Anthropic pricing this cuts the largest input component by roughly 90% on cache hits.
4. **Pricing assumptions in code.** `AI_PRICE_PER_MTOK` defaults to US$0.25 input and US$2 output. These are placeholders for telemetry and must be replaced with the real gateway rates before the unit economics in section 8 are trusted.

### 7.3 Cost per guided session

Assumptions: 8 turns per session, safety classification on every turn, output review on 30% of turns, one summary. Approximate tokens per session: 30,000 input, 2,000 output.

| Model rate (input / output per MTok) | Cost per session | Free user (5/mo) | Plus user (20/mo) |
|---|---|---|---|
| US$0.25 / US$2 (current telemetry assumption) | US$0.012 | US$0.06 | US$0.24 |
| US$2 / US$10 (Claude Sonnet 5 class) | US$0.080 | US$0.40 | US$1.60 |
| US$5 / US$25 (Claude Opus 5 class) | US$0.200 | US$1.00 | US$4.00 |

With prompt caching on a stable prefix, the two Claude rows fall by roughly 40–50%. Against US$9.99 gross and Paddle's fee (about 5% plus a fixed amount per transaction), gross margin on a Plus subscriber stays above 55% even on the Opus row at 20 sessions a month. The risk is not margin; it is heavy Free usage, which the 5-session allowance and the per-user daily budget already bound.

---

## 8. Database schema

### 8.1 As built (public schema, 17 tables, 3 functions)

```
profiles ─┐            user_preferences   consents          usage_counters
          │
anxiety_sessions ──< messages
        │        ──< session_patterns
        │        ──1 session_summaries
        │        ──< intervention_results >── interventions (seeded, versioned)
        │        ──< safety_events (server-only)
        │        ──< feedback
user_patterns (aggregated, hidden_by_user)
subscriptions (lean Paddle cache)   billing_webhook_events (server-only)
deleted_accounts (tombstones, server-only)   safety_metrics (aggregate, server-only)

functions: consume_guided_session(_user_id, _limit)
           record_confirmed_session_patterns(_session_id)
           record_safety_metric(_metric, _dimension, _count)
```

Every user table is owner-scoped by RLS. Server-only tables have RLS enabled with no policies and no grants.

### 8.2 Additions for v1

```sql
-- 3.1 local time for the anxiety map
alter table public.anxiety_sessions
  add column local_hour smallint check (local_hour between 0 and 23),
  add column local_dow smallint check (local_dow between 0 and 6),
  add column tz_at_start text;

-- 3.1 read model; security invoker so RLS applies
create or replace function public.insights_for_user(_user_id uuid)
returns jsonb language sql stable security invoker as $$ ... $$;

-- 3.6 document acceptance already covered by consents(version)
```

No new tables. Nothing new is server-only. Retention for the new columns is life-of-account like their parent row and is covered by reset-anxiety-history and account deletion.

### 8.3 Explicitly not added

No embeddings, no vector store, no free-text journal table, no wearable or calendar tables. None of these are needed for the five capabilities and each would add a retention category.

---

## 9. Safety architecture summary

```
message ──► deterministic tiers (self-harm floors, medication, emergency, injection)
        │         │ high certainty + safety route ──► redirect, no model call
        │         ▼
        │   classifier (strict JSON, bounded timeout, fail-safe to conservative)
        │         ▼
        │   merge (floors can only be raised) ──► route: normal | restricted | safety
        ▼
  normal ──► generation ──► output rules ──► optional model review ──► reply
  restricted ──► generation with narrowed guidance, no intervention this turn
  medication / reality-sensitive / violence-abuse / relational ──► approved copy
  safety ──► approved template + locale crisis resources; session held
  classifier down + nothing deterministic ──► constrained copy, no free generation
```

Invariants that must survive any change: safety never paywalled, rate-limited or budget-shed; the model never enters SAFETY_REDIRECT on its own; message text never reaches safety events, metrics or logs; crisis numbers are never inferred.

Deferred: automated verification of crisis sources, a second-provider classifier (7.2), broader locale coverage beyond the nine countries after 3.5.

---

## 10. Launch metrics

To be captured through the analytics provider in 3.7, consent-gated, with no wellness content:

| Metric | Target for a healthy first month |
|---|---|
| Sign-up → first completed session | ≥40% |
| Sessions with intensity drop ≥2 points | ≥50% of completed sessions |
| Session completion (reaches REASSESS) | ≥60% |
| Return within 7 days | ≥35% |
| Free → Plus conversion by day 30 | 3–5% |
| Safety redirect rate | Observed and reviewed weekly, no target |
| Provider failure rate | <2% of turns |
| Median turn latency | <4 s |

---

## 11. Explicitly deferred (not in v1)

Voice output, server-side transcription, wearable and calendar signals, proactive check-ins and notifications, therapist marketplace, community, meditation content, native app wrappers (a PWA install prompt is acceptable), multi-language UI, second AI provider (v1.1), the four additional interventions in 6.2 (v1.1), embeddings or semantic search over history.

---

## 12. Known issues observed during the audit

1. Preview renders the app error state. Undiagnosed. Plan Day 1.
2. `docs/safety-data-handling.md` contradicts `docs/data-retention.md` and the roadmap. Stale; delete or rewrite.
3. Two candidate production backends (Vercel-linked `jrbovbevoulmtggoqtxt` and the empty `yepdhlofnvrlfntgpakm`). One must be declared canonical and the other paused or deleted.
4. `AI_PRICE_PER_MTOK` telemetry defaults are placeholders.
5. `supabase/config.toml` identifies staging; documented, but easy to misuse with the CLI.
6. Safety evaluation "Not tested" list still names non-US locales, multi-turn escalation and human tone review.
