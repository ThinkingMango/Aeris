"use client";

import { useState } from "react";

import { INTENSITY_MAX, INTENSITY_MIN } from "@/core/patterns/taxonomy";

/**
 * Where the intensity is now.
 *
 * This is the measurement that makes "what helps you" mean anything, so it is
 * asked once, plainly, and is skippable. A number nobody wanted to give is
 * worse than a missing one.
 */
export function Reassess({
  before,
  onAnswer,
  onSkip,
}: {
  before: number | null;
  onAnswer: (intensity: number, helpfulness: number | null) => void;
  onSkip: () => void;
}) {
  const [intensity, setIntensity] = useState<number>(before ?? 5);
  const [helpfulness, setHelpfulness] = useState<number | null>(null);

  return (
    <aside className="reassess">
      <h3>Where is it now?</h3>
      {before !== null ? <p className="muted">It was {before} when you started.</p> : null}

      <input
        type="range"
        min={INTENSITY_MIN}
        max={INTENSITY_MAX}
        value={intensity}
        aria-label="Intensity now"
        onChange={(event) => setIntensity(Number(event.target.value))}
      />
      <div className="scale-ends">
        <span>{INTENSITY_MIN} manageable</span>
        <strong>{intensity}</strong>
        <span>{INTENSITY_MAX} overwhelming</span>
      </div>

      <p className="muted">Did that help?</p>
      <div className="row choices">
        {[
          { value: 1, label: "Not really" },
          { value: 2, label: "A bit" },
          { value: 3, label: "Yes" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className={helpfulness === option.value ? "chip selected" : "chip"}
            aria-pressed={helpfulness === option.value}
            onClick={() => setHelpfulness(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="row">
        <button type="button" className="primary" onClick={() => onAnswer(intensity, helpfulness)}>
          Save
        </button>
        <button type="button" className="ghost" onClick={onSkip}>
          Skip
        </button>
      </div>
    </aside>
  );
}
