#!/usr/bin/env bash
# Starts a throwaway PostgreSQL 16 cluster, runs the schema security tests, and removes it.
# Needs the PostgreSQL server binaries (Linux: postgresql-16; macOS: brew install postgresql@16).
# On a real Supabase project, also run these checks against a branch database before launch.
set -euo pipefail
BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}"
DIR="$(mktemp -d /tmp/aeris-pgtest.XXXXXX)"
PORT="${PG_PORT:-54329}"
RUN_AS=""
if [ "$(id -u)" = "0" ]; then chown postgres:postgres "$DIR"; RUN_AS="su postgres -c"; fi
start() { if [ -n "$RUN_AS" ]; then $RUN_AS "$*"; else bash -c "$*"; fi; }
start "$BIN/initdb -D $DIR/data -A trust -U postgres >/dev/null"
start "$BIN/pg_ctl -D $DIR/data -o '-k $DIR -p $PORT -c listen_addresses=' -l $DIR/log start >/dev/null"
trap 'start "$BIN/pg_ctl -D $DIR/data stop -m fast >/dev/null" || true; rm -rf "$DIR"' EXIT
sleep 2
python3 "$(dirname "$0")/run_security_tests.py" --host "$DIR" --port "$PORT" --user postgres
