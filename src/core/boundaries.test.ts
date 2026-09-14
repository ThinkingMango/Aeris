/**
 * The rule that keeps the domain honest.
 *
 * `core/` may not reach into the database, the server, the framework or any
 * SDK. Stated as a convention it decays within a month; stated as a failing
 * test it does not.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const CORE = fileURLToPath(new URL(".", import.meta.url));

async function coreFiles(dir: string = CORE): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return coreFiles(path);
      return entry.name.endsWith(".ts") ? [path] : [];
    }),
  );
  return files.flat();
}

const FORBIDDEN = [
  { pattern: /from\s+["']@\/db\//, why: "the database" },
  { pattern: /from\s+["']@\/server\//, why: "the server layer" },
  { pattern: /from\s+["']@\/app\//, why: "the app layer" },
  { pattern: /from\s+["']@anthropic-ai\//, why: "the Anthropic SDK" },
  { pattern: /from\s+["']next(\/|["'])/, why: "Next.js" },
  { pattern: /from\s+["']drizzle-orm/, why: "Drizzle" },
  { pattern: /from\s+["']react["']/, why: "React" },
];

describe("domain boundaries", () => {
  it("keeps every core module free of infrastructure", async () => {
    const files = (await coreFiles()).filter((path) => !path.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThan(10);

    const violations: string[] = [];
    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(source)) {
          violations.push(`${file.replace(CORE, "core/")} imports ${why}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("keeps message text out of anything that looks like a log or an event", async () => {
    // A field that can hold a person's words is how private content ends up
    // somewhere it was never meant to be. The safety modules must not have one.
    const safety = (await coreFiles(join(CORE, "safety"))).filter(
      (path) => !path.endsWith(".test.ts"),
    );
    for (const file of safety) {
      const source = await readFile(file, "utf8");
      // Guard and rule results carry ids; none of them may carry an excerpt.
      expect(source, `${file} exposes an excerpt`).not.toMatch(/\bexcerpt\b\s*:/);
    }
  });
});
