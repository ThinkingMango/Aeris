import { notFound } from "next/navigation";

import { viewerId } from "@/server/http";
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
  const userId = await viewerId();

  // A brand new visitor is signed in to nothing and therefore owns no session.
  // There is nothing here for them, and saying so is the same answer a
  // stranger gets — the two are deliberately indistinguishable.
  if (userId === null) notFound();

  const session = await repository().getSession(id, userId);
  if (session === null) notFound();

  const stored = await repository().listMessages(id, userId);
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
