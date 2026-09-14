import { describe, expect, it } from "vitest";

import { LIMITS as SERVER_LIMITS } from "@/server/ai/models";

import { LIMITS } from "./limits";

describe("client and server limits", () => {
  it("agree, so the composer never lets through what the route will reject", () => {
    // The client copy exists so a client component does not import server
    // config and drag the SDK into the bundle. That only stays safe while the
    // two numbers match, which is what this asserts.
    expect(LIMITS.maxInputChars).toBe(SERVER_LIMITS.maxInputChars);
  });
});
