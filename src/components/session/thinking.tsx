"use client";

import { useEffect, useState } from "react";

import type { State } from "@/core/conversation/states";

/** What is actually happening, rather than a spinner that says nothing. */
const STAGE_LABELS: Partial<Record<State, string>> = {
  START: "Reading what you wrote",
  UNDERSTAND: "Reading what you wrote",
  CLARIFY: "Reading what you wrote",
  NAME_PATTERN: "Noticing what your mind is doing",
  OFFER_TOOL: "Choosing something that might help",
  IN_TOOL: "Getting that ready",
  REASSESS: "Taking that in",
  REFLECT: "Taking that in",
};

/**
 * The pause between sending and the first word arriving.
 *
 * Appears after 300ms, so a fast turn never flashes it, and names the stage
 * rather than spinning. At 1 a.m. a blank screen reads as being ignored.
 */
export function Thinking({ state }: { state: State }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <p className="thinking" aria-live="polite">
      {STAGE_LABELS[state] ?? "Thinking"}
      <span className="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </p>
  );
}
