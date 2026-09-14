import { DELAY_RUNGS } from "@/core/urges";
import { identityFor, json, readJson } from "@/server/http";
import { SessionError, startDelay } from "@/server/services/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts a wait.
 *
 * The clock starts on the server and a second call is a no-op, so neither a
 * reload nor an edited request can make a wait appear longer than it was.
 * Telling someone they waited when they did not is the one thing this feature
 * must never do.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const identity = await identityFor(request);
  const { id } = await context.params;
  const body = await readJson(request);

  const minutes = body["minutes"];
  if (typeof minutes !== "number" || !DELAY_RUNGS.includes(minutes)) {
    return json(
      { error: "unsupported_duration", supported: DELAY_RUNGS },
      { status: 400, headers: identity.headers },
    );
  }

  try {
    const started = await startDelay({ userId: identity.userId, urgeId: id, minutes });
    return json(
      { startedAt: started.startedAt.toISOString(), minutes: started.minutes },
      { headers: identity.headers },
    );
  } catch (error) {
    if (error instanceof SessionError) {
      return json({ error: error.code }, { status: 404, headers: identity.headers });
    }
    throw error;
  }
}
