#!/usr/bin/env python3
"""
Security and correctness tests for supabase/schema.sql.

Runs every test twice: once with Supabase's old "expose everything" defaults
and once with the 2026 strict defaults. Each run loads the schema into a fresh
database, seeds two users (A and B), then checks:
  * legitimate actions succeed (P tests),
  * every attack from the October 2026 review fails (N tests),
  * the privilege catalogue grants nothing unexpected (C tests),
  * quota and budget reservations hold under concurrency (K tests),
  * account deletion removes personal rows (D tests).

Usage:  python3 supabase/tests/run_security_tests.py --host /tmp/sock --port 5432 --user postgres
Exit code 0 only if every test passes. See supabase/tests/run_local.sh.
"""
import argparse
import concurrent.futures as cf
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
SCHEMA = HERE.parent / "schema.sql"
A = "aaaaaaaa-0000-0000-0000-000000000001"
B = "bbbbbbbb-0000-0000-0000-000000000002"
B_SESSION = "bbbb0000-0000-0000-0000-00000000000b"


def psql(args, db, sql, role=None, uid=None, check=False):
    prefix = ""
    if role:
        prefix = f"set role {role}; select set_config('request.jwt.claim.sub', '{uid or ''}', false);\n"
    cmd = ["psql", "-h", args.host, "-p", str(args.port), "-U", args.user, "-d", db,
           "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-c", prefix + sql]
    r = subprocess.run(cmd, capture_output=True, text=True)
    out = r.stdout.splitlines()
    if role:
        out = out[1:]  # drop the set_config echo line (may be blank)
    if check and r.returncode != 0:
        raise RuntimeError(f"setup failed: {r.stderr.strip()}\nSQL: {sql[:200]}")
    return r.returncode, "\n".join(out).strip(), r.stderr.strip()


def psql_file(args, db, path):
    cmd = ["psql", "-h", args.host, "-p", str(args.port), "-U", args.user, "-d", db,
           "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", str(path)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"loading {path.name} failed: {r.stderr.strip()}")


# (id, description, role, uid, sql, expectation)
# expectation: ("ok",) | ("value", "x") | ("error", "substring")
TESTS = [
    # ---- legitimate use must work ----
    ("P01", "A starts a session; server assigns the arm", "authenticated", A,
     "insert into public.sessions (situation, tension_before) values ('work_tomorrow', 7) returning arm is not null;", ("value", "t")),
    ("P02", "A sees exactly A's one session", "authenticated", A, "select count(*) from public.sessions;", ("value", "1")),
    ("P03", "A logs an exercise on A's session", "authenticated", A,
     "insert into public.exercise_runs (session_id, exercise_id, position) select id, 'long_exhale_breathing', 1 from public.sessions limit 1;", ("ok",)),
    ("P04", "A completes A's session; server stamps the time", "authenticated", A,
     "update public.sessions set tension_after = 4, completed = true returning completed_at is not null;", ("value", "t")),
    ("P05", "A leaves feedback on A's session", "authenticated", A,
     "insert into public.feedback (session_id, helpful, would_use_again) select id, 4, true from public.sessions limit 1;", ("ok",)),
    ("P06", "A records a consent", "authenticated", A,
     "insert into public.consents (consent_type, version, granted) values ('pilot_participation', '2026-11-01', true);", ("ok",)),
    ("P07", "A sees only reviewed, active exercises", "authenticated", A, "select count(*) from public.exercises;", ("value", "3")),
    ("P08", "A can read A's own arm", "authenticated", A, "select public.my_arm() is not null;", ("value", "t")),
    ("P09", "A visitor can read the active exercise list", "anon", "", "select count(*) from public.exercises;", ("value", "3")),
    ("P10", "Server can reserve AI quota", "service_role", "", f"select app_private.reserve_ai_call('{A}', 0.02) is not null;", ("value", "t")),
    ("P11", "A updates A's own timezone", "authenticated", A,
     "with u as (update public.profiles set timezone = 'Europe/London' returning 1) select count(*) from u;", ("value", "1")),

    # ---- the review's attacks must fail ----
    ("N01", "A cannot read B's sessions", "authenticated", A, f"select count(*) from public.sessions where user_id = '{B}';", ("value", "0")),
    ("N02", "A cannot change A's assigned arm", "authenticated", A, "update public.sessions set arm = 'scripted';", ("error", "permission denied")),
    ("N03", "A cannot write the server's safety route", "authenticated", A, "update public.sessions set safety_route = 'none';", ("error", "permission denied")),
    ("N04", "A cannot create a session owned by B", "authenticated", A,
     f"insert into public.sessions (user_id, situation) values ('{B}', 'work_tomorrow');", ("error", "permission denied")),
    ("N05", "A cannot choose the arm on insert", "authenticated", A,
     "insert into public.sessions (situation, arm) values ('work_tomorrow', 'scripted');", ("error", "permission denied")),
    ("N06", "A cannot attach an exercise to B's session", "authenticated", A,
     f"insert into public.exercise_runs (session_id, exercise_id, position) values ('{B_SESSION}', 'grounding_54321', 1);", ("error", "violates foreign key")),
    ("N07", "A cannot set user_id on an exercise row", "authenticated", A,
     f"insert into public.exercise_runs (session_id, user_id, exercise_id, position) values ('{B_SESSION}', '{B}', 'grounding_54321', 1);", ("error", "permission denied")),
    ("N08", "A cannot leave feedback on B's session", "authenticated", A,
     f"insert into public.feedback (session_id, helpful) values ('{B_SESSION}', 1);", ("error", "violates foreign key")),
    ("N09", "A cannot edit a consent record", "authenticated", A, "update public.consents set granted = false;", ("error", "permission denied")),
    ("N10", "A cannot delete a consent record", "authenticated", A, "delete from public.consents;", ("error", "permission denied")),
    ("N11", "A cannot delete a session row", "authenticated", A, "delete from public.sessions;", ("error", "permission denied")),
    ("N12", "A cannot insert a profile", "authenticated", A, f"insert into public.profiles (user_id) values ('{B}');", ("error", "permission denied")),
    ("N13", "A cannot change B's profile", "authenticated", A,
     f"with u as (update public.profiles set timezone = 'X' where user_id = '{B}' returning 1) select count(*) from u;", ("value", "0")),
    ("N14", "A cannot call the quota function", "authenticated", A,
     f"select app_private.reserve_ai_call('{A}', 0.01);", ("error", "permission denied")),
    ("N15", "A cannot read safety events", "authenticated", A, "select count(*) from app_private.safety_events;", ("error", "permission denied")),
    ("N16", "A cannot read B's arm through the private helper", "authenticated", A,
     f"select app_private.current_arm('{B}');", ("error", "permission denied")),
    ("N17", "A visitor cannot call my_arm", "anon", "", "select public.my_arm();", ("error", "permission denied")),
    ("N18", "A visitor cannot read sessions", "anon", "", "select count(*) from public.sessions;", ("error", "permission denied")),
    ("N19", "A cannot reopen a completed session", "authenticated", A, "update public.sessions set completed = false;", ("error", "cannot be reopened")),
    ("N20", "A cannot set the completion time", "authenticated", A, "update public.sessions set completed_at = '2020-01-01';", ("error", "permission denied")),
    ("N21", "A cannot read B's exercise rows", "authenticated", A, f"select count(*) from public.exercise_runs where user_id = '{B}';", ("value", "0")),
    ("N22", "A cannot add or edit exercises", "authenticated", A,
     "insert into public.exercises (id, name, duration_sec) values ('evil_one', 'x', 60);", ("error", "permission denied")),
    ("N23", "A visitor cannot read the admin metrics", "anon", "", "select * from app_private.pilot_metrics();", ("error", "permission denied")),
    ("N24", "An exercise cannot be activated without a named reviewer", None, None,
     "update public.exercises set is_active = true, reviewed_by = null where id = 'sort_and_step';", ("error", "violates check constraint")),

    # ---- the privilege catalogue grants nothing unexpected ----
    ("C01", "Functions a visitor can run: none", None, None,
     "select coalesce(string_agg(p.proname, ',' order by p.proname), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace "
     "where n.nspname in ('public', 'app_private') and has_function_privilege('anon', p.oid, 'execute');", ("value", "")),
    ("C02", "Functions a signed-in user can run: my_arm only", None, None,
     "select coalesce(string_agg(p.proname, ',' order by p.proname), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace "
     "where n.nspname in ('public', 'app_private') and has_function_privilege('authenticated', p.oid, 'execute');", ("value", "my_arm")),
    ("C03", "Tables a visitor can touch: exercises (read) only", None, None,
     "select coalesce(string_agg(c.relname, ',' order by c.relname), '') from pg_class c join pg_namespace n on n.oid = c.relnamespace "
     "where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('anon', c.oid, 'select,insert,update,delete');", ("value", "exercises")),
    ("C04", "No table-wide UPDATE for signed-in users anywhere", None, None,
     "select coalesce(string_agg(c.relname, ','), '') from pg_class c join pg_namespace n on n.oid = c.relnamespace "
     "where n.nspname in ('public', 'app_private') and c.relkind = 'r' and has_table_privilege('authenticated', c.oid, 'update');", ("value", "")),
    ("C05", "Row level security is on for every public table", None, None,
     "select coalesce(string_agg(c.relname, ','), '') from pg_class c join pg_namespace n on n.oid = c.relnamespace "
     "where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;", ("value", "")),
]


def run_mode(args, mode):
    db = f"aeris_test_{mode}"
    subprocess.run(["psql", "-h", args.host, "-p", str(args.port), "-U", args.user, "-X", "-q", "-c",
                    f"drop database if exists {db};"], capture_output=True)
    subprocess.run(["psql", "-h", args.host, "-p", str(args.port), "-U", args.user, "-X", "-q", "-c",
                    f"create database {db};"], check=True, capture_output=True)
    psql_file(args, db, HERE / "supabase_shim.sql")
    if mode == "legacy_defaults":
        psql_file(args, db, HERE / "legacy_defaults.sql")
    psql_file(args, db, SCHEMA)

    # Seed: two users; a reviewer activates the three exercises; B has a session.
    psql(args, db, f"insert into auth.users values ('{A}', 'a@test'), ('{B}', 'b@test');", check=True)
    psql(args, db, "update public.exercises set is_active = true, reviewed_by = 'Test Reviewer, LCSW', reviewed_at = '2026-11-01';", check=True)
    psql(args, db, "insert into public.exercises (id, name, duration_sec) values ('unreviewed_draft', 'Draft', 60);", check=True)
    psql(args, db, f"insert into public.sessions (id, user_id, situation) values ('{B_SESSION}', '{B}', 'work_replay');", check=True)

    results = []
    for tid, desc, role, uid, sql, expect in TESTS:
        code, out, err = psql(args, db, sql, role=role, uid=uid)
        if expect[0] == "ok":
            passed = code == 0
        elif expect[0] == "value":
            passed = code == 0 and out == expect[1]
        else:
            passed = code != 0 and expect[1] in err
        results.append((tid, desc, passed, out if code == 0 else err.splitlines()[-1] if err else ""))

    results += concurrency_tests(args, db)
    results += deletion_tests(args, db)
    return results


def concurrency_tests(args, db):
    res = []
    # K01: 20 simultaneous requests from one user against a limit of 3.
    psql(args, db, "update app_private.settings set per_user_daily_ai_calls = 3, daily_budget_usd = 100; delete from app_private.ai_reservations; delete from app_private.daily_budget;", check=True)
    with cf.ThreadPoolExecutor(max_workers=20) as ex:
        outs = list(ex.map(lambda _: psql(args, db, f"select app_private.reserve_ai_call('{B}', 0.01);", role="service_role"), range(20)))
    granted = sum(1 for c, o, e in outs if c == 0 and o)
    res.append(("K01", "20 parallel requests, per-user limit 3: exactly 3 granted", granted == 3, f"granted={granted}"))

    # K02: global budget $0.10, 15 parallel $0.03 requests from different users.
    psql(args, db, "update app_private.settings set per_user_daily_ai_calls = 100, daily_budget_usd = 0.10; delete from app_private.ai_reservations; delete from app_private.daily_budget;", check=True)
    users = [f"cccccccc-0000-0000-0000-{i:012d}" for i in range(15)]
    psql(args, db, "insert into auth.users values " + ",".join(f"('{u}', 'u{i}@test')" for i, u in enumerate(users)) + ";", check=True)
    with cf.ThreadPoolExecutor(max_workers=15) as ex:
        outs = list(ex.map(lambda u: psql(args, db, f"select app_private.reserve_ai_call('{u}', 0.03);", role="service_role"), users))
    granted = sum(1 for c, o, e in outs if c == 0 and o)
    _, total, _ = psql(args, db, "select reserved_usd + spent_usd from app_private.daily_budget;")
    res.append(("K02", "15 parallel $0.03 requests, $0.10 daily budget: 3 granted, budget not exceeded",
                granted == 3 and float(total) <= 0.10, f"granted={granted} committed=${total}"))

    # K03: settling twice charges once.
    _, rid, _ = psql(args, db, "select id from app_private.ai_reservations where status = 'reserved' limit 1;")
    _, first, _ = psql(args, db, f"select app_private.settle_ai_call('{rid}', 0.02);", role="service_role")
    _, second, _ = psql(args, db, f"select app_private.settle_ai_call('{rid}', 0.02);", role="service_role")
    res.append(("K03", "Settling the same reservation twice charges once", first == "t" and second == "f", f"first={first} second={second}"))

    # K04: a released reservation cannot be settled; a bad cost is rejected.
    _, rid2, _ = psql(args, db, "select id from app_private.ai_reservations where status = 'reserved' limit 1;")
    _, rel, _ = psql(args, db, f"select app_private.release_ai_call('{rid2}');", role="service_role")
    _, after, _ = psql(args, db, f"select app_private.settle_ai_call('{rid2}', 0.02);", role="service_role")
    code, _, err = psql(args, db, f"select app_private.reserve_ai_call('{B}', -5);", role="service_role")
    res.append(("K04", "Release blocks a later settle; negative estimates are rejected",
                rel == "t" and after == "f" and code != 0 and "invalid" in err, f"release={rel} settle_after={after}"))
    return res


def deletion_tests(args, db):
    psql(args, db, f"insert into app_private.safety_events (user_id, route, source) values ('{A}', 'crisis_self_harm', 'keyword');", check=True)
    psql(args, db, f"delete from auth.users where id = '{A}';", check=True)
    _, left, _ = psql(args, db,
        f"select (select count(*) from public.profiles where user_id = '{A}') + (select count(*) from public.sessions where user_id = '{A}') "
        f"+ (select count(*) from public.consents where user_id = '{A}') + (select count(*) from public.feedback where user_id = '{A}') "
        f"+ (select count(*) from public.exercise_runs where user_id = '{A}') + (select count(*) from app_private.assignments where user_id = '{A}');")
    _, anon_events, _ = psql(args, db, "select count(*) from app_private.safety_events where user_id is null;")
    return [("D01", "Deleting an account removes all of that user's rows", left == "0", f"rows_left={left}"),
            ("D02", "Safety events survive only as anonymous counts", anon_events == "1", f"anonymous_events={anon_events}")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", required=True)
    ap.add_argument("--port", default="5432")
    ap.add_argument("--user", default="postgres")
    args = ap.parse_args()
    failures = 0
    for mode in ("legacy_defaults", "strict_defaults"):
        print(f"\n=== {mode} ===")
        for tid, desc, passed, detail in run_mode(args, mode):
            failures += 0 if passed else 1
            print(f"{'PASS' if passed else 'FAIL'}  {tid}  {desc}" + ("" if passed else f"   [{detail}]"))
    print(f"\n{'ALL TESTS PASSED' if failures == 0 else f'{failures} FAILURE(S)'}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
