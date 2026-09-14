/**
 * Shared request handling.
 *
 * Identity resolution and the cookie that carries it, plus the small set of
 * response shapes every route uses. Route handlers should be boring.
 */
import {
  IDENTITY_COOKIE,
  IDENTITY_MAX_AGE_SECONDS,
  resolveIdentity,
  type Identity,
} from "./identity";

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

export function identityFor(request: Request): RequestIdentity {
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
