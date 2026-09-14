"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Content } from "@/core/interventions/catalog";
import { delayStateAt, formatRemaining, holdingLineAt } from "@/core/interventions/timing";
import { DELAY_RUNGS } from "@/core/urges";

import { PlayerShell } from "./player-shell";
import type { PlayerProps } from "./types";

type Stage = "choosing" | "waiting" | "asking" | "settled";

/**
 * The delay timer.
 *
 * This is the exercise the whole product rests on, and it has one rule that
 * everything else follows from: **it never claims someone waited.**
 *
 *  - The clock starts on the server and cannot be restarted by a reload.
 *  - Closing the tab is expected. That is the point. On return, the remaining
 *    time is computed from the recorded start.
 *  - "I checked" is available at every moment and is never styled as a
 *    failure, because it is not one, and a tool that makes it shameful to say
 *    is a tool people lie to.
 *  - Nothing is recorded as resisted until the person answers the question.
 */
export function DelayPlayer({ intervention, onDone, urgeId }: PlayerProps) {
  const content = intervention.content as Extract<Content, { kind: "timer" }>;

  const [stage, setStage] = useState<Stage>("choosing");
  const [minutes, setMinutes] = useState<number>(content.offeredMinutes[0] ?? DELAY_RUNGS[0] ?? 10);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const resumed = useRef(false);

  /* Resume a wait that was already running — the case this exists for. */
  useEffect(() => {
    if (urgeId === null || urgeId === undefined || resumed.current) return;
    resumed.current = true;
    void (async () => {
      try {
        const response = await fetch(`/api/urge/${urgeId}`, { cache: "no-store" });
        if (!response.ok) return;
        const urge = (await response.json()) as {
          delayMinutes: number | null;
          delayStartedAt: string | null;
          resisted: boolean | null;
        };
        if (urge.delayStartedAt === null || urge.delayMinutes === null) return;
        if (urge.resisted !== null) return;
        const started = Date.parse(urge.delayStartedAt);
        setMinutes(urge.delayMinutes);
        setStartedAt(started);
        setStage(delayStateAt(started, urge.delayMinutes, Date.now()).complete ? "asking" : "waiting");
      } catch {
        // A failed resume just means choosing again. Nothing is lost.
      }
    })();
  }, [urgeId]);

  useEffect(() => {
    if (stage !== "waiting") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const state = startedAt === null ? null : delayStateAt(startedAt, minutes, now);

  useEffect(() => {
    if (stage === "waiting" && state !== null && state.complete) setStage("asking");
  }, [stage, state]);

  const begin = useCallback(async () => {
    setBusy(true);
    try {
      if (urgeId !== null && urgeId !== undefined) {
        const response = await fetch(`/api/urge/${urgeId}/delay`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ minutes }),
        });
        if (response.ok) {
          const body = (await response.json()) as { startedAt: string; minutes: number };
          setStartedAt(Date.parse(body.startedAt));
          setMinutes(body.minutes);
          setStage("waiting");
          return;
        }
      }
      // No urge to attach to, or the server was unreachable. The exercise is
      // still worth doing, so it runs locally rather than refusing.
      setStartedAt(Date.now());
      setStage("waiting");
    } finally {
      setBusy(false);
    }
  }, [minutes, urgeId]);

  const answer = useCallback(
    async (resisted: boolean) => {
      setBusy(true);
      try {
        if (urgeId !== null && urgeId !== undefined) {
          await fetch(`/api/urge/${urgeId}/settle`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ resisted }),
          }).catch(() => undefined);
        }
        setStage("settled");
        onDone({ completed: resisted });
      } finally {
        setBusy(false);
      }
    },
    [onDone, urgeId],
  );

  if (stage === "choosing") {
    return (
      <PlayerShell
        intervention={intervention}
        progress={null}
        onStop={() => onDone({ completed: false })}
        footer={<span className="muted">{intervention.intro}</span>}
      >
        <p className="step-instruction">How long shall we leave it?</p>
        <div className="row choices">
          {content.offeredMinutes.map((option) => (
            <button
              key={option}
              type="button"
              className={option === minutes ? "chip selected" : "chip"}
              aria-pressed={option === minutes}
              onClick={() => setMinutes(option)}
            >
              {option} min
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="primary" disabled={busy} onClick={() => void begin()}>
            Start waiting
          </button>
        </div>
      </PlayerShell>
    );
  }

  if (stage === "waiting" && state !== null) {
    const line = holdingLineAt(content.holdingScript, state.elapsedMs, state.totalMs);
    return (
      <PlayerShell
        intervention={intervention}
        progress={state.progress}
        onStop={() => onDone({ completed: false })}
        footer={<span className="muted">You can close this. The clock keeps going.</span>}
      >
        <div className="countdown" role="timer" aria-live="off">
          <strong>{formatRemaining(state.remainingMs)}</strong>
          <span className="muted">left</span>
        </div>
        {line !== null ? <p className="holding-line">{line}</p> : null}
        <div className="row">
          <button type="button" className="ghost" disabled={busy} onClick={() => void answer(false)}>
            I checked
          </button>
        </div>
      </PlayerShell>
    );
  }

  if (stage === "asking") {
    return (
      <PlayerShell
        intervention={intervention}
        progress={1}
        onStop={() => onDone({ completed: false })}
        footer={<span className="muted">However you answer, it's useful to know.</span>}
      >
        <p className="step-instruction">{content.closingQuestion}</p>
        <div className="row">
          <button type="button" className="primary" disabled={busy} onClick={() => void answer(true)}>
            No, I waited
          </button>
          <button type="button" className="ghost" disabled={busy} onClick={() => void answer(false)}>
            Yes, I checked
          </button>
        </div>
      </PlayerShell>
    );
  }

  return (
    <PlayerShell
      intervention={intervention}
      progress={1}
      onStop={() => onDone({ completed: true })}
      footer={null}
    >
      <p className="step-instruction">Noted. That goes into your patterns.</p>
      <div className="row">
        <button type="button" className="primary" onClick={() => onDone({ completed: true })}>
          Done
        </button>
      </div>
    </PlayerShell>
  );
}
