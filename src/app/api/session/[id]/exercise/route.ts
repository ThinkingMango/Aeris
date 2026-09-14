import { isInterventionSlug } from "@/core/interventions/catalog";
import { INTENSITY_MAX, INTENSITY_MIN } from "@/core/patterns/taxonomy";
import { identityFor, json, optionalInt, optionalString, readJson } from "@/server/http";
import { completeExercise, SessionError } from "@/server/services/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records what an exercise did.
 *
 * The before-intensity is not accepted from the browser: it is read from the
 * session, so the measurement that feeds "what helps you" cannot be edited
 * into a better-looking result.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const identity = identityFor(request);
  const { id } = await context.params;
  const body = await readJson(request);

  const intervention = optionalString(body["intervention"]);
  if (intervention === undefined || !isInterventionSlug(intervention)) {
    return json({ error: "unknown_intervention" }, { status: 400, headers: identity.headers });
  }

  try {
    await completeExercise({
      userId: identity.userId,
      sessionId: id,
      intervention,
      completed: body["completed"] !== false,
      intensityAfter: optionalInt(body["intensityAfter"], INTENSITY_MIN, INTENSITY_MAX),
      helpfulness: optionalInt(body["helpfulness"], 1, 3),
    });
    return json({ ok: true }, { headers: identity.headers });
  } catch (error) {
    if (error instanceof SessionError) {
      return json({ error: error.code }, { status: 404, headers: identity.headers });
    }
    throw error;
  }
}
