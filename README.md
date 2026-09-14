# Aeris

**An AI that learns your anxiety patterns and helps you interrupt them.**

Aeris is a wellness self-help product for adults with anxious thoughts, overthinking and uncertainty. At the moment anxiety hits it asks what is happening, notices the thinking pattern in plain language, guides one short evidence-based exercise, checks whether it helped, and over weeks builds a picture of when anxiety shows up, what it tends to be about, and which tools actually work for that person.

It is not therapy, not diagnosis, and not an emergency service, and it is built so that it cannot pretend to be.

**The thing that makes it different:** it will not reassure you. Most people arriving at an anxiety app want to be told it is fine. Being told is what keeps the loop running — relief lasts minutes, and the next check comes sooner. Aeris names the wish, separates what is known from what is predicted, and offers to wait the urge out instead.

---

## Repository layout

```
docs/     the founding documents — market, product, plan, strategy, architecture
src/
  core/       the domain. Pure TypeScript, no I/O, no framework. 98% covered.
  db/         Drizzle schema
  server/ai/  Claude integration: prompts, classifier, streaming turn
  app/        Next.js App Router
```

### `src/core` — the domain

Everything that decides anything lives here, and none of it can reach a database, a network, or a framework. That rule is enforced by a test, not a convention.

| Module | What it owns |
|---|---|
| `safety/` | The risk ladder, deterministic phrase floors, classifier merge, and the output guards that run on the live stream |
| `conversation/` | The state machine, the model turn contract, and the pacing budgets that stop the conversation circling |
| `interventions/` | Ten app-owned exercises, pattern routing, and effectiveness-aware ranking |
| `patterns/` | The non-clinical taxonomy, evidence thresholds, and conservative aggregation |
| `urges/` | The wedge: reassurance detection, urge targets, the delay ladder |
| `insights/` | The anxiety map, with a stated threshold per section |
| `entitlements/` | Plans and capabilities, failing closed |
| `copy/` | Reviewed replies and the crisis registry |

### Three invariants worth knowing before changing anything

1. **A deterministic safety floor can be raised, never lowered.** Literal crisis language sets a minimum risk level before any model is consulted, so a classifier outage cannot produce a miss.
2. **The client never chooses the next state.** The server reads the stored state, computes the legal moves, and rejects anything else — including anything the model proposes. A degraded turn can never move someone into the safety hold.
3. **Message text lives in exactly one table.** No safety event, metric, log line or telemetry record has a field capable of holding what a person typed.

---

## Documents

| Document | What it answers |
|---|---|
| [`docs/01-product-deep-dive.md`](docs/01-product-deep-dive.md) | Is this a viable business, against whom, under which rules? Market reality, competitor teardown with real user complaints, clinical grounding, regulation across five markets, monetization, positioning. |
| [`docs/02-mvp-spec.md`](docs/02-mvp-spec.md) | The product surface: screens, conversation contract, intervention library, safety architecture, cost model. |
| [`docs/03-30-day-launch-plan.md`](docs/03-30-day-launch-plan.md) | Day-by-day execution to a certified, legally launchable, paid product. |
| [`docs/04-viable-options.md`](docs/04-viable-options.md) | Which version clears US$10k MRR. Nine options scored; recommends a reassurance-seeking consumer wedge plus a Hong Kong SME and practitioner revenue layer. |
| [`docs/05-greenfield-architecture.md`](docs/05-greenfield-architecture.md) | This codebase: stack decisions with rationale, module boundaries, the streaming turn design, schema, and the decisions recorded so they are not relitigated. |
| [`docs/research/`](docs/research/) | Four source memos with a link for every claim. |

---

## Getting started

```sh
npm install
cp .env.example .env.local    # fill in Supabase, Anthropic, Paddle
npm test                      # 192 unit tests, no infrastructure needed
npm run typecheck
npm run dev
```

The test suite needs no database, no API key and no network: the domain is pure, which is the whole reason it is worth having.

| Command | Does |
|---|---|
| `npm test` | Unit tests |
| `npm run test:watch` | Watch mode |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run build` | Production build |
| `npm run db:generate` | Generate a migration from the schema |

---

## Status

Built and working end to end:

- the domain core, the Claude integration and the database schema
- the **session screen**: streaming replies, staged thinking, choices, the offer, reassessment
- all **five exercise players**, covering the ten exercises
- the **delay timer**, with a server-held clock that a reload cannot restart
- the entry flow, and the safety paths that bypass the model entirely

`npm run dev` works with no database and no API key. Without a key the classifier fails, the safety gate returns its constrained route, and the app answers from reviewed copy rather than generating unsupervised — the fail-closed design doing its job rather than an error.

Still to build: Postgres behind the repository interface, Supabase Auth, onboarding, the anxiety map screen, billing, and the legal documents. Sequenced in `docs/05-greenfield-architecture.md` section 6.

Nothing is deployed and no production database exists.
