/**
 * Choosing a repository.
 *
 * Development and tests run on the in-memory store, which is why the product
 * can be used with no infrastructure at all. Production must not: holding
 * someone's anxiety history in a process that restarts would be a serious bug,
 * so it fails closed and says exactly what is missing rather than starting and
 * losing data quietly.
 */
import { createMemoryRepository } from "./memory";
import type { Repository } from "./types";

export * from "./types";
export { resetMemoryStore, seedHistory } from "./memory";

let cached: Repository | null = null;

export function repository(): Repository {
  if (cached !== null) return cached;

  const environment = process.env["APP_ENV"] ?? "development";
  if (environment === "production") {
    throw new Error(
      "No durable repository is configured. The Postgres implementation is not built yet, " +
        "and the in-memory store must never back a production deployment.",
    );
  }

  cached = createMemoryRepository();
  return cached;
}

/** Test seam. */
export function setRepositoryForTesting(repo: Repository | null): void {
  cached = repo;
}
