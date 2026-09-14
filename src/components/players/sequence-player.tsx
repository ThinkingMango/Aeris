"use client";

import { useState } from "react";

import type { Content } from "@/core/interventions/catalog";
import { stepProgress } from "@/core/interventions/timing";

import { OptionalCapture, PlayerShell } from "./player-shell";
import type { PlayerProps } from "./types";

/**
 * One instruction at a time.
 *
 * Deliberately not a scrollable list. A person with a racing mind reading six
 * instructions at once will read none of them; one at a time, with the way
 * back always available, is the whole design.
 */
export function SequencePlayer({ intervention, onDone }: PlayerProps) {
  const content = intervention.content as Extract<Content, { kind: "sequence" }>;
  const [index, setIndex] = useState(0);
  const [captures, setCaptures] = useState<Record<number, string>>({});

  const progress = stepProgress(index, content.steps.length);
  const step = content.steps[progress.index];
  if (step === undefined) return null;

  return (
    <PlayerShell
      intervention={intervention}
      progress={progress.total === 0 ? null : (progress.position - 1) / progress.total}
      onStop={() => onDone({ completed: false })}
      footer={
        <span className="muted">
          {progress.position} of {progress.total}
        </span>
      }
    >
      <p className="step-instruction">{step.instruction}</p>
      {step.hint !== undefined ? <p className="step-hint">{step.hint}</p> : null}

      {step.capture !== undefined ? (
        <OptionalCapture
          question={step.capture.question}
          placeholder={step.capture.placeholder}
          value={captures[progress.index] ?? ""}
          onChange={(value) =>
            setCaptures((current) => ({ ...current, [progress.index]: value }))
          }
        />
      ) : null}

      <div className="row">
        {!progress.isFirst ? (
          <button type="button" className="ghost" onClick={() => setIndex(progress.index - 1)}>
            Back
          </button>
        ) : null}
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (progress.isLast) onDone({ completed: true });
            else setIndex(progress.index + 1);
          }}
        >
          {progress.isLast ? "Done" : "Next"}
        </button>
      </div>
    </PlayerShell>
  );
}
