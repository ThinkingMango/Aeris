import { identityFor, json, readJson } from "@/server/http";
import { SessionError, settleUrge } from "@/server/services/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records what actually happened.
 *
 * `resisted` comes from the person answering the question, and from nowhere
 * else. A closed tab, an expired timer and a reload all leave it unset,
 * because none of them is evidence of anything.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const identity = await identityFor(request);
  const { id } = await context.params;
  const body = await readJson(request);

  if (typeof body["resisted"] !== "boolean") {
    return json({ error: "answer_required" }, { status: 400, headers: identity.headers });
  }

  try {
    await settleUrge({ userId: identity.userId, urgeId: id, resisted: body["resisted"] });
    return json({ ok: true }, { headers: identity.headers });
  } catch (error) {
    if (error instanceof SessionError) {
      return json({ error: error.code }, { status: 404, headers: identity.headers });
    }
    throw error;
  }
}
