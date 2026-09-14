import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { IDENTITY_COOKIE, resolveIdentity } from "@/server/identity";
import { repository } from "@/server/repo";
import { SessionView } from "@/components/session/session-view";
import type { DisplayMessage } from "@/components/session/message-list";

export const dynamic = "force-dynamic";

/**
 * The session, server-rendered.
 *
 * The transcript is loaded here rather than fetched by the browser, so
 * returning to a conversation shows it immediately instead of flashing empty.
 */
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const identity = resolveIdentity(store.get(IDENTITY_COOKIE)?.value);

  // A brand new visitor has no cookie and therefore owns no session. There is
  // nothing here for them, and saying so is the same answer a stranger gets.
  if (identity.isNew) notFound();

  const session = await repository().getSession(id, identity.userId);
  if (session === null) notFound();

  const stored = await repository().listMessages(id, identity.userId);
  const messages: DisplayMessage[] = stored.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
  }));

  return (
    <main className="wide">
      <SessionView
        sessionId={session.id}
        initialMessages={messages}
        initialState={session.state}
        intensityBefore={session.intensityBefore}
      />
    </main>
  );
}
