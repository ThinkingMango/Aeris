/**
 * Who is asking.
 *
 * Authentication is stage two. Until then a signed-out visitor gets a stable
 * anonymous id in a cookie, which is enough to have a real conversation and
 * come back to it, and is deliberately not enough to be mistaken for an
 * account.
 *
 * The resolution itself is a pure function so it can be tested without a
 * request; the cookie read and write live in the route handlers.
 */
export const IDENTITY_COOKIE = "aeris_uid";
export const IDENTITY_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface Identity {
  readonly userId: string;
  /** True when a cookie needs to be set on the response. */
  readonly isNew: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accepts an existing id only if it looks like one we issued. Anything else
 * gets a fresh id rather than being trusted, so a hand-edited cookie cannot
 * name an arbitrary user.
 */
export function resolveIdentity(cookieValue: string | undefined): Identity {
  if (cookieValue !== undefined && UUID.test(cookieValue)) {
    return { userId: cookieValue.toLowerCase(), isNew: false };
  }
  return { userId: crypto.randomUUID(), isNew: true };
}

export const IDENTITY_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: IDENTITY_MAX_AGE_SECONDS,
} as const;
