"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { State } from "@/core/conversation/states";
import { getIntervention, type InterventionSlug } from "@/core/interventions/catalog";
import { AI_DISCLOSURE } from "@/core/copy";
import { InterventionPlayer } from "@/components/players";
import { readStream, type TurnPayload } from "@/lib/stream-protocol";

import { Composer } from "./composer";
import { CrisisPanel } from "./crisis-panel";
import { InterventionCard } from "./intervention-card";
import { MessageList, type DisplayMessage } from "./message-list";
import { Reassess } from "./reassess";
import { Thinking } from "./thinking";

type Phase = "idle" | "sending" | "offer" | "exercise" | "reassess" | "held" | "done";

export interface SessionViewProps {
  readonly sessionId: string;
  readonly initialMessages: readonly DisplayMessage[];
  readonly initialState: State;
  readonly intensityBefore: number | null;
}

/**
 * The session.
 *
 * Holds only what the screen needs to render. Every decision that matters —
 * the next state, whether an exercise may be offered, whether safety has taken
 * over — was made on the server and arrives in the payload. This component
 * never infers any of them, which is what keeps the client from being able to
 * talk the conversation into somewhere it is not allowed to go.
 */
export function SessionView({
  sessionId,
  initialMessages,
  initialState,
  intensityBefore,
}: SessionViewProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([...initialMessages]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [state, setState] = useState<State>(initialState);
  const [phase, setPhase] = useState<Phase>(initialState === "SAFETY_HOLD" ? "held" : "idle");
  const [payload, setPayload] = useState<TurnPayload | null>(null);
  const [active, setActive] = useState<InterventionSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  const controller = useRef<AbortController | null>(null);

  // Navigating away mid-turn should not leave a request running.
  useEffect(() => () => controller.current?.abort(), []);

  const send = useCallback(
    async (message: string) => {
      setError(null);
      setPayload(null);
      // Show what they typed straight away rather than after a round trip.
      setMessages((current) => [
        ...current,
        { id: `local-${crypto.randomUUID()}`, role: "user", content: message },
      ]);
      setPhase("sending");
      setStreaming("");

      const abort = new AbortController();
      controller.current = abort;
      let accumulated = "";

      try {
        const response = await fetch(`/api/session/${sessionId}/turn`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message, clientEventId: crypto.randomUUID() }),
          signal: abort.signal,
        });

        if (response.body === null) throw new Error("no body");

        for await (const event of readStream(response.body)) {
          if (event.t === "delta") {
            accumulated += event.text;
            setStreaming(accumulated);
          } else if (event.t === "error") {
            setError(event.message);
            setStreaming(null);
            setPhase("idle");
            return;
          } else {
            const done = event.payload;
            setStreaming(null);
            setMessages((current) => [
              ...current,
              { id: done.messageId, role: "assistant", content: done.text },
            ]);
            setState(done.state);
            setPayload(done);

            if (done.safety.copyRoute === "crisis" || done.state === "SAFETY_HOLD") {
              setPhase("held");
            } else if (done.recommendedIntervention !== null) {
              setPhase("offer");
            } else if (done.state === "COMPLETE") {
              setPhase("done");
            } else {
              setPhase("idle");
            }
          }
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError("That didn't get through. Your exercises still work.");
        setStreaming(null);
        setPhase("idle");
      }
    },
    [sessionId],
  );

  const finishExercise = useCallback(
    async (slug: InterventionSlug, completed: boolean) => {
      await fetch(`/api/session/${sessionId}/exercise`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intervention: slug, completed }),
      }).catch(() => undefined);
      setPhase(completed ? "reassess" : "idle");
    },
    [sessionId],
  );

  const saveReassessment = useCallback(
    async (intensity: number | null, helpfulness: number | null) => {
      if (active !== null && intensity !== null) {
        await fetch(`/api/session/${sessionId}/exercise`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            intervention: active,
            completed: true,
            intensityAfter: intensity,
            helpfulness,
          }),
        }).catch(() => undefined);
      }
      setActive(null);
      setPhase("idle");
    },
    [active, sessionId],
  );

  const busy = phase === "sending";

  return (
    <div className="session">
      <p className="disclosure">{AI_DISCLOSURE}</p>

      <MessageList messages={messages} streaming={streaming} />

      {busy && streaming === "" ? <Thinking state={state} /> : null}
      {error !== null ? <p className="error">{error}</p> : null}

      {phase === "held" && payload !== null ? (
        <CrisisPanel resources={payload.safety.resources} />
      ) : null}

      {phase === "offer" && payload?.recommendedIntervention != null ? (
        <InterventionCard
          slug={payload.recommendedIntervention}
          helpedBefore={payload.interventionHelpedBefore}
          onStart={() => {
            setActive(payload.recommendedIntervention);
            setPhase("exercise");
          }}
          onDecline={() => setPhase("idle")}
        />
      ) : null}

      {phase === "exercise" && active !== null ? (
        <InterventionPlayer
          intervention={getIntervention(active)}
          urgeId={payload?.urge?.id ?? null}
          onDone={({ completed }) => void finishExercise(active, completed)}
        />
      ) : null}

      {phase === "reassess" ? (
        <Reassess
          before={intensityBefore}
          onAnswer={(intensity, helpfulness) => void saveReassessment(intensity, helpfulness)}
          onSkip={() => void saveReassessment(null, null)}
        />
      ) : null}

      {phase === "done" ? (
        <aside className="finished">
          <p>That’s this one done. You can start another whenever you need to.</p>
        </aside>
      ) : null}

      {phase === "idle" || phase === "sending" ? (
        <Composer
          disabled={busy}
          placeholder={messages.length === 0 ? "What's going on?" : "Say more, if you want to."}
          onSend={(message) => void send(message)}
        />
      ) : null}

      {phase === "held" ? (
        <p className="muted held-note">
          This session is paused here on purpose. You can start a new one any time.
        </p>
      ) : null}
    </div>
  );
}
