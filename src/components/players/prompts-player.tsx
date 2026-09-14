"use client";

import { useState } from "react";

import type { Content } from "@/core/interventions/catalog";
import { stepProgress } from "@/core/interventions/timing";

import { PlayerShell } from "./player-shell";
import type { PlayerProps } from "./types";

/**
 * A few questions, one screen each.
 *
 * Nothing is required. Someone who wants to think about a question without
 * typing an answer should be able to move on, so "Next" is never disabled.
 * A form that blocks on an empty field would turn a reflective exercise into
 * a compliance test.
 */
export function PromptsPlayer({ intervention, onDone }: PlayerProps) {
  const content = intervention.content as Extract<Content, { kind: "prompts" }>;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const progress = stepProgress(index, content.prompts.length);
  const prompt = content.prompts[progress.index];
  if (prompt === undefined) return null;

  return (
    <PlayerShell
      intervention={intervention}
      progress={progress.total === 0 ? null : (progress.position - 1) / progress.total}
      onStop={() => onDone({ completed: false })}
      footer={
        <span className="muted">
          {progress.position} of {progress.total} · nothing here is required
        </span>
      }
    >
      <label className="prompt">
        <span className="step-instruction">{prompt.question}</span>
        {prompt.hint !== undefined ? <span className="step-hint">{prompt.hint}</span> : null}
        <textarea
          value={answers[progress.index] ?? ""}
          onChange={(event) =>
            setAnswers((current) => ({ ...current, [progress.index]: event.target.value }))
          }
          rows={4}
          placeholder="Or just think about it."
        />
        <span className="capture-note">This stays on your device.</span>
      </label>

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
