import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * Next's recommended rules plus its TypeScript set.
 *
 * Deliberately thin. The real guarantees in this codebase come from
 * `tsc --noEmit` under strict settings and from the tests; a lint config that
 * tries to restate them just produces two sources of truth that drift.
 */
const config = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/db/migrations/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default config;
