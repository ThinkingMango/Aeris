/**
 * Applies src/db/policies.sql.
 *
 * Separate from `drizzle-kit migrate` because the two want different
 * connections: migrations and DDL need a session-mode connection, and the
 * transaction pooler the application uses is not one. This reads
 * `MIGRATE_DATABASE_URL` first for exactly that reason, falling back to
 * `DATABASE_URL` for a local database where the two are the same thing.
 *
 * The file is idempotent, so running this after every deploy is correct and
 * running it twice is a no-op.
 */
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error(
    "Set MIGRATE_DATABASE_URL (Supabase → Settings → Database → Connection string → Direct).",
  );
  process.exit(1);
}

if (new URL(url).port === "6543") {
  console.error(
    "That is the transaction pooler. DDL needs the direct connection or the session pooler;\n" +
      "the transaction pooler will fail partway through and leave policies half applied.",
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  const text = await readFile(new URL("../src/db/policies.sql", import.meta.url), "utf8");
  await sql.unsafe(text);
  console.log("Policies applied.");
} catch (error) {
  console.error("Failed to apply policies:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
