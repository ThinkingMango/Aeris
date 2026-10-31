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
-- Tested by supabase/tests/security_test.sql and
-- supabase/tests/concurrency_test.sh (run: supabase/tests/run_local.sh).
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
create type public.app_situation as enum ('work_tomorrow', 'work_replay', 'work_too_much', 'work_other');
create type public.app_arm as enum ('scripted', 'ai');

-- ---------------------------------------------------------------------
-- 2. Server-only tables (app_private)
-- ---------------------------------------------------------------------

-- Crossover assignment: each participant uses one arm for period_days,
-- then the other. Written only by the signup trigger.
create table app_private.assignments (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  first_arm   public.app_arm not null,
  period_days smallint not null default 14 check (period_days between 1 and 60),
  enrolled_at timestamptz not null default now()
);

-- Operational settings, one row.
create table app_private.settings (
  id                     boolean primary key default true check (id),
  per_user_daily_ai_calls int     not null default 12 check (per_user_daily_ai_calls between 0 and 100),
  daily_budget_usd       numeric(10,4) not null default 5.00 check (daily_budget_usd >= 0),
  max_single_call_usd    numeric(10,4) not null default 0.25 check (max_single_call_usd > 0)
);
insert into app_private.settings default values;

-- Global daily AI budget ledger. reserved + spent may never exceed cap.
create table app_private.daily_budget (
  day          date primary key,
  cap_usd      numeric(10,4) not null,
  reserved_usd numeric(10,4) not null default 0 check (reserved_usd >= 0),
  spent_usd    numeric(10,4) not null default 0 check (spent_usd >= 0),
  check (reserved_usd + spent_usd <= cap_usd + 0.0001)
);

create table app_private.ai_reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  day         date not null,
  est_usd     numeric(10,4) not null check (est_usd > 0),
  actual_usd  numeric(10,4) check (actual_usd >= 0),
  status      text not null default 'reserved' check (status in ('reserved', 'settled', 'released', 'expired')),
  created_at  timestamptz not null default now(),
  settled_at  timestamptz
);
create index on app_private.ai_reservations (user_id, day);

-- Safety events: no text, no hash of text. user_id is kept only so a
-- reviewer can follow the duty-of-care protocol in docs/07; it becomes
-- null when the account is deleted, leaving an anonymous count.
create table app_private.safety_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  route       text not null check (char_length(route) <= 40),
  categories  text[] not null default '{}',
  source      text not null check (source in ('keyword', 'classifier', 'classifier_failure', 'model_escalate', 'user_report')),
  arm         public.app_arm,
  reviewed_at timestamptz
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
  version      int  not null default 1,
  reviewed_by  text,
  reviewed_at  date,
  is_active    boolean not null default false,
  check (not is_active or (reviewed_by is not null and reviewed_at is not null))
);
insert into public.exercises (id, name, duration_sec) values
  ('long_exhale_breathing', 'Long-exhale breathing', 120),
  ('grounding_54321',       'Grounding 5-4-3-2-1',   120),
  ('sort_and_step',         'Sort it, then one step', 180);

create table public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  country_code char(2) not null default 'US' check (country_code ~ '^[A-Z]{2}$'),
  timezone     text not null default 'UTC' check (char_length(timezone) <= 64),
  created_at   timestamptz not null default now()
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
  tension_before smallint check (tension_before between 0 and 10),
  tension_after  smallint check (tension_after between 0 and 10),
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
  helpful         smallint not null check (helpful between 1 and 5),
  would_use_again boolean,
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
grant update (country_code, timezone) on public.profiles to authenticated;

grant select on public.consents to authenticated;
grant insert (consent_type, version, granted) on public.consents to authenticated;

grant select on public.sessions to authenticated;
grant insert (situation, tension_before) on public.sessions to authenticated;
grant update (tension_after, completed) on public.sessions to authenticated;

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
    when now() < a.enrolled_at + make_interval(days => a.period_days) then a.first_arm
    when a.first_arm = 'scripted' then 'ai'::public.app_arm
    else 'scripted'::public.app_arm
  end
  from app_private.assignments a where a.user_id = p_user;
$$;

-- Signup: create the profile and a random crossover order.
create function app_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id);
  insert into app_private.assignments (user_id, first_arm)
    values (new.id, case when random() < 0.5 then 'scripted'::public.app_arm else 'ai'::public.app_arm end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- Session insert: the server decides the arm and the timestamps.
create function app_private.sessions_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.arm := app_private.current_arm(new.user_id);
  if new.arm is null then raise exception 'user is not enrolled in the pilot'; end if;
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

-- The one function users may call: their own current arm. No parameters.
create function public.my_arm() returns public.app_arm
language sql stable security definer set search_path = '' as $$
  select app_private.current_arm(auth.uid());
$$;

-- Reserve AI quota and budget BEFORE calling a model. Returns null when
-- the user's daily limit or the global daily budget would be exceeded.
-- The FOR UPDATE lock on the day's budget row serializes concurrent
-- reservations, so N parallel requests cannot all pass a stale check.
-- Do not hold this transaction open during the model call: reserve,
-- commit, call the model, then settle or release.
create function app_private.reserve_ai_call(p_user uuid, p_est_usd numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_settings app_private.settings%rowtype;
  v_budget app_private.daily_budget%rowtype;
  v_used int;
  v_id uuid;
begin
  select * into v_settings from app_private.settings;
  if p_user is null or p_est_usd is null or p_est_usd <= 0 or p_est_usd > v_settings.max_single_call_usd then
    raise exception 'invalid reservation request';
  end if;
  insert into app_private.daily_budget (day, cap_usd) values (v_day, v_settings.daily_budget_usd)
    on conflict (day) do nothing;
  select * into v_budget from app_private.daily_budget where day = v_day for update;
  select count(*) into v_used from app_private.ai_reservations
    where user_id = p_user and day = v_day and status <> 'released';
  if v_used >= v_settings.per_user_daily_ai_calls then return null; end if;
  if v_budget.reserved_usd + v_budget.spent_usd + p_est_usd > v_budget.cap_usd then return null; end if;
  update app_private.daily_budget set reserved_usd = reserved_usd + p_est_usd where day = v_day;
  insert into app_private.ai_reservations (user_id, day, est_usd) values (p_user, v_day, p_est_usd)
    returning id into v_id;
  return v_id;
end; $$;

-- Settle with the real cost. Idempotent: a second call does nothing.
create function app_private.settle_ai_call(p_id uuid, p_actual_usd numeric) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_r app_private.ai_reservations%rowtype;
begin
  if p_actual_usd is null or p_actual_usd < 0 then raise exception 'invalid cost'; end if;
  select * into v_r from app_private.ai_reservations where id = p_id for update;
  if not found or v_r.status <> 'reserved' then return false; end if;
  perform 1 from app_private.daily_budget where day = v_r.day for update;
  update app_private.daily_budget
     set reserved_usd = greatest(0, reserved_usd - v_r.est_usd), spent_usd = spent_usd + p_actual_usd
   where day = v_r.day;
  update app_private.ai_reservations set status = 'settled', actual_usd = p_actual_usd, settled_at = now() where id = p_id;
  return true;
end; $$;

-- Release when the model was never called. Idempotent.
create function app_private.release_ai_call(p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_r app_private.ai_reservations%rowtype;
begin
  select * into v_r from app_private.ai_reservations where id = p_id for update;
  if not found or v_r.status <> 'reserved' then return false; end if;
  perform 1 from app_private.daily_budget where day = v_r.day for update;
  update app_private.daily_budget set reserved_usd = greatest(0, reserved_usd - v_r.est_usd) where day = v_r.day;
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

-- Execute rights: explicit and minimal.
revoke execute on all functions in schema app_private from public, anon, authenticated;
grant execute on all functions in schema app_private to service_role;
revoke execute on function public.my_arm() from public, anon;
grant execute on function public.my_arm() to authenticated, service_role;
