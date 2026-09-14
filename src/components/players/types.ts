import type { Intervention } from "@/core/interventions/catalog";

/**
 * What every player is handed and what it reports back.
 *
 * `onDone` carries no free text. What a person writes inside an exercise stays
 * in the browser; only the fact that they finished, and how the intensity
 * moved, is worth keeping — and it is the only thing "what helps you" needs.
 */
export interface PlayerProps {
  readonly intervention: Intervention;
  /** Finished the exercise. `completed` is false when they stopped early. */
  readonly onDone: (result: { completed: boolean }) => void;
  /** Set for the delay timer, which has an urge to settle. */
  readonly urgeId?: string | null;
}
