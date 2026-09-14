"use client";

import { useState } from "react";

import type { Content } from "@/core/interventions/catalog";

import { PlayerShell } from "./player-shell";
import type { PlayerProps } from "./types";

/** One line at a time, sorted into two columns. */
function Column({
  title,
  hint,
  items,
  onAdd,
  onRemove,
}: {
  title: string;
  hint: string;
  items: readonly string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");

  const submit = (): void => {
    const value = draft.trim();
    if (value.length === 0) return;
    onAdd(value);
    setDraft("");
  };

  return (
    <div className="column">
      <h3>{title}</h3>
      <p className="step-hint">{hint}</p>
      <ul>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span>{item}</span>
            <button
              type="button"
              className="ghost small"
              aria-label={`Remove ${item}`}
              onClick={() => onRemove(index)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Add one"
          aria-label={`Add to ${title}`}
        />
        <button type="button" className="ghost" onClick={submit}>
          Add
        </button>
      </div>
    </div>
  );
}

/**
 * Sorting a situation into what is yours and what is not.
 *
 * The two columns are deliberately equal in weight. Making "within my control"
 * look like the good column would imply the other one is a failure, and most
 * of what makes people anxious lives in it.
 */
export function TwoColumnPlayer({ intervention, onDone }: PlayerProps) {
  const content = intervention.content as Extract<Content, { kind: "two_column" }>;
  const [left, setLeft] = useState<string[]>([]);
  const [right, setRight] = useState<string[]>([]);

  return (
    <PlayerShell
      intervention={intervention}
      progress={null}
      onStop={() => onDone({ completed: false })}
      footer={<span className="muted">This stays on your device.</span>}
    >
      <div className="columns">
        <Column
          title={content.leftTitle}
          hint={content.leftHint}
          items={left}
          onAdd={(value) => setLeft((current) => [...current, value])}
          onRemove={(index) => setLeft((current) => current.filter((_, i) => i !== index))}
        />
        <Column
          title={content.rightTitle}
          hint={content.rightHint}
          items={right}
          onAdd={(value) => setRight((current) => [...current, value])}
          onRemove={(index) => setRight((current) => current.filter((_, i) => i !== index))}
        />
      </div>

      <p className="step-instruction closing">{content.closing}</p>

      <div className="row">
        <button type="button" className="primary" onClick={() => onDone({ completed: true })}>
          Done
        </button>
      </div>
    </PlayerShell>
  );
}
