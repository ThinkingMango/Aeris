"use client";

import type { ReactNode } from "react";

import type { Intervention } from "@/core/interventions/catalog";

/**
 * The frame every exercise sits in.
 *
 * Two rules it enforces for all of them:
 *
 *  - "Stop" is always visible, always first in the tab order after the
 *    content, and never styled as a failure. Someone who needs to leave an
 *    exercise at 2 a.m. should not have to look for the way out.
 *  - The framing line is always shown. It is what keeps the claim honest —
 *    a breathing exercise that does not say "this isn't meant to make the
 *    feeling disappear" is quietly promising something it cannot deliver.
 */
export function PlayerShell({
  intervention,
  progress,
  onStop,
  children,
  footer,
}: {
  intervention: Intervention;
  /** 0–1, or null where the exercise has no meaningful progress. */
  progress: number | null;
  onStop: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="player" aria-label={intervention.title}>
      <header className="player-head">
        <div>
          <h2>{intervention.title}</h2>
          <p className="player-framing">{intervention.framing}</p>
        </div>
        <button type="button" className="ghost" onClick={onStop}>
          Stop
        </button>
      </header>

      {progress !== null ? (
        <div
          className="player-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      ) : null}

      <div className="player-body">{children}</div>

      {footer !== undefined ? <div className="player-footer">{footer}</div> : null}
    </section>
  );
}

/** A jot that never leaves the browser. */
export function OptionalCapture({
  question,
  placeholder,
  value,
  onChange,
}: {
  question: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="capture">
      <span>{question}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        enterKeyHint="next"
      />
      <span className="capture-note">Optional, and it stays on this device.</span>
    </label>
  );
}
