import { afterEach, describe, expect, it } from "vitest";

import { SAFETY_CATEGORIES } from "@/core/safety/risk";
import { RECORD_TURN_TOOL } from "@/core/conversation/turn-contract";

import { CLASSIFY_PARAMETERS } from "./classifier-contract";
import {
  failureForStatus,
  isContentFailure,
  isInfrastructureFailure,
  type FailureKind,
} from "./failure";
import {
  aiProvider,
  classifierModel,
  classifierVersion,
  conversationModel,
  isAiProvider,
} from "./models";
import { checkBlocked, readUsage, SAFETY_SETTINGS, thinkingLevel } from "./google/client";

const original = {
  provider: process.env["AERIS_AI_PROVIDER"],
  conversation: process.env["AERIS_CONVERSATION_MODEL"],
  classifier: process.env["AERIS_CLASSIFIER_MODEL"],
};

afterEach(() => {
  for (const [key, value] of [
    ["AERIS_AI_PROVIDER", original.provider],
    ["AERIS_CONVERSATION_MODEL", original.conversation],
    ["AERIS_CLASSIFIER_MODEL", original.classifier],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("choosing a provider", () => {
  it("defaults to Google", () => {
    delete process.env["AERIS_AI_PROVIDER"];
    expect(aiProvider()).toBe("google");
    expect(conversationModel()).toMatch(/^gemini-/);
  });

  it("moves the whole application back to Anthropic with one variable", () => {
    // The reason the second adapter was kept rather than deleted. If this ever
    // stops working, the migration has become irreversible without a release.
    process.env["AERIS_AI_PROVIDER"] = "anthropic";
    expect(aiProvider()).toBe("anthropic");
    expect(conversationModel()).toMatch(/^claude-/);
    expect(classifierModel()).toMatch(/^claude-/);
  });

  it("ignores a provider it does not have an adapter for", () => {
    process.env["AERIS_AI_PROVIDER"] = "openai";
    expect(aiProvider()).toBe("google");
    expect(isAiProvider("openai")).toBe(false);
  });

  it("lets an explicit model override the provider default", () => {
    delete process.env["AERIS_AI_PROVIDER"];
    process.env["AERIS_CLASSIFIER_MODEL"] = "gemini-3.1-flash-lite";
    expect(classifierModel()).toBe("gemini-3.1-flash-lite");
  });

  it("does not put the cheap model on the classifier by default", () => {
    // Flash-Lite is roughly ten times cheaper and is the obvious saving. It is
    // gated behind `npm run eval:safety` on purpose, and this test is what
    // stops the gate being removed quietly in a cost-cutting pass.
    delete process.env["AERIS_AI_PROVIDER"];
    delete process.env["AERIS_CLASSIFIER_MODEL"];
    expect(classifierModel()).not.toContain("lite");
  });
});

describe("classifier version", () => {
  it("names the model, so a swap cannot ship without the audit trail changing", () => {
    delete process.env["AERIS_AI_PROVIDER"];
    delete process.env["AERIS_CLASSIFIER_MODEL"];
    const before = classifierVersion();
    process.env["AERIS_CLASSIFIER_MODEL"] = "gemini-3.1-flash-lite";
    expect(classifierVersion()).not.toBe(before);
    expect(classifierVersion()).toContain("gemini-3.1-flash-lite");
  });
});

describe("failure taxonomy", () => {
  it("maps the statuses that matter", () => {
    expect(failureForStatus(401)).toBe("unauthorized");
    expect(failureForStatus(403)).toBe("unauthorized");
    expect(failureForStatus(429)).toBe("rate_limited");
    expect(failureForStatus(400)).toBe("malformed");
    expect(failureForStatus(503)).toBe("overloaded");
    expect(failureForStatus(504)).toBe("timeout");
  });

  it("separates a refusal from a provider block", () => {
    // They end in the same reviewed copy today, which is exactly why they must
    // stay distinguishable: a blocked classifier never saw the message, and
    // that is an operational alarm hiding inside a content outcome.
    expect(isContentFailure("refusal")).toBe(true);
    expect(isContentFailure("blocked")).toBe(true);
    expect(isInfrastructureFailure("blocked")).toBe(false);
    expect(isInfrastructureFailure("refusal")).toBe(false);
  });

  it("treats outages as infrastructure, never as content", () => {
    const outages: FailureKind[] = ["rate_limited", "overloaded", "timeout", "unavailable"];
    for (const kind of outages) {
      expect(isInfrastructureFailure(kind)).toBe(true);
      expect(isContentFailure(kind)).toBe(false);
    }
  });
});

describe("Google safety settings", () => {
  it("covers every adjustable category", () => {
    // A category left unset inherits a default that Google can change. The
    // point of setting them is that this application decides, not that the
    // current default happens to suit it.
    expect(SAFETY_SETTINGS).toHaveLength(4);
    const categories = SAFETY_SETTINGS.map((setting) => setting.category);
    expect(new Set(categories).size).toBe(4);
    expect(categories).toContain("HARM_CATEGORY_DANGEROUS_CONTENT");
  });

  it("turns every filter off, deliberately", () => {
    // See the long note in google/client.ts. The classifier's job is to read
    // self-harm text; a filter that hides it disables the safety mechanism.
    for (const setting of SAFETY_SETTINGS) {
      expect(setting.threshold).toBe("OFF");
    }
  });
});

describe("detecting a Google block", () => {
  it("catches a blocked prompt", () => {
    const check = checkBlocked({ promptFeedback: { blockReason: "SAFETY" } } as never);
    expect(check).toEqual({ blocked: true, where: "prompt" });
  });

  it("catches a response cut off by the filter", () => {
    const check = checkBlocked({ candidates: [{ finishReason: "SAFETY" }] } as never);
    expect(check).toEqual({ blocked: true, where: "response" });
  });

  it("does not call an ordinary completion blocked", () => {
    const check = checkBlocked({ candidates: [{ finishReason: "STOP" }] } as never);
    expect(check.blocked).toBe(false);
  });

  it("does not call an empty response blocked", () => {
    // An empty response is a different failure. Reading it as a block would
    // hide a real outage behind a content explanation.
    expect(checkBlocked({} as never).blocked).toBe(false);
  });
});

describe("Google usage", () => {
  it("bills thinking tokens as output", () => {
    // Gemini 3 Pro cannot disable thinking, so leaving thoughts out of the
    // output count understates the cost of every single turn.
    const usage = readUsage({
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        thoughtsTokenCount: 400,
        cachedContentTokenCount: 80,
      },
    } as never);
    expect(usage.inputTokens).toBe(100);
    expect(usage.outputTokens).toBe(450);
    expect(usage.cacheReadTokens).toBe(80);
    expect(usage.thoughtTokens).toBe(400);
  });

  it("reads a response with no usage metadata as zero rather than throwing", () => {
    expect(readUsage({} as never).outputTokens).toBe(0);
  });
});

describe("thinking levels", () => {
  it("maps the levels named in models.ts", () => {
    expect(thinkingLevel("LOW")).toBe("LOW");
    expect(thinkingLevel("MEDIUM")).toBe("MEDIUM");
    expect(thinkingLevel("MINIMAL")).toBe("MINIMAL");
  });

  it("falls back to LOW for a level it does not know", () => {
    expect(thinkingLevel("EXTREME")).toBe("LOW");
  });
});

describe("the shared tool schemas", () => {
  it("offers the classifier exactly the categories core defines", () => {
    // Both providers receive this same object. A drift here would let one
    // provider return a category the risk ladder has no meaning for.
    expect(CLASSIFY_PARAMETERS.properties.category.enum).toEqual([...SAFETY_CATEGORIES]);
  });

  it("keeps record_turn's schema usable as plain JSON Schema", () => {
    // Anthropic takes it as `input_schema`, Google as `parametersJsonSchema`.
    // Both require a plain object schema with explicit required keys.
    expect(RECORD_TURN_TOOL.input_schema.type).toBe("object");
    expect(Array.isArray(RECORD_TURN_TOOL.input_schema.required)).toBe(true);
    expect(RECORD_TURN_TOOL.input_schema.required).toContain("next_state");
  });
});
