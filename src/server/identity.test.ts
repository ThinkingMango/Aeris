import { describe, expect, it } from "vitest";

import { IdentityError, identityMode, resolveIdentity } from "./identity";

describe("resolveIdentity", () => {
  it("keeps an id that looks like one we issued", () => {
    const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    expect(resolveIdentity(id)).toEqual({ userId: id, isNew: false });
  });

  it("normalises case, so the same cookie is the same person", () => {
    expect(resolveIdentity("3F2504E0-4F89-41D3-9A0C-0305E82C3301").userId).toBe(
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    );
  });

  it("issues a fresh id rather than trusting a hand-edited cookie", () => {
    // The failure mode being prevented is a cookie naming somebody else's id.
    for (const attempt of ["", "admin", "../../etc/passwd", "1 or 1=1", "not-a-uuid"]) {
      const identity = resolveIdentity(attempt);
      expect(identity.isNew).toBe(true);
      expect(identity.userId).not.toBe(attempt);
    }
  });
});

describe("identityMode", () => {
  it("uses Supabase whenever it is configured", () => {
    expect(identityMode({ supabaseConfigured: true, appEnv: "development" })).toBe("supabase");
    expect(identityMode({ supabaseConfigured: true, appEnv: "production" })).toBe("supabase");
  });

  it("falls back to the development cookie when nothing is configured", () => {
    expect(identityMode({ supabaseConfigured: false, appEnv: "development" })).toBe("dev_cookie");
    expect(identityMode({ supabaseConfigured: false, appEnv: undefined })).toBe("dev_cookie");
  });

  it("refuses to run production without authentication", () => {
    // Without Supabase there is no auth.uid(), so every row-level security
    // policy would be inert. That is not a degraded mode, it is no security.
    expect(() => identityMode({ supabaseConfigured: false, appEnv: "production" })).toThrow(
      IdentityError,
    );
  });
});
