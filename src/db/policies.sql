-- ===========================================================================
-- Aeris row-level security.
--
-- Deliberately NOT a Drizzle migration. Drizzle owns the shape of the
-- database; this file owns who can see what. Keeping them apart means this
-- can be re-read as a single statement of the security model and re-applied
-- after any schema change, and it is written to be idempotent so re-applying
-- is always safe.
--
-- Apply with `npm run db:policies`, or paste into the Supabase SQL editor.
--
-- ---------------------------------------------------------------------------
-- The two boundaries, and which one this is
--
-- The browser reaches Postgres through Supabase with an anon key, as the
-- `authenticated` role. Everything it can do is decided here, and `auth.uid()`
-- is the whole of it.
--
-- The application server reaches Postgres directly, as the owning role, which
-- bypasses RLS by design — it has to, because it writes safety events and
-- billing rows that no user may touch. Its boundary is the `userId` argument
-- that every repository method demands and every statement filters on.
--
-- Two boundaries, not one, and they are meant to agree. If they ever disagree
-- the stricter one wins, which is why the server-side filters are not
-- redundant with these policies.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles mirror auth.users, and are created with them.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_auth_users_fk'
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fk
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end
$$;

-- `security definer` because the trigger runs as the signing-up user, who has
-- no rights on public.profiles yet. `search_path = ''` is why every name below
-- is schema-qualified: an empty search path is what stops a hostile object in
-- another schema being resolved ahead of the intended one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. RLS on, everywhere, with no exceptions.
--
-- Enabled on every table including the ones with no policies at all. A table
-- with RLS on and no policy denies everything to everyone except the owner,
-- which is exactly what a server-only table should do.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'preferences', 'consents',
    'sessions', 'session_events', 'messages', 'session_summaries',
    'urges', 'session_patterns', 'user_patterns', 'intervention_runs',
    'interventions', 'subscriptions', 'usage_counters',
    'safety_events', 'safety_metrics', 'billing_events', 'deleted_accounts',
    'orgs', 'org_members', 'practitioner_links'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Server-only tables: no policies, and no grants either.
--
-- RLS alone would be enough, but a revoked grant fails earlier and louder, and
-- survives somebody later adding a policy without thinking about it.
--
-- `orgs`, `org_members` and `practitioner_links` are here because Teams and
-- practitioner sharing are not built. A table nobody has designed the access
-- rules for gets no access, rather than a placeholder policy that quietly
-- becomes the real one.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'safety_events', 'safety_metrics', 'billing_events', 'deleted_accounts',
    'orgs', 'org_members', 'practitioner_links'
  ]
  loop
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 4. The person's own rows.
--
-- `(select auth.uid())` rather than a bare `auth.uid()` on purpose: wrapping it
-- in a subquery lets Postgres evaluate it once per statement instead of once
-- per row, which is the difference between a scan and an index lookup on a
-- table with any history in it.
-- ---------------------------------------------------------------------------

-- profiles: keyed on `id`, not `user_id`.
drop policy if exists "profiles are private" on public.profiles;
create policy "profiles are private" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

do $$
declare
  t text;
begin
  -- Tables a person may read and write freely, because every row in them is
  -- something they said or did.
  foreach t in array array[
    'preferences', 'sessions', 'session_events', 'messages',
    'session_summaries', 'urges', 'session_patterns', 'user_patterns',
    'intervention_runs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || ' are private', t);
    execute format($f$
      create policy %I on public.%I
        for all to authenticated
        using (user_id = (select auth.uid()))
        with check (user_id = (select auth.uid()))
    $f$, t || ' are private', t);
  end loop;

  -- Tables a person may read but never write: what they are entitled to and
  -- how much they have used are facts the server establishes, not claims the
  -- browser gets to make.
  foreach t in array array['subscriptions', 'usage_counters']
  loop
    execute format('drop policy if exists %I on public.%I', t || ' are readable', t);
    execute format($f$
      create policy %I on public.%I
        for select to authenticated
        using (user_id = (select auth.uid()))
    $f$, t || ' are readable', t);
  end loop;
end
$$;

-- `consents` is append-only by design: a withdrawal is a new row, never an
-- edit, so the record of what someone agreed to and when cannot be rewritten.
drop policy if exists "consents are readable" on public.consents;
create policy "consents are readable" on public.consents
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "consents are appendable" on public.consents;
create policy "consents are appendable" on public.consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- The exercise catalog is the same for everybody and contains nothing personal.
drop policy if exists "catalog is readable" on public.interventions;
create policy "catalog is readable" on public.interventions
  for select to authenticated, anon
  using (active);

-- ---------------------------------------------------------------------------
-- 5. Indexes that RLS makes load-bearing.
--
-- Every policy above filters on `user_id`. Without an index on it, each policy
-- check is a sequential scan, and the cost lands on the person with the most
-- history — the one who has been paying the longest.
-- ---------------------------------------------------------------------------

create index if not exists messages_user_idx on public.messages (user_id);
create index if not exists session_events_user_idx on public.session_events (user_id);
create index if not exists session_summaries_user_idx on public.session_summaries (user_id);
create index if not exists session_patterns_user_idx on public.session_patterns (user_id);
create index if not exists consents_user_idx on public.consents (user_id);
