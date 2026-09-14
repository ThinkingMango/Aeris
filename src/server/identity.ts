/**
 * Who is asking.
 *
 * Aeris is opened by someone who is anxious right now. Putting a sign-up form
 * in front of that is the wrong product, so there isn't one: pressing "Help me
 * now" gets a real, durable identity with nothing typed.
 *
 * That identity is a **Supabase anonymous user** rather than a cookie we
 * invent, and the difference matters more than it looks.
 *
 *  - It is a real row in `auth.users`, so `auth.uid()` exists, so row-level
 *    security is a working boundary rather than an aspiration.
 *  - It survives being upgraded. Adding an email later with `updateUser`
 *    converts the same account to a permanent one — **same id** — so months of
 *    history follow the person to their account instead of being migrated,
 *    reconciled, or lost.
 *
 * The cookie below is the development fallback for running with no Supabase
 * project at all. It is enough to have a conversation and come back to it, and
 * deliberately not enough to be mistaken for an account — which is why
 * production refuses to use it.
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

export type IdentityMode = "supabase" | "dev_cookie";

/**
 * Which mechanism is in play, decided from configuration alone.
 *
 * Pure so the rule can be tested without an environment: production without
 * Supabase is not a degraded mode to be papered over, it is a deployment that
 * has no authentication and therefore no RLS, and it must not start.
 */
export function identityMode(input: {
  readonly supabaseConfigured: boolean;
  readonly appEnv: string | undefined;
}): IdentityMode {
  if (input.supabaseConfigured) return "supabase";
  if (input.appEnv === "production") {
    throw new IdentityError(
      "Supabase is not configured. A production deployment cannot fall back to " +
        "the development cookie: it would run with no authentication and no " +
        "row-level security.",
    );
  }
  return "dev_cookie";
}

/** Distinguishable from an ordinary failure so a route can answer 503. */
export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityError";
  }
}
