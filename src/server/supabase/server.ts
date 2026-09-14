/**
 * Supabase clients for the server.
 *
 * Two of them, because Next draws a hard line this has to respect: a Route
 * Handler or Server Action may write cookies, and a Server Component may not.
 * Handing a component a client that thinks it can refresh a token produces a
 * runtime error at render time, so the read-only client is given cookie
 * writers that deliberately do nothing.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { requireSupabaseConfig } from "./config";

type Cookie = { name: string; value: string; options?: Record<string, unknown> };

/** For route handlers and server actions: may set cookies, so may refresh. */
export async function supabaseRouteClient(): Promise<SupabaseClient> {
  const { url, publishableKey } = requireSupabaseConfig();
  const store = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: Cookie[]) => {
        for (const cookie of list) {
          store.set(cookie.name, cookie.value, cookie.options ?? {});
        }
      },
    },
  });
}

/** For server components: reads the session, never rotates it. */
export async function supabaseReadOnlyClient(): Promise<SupabaseClient> {
  const { url, publishableKey } = requireSupabaseConfig();
  const store = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      // A component cannot write cookies. Middleware has already refreshed the
      // token by the time this runs, so discarding the write is correct rather
      // than merely tolerable.
      setAll: () => {},
    },
  });
}

/**
 * Who is signed in, without a network round trip where possible.
 *
 * `getClaims` verifies the JWT locally against the project's public key, which
 * turns an identity check from an HTTP call into a signature check. That
 * matters here: identity is read on every turn of a streaming conversation,
 * and a round trip to Supabase before the first token of a reply is latency a
 * person feels at the moment they are least able to wait for it.
 *
 * It falls back to `getUser` when local verification is unavailable — a
 * project still on the legacy shared-secret signing key, for instance.
 */
export async function currentUserId(client: SupabaseClient): Promise<string | null> {
  try {
    const claims = await client.auth.getClaims();
    const sub = claims.data?.claims?.sub;
    if (typeof sub === "string" && sub.length > 0) return sub;
  } catch {
    // Fall through to the authoritative check.
  }
  const { data, error } = await client.auth.getUser();
  if (error !== null || data.user === null) return null;
  return data.user.id;
}

export interface CurrentUser {
  readonly id: string;
  readonly email: string | null;
  /** True until an email has been confirmed. Drives the upgrade prompt. */
  readonly isAnonymous: boolean;
}

/**
 * The full user, for screens that show who someone is.
 *
 * Unlike `currentUserId` this always asks Supabase, because the email and the
 * anonymous flag are not in the token's claims and a stale answer here would
 * show somebody the wrong account state.
 */
export async function currentUser(client: SupabaseClient): Promise<CurrentUser | null> {
  const { data, error } = await client.auth.getUser();
  if (error !== null || data.user === null) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAnonymous: data.user.is_anonymous === true,
  };
}
