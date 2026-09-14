import { INTENSITY_MAX, INTENSITY_MIN } from "@/core/patterns/taxonomy";
import { identityFor, json, optionalInt, optionalString, readJson } from "@/server/http";
import { startSession } from "@/server/services/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a session.
 *
 * Local time comes from the browser here and nowhere else. It is the one thing
 * the server genuinely cannot work out afterwards, and the anxiety map is
 * built from it — so it is captured at creation and never inferred later.
 */
export async function POST(request: Request): Promise<Response> {
  const identity = identityFor(request);
  const body = await readJson(request);

  const session = await startSession({
    userId: identity.userId,
    intensityBefore: optionalInt(body["intensity"], INTENSITY_MIN, INTENSITY_MAX),
    localHour: optionalInt(body["localHour"], 0, 23),
    localDow: optionalInt(body["localDow"], 0, 6),
    timezone: optionalString(body["timezone"]) ?? null,
  });

  return json({ sessionId: session.id, state: session.state }, { headers: identity.headers });
}
