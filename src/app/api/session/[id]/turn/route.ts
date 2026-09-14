import { LIMITS } from "@/server/ai/models";
import { identityFor, json, optionalString, readJson } from "@/server/http";
import { runSessionTurn, SessionError } from "@/server/services/session";
import { encodeEvent, NDJSON_CONTENT_TYPE, type StreamEvent } from "@/lib/stream-protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * A generated reply plus its structured decision takes longer than Vercel's
 * default. 60 seconds is the ceiling on the Hobby plan and comfortably above
 * what a turn needs; raise it on Pro only if the model is asked to do more.
 *
 * The runtime is Node rather than Edge on purpose: the Postgres driver and the
 * Anthropic SDK both need APIs the Edge runtime does not have, and streaming
 * works identically on Node.
 */
export const maxDuration = 60;

/**
 * One turn, streamed.
 *
 * The reply is sent as it is generated so the person is not watching a blank
 * screen; the structured result follows in a final `done` event. Errors are
 * sent inside the stream rather than as a status code, because by the time one
 * happens the response has already started.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const identity = await identityFor(request);
  const { id } = await context.params;
  const body = await readJson(request);

  const message = optionalString(body["message"]);
  if (message === undefined || message.length > LIMITS.maxInputChars) {
    return json(
      { error: "invalid_message", maxChars: LIMITS.maxInputChars },
      { status: 400, headers: identity.headers },
    );
  }

  const clientEventId = optionalString(body["clientEventId"]);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent): void => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      try {
        const result = await runSessionTurn({
          userId: identity.userId,
          sessionId: id,
          message,
          ...(clientEventId !== undefined ? { clientEventId } : {}),
          onTextDelta: (text) => send({ t: "delta", text }),
        });

        send({
          t: "done",
          payload: {
            messageId: result.messageId,
            text: result.text,
            state: result.state,
            ui: { kind: result.ui.kind, choices: result.ui.choices },
            recommendedIntervention: result.recommendedIntervention,
            interventionHelpedBefore: result.interventionHelpedBefore,
            safety: result.safety,
            urge: result.urge,
            degraded: result.degraded,
            blocked: result.blocked,
          },
        });
      } catch (error) {
        if (error instanceof SessionError) {
          send({
            t: "error",
            code: error.code,
            message: error.message,
            retryable: error.code === "empty_message",
          });
        } else {
          // Nothing from the provider or the stack reaches the browser.
          console.error("[aeris/turn] unhandled turn failure");
          send({
            t: "error",
            code: "server_error",
            message: "Something went wrong on our side.",
            retryable: true,
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": NDJSON_CONTENT_TYPE,
      "cache-control": "no-store",
      // Stops a reverse proxy buffering the stream into one lump at the end.
      "x-accel-buffering": "no",
      ...identity.headers,
    },
  });
}
