# Greenfield Architecture: Building Aeris From Scratch

Status: founding document, v1 (14 September 2026)
Builds on: `02-mvp-spec.md` (product surface), `04-viable-options.md` (the wedge and the revenue layer)

---

## 0. What this is and what it replaces

This is the technical blueprint for a **clean-slate SaaS build**. No code is carried over from the earlier Lovable project (`aeris-calm-foundation`). What is carried over is the *product knowledge*: the conversation contract, the safety ladder, the intervention set, the pattern-evidence rules and the privacy posture, all documented in `02-mvp-spec.md` and re-derived here as fresh implementations with better boundaries.

The brand stays Aeris. Only the codebase is new.

**Three things this build does that the previous one did not:**

1. **Streams the reply.** The old design used strict JSON output, which cannot be shown token by token. This build streams the visible text and collects the structured decision through a tool call in the same turn. At 1:30 a.m. the difference between a four-second blank screen and words appearing immediately is the difference between staying and closing the tab.
2. **Puts the whole domain in a pure core.** `src/core/` has no database, no network, no framework. Every safety rule, state transition, pattern threshold and intervention script is a pure function over plain data, so the rules that matter most are the easiest things in the system to test and the hardest to break by accident.
3. **Ships the wedge from day one.** Urge capture, the delay-the-check timer and urge metrics are first-class, not bolted on later. `04-viable-options.md` concluded that reassurance-seeking is the wedge; the schema and the domain reflect that from the first commit.

---

## 1. Stack

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| Framework | **Next.js 15, App Router, React 19** | Server Components keep the safety-critical code on the server by construction. Largest ecosystem, best streaming primitives, Vercel-native. The previous build used TanStack Start, which is good but thinner on streaming-UI patterns and has far less training data behind it, which matters when an AI agent is doing most of the typing. |
| Language | **TypeScript, strict** | Non-negotiable for a system whose correctness argument is "the types make the illegal states unrepresentable". |
| Database | **Postgres via Supabase** | Row Level Security is real defence in depth for health data: even a route handler bug cannot read another person's rows. Nothing else in this price range gives that. |
| Auth | **Supabase Auth** | Keeps `auth.uid()` available inside RLS policies. Clerk is a nicer developer experience but splits identity from the database, which means RLS has to be driven by a custom JWT claim: more moving parts in the exact place where a mistake is worst. |
| Query layer | **Drizzle ORM** | Typed SQL, real migration files in the repo, and it does not hide the query. The previous build's migration story was its weakest point; this fixes it at the root. |
| AI | **Anthropic Claude** (`claude-opus-5`) | Native tool use with strict schemas, prompt caching on a stable prefix, and adaptive thinking. See section 4. |
| Payments | **Paddle** (Merchant of Record) | A Hong Kong company selling subscriptions to the UK, EU and Australia would otherwise have to register for VAT and GST in each. Paddle absorbs that entirely. Stripe is the better API; it is not worth multi-jurisdiction tax registration for a solo founder. |
| Hosting | **Vercel** | Edge-adjacent streaming, preview deployments, and it is where Next.js is least surprising. |
| Styling | **Tailwind v4 + shadcn/ui** | Fast to build, easy for an agent to edit, and the design tokens from the Ambient Minimalism language map onto it directly. |
| Analytics | **PostHog EU**, consent-gated | EU residency, event allowlist, never carries message text. |
| Testing | **Vitest** (unit), **Playwright** (journeys) | The core is pure, so unit tests cover the rules that matter without any infrastructure. |

**Deliberately excluded:** no Redis, no queue, no vector store, no microservices, no GraphQL. Every one of those is a thing to operate, and none is needed to serve a conversation, five exercises and a weekly aggregate.

---

## 2. Module boundaries

```
src/
├── core/                  pure domain — no I/O, no framework, 100% unit-tested
│   ├── safety/            risk ladder, deterministic floors, merge, output guards
│   ├── conversation/      state machine, turn contract, pacing budgets
│   ├── interventions/     app-owned exercise content, routing, effectiveness ranking
│   ├── patterns/          taxonomy, evidence thresholds, aggregation
│   ├── urges/             the wedge: urge targets, delay ladder, outcomes
│   ├── insights/          anxiety-map computation with availability thresholds
│   └── entitlements/      plans and capabilities
├── db/                    Drizzle schema, migrations, typed client
├── server/                I/O boundary — the only place that touches network or DB
│   ├── ai/                Claude client, prompts, classifier, turn pipeline, summary
│   ├── repo/              data access, one module per aggregate
│   └── services/          orchestration: runTurn, startSession, completeSession
└── app/                   Next.js routes, Server Components, Server Actions
```

**The rule that keeps this honest:** `core/` may not import from `db/`, `server/`, `app/`, the Anthropic SDK, Next.js, Drizzle or React. Enforced by a test (`src/core/boundaries.test.ts`) rather than by discipline, because a convention decays within a month and a failing test does not. Anything in `core/` can be reasoned about by reading one file, and tested by calling one function.

---

## 3. The conversation turn

### 3.1 Why the previous design could not stream

A strict JSON schema forces the entire response to be one JSON object. You cannot show `user_facing_response` to the user until the object closes, because until then you do not know whether it will parse. So the user waits for the whole turn, thinking included.

### 3.2 The design here

One streaming request. The model writes its reply as ordinary text, then calls a single tool, `record_turn`, carrying the structured decision.

```
user message
   │
   ├─► SAFETY GATE (before any generation)
   │      deterministic floors ──► classifier ──► merge (floors only rise)
   │      risk 3–4 ────────────────────────────► approved copy, session held, STOP
   │      medication / reality-sensitive / violence / relational ──► approved copy, STOP
   │      classifier down + nothing deterministic ──► constrained copy, STOP
   │
   └─► GENERATION (risk 0–2 only)
          client.messages.stream({ tools: [record_turn], tool_choice: auto })
             │
             ├─ text deltas ──► output guards on the live buffer ──► client
             │                     violation ──► abort stream, replace with safe copy
             │
             └─ tool_use block ──► validated structured decision
                                     ├─ illegal transition ──► safe fallback
                                     ├─ intervention outside allowed set ──► stripped
                                     └─ persisted
```

**Output guards on the live buffer** are what make streaming safe. They are deterministic phrase and pattern checks, cheap enough to run on every delta:

- unsupported certainty ("I'm sure", "definitely won't", "there's nothing to worry about")
- reassurance delivered without naming uncertainty, when the user was seeking reassurance
- credential claims ("as your therapist", "I diagnose")
- exclusivity, romance, permanence ("I'm all you need", "I'll never leave you")
- medication instruction ("stop taking", "double your dose")
- diagnosis language (disorder names in a "you have" frame)

If a guard trips mid-stream, the stream aborts, the partial text is discarded client-side, and app-owned copy replaces it. The user sees a brief correction, not an unsafe sentence. Model-based output review runs only on the small set of cases wording alone cannot settle, and only after the stream completes.

### 3.3 The turn contract

`record_turn` is a `strict: true` tool. The model cannot return a shape that does not validate:

| Field | Type | Server-enforced constraint |
|---|---|---|
| `next_state` | enum | Must be a legal transition from the stored current state |
| `trigger` | enum | Fixed vocabulary |
| `patterns` | array ≤3 of `{type, confidence}` | Fixed taxonomy |
| `needs_more_context` | boolean | — |
| `recommended_intervention` | enum or null | Must be in the server-computed allowed set |
| `ui` | `text` \| `choice` \| `intervention` \| `intensity` \| `summary` | `choice` requires ≤4 options, each ≤120 chars |
| `urge` | `{target, wants_delay}` or null | Only when the session is in reassurance mode |

The client never sends state. The server reads the current state from storage, computes the allowed transitions, and rejects anything else. This is the single most important invariant in the system and it is enforced in one function.

### 3.4 Model configuration

```ts
model: "claude-opus-5"
thinking: { type: "adaptive" }        // on by default on Opus 5
output_config: { effort: "medium" }   // tuned per route; see below
max_tokens: 2000
system: [ { text: STABLE_PROMPT, cache_control: { type: "ephemeral" } },
          { text: perTurnContext } ]  // volatile content after the cache breakpoint
```

- **Prompt caching.** The system prompt and the tool definition are byte-stable across every turn of every user, so they cache. Per-turn context (state, known patterns, allowed interventions, tone) goes after the breakpoint. This is the largest single cost lever in the app.
- **Effort.** `medium` for ordinary turns, `low` for the safety classifier, `low` for summaries. These are starting points to be measured, not conclusions.
- **Refusals.** Claude may decline a request with `stop_reason: "refusal"`. This build does **not** use server-side model fallbacks. A refusal routes to app-owned approved copy, which for a mental-health product is safer than a second model improvising on a message the first one declined.
- **Classifier model.** Also `claude-opus-5` at effort `low`. `claude-sonnet-5` is the obvious latency and cost lever, but it must not be pulled until the 300-case safety set proves it holds, because this is the highest-stakes call in the system. The model id is configuration, not a constant, so the swap is one environment variable plus an eval run.

---

## 4. Safety architecture

Three properties, in priority order:

1. **Deterministic floors can only be raised, never lowered.** A phrase-tier match sets a minimum risk level. The classifier may raise it. Nothing may lower it. A classifier outage therefore cannot produce a miss on literal language.
2. **Failure is conservative.** Classifier unavailable, malformed, or timed out resolves to a cautious decision, never to "no risk". If nothing deterministic looked risky and the classifier is down, the app answers from constrained copy rather than generating freely.
3. **The model never decides to escalate or de-escalate.** Entering the terminal safety hold is the gate's decision. A model that proposes it on a non-safety turn keeps its supportive wording but stays in the ordinary flow.

The risk ladder:

| Level | Meaning | Route |
|---|---|---|
| 0 | Ordinary worry | Normal conversation |
| 1 | Clear distress, no safety concern | Normal conversation |
| 2 | Concerning, no immediate threat | Restricted: narrowed advice, no intervention this turn |
| 3 | Any stated wish to die; self-harm; violence; serious risk | Safety redirect, session held, crisis resources |
| 4 | Imminent danger or medical emergency | Safety redirect, emergency framing |

Four categories bypass the model entirely and answer from reviewed copy even below level 3: medication questions, reality-sensitive content, violence and abuse, and relational bids ("are you conscious", "I love you"). Each is a place where an improvised reply is worse than a fixed one.

Safety events record risk level, category, action, route and classifier version. **They never record message text.** Crisis resources are a curated registry with a named source and verification date per entry; no number is ever inferred.

---

## 5. Data model

Eighteen tables. The shape that differs most from the previous build is `session_events`, an append-only log that makes the session auditable and makes pattern aggregation a pure fold rather than a set of scattered writes.

```
profiles          preferences        consents (append-only)      usage_counters
sessions ──< session_events (append-only)
         ──< messages                 (purgeable; the only place text lives)
         ──< urges                    (the wedge: target, delay, outcome)
         ──1 session_summaries
         ──< session_patterns
         ──< intervention_runs >── interventions (seeded catalog, versioned)
         ──< safety_events            (server-only, no text)
user_patterns                          (aggregated, user-correctable)
safety_metrics                         (aggregate, no user reference)
subscriptions     billing_events       deleted_accounts (tombstones)
orgs ──< org_members                   (Teams plan)
practitioner_links                     (Practitioner plan, consent-scoped)
```

Rules baked into the schema:

- Every user-owned table carries `user_id` and an RLS policy of `user_id = auth.uid()`. No exceptions.
- Server-only tables (`safety_events`, `safety_metrics`, `billing_events`, `deleted_accounts`) have RLS enabled with **no policies and no grants** to the browser roles. They are reachable only with the service role.
- `sessions` stores `local_hour`, `local_dow` and `tz_at_start`, captured at creation. The anxiety map cannot be built later from UTC alone, and back-filling by guessing is not acceptable.
- `messages` is the only table containing what a person typed, so "do not keep my conversations" is a purge of one table at session end.

Retention is finite and enforced by a scheduled job: safety events 12 months, safety metrics 24 months, billing events 400 days, closed usage periods 24 months, tombstones 7 years. Wellness data lives for the life of the account under the person's own controls.

---

## 6. What gets built in what order

| Stage | Contents | Why first |
|---|---|---|
| **1. Core** *(this commit)* | `src/core/**` and its tests; schema; AI layer | The rules are the product. They are pure, so they can be finished and proven before a single screen exists. |
| 2. Data and auth | Migrations, RLS policies, Supabase Auth, onboarding | Nothing can be tried by a real person until an account exists |
| 3. The session | Help-now entry, intensity, streaming conversation, intervention players, reassess, summary | The core loop |
| 4. The wedge | Urge capture, delay timer, uncertainty-tolerance exercise, urge metrics | The reason to choose Aeris over ChatGPT |
| 5. The map | Insights screen from `core/insights` | The reason to pay |
| 6. Commerce | Paddle, entitlements, Teams seats, Practitioner links | The revenue layer from `04-viable-options.md` |
| 7. Compliance | Legal documents, disclosure, per-message flag, crisis registry expansion, export and deletion | Required before launch, not after |

---

## 7. Decisions recorded so they are not relitigated

1. **Supabase Auth over Clerk.** RLS needs `auth.uid()`. Splitting identity from the database to gain a nicer sign-in screen is a bad trade when the database is the last line of defence on health data.
2. **Drizzle over the Supabase client for writes.** Typed queries and migrations in the repo. The Supabase client remains for auth and realtime.
3. **Tool call over structured output for the turn.** Streaming is worth more than the marginal simplicity of one JSON object, and `strict: true` on the tool gives the same validation guarantee.
4. **No server-side model fallback on refusal.** App-owned copy is safer than a second model.
5. **Paddle over Stripe.** Merchant of Record removes multi-jurisdiction tax registration for a Hong Kong company selling worldwide.
6. **Append-only `session_events`.** Auditability and a pure aggregation fold, for the cost of one extra table.
7. **The wedge is in the schema from commit one.** Retrofitting `urges` after launch would mean a migration on live health data for the feature the business case depends on.
