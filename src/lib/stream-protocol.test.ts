/**
 * The wire format.
 *
 * Network chunks do not respect line boundaries. A JSON object split across
 * two TCP reads must be parsed once, not twice and not never — and the way to
 * find out whether the buffering is right is to split it deliberately.
 */
import { describe, expect, it } from "vitest";

import { encodeEvent, parseEvent, readStream, type StreamEvent } from "./stream-protocol";

function streamOf(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(chunks: readonly string[]): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of readStream(streamOf(chunks))) events.push(event);
  return events;
}

const delta = (text: string): StreamEvent => ({ t: "delta", text });

describe("encoding", () => {
  it("puts exactly one event on a line", () => {
    const line = encodeEvent(delta("hello"));
    expect(line.endsWith("\n")).toBe(true);
    expect(line.split("\n").filter(Boolean)).toHaveLength(1);
  });
});

describe("reading", () => {
  it("reads several events from one chunk", async () => {
    const events = await collect([
      encodeEvent(delta("a")) + encodeEvent(delta("b")) + encodeEvent(delta("c")),
    ]);
    expect(events).toHaveLength(3);
    expect(events.map((event) => (event.t === "delta" ? event.text : ""))).toEqual(["a", "b", "c"]);
  });

  it("reassembles an event split across chunks", async () => {
    const line = encodeEvent(delta("split me"));
    const cut = Math.floor(line.length / 2);
    const events = await collect([line.slice(0, cut), line.slice(cut)]);
    expect(events).toEqual([delta("split me")]);
  });

  it("reassembles an event split one byte at a time", async () => {
    const line = encodeEvent(delta("one byte at a time"));
    const events = await collect([...line]);
    expect(events).toEqual([delta("one byte at a time")]);
  });

  it("reads a final event that arrived without a trailing newline", async () => {
    const events = await collect([JSON.stringify(delta("no newline"))]);
    expect(events).toEqual([delta("no newline")]);
  });

  it("skips a malformed line rather than abandoning the rest of the turn", async () => {
    const events = await collect([
      encodeEvent(delta("before")),
      "{not json at all}\n",
      encodeEvent(delta("after")),
    ]);
    expect(events).toEqual([delta("before"), delta("after")]);
  });

  it("ignores blank lines and heartbeats", async () => {
    const events = await collect(["\n", "  \n", encodeEvent(delta("real")), "\n"]);
    expect(events).toEqual([delta("real")]);
  });

  it("handles multi-byte characters split across a chunk boundary", async () => {
    // A stream that cuts a UTF-8 sequence in half must not emit a replacement
    // character. Anxiety is not written only in ASCII.
    const encoder = new TextEncoder();
    const line = encoder.encode(encodeEvent(delta("你好 — ok")));
    const cut = 12;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(line.slice(0, cut));
        controller.enqueue(line.slice(cut));
        controller.close();
      },
    });
    const events: StreamEvent[] = [];
    for await (const event of readStream(stream)) events.push(event);
    expect(events).toEqual([delta("你好 — ok")]);
  });

  it("carries an error event through intact", async () => {
    const error: StreamEvent = {
      t: "error",
      code: "terminal",
      message: "This session has finished.",
      retryable: false,
    };
    expect(await collect([encodeEvent(error)])).toEqual([error]);
  });
});

describe("parsing a single line", () => {
  it("rejects anything that is not one of our events", () => {
    expect(parseEvent('{"t":"nonsense"}')).toBeNull();
    expect(parseEvent("null")).toBeNull();
    expect(parseEvent("[1,2,3]")).toBeNull();
    expect(parseEvent("")).toBeNull();
    expect(parseEvent("plain text")).toBeNull();
  });

  it("accepts each of the three event kinds", () => {
    expect(parseEvent('{"t":"delta","text":"x"}')?.t).toBe("delta");
    expect(parseEvent('{"t":"done","payload":{}}')?.t).toBe("done");
    expect(parseEvent('{"t":"error","code":"server_error"}')?.t).toBe("error");
  });
});
