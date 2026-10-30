# 09 — Database Design

**Plain-English summary:** The database is a set of tables (like spreadsheets) in Supabase, which is a hosted Postgres database with login, file storage, and small server programs built in. The design has three goals, in order: (1) a user can only ever see their own data, (2) we store as little as possible, (3) the data is shaped so that "patterns over time" is a simple query, not a research project.

The actual, runnable setup is in [`supabase/schema.sql`](../supabase/schema.sql). This document explains it.

---

## 1. Vocabulary

- **Table:** a spreadsheet with fixed columns.
- **Row:** one record (one session, one user).
- **Primary key:** the unique ID of a row.
- **Foreign key:** a column that points at a row in another table ("this session belongs to this user").
- **Row Level Security (RLS):** a rule attached to a table that Postgres enforces on every request: "only return rows where `user_id` equals the logged-in user." This is the single most important safety feature in the whole app.
- **Service role:** a special server-only key that bypasses RLS. It lives in Edge Functions only, never in the browser.
- **Cascade delete:** when a user is deleted, every row that points at them is deleted automatically.
- **JSONB:** a column that holds a flexible blob of structured data (used sparingly, for personalization and intervention scripts).

---

## 2. The tables and why each exists

```
auth.users (managed by Supabase)
   │
   ├── profiles            1 per user: settings, plan, country, personalization
   ├── consents            what they agreed to, when (never edited, only added)
   ├── sessions            1 per Moment  ◀── the heart
   │     ├── intervention_runs   which exercises ran, completed or swapped
   │     ├── worry_items         the worry-sort board
   │     └── session_triggers    short tags ("manager", "email") for patterns
   ├── checkins            10-second daily tension ratings
   ├── reflections         weekly AI reflections (Plus)
   ├── usage_monthly       free-tier counter + AI cost per user per month
   ├── subscriptions       mirror of Stripe (written only by the webhook)
   ├── safety_events       flagged inputs, minimal content (server-only)
   ├── deletion_requests   proof you honoured a deletion (server-only, survives deletion)
   └── ai_calls            cost ledger per AI call, no content (server-only)

interventions            the scripted library (public read, you edit)
```

### `sessions` — the heart
One row per Moment. It is **structured first**: chip, tension before/after, pattern, plan, helped. Free text (`user_text`, `user_note`) is optional and capped. This shape means the Patterns screen is a handful of `GROUP BY` queries:

- Most common pattern: `select pattern, count(*) from sessions where user_id = me group by 1`
- Best intervention: `avg(tension_before - tension_after)` grouped by `intervention_runs.intervention_id`
- Time-of-day heatmap: `local_hour`, `local_weekday` stored at creation so we never have to deal with timezone math later.

### `safety_events` — deliberately minimal
Stores level, signals, action taken, a **hash** of the triggering text, and a short excerpt that is automatically blanked after 90 days. It does **not** store the transcript. It keeps `user_id` as nullable with `on delete set null` so that if a user deletes their account, you still have the anonymous record that a crisis protocol ran (which California-style annual reporting may ask about).

### `consents` — append-only
Every toggle the user flips creates a new row with the policy version and a hashed IP. This is what you show a regulator if asked "did this user agree to health-data storage, and to which version?"

### `ai_calls` — cost ledger
Every AI call writes tokens and cost, no content. Your admin dashboard reads this. It is how you catch a cost blowup within a day, not at month end.

---

## 3. Security model (how "only your own data" is enforced)

1. **RLS is ON for every table.** Supabase does not enforce it unless you turn it on. The schema turns it on for all 14 tables.
2. **Policies compare `auth.uid()` to `user_id`.** The browser's requests carry the user's login token; Postgres checks it on every row. A bug in the app's JavaScript cannot leak another user's data, because the database refuses.
3. **Three tables have no user policies at all** (`safety_events`, `deletion_requests`, `ai_calls`). They are invisible to the browser. Only Edge Functions using the service-role key can touch them.
4. **Users cannot change their own plan.** The `revoke update (plan, …)` line means even a clever user cannot set themselves to "plus" from the browser. Only the Stripe webhook (server) can.
5. **Guests (Quick Calm with no account) write nothing.** The client-only tools store nothing at all.
6. **Encryption:** Supabase encrypts data at rest and in transit by default. For the two free-text columns, v1.1 can add application-level encryption (encrypt in the Edge Function with a key stored in Supabase Vault, so even someone with database access sees ciphertext). For MVP, at-rest encryption + RLS + no third-party access is the standard that most competitors actually run.
7. **No third-party trackers** touch the data. Analytics (Vercel Analytics) sees page views, not content or user IDs.

**The one thing you personally must do:** never, ever paste the `service_role` key anywhere except Supabase's Edge Function secrets and (if needed) Vercel's server-side environment variables. Not in v0. Not in the browser. Not in a chat. If you ever suspect it leaked, rotate it in the Supabase dashboard immediately.

---

## 4. Data minimization and retention

| Data | Kept for | Why |
|---|---|---|
| Structured session fields | Until the user deletes | They are the product (patterns) |
| Free text (`user_text`, `user_note`) | Until the user deletes | Needed for tag extraction and the user's own history. Capped at 1,000 / 500 characters |
| Safety excerpt | 90 days, then blanked | Enough to review; not a permanent record of someone's worst moment |
| `ai_calls` | 13 months | Cost history |
| Deleted users | Everything gone via cascade within minutes; `deletion_requests` keeps a hash + timestamp | Proof of compliance |
| Backups | Supabase daily backups, 7 days on Pro | A deleted user's data lives in backups up to 7 days. Say so in the privacy policy ("removed from backups within 7 days") |

What we **do not** store: raw IP addresses (hashed only), device fingerprints, location beyond country, contacts, photos, voice, full AI transcripts beyond the fields above, anything from the Quick Calm guest tools.

---

## 5. Regions

- **If your first market is the US:** Supabase region `us-east-1` (or `us-west-1`), Vercel default.
- **If UK/EU:** Supabase `eu-west-2` (London) or `eu-central-1` (Frankfurt). Vercel functions can be pinned to `lhr1`/`fra1`. Anthropic's API processes data where their infrastructure is; the EU AI Act and GDPR do not forbid this but your privacy policy must disclose the AI provider as a processor, and you should sign Anthropic's Data Processing Addendum (available in the console).

---

## 6. How the Patterns screen reads the data (example queries)

**Most common pattern in the last 30 days:**
```sql
select pattern, count(*) as n
from sessions
where user_id = auth.uid() and started_at > now() - interval '30 days' and pattern is not null
group by pattern order by n desc limit 1;
```

**What helps most (average drop in tension, per intervention, minimum 2 runs):**
```sql
select ir.intervention_id, round(avg(s.tension_before - s.tension_after),1) as avg_drop, count(*) as runs
from intervention_runs ir join sessions s on s.id = ir.session_id
where ir.user_id = auth.uid() and ir.completed and s.tension_after is not null
group by 1 having count(*) >= 2 order by avg_drop desc;
```

**Weekday × hour heat map:**
```sql
select local_weekday, local_hour, count(*) from sessions
where user_id = auth.uid() group by 1,2;
```

These run under RLS, so the `auth.uid()` filter is enforced even if someone removes it from the query.

---

## 7. Things to add later (not MVP)

- `organizations` and `memberships` tables for B2B plans.
- Application-level encryption for free text (Supabase Vault).
- `prompt_experiments` table for A/B tests of prompts and interventions.
- Partitioning `ai_calls` by month when it grows past a few million rows (years away).
