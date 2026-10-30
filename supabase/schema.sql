-- =====================================================================
-- Aeris — initial database schema (Supabase / Postgres)
-- Version: 0001_init
-- Run this in the Supabase SQL editor, or save as
-- supabase/migrations/0001_init.sql and run `supabase db push`.
--
-- Design rules (see docs/09-database-design.md):
--  * Every user-owned table has Row Level Security (RLS) ON and policies
--    that compare user_id to auth.uid(). Users can only see their own rows.
--  * Service-role (server) code bypasses RLS; the browser never has that key.
--  * Minimal data. We store structured records first, free text second,
--    and never anything we do not need.
--  * Deletion cascades from auth.users, so deleting the auth user deletes
--    everything.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums (fixed lists of allowed values)
-- ---------------------------------------------------------------------
create type plan_tier as enum ('free', 'plus');
create type session_status as enum ('started', 'reading', 'intervening', 'rated', 'completed', 'abandoned', 'crisis_exit');
create type situation_chip as enum ('tomorrow', 'conversation', 'body', 'money', 'someone', 'unknown', 'other');
create type pattern_key as enum (
  'waiting_for_tomorrow', 'replaying_conversation', 'body_first', 'waiting_for_news',
  'too_much_at_once', 'checking_loop', 'late_night_loop', 'someone_i_love', 'money', 'unnamed'
);
create type safety_level as enum ('0', '1', '2', '3');
create type sort_zone as enum ('mine', 'not_mine', 'not_today');

-- ---------------------------------------------------------------------
-- profiles: one row per user. Created automatically on signup (trigger).
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  preferred_name     text check (char_length(preferred_name) <= 40),
  country_code       char(2) not null default 'US',          -- drives crisis lines
  timezone           text not null default 'UTC',
  plan               plan_tier not null default 'free',
  plan_renews_at     timestamptz,
  stripe_customer_id text unique,
  checkin_time       time,                                   -- null = daily check-in off
  reduce_motion      boolean not null default false,
  sounds_enabled     boolean not null default false,
  theme              text not null default 'auto' check (theme in ('auto','light','dark')),
  personalization    jsonb not null default '{}'::jsonb,     -- computed weekly (Doc 08 §8)
  last_ai_disclosure_at timestamptz,                         -- for the 3-hour reminder rule
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- consents: an audit trail of what the user agreed to and when.
-- Never updated in place; a new row is added for each change.
-- ---------------------------------------------------------------------
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  consent_type   text not null check (consent_type in ('terms','privacy','health_data','age_18_plus','email_reflections')),
  version        text not null,                              -- e.g. '2026-11-01'
  granted        boolean not null,
  granted_at     timestamptz not null default now(),
  ip_hash        text                                        -- hashed, never raw IP
);
create index on public.consents (user_id, consent_type, granted_at desc);

-- ---------------------------------------------------------------------
-- interventions: the scripted library. Public read. Edited by you only.
-- ---------------------------------------------------------------------
create table public.interventions (
  id            text primary key,                            -- 'worry_sort', 'breathe_90', ...
  name          text not null,
  fits          text not null,                               -- when to use, for the prompt
  duration_sec  int not null,
  steps         jsonb not null,                              -- screen sequence (Doc 08 §6)
  is_active     boolean not null default true,
  version       int not null default 1,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- sessions: one row per "Moment". The heart of the data model.
-- ---------------------------------------------------------------------
create table public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  status             session_status not null default 'started',
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  local_hour         smallint check (local_hour between 0 and 23),
  local_weekday      smallint check (local_weekday between 0 and 6),
  chip               situation_chip not null,
  user_text          text check (char_length(user_text) <= 1000),  -- optional free text
  tension_before     smallint check (tension_before between 0 and 10),
  tension_after      smallint check (tension_after between 0 and 10),
  pattern            pattern_key,
  ai_reflection      text,
  ai_proposal        text,
  plan               text[] ,                                 -- intervention ids in order
  closing_line       text,
  next_step          text check (char_length(next_step) <= 200),
  user_note          text check (char_length(user_note) <= 500),
  helped             boolean,                                -- thumbs up/down
  helped_reason      text,
  safety_level       safety_level not null default '0',
  elevated           boolean not null default false,
  prompt_version     text,
  model_read         text,                                   -- e.g. 'claude-opus-5-5'
  ai_cost_usd        numeric(8,5) not null default 0,        -- summed from usage
  is_guest           boolean not null default false
);
create index on public.sessions (user_id, started_at desc);
create index on public.sessions (user_id, pattern);

-- ---------------------------------------------------------------------
-- intervention_runs: each intervention step actually run inside a session.
-- ---------------------------------------------------------------------
create table public.intervention_runs (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.sessions(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  intervention_id  text not null references public.interventions(id),
  position         smallint not null,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  completed        boolean not null default false,
  swapped_out      boolean not null default false             -- user tapped "try something else"
);
create index on public.intervention_runs (user_id, intervention_id);

-- ---------------------------------------------------------------------
-- worry_items: the worry-sort board contents.
-- ---------------------------------------------------------------------
create table public.worry_items (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  text        text not null check (char_length(text) <= 140),
  zone        sort_zone,
  is_top_step boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- session_triggers: short tags extracted nightly (Doc 08 §8).
-- ---------------------------------------------------------------------
create table public.session_triggers (
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  tag         text not null check (char_length(tag) <= 40),
  source      text not null default 'ai' check (source in ('chip','ai','user')),
  primary key (session_id, tag)
);
create index on public.session_triggers (user_id, tag);

-- ---------------------------------------------------------------------
-- checkins: the 10-second daily check-in (no AI).
-- ---------------------------------------------------------------------
create table public.checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  at          timestamptz not null default now(),
  local_hour  smallint,
  local_weekday smallint,
  tension     smallint not null check (tension between 0 and 10),
  chip        situation_chip
);
create index on public.checkins (user_id, at desc);

-- ---------------------------------------------------------------------
-- reflections: weekly AI reflections (Plus).
-- ---------------------------------------------------------------------
create table public.reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  body        text not null,
  suggestion  text,
  prompt_version text,
  created_at  timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ---------------------------------------------------------------------
-- safety_events: minimal record of flagged inputs. No full transcript.
-- ---------------------------------------------------------------------
create table public.safety_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,   -- keep event even if user deletes
  session_id     uuid references public.sessions(id) on delete set null,
  level          safety_level not null,
  signals        text[] not null default '{}',
  excerpt_hash   text,                                      -- hash of the triggering text, not the text
  excerpt        text check (char_length(excerpt) <= 300),  -- short excerpt, purged after 90 days
  action_taken   text not null,                             -- 'crisis_screen','elevated_mode','minor_exit','physical_notice'
  user_continued boolean,
  reviewed_at    timestamptz,
  reviewer_note  text,
  created_at     timestamptz not null default now()
);
create index on public.safety_events (created_at desc);

-- ---------------------------------------------------------------------
-- usage: monthly counters for free-tier limits and rate limits.
-- ---------------------------------------------------------------------
create table public.usage_monthly (
  user_id       uuid not null references auth.users(id) on delete cascade,
  month         date not null,                              -- first day of month
  ai_sessions   int not null default 0,
  ai_cost_usd   numeric(8,4) not null default 0,
  primary key (user_id, month)
);

-- ---------------------------------------------------------------------
-- subscriptions: mirror of Stripe state (written only by the webhook).
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id                     text primary key,                  -- Stripe subscription id
  user_id                uuid not null references auth.users(id) on delete cascade,
  status                 text not null,                     -- active, trialing, past_due, canceled...
  price_id               text not null,
  interval               text not null check (interval in ('month','year')),
  current_period_end     timestamptz not null,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);
create index on public.subscriptions (user_id);

-- ---------------------------------------------------------------------
-- deletion_requests: GDPR/MHMDA trail. Row survives the user's deletion.
-- ---------------------------------------------------------------------
create table public.deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id_hash  text not null,                              -- hash of the uuid, not the uuid
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz
);

-- ---------------------------------------------------------------------
-- ai_calls: per-call cost ledger (no content). For the admin view.
-- ---------------------------------------------------------------------
create table public.ai_calls (
  id              bigserial primary key,
  user_id         uuid references auth.users(id) on delete set null,
  session_id      uuid references public.sessions(id) on delete set null,
  step            text not null,                            -- 'safety','read','suggest','close','tags','reflection'
  model           text not null,
  input_tokens    int not null,
  cached_tokens   int not null default 0,
  output_tokens   int not null,
  cost_usd        numeric(8,5) not null,
  latency_ms      int,
  stop_reason     text,
  created_at      timestamptz not null default now()
);
create index on public.ai_calls (created_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.consents          enable row level security;
alter table public.interventions     enable row level security;
alter table public.sessions          enable row level security;
alter table public.intervention_runs enable row level security;
alter table public.worry_items       enable row level security;
alter table public.session_triggers  enable row level security;
alter table public.checkins          enable row level security;
alter table public.reflections       enable row level security;
alter table public.safety_events     enable row level security;
alter table public.usage_monthly     enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.ai_calls          enable row level security;

-- Users: full access to their own rows on user-owned tables.
create policy "own profile"      on public.profiles          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own consents"     on public.consents          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions"     on public.sessions          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own runs"         on public.intervention_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own worries"      on public.worry_items       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own triggers"     on public.session_triggers  for select using (auth.uid() = user_id);
create policy "own checkins"     on public.checkins          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reflections"  on public.reflections       for select using (auth.uid() = user_id);
create policy "own usage"        on public.usage_monthly     for select using (auth.uid() = user_id);
create policy "own subscription" on public.subscriptions     for select using (auth.uid() = user_id);

-- Library is readable by everyone (including guests), writable by nobody via the API.
create policy "read library"     on public.interventions     for select using (is_active);

-- safety_events, deletion_requests, ai_calls: NO user policies.
-- Only the service role (server-side Edge Functions) can read or write them.

-- A user may never change their own plan or stripe id from the browser.
revoke update (plan, plan_renews_at, stripe_customer_id, personalization) on public.profiles from authenticated;

-- =====================================================================
-- Triggers & helpers
-- =====================================================================

-- Create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute procedure public.touch_updated_at();

-- Monthly free-tier gate, called by the Edge Function before an AI session.
-- Returns true if the user may start an AI session.
create or replace function public.can_start_ai_session(p_user uuid, p_free_limit int default 3)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_plan plan_tier; v_count int;
begin
  select plan into v_plan from public.profiles where user_id = p_user;
  if v_plan = 'plus' then return true; end if;
  select coalesce(ai_sessions,0) into v_count
    from public.usage_monthly
    where user_id = p_user and month = date_trunc('month', now())::date;
  return coalesce(v_count,0) < p_free_limit;
end; $$;

-- Increment usage (server-side only).
create or replace function public.bump_ai_session(p_user uuid, p_cost numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.usage_monthly (user_id, month, ai_sessions, ai_cost_usd)
  values (p_user, date_trunc('month', now())::date, 1, p_cost)
  on conflict (user_id, month) do update
    set ai_sessions = usage_monthly.ai_sessions + 1,
        ai_cost_usd = usage_monthly.ai_cost_usd + excluded.ai_cost_usd;
end; $$;

-- Per-user personalization (computed weekly by a scheduled function; also callable ad hoc).
create or replace function public.compute_personalization(p_user uuid)
returns jsonb language sql security definer set search_path = public as $$
  with deltas as (
    select ir.intervention_id,
           avg(s.tension_before - s.tension_after) as avg_delta,
           count(*) as n
    from public.intervention_runs ir
    join public.sessions s on s.id = ir.session_id
    where ir.user_id = p_user and ir.completed and s.tension_after is not null
    group by ir.intervention_id
  ),
  recent as (
    select array_agg(pattern order by started_at desc) as patterns
    from (select pattern, started_at from public.sessions
          where user_id = p_user and pattern is not null
          order by started_at desc limit 5) r
  )
  select jsonb_build_object(
    'helped_before', (select jsonb_object_agg(intervention_id, round(avg_delta,1)) from deltas where n >= 2),
    'recent_patterns', (select to_jsonb(patterns) from recent),
    'computed_at', now()
  );
$$;

-- Admin dashboard view (read via service role only).
create or replace view public.admin_daily as
select
  date_trunc('day', started_at)::date as day,
  count(*) filter (where not is_guest)                               as sessions,
  count(*) filter (where status = 'completed')                       as completed,
  percentile_cont(0.5) within group (order by tension_before - tension_after)
      filter (where tension_after is not null)                       as median_delta,
  count(*) filter (where safety_level = '3')                         as crisis_exits,
  round(sum(ai_cost_usd)::numeric, 2)                                as ai_cost_usd
from public.sessions
group by 1 order by 1 desc;

-- Purge old safety excerpts (run by a scheduled function; keeps the hash and level).
create or replace function public.purge_safety_excerpts()
returns void language sql security definer set search_path = public as $$
  update public.safety_events set excerpt = null
  where excerpt is not null and created_at < now() - interval '90 days';
$$;

-- Seed the intervention library (names/fits only; steps are filled by the app's seed script).
insert into public.interventions (id, name, fits, duration_sec, steps) values
 ('breathe_60',  'Breathe (1 min)',        'body activation, racing heart, short reset', 60,  '[]'),
 ('breathe_90',  'Breathe (90 s)',         'body activation, racing heart',              90,  '[]'),
 ('breathe_180', 'Breathe (3 min)',        'strong body activation, before sleep',       180, '[]'),
 ('grounding',   'Ground (5-4-3-2-1)',     'dissociation, "I don''t know", panic edge',  120, '[]'),
 ('name_it',     'Name it',                'diffuse fear, replaying',                    60,  '[]'),
 ('worry_sort',  'Sort what''s yours',     'anticipatory, control confusion, money, someone I love', 180, '[]'),
 ('worst_best_likely','Worst, best, likely','catastrophizing a specific event',          120, '[]'),
 ('postpone_worry','Postpone the worry',   'late-night rumination, checking loops',      60,  '[]'),
 ('self_compassion','A kinder voice',      'self-criticism, shame',                      120, '[]'),
 ('muscle_release','Release tension',      'physical tension',                           180, '[]'),
 ('physical_reset','Physical reset',       'stuck arousal (cold water, movement)',       60,  '[]'),
 ('next_smallest_step','Next smallest step','overwhelm, avoidance',                      120, '[]'),
 ('body_scan',   'Body scan',              'late night, winding down',                   180, '[]'),
 ('sleep_wind_down','Wind down',           'late-night loop ending',                     180, '[]'),
 ('check_in',    'Check in',               'safety step (elevated mode)',                60,  '[]'),
 ('physical_notice','Physical symptoms notice','safety step (physical symptoms)',        15,  '[]');
