/**
 * The wire format between the turn endpoint and the browser.
 *
 * Newline-delimited JSON over a plain `ReadableStream`. No dependency, works
 * on Node and Edge, and you can watch a real conversation with `curl -N`,
 * which matters more than it sounds when the thing you are debugging only
 * misbehaves on the fourth turn.
 *
 * Imported by client components, so it may contain types and pure helpers
 * only — never anything that reaches for the server.
 */
import type { CopyRoute, SafetyRoute } from "@/core/safety";
import type { CrisisResource } from "@/core/copy";
import type { InterventionSlug } from "@/core/interventions/catalog";
import type { State } from "@/core/conversation/states";
import type { UiKind } from "@/core/conversation/turn-contract";
import type { UrgeTarget } from "@/core/urges";

export const NDJSON_CONTENT_TYPE = "application/x-ndjson";

export interface TurnPayload {
  readonly messageId: string;
  readonly text: string;
  readonly state: State;
  readonly ui: { readonly kind: UiKind; readonly choices: readonly string[] | null };
  readonly recommendedIntervention: InterventionSlug | null;
  readonly interventionHelpedBefore: boolean;
  readonly safety: {
    readonly route: SafetyRoute;
    readonly copyRoute: CopyRoute | null;
    readonly countryCode: string | null;
    readonly resources: readonly CrisisResource[];
  };
  readonly urge: { readonly id: string; readonly target: UrgeTarget } | null;
  readonly degraded: boolean;
  readonly blocked: "allowance_exhausted" | null;
}

export type StreamEvent =
  /** A fragment of the reply that has passed the output guards. */
  | { readonly t: "delta"; readonly text: string }
  /** The turn finished. Everything the screen needs is here. */
  | { readonly t: "done"; readonly payload: TurnPayload }
  /**
   * The turn could not run. `retryable` tells the screen whether to offer the
   * message back to the person or send them to the toolkit instead.
   */
  | {
      readonly t: "error";
      readonly code: "not_found" | "terminal" | "empty_message" | "server_error";
      readonly message: string;
      readonly retryable: boolean;
    };

export function encodeEvent(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/**
 * Reads the stream a line at a time.
 *
 * Deltas arrive mid-line often enough that buffering is not optional: a JSON
 * object split across two network chunks must not be parsed twice or dropped.
 */
export async function* readStream(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line.length > 0) {
          const parsed = parseEvent(line);
          if (parsed !== null) yield parsed;
        }
        newline = buffer.indexOf("\n");
      }
    }

    const tail = buffer.trim();
    if (tail.length > 0) {
      const parsed = parseEvent(tail);
      if (parsed !== null) yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}

/** A malformed line is skipped rather than throwing away the rest of the turn. */
export function parseEvent(line: string): StreamEvent | null {
  try {
    const value = JSON.parse(line) as unknown;
    if (typeof value !== "object" || value === null) return null;
    const event = value as StreamEvent;
    return event.t === "delta" || event.t === "done" || event.t === "error" ? event : null;
  } catch {
    return null;
  }
}
