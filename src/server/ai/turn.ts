/**
 * One conversation turn, whichever provider is configured.
 *
 * A dispatcher and nothing else. Both adapters run the same output guards on
 * the live stream, apply the same `validateTurn` against server state, and
 * fall back to the same reviewed copy — because those are `core/` rules, not
 * provider behaviour, and a provider that could skip them would not be behind
 * a seam at all.
 */
import type { RunTurnInput, TurnResult } from "./contracts";
import { runTurnWithAnthropic } from "./anthropic/turn";
import { runTurnWithGoogle } from "./google/turn";
import { aiProvider } from "./models";

export type { HistoryMessage, RunTurnInput, TurnResult } from "./contracts";

export async function runTurn(input: RunTurnInput): Promise<TurnResult> {
  return aiProvider() === "anthropic" ? runTurnWithAnthropic(input) : runTurnWithGoogle(input);
}
