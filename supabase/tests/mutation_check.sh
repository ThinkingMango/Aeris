#!/usr/bin/env bash
# Proves the security tests are not vacuous: re-introduces each hole from the
# October 2026 review into a copy of the schema and checks that the suite fails.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ORIG="$HERE/../schema.sql"
BACKUP="$(mktemp)"; cp "$ORIG" "$BACKUP"
trap 'cp "$BACKUP" "$ORIG"; rm -f "$BACKUP"' EXIT
mutate() {
  local name="$1" find="$2" replace="$3"
  cp "$BACKUP" "$ORIG"
  python3 - "$ORIG" "$find" "$replace" <<'PY'
import sys, pathlib
p, f, r = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
t = p.read_text(); assert f in t, f"mutation anchor not found: {f}"; p.write_text(t.replace(f, r, 1))
PY
  if bash "$HERE/run_local.sh" >/tmp/mut.log 2>&1; then echo "NOT CAUGHT  $name"; else echo "caught      $name  ($(grep -c '^FAIL' /tmp/mut.log) failing checks)"; fi
}
mutate "table-wide UPDATE on sessions (v1 plan self-upgrade hole)" \
  "grant update (completed) on public.sessions to authenticated;" \
  "grant update on public.sessions to authenticated;"
mutate "child rows not tied to parent owner (v1 cross-owner hole)" \
  "  foreign key (session_id, user_id) references public.sessions(id, user_id) on delete cascade
);

create table public.feedback" \
  "  foreign key (session_id) references public.sessions(id) on delete cascade
);

create table public.feedback"
mutate "privileged functions executable by everyone (v1 RPC hole)" \
  "revoke execute on all functions in schema app_private from public, anon, authenticated;" \
  "grant usage on schema app_private to anon, authenticated; grant execute on all functions in schema app_private to anon, authenticated;"
mutate "consents editable by users (v1 audit-record hole)" \
  "grant insert (consent_type, version, granted) on public.consents to authenticated;" \
  "grant insert, update, delete on public.consents to authenticated; create policy consents_any on public.consents for all to authenticated using (user_id = auth.uid());"
mutate "sessions without a consent check (red-team A5)" \
  "  if not app_private.has_required_consents(new.user_id) then raise exception 'required consent missing or withdrawn'; end if;" \
  ""
mutate "unreviewed exercises loggable (red-team A4)" \
  "  if not exists (select 1 from public.exercises e where e.id = new.exercise_id and e.is_active) then" \
  "  if false then"
mutate "quota check without row lock (v1 race)" \
  "select * into v_b from app_private.daily_budget where day = v_day and kind = p_kind for update;" \
  "select * into v_b from app_private.daily_budget where day = v_day and kind = p_kind; perform pg_sleep(0.05);"
mutate "approval passes through a NULL date (third review)" \
  "  check (not is_active or coalesce(char_length(btrim(reviewed_by)) >= 3
                                   and reviewed_at >= date '2026-01-01'
                                   and reviewed_version = version, false))" \
  "  check (not is_active or (char_length(btrim(reviewed_by)) >= 3
                                   and reviewed_at >= date '2026-01-01'
                                   and reviewed_version = version))"
mutate "consent to an outdated document version accepted (third review)" \
  "  where latest.granted and latest.version = r.version;" \
  "  where latest.granted;"
mutate "deleted accounts leave linkable safety-event rows (third review)" \
  "  delete from app_private.safety_events where user_id = old.id;
  return old;" \
  "  update app_private.safety_events set user_id = null where user_id = old.id;
  return old;"
mutate "AI arm on by default before Stage 5 (third review)" \
  "  ai_arm_enabled                 boolean not null default false," \
  "  ai_arm_enabled                 boolean not null default true,"
