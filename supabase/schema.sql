-- =====================================================================
-- Aeris pilot schema, version 2 (2026-10-31)
--
-- Scope: the discovery pilot in docs/05. It stores only structured,
-- non-narrative data on the server. Free text (worries, notes, anything
-- the user types) stays on the user's device in the pilot.
--
-- Security model (see docs/08 for the full role x object x operation matrix):
--   * Nothing is reachable through the Data API unless granted below.
--     This matches Supabase's 2026 default ("tables not exposed
--     automatically") and also undoes the older default that exposed
--     every public table to anon and authenticated.
--   * Users get column-level grants only, never table-wide UPDATE, so a
--     user cannot write server-owned columns such as arm or safety_route.
--   * Child rows reference (session_id, user_id) together, so a child
--     row can only point at a session owned by the same user. Foreign
--     key checks bypass row level security, so ownership must be part
--     of the key itself.
--   * Privileged functions live in the app_private schema, which the
--     Data API does not expose, and only service_role may run them.
--     Postgres lets PUBLIC execute every new function by default; that
--     default is revoked below, per Supabase's database-functions guide.
--   * Consent records are append-only for users: insert and read, never
--     update or delete.
--   * AI quota and spend are reserved atomically before any model call.
--
-- Revised 2026-10-31 after red-team review: enrolment by invite only;
-- sessions require recorded consent and a country; inactive (unreviewed)
-- exercises cannot be logged; reviewer sign-off must be real; AI budget
-- is enforced at reservation and settles may exceed estimates; classifier
-- and generator calls have separate limits; Illinois participants are
-- held on the scripted arm; a global kill switch exists.
-- Revised again after the third review (docs/03 Part F): approval cannot pass
-- through a NULL and is tied to the content version; consent must be to the
-- version in force; region must match country and is required where it
-- matters; deleted accounts leave only monthly counts, never event rows.
--
-- Tested by supabase/tests/run_security_tests.py (run: npm run test:db),
-- with a mutation check (npm run test:db:mutations).
-- =====================================================================

-- gen_random_uuid() is built into PostgreSQL 13+, so no extension is installed.
-- (Installing pgcrypto into public would expose ~35 functions to every caller.)

-- ---------------------------------------------------------------------
-- 0. Default privileges: deny by default, grant explicitly below.
-- ---------------------------------------------------------------------
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to service_role;

-- ---------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------
create type public.app_situation as enum ('work_tomorrow', 'work_replay', 'work_too_much', 'work_other',
  -- Stages 1-4 wedge: a difficult conversation ahead (docs/04, docs/06 section 3)
  'conv_feedback', 'conv_ask', 'conv_criticism', 'conv_say_no', 'conv_other');
create type public.app_arm as enum ('scripted', 'ai');

-- ---------------------------------------------------------------------
-- 2. Server-only tables (app_private)
-- ---------------------------------------------------------------------

-- Crossover assignment: each participant uses one arm for period_days,
-- then the other. Written only by the signup trigger.
-- Invite list: only these email addresses are enrolled at signup.
create table app_private.invites (
  email      text primary key check (email = lower(email) and position('@' in email) > 1),
  invited_at timestamptz not null default now()
);

create table app_private.assignments (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  first_arm    public.app_arm not null,
  arm_override public.app_arm,   -- set by the region rule (Illinois -> scripted)
  period_days smallint not null default 14 check (period_days between 1 and 60),
  enrolled_at timestamptz not null default now()
);

-- Operational settings, one row.
create table app_private.settings (
  id                             boolean primary key default true check (id),
  per_user_daily_generate_calls  int not null default 12  check (per_user_daily_generate_calls between 0 and 1000),
  per_user_daily_classify_calls  int not null default 300 check (per_user_daily_classify_calls between 0 and 10000),
  daily_generate_budget_usd      numeric(12,6) not null default 5.00 check (daily_generate_budget_usd >= 0),
  daily_classify_budget_usd      numeric(12,6) not null default 5.00 check (daily_classify_budget_usd >= 0),
  max_single_call_usd            numeric(12,6) not null default 0.25 check (max_single_call_usd > 0),
  -- Kill switch read by every server function: when true, the controller is
  -- run with globalRestricted and no generated text is shown to anyone.
  global_restricted              boolean not null default false,
  -- The AI arm is OFF until Stage 5 is explicitly started (docs/04). While off,
  -- everyone is on the scripted arm whatever their random assignment.
  ai_arm_enabled                 boolean not null default false,
  -- Countries where a region (state) changes the rules, so it is required before a session.
  region_required_countries      text[] not null default '{US}'
);

-- The consent document versions currently in force. Raising a version here
-- blocks new sessions until each participant consents to the new text.
create table app_private.required_consents (
  consent_type text primary key check (consent_type in ('terms', 'privacy', 'pilot_participation', 'age_18_plus')),
  version      text not null check (char_length(version) between 1 and 32)
);
insert into app_private.required_consents values
  ('terms', '2026-11-01'), ('privacy', '2026-11-01'), ('pilot_participation', '2026-11-01'), ('age_18_plus', '2026-11-01');
insert into app_private.settings default values;

-- Daily AI budget ledger, one row per day and call kind. The cap is enforced
-- when reserving. Settling records the REAL cost even if it exceeds the cap,
-- so the ledger never under-reports spend; new reservations are then refused.
create table app_private.daily_budget (
  day          date not null,
  kind         text not null check (kind in ('classify', 'generate')),
  cap_usd      numeric(12,6) not null,
  reserved_usd numeric(12,6) not null default 0 check (reserved_usd >= 0),
  spent_usd    numeric(12,6) not null default 0 check (spent_usd >= 0),
  primary key (day, kind)
);

create table app_private.ai_reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  day         date not null,
  kind        text not null check (kind in ('classify', 'generate')),
  est_usd     numeric(12,6) not null check (est_usd > 0),
  actual_usd  numeric(12,6) check (actual_usd >= 0),
  status      text not null default 'reserved' check (status in ('reserved', 'settled', 'released', 'expired')),
  created_at  timestamptz not null default now(),
  settled_at  timestamptz
);
create index on app_private.ai_reservations (user_id, day, kind);

-- Safety events: no text, no hash of text. user_id is kept only so a
-- reviewer can follow the duty-of-care protocol in docs/07. When an account
-- is deleted its events are folded into monthly counts by route and the rows
-- are deleted. A row with only user_id removed is NOT anonymous: its timestamp,
-- arm and route can be linked back in a 55-person pilot.
create table app_private.safety_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  route       text not null check (char_length(route) <= 40),
  categories  text[] not null default '{}',
  source      text not null check (source in ('keyword', 'classifier', 'classifier_failure', 'model_escalate', 'user_report')),
  arm         public.app_arm,
  reviewed_at timestamptz
);

-- What remains of deleted accounts' safety events: counts per month and route only.
create table app_private.safety_event_counts (
  month date not null,
  route text not null check (char_length(route) <= 40),
  n     int  not null check (n > 0),
  primary key (month, route)
);

-- Proof that deletions were honoured. Deliberately holds no identifier.
create table app_private.deletion_log (
  id           uuid primary key default gen_random_uuid(),
  requested_at timestamptz not null,
  completed_at timestamptz not null default now()
);

grant select, insert, update, delete on all tables in schema app_private to service_role;

-- ---------------------------------------------------------------------
-- 3. User-facing tables (public)
-- ---------------------------------------------------------------------

-- The exercise library. Inactive until a qualified reviewer signs off.
create table public.exercises (
  id           text primary key check (id ~ '^[a-z0-9_]{3,40}$'),
  name         text not null check (char_length(name) <= 60),
  duration_sec int  not null check (duration_sec between 30 and 600),
  version      int  not null default 1 check (version >= 1),   -- bump whenever the script text changes
  reviewed_by  text,
  reviewed_at  date,
  reviewed_version int,                                      -- the version the reviewer actually approved
  is_active    boolean not null default false,
  -- A CHECK passes when its expression is NULL, so every part is wrapped in
  -- coalesce(..., false): a missing date or version can never count as approval.
  check (not is_active or coalesce(char_length(btrim(reviewed_by)) >= 3
                                   and reviewed_at >= date '2026-01-01'
                                   and reviewed_version = version, false))
);
insert into public.exercises (id, name, duration_sec) values
  ('long_exhale_breathing', 'Long-exhale breathing', 120),
  ('grounding_54321',       'Grounding 5-4-3-2-1',   120),
  ('sort_and_step',         'Sort it, then one step', 180),
  ('conversation_reset',    'Three-minute reset before a difficult conversation', 180);

create table public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  country_code char(2) check (country_code ~ '^[A-Z]{2}$'),            -- required before a session; no default, so crisis lines are never guessed
  region       text check (region ~ '^[A-Z]{2}-[A-Z0-9]{1,3}$'),       -- ISO 3166-2, e.g. US-IL; self-reported, not verified location
  timezone     text not null default 'UTC' check (char_length(timezone) <= 64),
  created_at   timestamptz not null default now(),
  check (region is null or left(region, 2) = country_code)          -- region must belong to the chosen country
);

create table public.consents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  consent_type  text not null check (consent_type in ('terms', 'privacy', 'pilot_participation', 'age_18_plus', 'research_contact')),
  version       text not null check (char_length(version) between 1 and 32),
  granted       boolean not null,
  recorded_at   timestamptz not null default now()
);
create index on public.consents (user_id, consent_type, recorded_at desc);

create table public.sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  arm            public.app_arm not null,
  situation      public.app_situation not null,
  tension_before smallint check (tension_before between 0 and 10),   -- optional; there is no after-score (docs/06 section B3)
  completed      boolean not null default false,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  safety_route   text check (char_length(safety_route) <= 40),
  unique (id, user_id)
);
create index on public.sessions (user_id, started_at desc);

create table public.exercise_runs (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null,
  user_id     uuid not null default auth.uid(),
  exercise_id text not null references public.exercises(id),
  position    smallint not null check (position between 1 and 5),
  started_at  timestamptz not null default now(),
  completed   boolean not null default false,
  foreign key (session_id, user_id) references public.sessions(id, user_id) on delete cascade
);

create table public.feedback (
  session_id      uuid primary key,
  user_id         uuid not null default auth.uid(),
  helpful         smallint check (helpful between 1 and 5),
  would_use_again boolean,
  check (helpful is not null or would_use_again is not null),
  created_at      timestamptz not null default now(),
  foreign key (session_id, user_id) references public.sessions(id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- 4. Explicit grants. Anything not listed here is denied.
-- ---------------------------------------------------------------------
revoke all on public.exercises, public.profiles, public.consents, public.sessions,
              public.exercise_runs, public.feedback from anon, authenticated;

grant select on public.exercises to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (country_code, region, timezone) on public.profiles to authenticated;

grant select on public.consents to authenticated;
grant insert (consent_type, version, granted) on public.consents to authenticated;

grant select on public.sessions to authenticated;
grant insert (situation, tension_before) on public.sessions to authenticated;
grant update (completed) on public.sessions to authenticated;

grant select on public.exercise_runs to authenticated;
grant insert (session_id, exercise_id, position) on public.exercise_runs to authenticated;
grant update (completed) on public.exercise_runs to authenticated;

grant select on public.feedback to authenticated;
grant insert (session_id, helpful, would_use_again) on public.feedback to authenticated;

grant select, insert, update, delete on public.exercises, public.profiles, public.consents,
      public.sessions, public.exercise_runs, public.feedback to service_role;

-- ---------------------------------------------------------------------
-- 5. Row level security
-- ---------------------------------------------------------------------
alter table public.exercises     enable row level security;
alter table public.profiles      enable row level security;
alter table public.consents      enable row level security;
alter table public.sessions      enable row level security;
alter table public.exercise_runs enable row level security;
alter table public.feedback      enable row level security;

create policy exercises_read on public.exercises for select to anon, authenticated using (is_active);

create policy profiles_read   on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy consents_read   on public.consents for select to authenticated using (user_id = auth.uid());
create policy consents_insert on public.consents for insert to authenticated with check (user_id = auth.uid());

create policy sessions_read   on public.sessions for select to authenticated using (user_id = auth.uid());
create policy sessions_insert on public.sessions for insert to authenticated with check (user_id = auth.uid());
create policy sessions_update on public.sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy runs_read   on public.exercise_runs for select to authenticated using (user_id = auth.uid());
create policy runs_insert on public.exercise_runs for insert to authenticated with check (user_id = auth.uid());
create policy runs_update on public.exercise_runs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy feedback_read   on public.feedback for select to authenticated using (user_id = auth.uid());
create policy feedback_insert on public.feedback for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. Functions. All privileged logic is in app_private, service_role only.
-- ---------------------------------------------------------------------

create function app_private.current_arm(p_user uuid) returns public.app_arm
language sql stable security definer set search_path = '' as $$
  select case
    when a.user_id is null then null
    when not (select st.ai_arm_enabled from app_private.settings st) then 'scripted'::public.app_arm
    when a.arm_override is not null then a.arm_override
    when now() < a.enrolled_at + make_interval(days => a.period_days) then a.first_arm
    when a.first_arm = 'scripted' then 'ai'::public.app_arm
    else 'scripted'::public.app_arm
  end
  from app_private.assignments a where a.user_id = p_user;
$$;

-- Signup: always create a profile; enrol (assign an arm) ONLY if invited.
-- Uninvited accounts can exist but cannot start sessions (my_arm is null).
create function app_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id);
  if exists (select 1 from app_private.invites i where i.email = lower(new.email)) then
    insert into app_private.assignments (user_id, first_arm)
      values (new.id, case when random() < 0.5 then 'scripted'::public.app_arm else 'ai'::public.app_arm end);
  end if;
  return new;
end; $$;

-- Region rule: participants in Illinois stay on the scripted arm (docs/10 section 3).
create function app_private.profiles_region_rule() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update app_private.assignments
     set arm_override = case when new.region = 'US-IL' then 'scripted'::public.app_arm else null end
   where user_id = new.user_id;
  return new;
end; $$;
create trigger profiles_region_rule after insert or update of region on public.profiles
  for each row execute function app_private.profiles_region_rule();

-- True only if the user's LATEST answer to each required consent is 'granted'
-- AND was given to the version currently in force.
create function app_private.has_required_consents(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select count(*) = (select count(*) from app_private.required_consents) from (
    select distinct on (c.consent_type) c.consent_type, c.granted, c.version
    from public.consents c
    where c.user_id = p_user and c.consent_type in (select consent_type from app_private.required_consents)
    order by c.consent_type, c.recorded_at desc, c.id desc
  ) latest
  join app_private.required_consents r on r.consent_type = latest.consent_type
  where latest.granted and latest.version = r.version;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- Session insert: the server decides the arm and the timestamps.
create function app_private.sessions_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.arm := app_private.current_arm(new.user_id);
  if new.arm is null then raise exception 'user is not enrolled in the pilot'; end if;
  if not app_private.has_required_consents(new.user_id) then raise exception 'required consent missing or withdrawn'; end if;
  if (select p.country_code from public.profiles p where p.user_id = new.user_id) is null then
    raise exception 'country required before a session (it sets the crisis lines)';
  end if;
  if exists (select 1 from public.profiles p, app_private.settings st
             where p.user_id = new.user_id and p.region is null and p.country_code = any (st.region_required_countries)) then
    raise exception 'region required before a session in this country (it changes the rules, e.g. Illinois)';
  end if;
  new.started_at := now();
  new.completed_at := null;
  new.safety_route := null;
  return new;
end; $$;
create trigger sessions_before_insert before insert on public.sessions
  for each row execute function app_private.sessions_before_insert();

-- Session update: completion time is set by the server, once.
create function app_private.sessions_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.completed and not old.completed then new.completed_at := now(); end if;
  if old.completed and not new.completed then raise exception 'a completed session cannot be reopened'; end if;
  return new;
end; $$;
create trigger sessions_before_update before update on public.sessions
  for each row execute function app_private.sessions_before_update();

-- Exercise runs: only reviewed, active exercises may be logged.
create function app_private.runs_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.exercises e where e.id = new.exercise_id and e.is_active) then
    raise exception 'exercise % is not active (no reviewer sign-off)', new.exercise_id;
  end if;
  new.started_at := now();
  return new;
end; $$;
create trigger runs_before_insert before insert on public.exercise_runs
  for each row execute function app_private.runs_before_insert();

-- Changing an exercise's content version withdraws approval until it is reviewed again.
create function app_private.exercises_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.version <> old.version and new.reviewed_version is distinct from new.version then
    new.is_active := false;
  end if;
  return new;
end; $$;
create trigger exercises_before_update before update on public.exercises
  for each row execute function app_private.exercises_before_update();

-- Account deletion: fold the user's safety events into monthly counts, then delete them.
create function app_private.fold_safety_events() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into app_private.safety_event_counts (month, route, n)
    select date_trunc('month', e.occurred_at)::date, e.route, count(*)
    from app_private.safety_events e where e.user_id = old.id group by 1, 2
  on conflict (month, route) do update set n = app_private.safety_event_counts.n + excluded.n;
  delete from app_private.safety_events where user_id = old.id;
  return old;
end; $$;
create trigger fold_safety_events before delete on auth.users
  for each row execute function app_private.fold_safety_events();

-- The one function users may call: their own current arm. No parameters.
create function public.my_arm() returns public.app_arm
language sql stable security definer set search_path = '' as $$
  select app_private.current_arm(auth.uid());
$$;

-- Reserve AI quota and budget BEFORE calling a model. Returns null when the
-- user's daily limit or that kind's daily budget would be exceeded. The
-- FOR UPDATE lock on the day's budget row serializes concurrent reservations.
-- Do not hold this transaction open during the model call: reserve, commit,
-- call the model, then settle (real cost) or release (model never called).
-- Classifier calls have their own, larger limits so that a busy generator
-- budget never stops safety screening.
create function app_private.reserve_ai_call(p_user uuid, p_kind text, p_est_usd numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_s app_private.settings%rowtype;
  v_b app_private.daily_budget%rowtype;
  v_used int;
  v_limit int;
  v_cap numeric;
  v_id uuid;
begin
  select * into v_s from app_private.settings;
  if p_user is null or p_kind not in ('classify', 'generate') or p_est_usd is null
     or p_est_usd <= 0 or p_est_usd > v_s.max_single_call_usd then
    raise exception 'invalid reservation request';
  end if;
  v_cap   := case p_kind when 'classify' then v_s.daily_classify_budget_usd else v_s.daily_generate_budget_usd end;
  v_limit := case p_kind when 'classify' then v_s.per_user_daily_classify_calls else v_s.per_user_daily_generate_calls end;
  insert into app_private.daily_budget (day, kind, cap_usd) values (v_day, p_kind, v_cap) on conflict (day, kind) do nothing;
  select * into v_b from app_private.daily_budget where day = v_day and kind = p_kind for update;
  select count(*) into v_used from app_private.ai_reservations
    where user_id = p_user and day = v_day and kind = p_kind and status <> 'released';
  if v_used >= v_limit then return null; end if;
  if v_b.reserved_usd + v_b.spent_usd + p_est_usd > v_b.cap_usd then return null; end if;
  update app_private.daily_budget set reserved_usd = reserved_usd + p_est_usd where day = v_day and kind = p_kind;
  insert into app_private.ai_reservations (user_id, day, kind, est_usd) values (p_user, v_day, p_kind, p_est_usd)
    returning id into v_id;
  return v_id;
end; $$;

-- Settle with the REAL cost, even if above the estimate or the cap. Idempotent.
create function app_private.settle_ai_call(p_id uuid, p_actual_usd numeric) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_r app_private.ai_reservations%rowtype;
begin
  if p_actual_usd is null or p_actual_usd < 0 then raise exception 'invalid cost'; end if;
  select * into v_r from app_private.ai_reservations where id = p_id for update;
  if not found or v_r.status <> 'reserved' then return false; end if;
  perform 1 from app_private.daily_budget where day = v_r.day and kind = v_r.kind for update;
  update app_private.daily_budget
     set reserved_usd = greatest(0, reserved_usd - v_r.est_usd), spent_usd = spent_usd + p_actual_usd
   where day = v_r.day and kind = v_r.kind;
  update app_private.ai_reservations set status = 'settled', actual_usd = p_actual_usd, settled_at = now() where id = p_id;
  return true;
end; $$;

-- Release only when the model was NEVER called. Idempotent.
create function app_private.release_ai_call(p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_r app_private.ai_reservations%rowtype;
begin
  select * into v_r from app_private.ai_reservations where id = p_id for update;
  if not found or v_r.status <> 'reserved' then return false; end if;
  perform 1 from app_private.daily_budget where day = v_r.day and kind = v_r.kind for update;
  update app_private.daily_budget set reserved_usd = greatest(0, reserved_usd - v_r.est_usd) where day = v_r.day and kind = v_r.kind;
  update app_private.ai_reservations set status = 'released', settled_at = now() where id = p_id;
  return true;
end; $$;

-- Reservations left open by a crashed call are charged at their estimate,
-- because the model may have run. Run every few minutes from a scheduler.
create function app_private.expire_stale_reservations(p_older_than interval default '10 minutes') returns int
language plpgsql security definer set search_path = '' as $$
declare v_r record; v_n int := 0;
begin
  for v_r in select id from app_private.ai_reservations
             where status = 'reserved' and created_at < now() - p_older_than for update skip locked loop
    perform app_private.settle_ai_call(v_r.id, (select est_usd from app_private.ai_reservations where id = v_r.id));
    update app_private.ai_reservations set status = 'expired' where id = v_r.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end; $$;

-- Pilot metrics for the private admin page (server-side only).
create function app_private.pilot_metrics(p_since date default (now() - interval '30 days')::date)
returns table (day date, arm public.app_arm, sessions bigint, completed bigint, participants bigint)
language sql stable security definer set search_path = '' as $$
  select s.started_at::date, s.arm, count(*), count(*) filter (where s.completed), count(distinct s.user_id)
  from public.sessions s where s.started_at >= p_since group by 1, 2 order by 1, 2;
$$;

-- Safety summary for the reviewer and any report: counts per month and route,
-- live and folded together. Cells below p_min_cell are suppressed (null), because
-- small counts in a 55-person pilot can identify a person.
create function app_private.safety_summary(p_min_cell int default 5)
returns table (month date, route text, n bigint)
language sql stable security definer set search_path = '' as $$
  select m, r, case when sum(c) >= p_min_cell then sum(c) end
  from (
    select date_trunc('month', occurred_at)::date as m, route as r, count(*) as c from app_private.safety_events group by 1, 2
    union all
    select month, route, n from app_private.safety_event_counts
  ) x group by m, r order by m, r;
$$;

-- Execute rights: explicit and minimal.
revoke execute on all functions in schema app_private from public, anon, authenticated;
grant execute on all functions in schema app_private to service_role;
revoke execute on function public.my_arm() from public, anon;
grant execute on function public.my_arm() to authenticated, service_role;
