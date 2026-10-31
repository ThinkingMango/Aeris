# 08 — Data, Privacy and Security

**Principle.** Store as little as possible, on the server even less, and prove the rules with tests rather than describing them.

---

## 1. Data map (pilot)

| Data | Where it lives | Who can read it | Kept for | On account deletion |
|---|---|---|---|---|
| Text the person types (worries, next steps) | **On the device only** (browser storage) | The person | Until they delete it or the account | App clears device storage |
| The same text, during screening and AI generation | Passes through Aeris's server function and the AI provider; **not written to Aeris's database or logs** | The AI provider, under its policy | Up to 30 days at the provider (E-SEC-05) | Cannot be recalled from the provider; the notice must say so |
| Situation chosen, optional tension score, exercises run, completion, feedback score | Aeris database, `public.sessions`, `exercise_runs`, `feedback` | The person (row level security); the server | Pilot plus 90 days, then deleted or fully anonymised | Deleted (test D01) |
| Arm assignment | `app_private.assignments` | Server only; the person sees their current arm via `my_arm()` | As above | Deleted |
| Consent records | `public.consents` | The person can read and add, never edit or delete; the server | Life of the account | Deleted with the account; there is nothing left to have consented about |
| Safety events: route, categories, source, arm, **no text** | `app_private.safety_events` | Server and reviewer only | Pilot plus 1 year | `user_id` removed; becomes an anonymous count (test D02); the notice says so |
| AI reservations and cost | `app_private.ai_reservations` | Server only | 13 months | `user_id` removed |
| Deletion proof | `app_private.deletion_log` | Server only | Indefinitely | Holds no identifier by design |
| Email address | Supabase Auth | Server | Life of the account | Deleted |
| Backups | Supabase managed backups | Supabase | Per plan; confirm the retention period for your plan and state it in the notice | Rolls off with the backup window |

**What is never collected.** Precise location, contacts, photos, voice, device fingerprints, analytics with user identifiers, advertising identifiers.

## 2. Processors to name in the privacy notice

Supabase (database and sign-in), Vercel (hosting), the AI provider chosen in [09](09-ai-and-models.md) (screening and AI arm), and the email provider (sign-in links, weekly survey). Stripe is added only if E7 runs. Each needs a signed data processing agreement.

## 3. Who can do what (the permission matrix)

Enforced by `supabase/schema.sql` and checked by `supabase/tests/run_security_tests.py`. "Own" means rows where `user_id` equals the signed-in user.

| Object | Visitor (anon) | Signed-in user | Server (service_role) |
|---|---|---|---|
| `exercises` | Read active rows | Read active rows | All |
| `profiles` | — | Read own; update own `country_code`, `timezone` | All |
| `consents` | — | Read own; insert own (`consent_type`, `version`, `granted`); **never** update or delete | All |
| `sessions` | — | Read own; insert own (`situation`, `tension_before`); update own (`tension_after`, `completed`). Server fields (`arm`, `started_at`, `completed_at`, `safety_route`) are set by triggers or the server | All |
| `exercise_runs`, `feedback` | — | Read own; insert own, only on own sessions (composite key) | All |
| `my_arm()` | — | Execute | Execute |
| Everything in `app_private` (assignments, settings, budget, reservations, safety events, deletion log, metrics, quota functions) | — | — | All |

**Tested:** 46 checks under both Supabase defaults (E-SEC-04), including the catalogue checks:
- A visitor can run no functions and read only exercises.
- A signed-in user can run only `my_arm` and has no table-wide update anywhere.
- Row level security is on for every public table.

Five re-introduced v1 holes are each caught.

## 4. How to run the tests

```bash
npm run test:db
```

```bash
npm run test:db:mutations
```

The first starts a throwaway PostgreSQL 16 database, loads a small Supabase stand-in (`supabase/tests/supabase_shim.sql`), and runs every check twice. The second proves the checks are not vacuous.

**Limit.** The stand-in imitates Supabase's roles; it is not Supabase. Before the pilot, apply the schema to a **Supabase branch database** and run the same checks there (phase 3, week 6).

## 5. Threat model (short)

| Threat | Example | Control | Tested |
|---|---|---|---|
| User reads another user's data | Guessing a session ID | Row level security; no privileged functions exposed | N01, N13, N16, N21 |
| User gives themselves privileges | Changing arm or plan | Column grants; triggers set server fields | N02–N05, N20, C04 |
| Visitor calls server functions | v1 personalisation leak | Private schema; execute revoked | N14, N17, N23, C01 |
| Cost blow-up or abuse | 20 parallel AI requests | Reserve-then-settle with row lock; per-user and global daily caps | K01–K04 |
| Key leak | Service key in browser code | Service key only in server function secrets; never in the client | Code review in phase 3 |
| Prompt injection via text | "Ignore your rules..." | Model chooses only from an enum; every output validated; controller decides routes | Bake-off; controller tests |
| Provider outage | AI down | Scripted fallback; breathing works offline | Phase 3 dry run |
| Data at rest on a lost phone | Device storage | Text minimal; "delete account" clears storage; optional device lock reminder | Manual |

## 6. Account deletion

1. The person taps "Delete my account and data", then confirms.
2. The app clears device storage.
3. The server function deletes the auth user, which cascades to every user-owned row (test D01). Safety events lose their user link (test D02). An anonymous `deletion_log` row is written.
4. A confirmation email is sent.
5. What remains, and the notice must say it: provider-side copies of text for up to 30 days, backups until they roll off, and anonymous safety counts.

## 7. Incident response

**Triggers.** Suspected unauthorised access, a leaked key, a safety-logic failure, or a report from a participant or researcher.

**Steps.**
1. **Contain within an hour.** Rotate keys; switch the controller to restricted for everyone, which can be a single setting; pause the pilot if needed.
2. **Assess within 24 hours.** What, how many people, which data.
3. **Notify as required.** Under the FTC Health Breach Notification Rule, if it applies (E-REG-05):
   - affected people without unreasonable delay, and within 60 days;
   - the FTC at the same time if 500 or more people are affected;
   - the FTC within 60 days after the end of the calendar year if fewer than 500 are affected;
   - prominent media if 500 or more residents of one state are affected.

   Other countries have their own rules. The lawyer confirms which apply ([10](10-regulatory.md) §7).
4. **Fix and retest.** Add a test reproducing the issue.
5. **Write it up.** A short post-mortem in `docs/incidents/`.

## 8. Before the pilot

A two-hour review by an independent developer of the schema, server functions, key handling and the screening path. Budget: $150–300. Bring this document and the test output.
