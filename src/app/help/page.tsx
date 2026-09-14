"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { INTENSITY_MAX, INTENSITY_MIN } from "@/core/patterns/taxonomy";
import { AI_DISCLOSURE } from "@/core/copy";

/**
 * Help me now.
 *
 * One number before the conversation starts, because without a before there is
 * no after, and "what helps you" is the whole reason to come back. It is
 * skippable: making it mandatory would put a form in front of someone who
 * needs to type a sentence.
 *
 * Local time is read here and sent once. The server cannot work it out later,
 * and the anxiety map is built from it.
 */
export default function HelpPage() {
  const router = useRouter();
  const [intensity, setIntensity] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = async (withIntensity: number | null): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const now = new Date();
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intensity: withIntensity,
          localHour: now.getHours(),
          localDow: now.getDay(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!response.ok) throw new Error("could not start");
      const body = (await response.json()) as { sessionId: string };
      router.push(`/session/${body.sessionId}`);
    } catch {
      setError("Couldn't start just now. Your toolkit still works.");
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>How intense does it feel right now?</h1>
      <p>One number. It only exists so we can see whether anything helped.</p>

      <input
        type="range"
        min={INTENSITY_MIN}
        max={INTENSITY_MAX}
        value={intensity}
        aria-label="Intensity right now"
        onChange={(event) => setIntensity(Number(event.target.value))}
      />
      <div className="scale-ends">
        <span>{INTENSITY_MIN} manageable</span>
        <strong>{intensity}</strong>
        <span>{INTENSITY_MAX} overwhelming</span>
      </div>

      {error !== null ? <p className="error">{error}</p> : null}

      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={() => void begin(intensity)}>
          Start
        </button>
        <button type="button" className="ghost" disabled={busy} onClick={() => void begin(null)}>
          Skip this
        </button>
      </div>

      <p className="note">{AI_DISCLOSURE}</p>
    </main>
  );
}
