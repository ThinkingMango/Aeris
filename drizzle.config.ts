import type { Config } from "drizzle-kit";

/**
 * Migrations need a session-mode connection: DDL cannot run through the
 * transaction pooler the application uses, so `MIGRATE_DATABASE_URL` is read
 * first and `DATABASE_URL` is only the fallback for a local database where the
 * two are the same thing.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["MIGRATE_DATABASE_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
