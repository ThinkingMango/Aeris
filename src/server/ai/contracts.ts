/**
 * What a model adapter must provide, independent of who provides it.
 *
 * Extracted when the second provider arrived. Both adapters implement these
 * exact signatures, which is what lets `classify.ts` and `turn.ts` be thin
 * dispatchers and lets the session service stay entirely unaware that there is
 * more than one provider at all.
 */
import type { ClassifierReading } from "@/core/safety/merge";
import type {
  Correction,
  TurnDecision,
  ValidationContext,
} from "@/core/conversation/turn-contract";
import type { GuardId } from "@/core/safety/output-guards";

import type { FailureKind } from "./failure";
import type { TurnContextInput } from "./prompt";

export interface HistoryMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface RunTurnInput {
  readonly requestId: string;
  readonly userMessage: string;
  readonly history: readonly HistoryMessage[];
  readonly promptContext: TurnContextInput;
  readonly validation: ValidationContext;
  /** Called for every text delta that survives the guards. */
  readonly onTextDelta: (delta: string) => void;
}

export interface TurnResult {
  /** What the person should end up seeing. */
  readonly text: string;
  readonly decision: TurnDecision;
  readonly corrections: readonly Correction[];
  readonly guards: readonly GuardId[];
  /** True when a guard aborted the stream and the text was replaced. */
  readonly guardAborted: boolean;
  /** True when the provider failed and the app answered instead. */
  readonly degraded: boolean;
  readonly failureKind: FailureKind | null;
}

/**
 * Classifies one message.
 *
 * Returns null on **any** failure, which the safety gate reads as "could not
 * run" and never as "no risk". Every adapter must preserve that: a classifier
 * that returns a cheerful zero when it could not reach the provider would turn
 * an outage into a miss.
 */
export type ClassifyMessage = (
  message: string,
  requestId: string,
) => Promise<ClassifierReading | null>;

export type RunTurn = (input: RunTurnInput) => Promise<TurnResult>;

export interface ModelAdapter {
  readonly classifyMessage: ClassifyMessage;
  readonly runTurn: RunTurn;
}
