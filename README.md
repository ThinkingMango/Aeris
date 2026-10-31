# Aeris

A proposed stress-management tool for stressful moments at work, and the plan to find out whether it should exist.

**Status (31 October 2026):** discovery phase. No product has been released. The plan was rewritten after an independent review (version 1 is archived), then revised again after an adversarial review of version 2. Every finding and its disposition is in [`docs/03-review-log.md`](docs/03-review-log.md).

**Start here:** [`docs/00-START-HERE.md`](docs/00-START-HERE.md)

## What is in this repository

| Path | Contents |
|---|---|
| `docs/` | The plan: decision memo, evidence register, review log, experiments, safety, privacy, AI, law, economics |
| `supabase/schema.sql` | Pilot database schema with explicit permissions |
| `supabase/tests/` | Security tests run against a throwaway PostgreSQL 16, plus a mutation check |
| `src/safety/` | Deterministic safety controller and its tests; shared keyword and banned-term lists |
| `src/ai/` | The AI arm's prompt and output schema, shared by production and tests |
| `evals/` | Classifier evaluation, model bake-off, exact statistics |
| `models/` | Cohort economics model and its assumptions |

## Run the checks

```bash
npm test
```

```bash
npm run test:db:mutations
```

```bash
python3 evals/classifier_eval.py --parity
```

Aeris is a stress-management tool, not therapy, medical care, or an emergency service.
