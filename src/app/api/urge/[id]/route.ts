import { identityFor, json } from "@/server/http";
import { repository } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The state of one wait.
 *
 * Exists so that someone who closed the tab — which is exactly what the
 * exercise asks them to do — comes back to a timer showing the truth rather
 * than a fresh one.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const identity = identityFor(request);
  const { id } = await context.params;

  const urge = await repository().getUrge(id, identity.userId);
  if (urge === null) {
    return json({ error: "not_found" }, { status: 404, headers: identity.headers });
  }

  return json(
    {
      target: urge.target,
      delayMinutes: urge.delayMinutes,
      delayStartedAt: urge.delayStartedAt === null ? null : urge.delayStartedAt.toISOString(),
      resisted: urge.resisted,
    },
    { headers: identity.headers },
  );
}
