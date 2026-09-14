"use client";

import type { Intervention } from "@/core/interventions/catalog";

import { BreathPlayer } from "./breath-player";
import { DelayPlayer } from "./delay-player";
import { PromptsPlayer } from "./prompts-player";
import { SequencePlayer } from "./sequence-player";
import { TwoColumnPlayer } from "./two-column-player";
import type { PlayerProps } from "./types";

export type { PlayerProps } from "./types";

/**
 * Ten exercises, five shapes.
 *
 * The switch is exhaustive over the content union, so adding a new shape to
 * the catalog is a type error here rather than a blank screen at 2 a.m.
 */
export function InterventionPlayer(props: PlayerProps) {
  const { content } = props.intervention;
  switch (content.kind) {
    case "sequence":
      return <SequencePlayer {...props} />;
    case "breath":
      return <BreathPlayer {...props} />;
    case "prompts":
      return <PromptsPlayer {...props} />;
    case "two_column":
      return <TwoColumnPlayer {...props} />;
    case "timer":
      return <DelayPlayer {...props} />;
  }
}

export function playerExistsFor(intervention: Intervention): boolean {
  return ["sequence", "breath", "prompts", "two_column", "timer"].includes(
    intervention.content.kind,
  );
}
