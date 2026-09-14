"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Content } from "@/core/interventions/catalog";
import {
  BREATH_LABELS,
  breathStateAt,
  cycleDurationMs,
  phaseBoundaries,
  totalDurationMs,
  type BreathPattern,
} from "@/core/interventions/timing";

import { PlayerShell } from "./player-shell";
import type { PlayerProps } from "./types";

/**
 * Builds one CSS animation for the whole cycle.
 *
 * The circle is driven entirely by the compositor: React never re-renders to
 * move it. The only thing React updates is the word in the middle, four times
 * a second, which costs nothing.
 */
function keyframes(pattern: BreathPattern, name: string): string {
  const boundaries = phaseBoundaries(pattern);
  if (boundaries.length === 0) return "";

  const scaleFor = (phase: string): number =>
    phase === "inhale" ? 0.92 : phase === "sniff" ? 1 : 0.52;

  const stops: string[] = ["0% { transform: scale(0.52); }"];
  for (const boundary of boundaries) {
    // Inhaling eases out (fast then gentle); exhaling eases in and keeps
    // going, which is the shape a long breath out actually has.
    const easing = boundary.phase === "exhale" ? "ease-in-out" : "ease-out";
    stops.push(
      `${boundary.endPercent}% { transform: scale(${scaleFor(boundary.phase)}); animation-timing-function: ${easing}; }`,
    );
  }

  return `@keyframes ${name} { ${stops.join(" ")} }`;
}

/**
 * Paced breathing.
 *
 * Never counts a hold, because the catalog never asks for one, and framing is
 * carried by the shell: this settles the body a little, and is not meant to
 * make the feeling disappear.
 */
export function BreathPlayer({ intervention, onDone }: PlayerProps) {
  const content = intervention.content as Extract<Content, { kind: "breath" }>;
  const pattern: BreathPattern = content;

  const startedAt = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const animationName = useMemo(
    () => `aeris-breath-${intervention.slug.replace(/_/g, "-")}`,
    [intervention.slug],
  );
  const css = useMemo(() => keyframes(pattern, animationName), [pattern, animationName]);
  const totalMs = useMemo(() => totalDurationMs(pattern), [pattern]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const listener = (event: MediaQueryListEvent): void => setReducedMotion(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    // Reads the clock rather than counting ticks, so a throttled interval in a
    // backgrounded tab shows the right phase the moment it fires again.
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
    return () => window.clearInterval(id);
  }, []);

  const state = breathStateAt(pattern, elapsed);

  useEffect(() => {
    if (state.complete) onDone({ completed: true });
    // Fires once, when the exercise finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.complete]);

  return (
    <PlayerShell
      intervention={intervention}
      progress={totalMs === 0 ? null : Math.min(1, elapsed / totalMs)}
      onStop={() => onDone({ completed: false })}
      footer={<span className="muted">{content.note}</span>}
    >
      <style>{css}</style>

      <div className="breath" aria-live="polite">
        <div
          className="breath-circle"
          aria-hidden="true"
          style={
            reducedMotion
              ? { transform: "scale(0.8)" }
              : {
                  animationName,
                  animationDuration: `${cycleDurationMs(pattern)}ms`,
                  animationIterationCount: pattern.cycles,
                  animationTimingFunction: "ease-out",
                  animationFillMode: "forwards",
                }
          }
        />
        <div className="breath-label">
          <strong>{BREATH_LABELS[state.phase]}</strong>
          <span className="muted">
            {state.complete ? "That's the set" : `Breath ${state.cycle} of ${state.totalCycles}`}
          </span>
        </div>
      </div>

      <div className="row">
        <button type="button" className="ghost" onClick={() => onDone({ completed: false })}>
          That’s enough
        </button>
      </div>
    </PlayerShell>
  );
}
