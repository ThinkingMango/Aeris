/**
 * The database connection.
 *
 * Three things here exist specifically because this runs on Vercel in front of
 * Supabase, and each of them is a production-only failure if you get it wrong.
 *
 *  1. **The pooler, not the database.** A serverless function opens a
 *     connection per cold start and Postgres has a hard connection limit. The
 *     Supavisor transaction pooler (port 6543) multiplexes them; the direct
 *     connection (5432) will exhaust under traffic you would consider modest.
 *     This module refuses to start on a direct URL in production rather than
 *     letting the failure arrive as a pager at the wrong hour.
 *
 *  2. **`prepare: false`.** A transaction-mode pooler hands each statement to
 *     whichever backend is free, so a prepared statement created on one is not
 *     there on the next. Leaving preparation on produces intermittent
 *     "prepared statement does not exist" errors under concurrency and none at
 *     all in development.
 *
 *  3. **A small pool, cached across invocations.** Vercel reuses a warm
 *     instance for many requests, so the client is cached on `globalThis` —
 *     which also stops Next's hot reload opening a new pool on every save.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

export type Database = PostgresJsDatabase<typeof schema>;

interface Holder {
  sql: postgres.Sql | undefined;
  db: Database | undefined;
}

const KEY = Symbol.for("aeris.db");

function holder(): Holder {
  const global = globalThis as unknown as Record<symbol, Holder | undefined>;
  const existing = global[KEY];
  if (existing !== undefined) return existing;
  const fresh: Holder = { sql: undefined, db: undefined };
  global[KEY] = fresh;
  return fresh;
}

/** Supavisor's transaction pooler. Session mode (5432) is not interchangeable. */
const TRANSACTION_POOLER_PORT = "6543";

export function isPooledUrl(url: string): boolean {
  try {
    return new URL(url).port === TRANSACTION_POOLER_PORT;
  } catch {
    return false;
  }
}

export function databaseUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url.length === 0) {
    throw new Error(
      "DATABASE_URL is not set. Supabase → Project Settings → Database → " +
        "Connection string → Transaction pooler.",
    );
  }
  if (process.env["APP_ENV"] === "production" && !isPooledUrl(url)) {
    throw new Error(
      "DATABASE_URL points at the direct Postgres port. Serverless functions " +
        "must use the Supavisor transaction pooler on port 6543, or the " +
        "connection limit is reached under load.",
    );
  }
  return url;
}

export function database(): Database {
  const current = holder();
  if (current.db !== undefined) return current.db;

  const client = postgres(databaseUrl(), {
    // See (2) above. Non-negotiable behind a transaction-mode pooler.
    prepare: false,
    // Each warm instance serves a handful of concurrent requests. Larger
    // pools do not make a single function faster; they just consume the
    // pooler's budget that every other instance is also drawing on.
    max: Number(process.env["DATABASE_POOL_MAX"] ?? 3),
    idle_timeout: 20,
    connect_timeout: 10,
    // Postgres notices are noise in a serverless log and can carry query text.
    onnotice: () => {},
  });

  current.sql = client;
  current.db = drizzle(client, { schema });
  return current.db;
}

/** Closes the pool. Migrations and scripts only; never a request path. */
export async function closeDatabase(): Promise<void> {
  const current = holder();
  if (current.sql !== undefined) await current.sql.end({ timeout: 5 });
  current.sql = undefined;
  current.db = undefined;
}
