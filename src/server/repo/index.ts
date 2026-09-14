/**
 * Choosing a repository.
 *
 * The rule is one line: **a `DATABASE_URL` means Postgres, and its absence
 * means the in-memory store.** That keeps `npm run dev` working with no
 * infrastructure at all, which is the reason the interface exists, while
 * making the durable path the default the moment a database is configured.
 *
 * Production is not allowed to opt out. Holding someone's anxiety history in a
 * process that restarts would be a serious bug, so a production build with no
 * database fails at the first request and says exactly what is missing, rather
 * than starting cleanly and losing data quietly for a week.
 */
import { createMemoryRepository } from "./memory";
import { createPostgresRepository } from "./postgres";
import type { Repository } from "./types";

export * from "./types";
export { resetMemoryStore, seedHistory } from "./memory";

let cached: Repository | null = null;

export type RepositoryKind = "postgres" | "memory";

export function repositoryKind(): RepositoryKind {
  const configured = (process.env["DATABASE_URL"] ?? "").trim();
  return configured.length > 0 ? "postgres" : "memory";
}

export function repository(): Repository {
  if (cached !== null) return cached;

  const environment = process.env["APP_ENV"] ?? "development";
  const kind = repositoryKind();

  if (environment === "production" && kind !== "postgres") {
    throw new Error(
      "DATABASE_URL is not set. A production deployment must be backed by Postgres; " +
        "the in-memory store loses every conversation when the instance recycles.",
    );
  }

  cached = kind === "postgres" ? createPostgresRepository() : createMemoryRepository();
  return cached;
}

/** Test seam. */
export function setRepositoryForTesting(repo: Repository | null): void {
  cached = repo;
}
