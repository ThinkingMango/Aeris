/**
 * Shared request handling.
 *
 * Identity resolution and the cookie that carries it, plus the small set of
 * response shapes every route uses. Route handlers should be boring.
 */
import { cookies } from "next/headers";

import {
  IDENTITY_COOKIE,
  IDENTITY_MAX_AGE_SECONDS,
  IdentityError,
  identityMode,
  resolveIdentity,
  type Identity,
} from "./identity";
import { isSupabaseConfigured } from "./supabase/config";
import { currentUserId, supabaseReadOnlyClient, supabaseRouteClient } from "./supabase/server";

export interface RequestIdentity extends Identity {
  /** Headers to merge into the response, setting the cookie when it is new. */
  readonly headers: Record<string, string>;
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (header === null) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

/**
 * Resolves the caller, creating an anonymous account if there isn't one.
 *
 * Signing in happens here, in the route layer, rather than in middleware,
 * because middleware runs on requests from crawlers and prefetches too and
 * would mint an account for each of them. A request that reaches a route has
 * asked for something that needs an identity.
 *
 * This requires anonymous sign-ins to be enabled on the Supabase project. If
 * they are not, it fails loudly rather than silently handing out an
 * unauthenticated id that RLS would reject on the next query.
 */
export async function identityFor(request: Request): Promise<RequestIdentity> {
  const mode = identityMode({
    supabaseConfigured: isSupabaseConfigured(),
    appEnv: process.env["APP_ENV"],
  });

  if (mode === "supabase") {
    const supabase = await supabaseRouteClient();

    const existing = await currentUserId(supabase);
    if (existing !== null) return { userId: existing, isNew: false, headers: {} };

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error !== null || data.user === null) {
      throw new IdentityError(
        "Could not create an anonymous session. Check that anonymous sign-ins are " +
          "enabled: Supabase → Authentication → Sign In / Providers → Anonymous.",
      );
    }
    // The Supabase client wrote its own cookies through the store, so there is
    // nothing to merge into the response here.
    return { userId: data.user.id, isNew: true, headers: {} };
  }

  return devCookieIdentity(request);
}

/**
 * The signed-in viewer, for server components.
 *
 * Read-only: a component cannot start a session, so a visitor with no identity
 * gets null and the page decides what that means. It must never be the path
 * that creates an account, because a prefetched page would then create one.
 */
export async function viewerId(): Promise<string | null> {
  const mode = identityMode({
    supabaseConfigured: isSupabaseConfigured(),
    appEnv: process.env["APP_ENV"],
  });

  if (mode === "supabase") {
    return currentUserId(await supabaseReadOnlyClient());
  }

  const store = await cookies();
  const identity = resolveIdentity(store.get(IDENTITY_COOKIE)?.value);
  return identity.isNew ? null : identity.userId;
}

/** Development only. `identityMode` refuses to return this in production. */
function devCookieIdentity(request: Request): RequestIdentity {
  const identity = resolveIdentity(readCookie(request, IDENTITY_COOKIE));
  if (!identity.isNew) return { ...identity, headers: {} };

  const secure = new URL(request.url).protocol === "https:";
  const cookie = [
    `${IDENTITY_COOKIE}=${identity.userId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${IDENTITY_MAX_AGE_SECONDS}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");

  return { ...identity, headers: { "set-cookie": cookie } };
}

export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...init.headers,
    },
  });
}

/** Reads and validates a JSON body without trusting its shape. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function optionalInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded >= min && rounded <= max ? rounded : null;
}
