"use client";

import { useEffect, useRef } from "react";

export interface DisplayMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
}

/**
 * The conversation so far.
 *
 * Scrolls to the newest message on change, but only when the person is
 * already near the bottom — yanking the view while someone is re-reading an
 * earlier reply is worse than a slightly stale scroll position.
 */
export function MessageList({
  messages,
  streaming,
}: {
  messages: readonly DisplayMessage[];
  streaming: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 160) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, streaming]);

  return (
    <div className="messages" ref={containerRef}>
      {messages.map((message) => (
        <p key={message.id} className={`bubble ${message.role}`}>
          {message.content}
        </p>
      ))}
      {streaming !== null ? <p className="bubble assistant streaming">{streaming}</p> : null}
      <div ref={endRef} />
    </div>
  );
}
