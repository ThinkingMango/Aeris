import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/core/**"],
      // Pure re-export barrels carry no logic; counting them only obscures
      // whether the code that does carry logic is actually covered.
      exclude: [
        "src/core/index.ts",
        "src/core/conversation/index.ts",
        "src/core/interventions/index.ts",
        "src/core/patterns/index.ts",
      ],
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
    },
  },
});
