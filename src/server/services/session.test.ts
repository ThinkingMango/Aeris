/**
 * The order things happen in.
 *
 * Safety before the allowance, safety before generation, ownership before
 * anything. These are the assertions that would catch a refactor quietly
 * reordering the turn into something unsafe.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RiskLevel } from "@/core/safety/risk";

const classifyMessage = vi.fn();
const runTurn = vi.fn();

vi.mock("../ai/classify", () => ({ classifyMessage: (...args: unknown[]) => classifyMessage(...args) }));
vi.mock("../ai/turn", () => ({ runTurn: (...args: unknown[]) => runTurn(...args) }));

const { repository, resetMemoryStore } = await import("../repo");
const { completeExercise, runSessionTurn, settleUrge, startDelay, startSession, SessionError } =
  await import("./session");

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

function stubReply(over: Record<string, unknown> = {}) {
  return async (input: { onTextDelta: (delta: string) => void }) => {
    input.onTextDelta("Tell me what's going on.");
    return {
      text: "Tell me what's going on.",
      decision: {
        next_state: "UNDERSTAND",
        trigger: "work",
        patterns: [],
        needs_more_context: true,
        recommended_intervention: null,
        ui: { kind: "text", choices: null },
        urge: null,
        ...over,
      },
      corrections: [],
      guards: [],
      guardAborted: false,
      degraded: false,
      failureKind: null,
    };
  };
}

const silent = (): void => {};

async function newSession(userId = USER) {
  return startSession({
    userId,
    intensityBefore: 7,
    localHour: 1,
    localDow: 2,
    timezone: "Asia/Hong_Kong",
  });
}

beforeEach(() => {
  resetMemoryStore();
  classifyMessage.mockReset();
  runTurn.mockReset();
  classifyMessage.mockResolvedValue({
    level: RiskLevel.DISTRESS,
    category: "none",
    immediateDanger: false,
    needsRestriction: false,
    version: "test",
  });
  runTurn.mockImplementation(stubReply());
});

describe("starting a session", () => {
  it("captures local time at creation, because it cannot be recovered later", async () => {
    const session = await newSession();
    expect(session.localHour).toBe(1);
    expect(session.localDow).toBe(2);
    expect(session.tzAtStart).toBe("Asia/Hong_Kong");
    expect(session.state).toBe("START");
    expect(session.intensityBefore).toBe(7);
  });
});

describe("ownership", () => {
  it("hides another person's session behind the same answer as a missing one", async () => {
    const session = await newSession(USER);
    await expect(
      runSessionTurn({
        userId: OTHER,
        sessionId: session.id,
        message: "hello",
        onTextDelta: silent,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses a turn on a finished session", async () => {
    const session = await newSession();
    await repository().updateSession(session.id, USER, { state: "COMPLETE" });
    await expect(
      runSessionTurn({ userId: USER, sessionId: session.id, message: "hi", onTextDelta: silent }),
    ).rejects.toMatchObject({ code: "terminal" });
  });

  it("refuses an empty message before touching anything", async () => {
    const session = await newSession();
    await expect(
      runSessionTurn({ userId: USER, sessionId: session.id, message: "   ", onTextDelta: silent }),
    ).rejects.toBeInstanceOf(SessionError);
    expect(classifyMessage).not.toHaveBeenCalled();
  });
});

describe("an ordinary turn", () => {
  it("streams, persists both sides, and advances the state", async () => {
    const session = await newSession();
    const deltas: string[] = [];
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "my boss hasn't replied",
      onTextDelta: (delta) => deltas.push(delta),
    });

    expect(deltas.join("")).toBe(result.text);
    expect(result.state).toBe("UNDERSTAND");
    expect(result.blocked).toBeNull();

    const messages = await repository().listMessages(session.id, USER);
    expect(messages.map((row) => row.role)).toEqual(["user", "assistant"]);

    const updated = await repository().getSession(session.id, USER);
    expect(updated?.state).toBe("UNDERSTAND");
    expect(updated?.trigger).toBe("work");
  });

  it("hands the model only the exercises the server authorised", async () => {
    const session = await newSession();
    await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "I keep going over it",
      onTextDelta: silent,
    });
    const call = runTurn.mock.calls[0]?.[0] as { validation: { allowedInterventions: string[] } };
    expect(call.validation.allowedInterventions.length).toBeGreaterThan(0);
    // One in the morning: winding down should be on the table.
    expect(call.validation.allowedInterventions).toContain("wind_down");
  });
});

describe("safety comes first", () => {
  it("never sends literal crisis language to the model", async () => {
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "I'm going to kill myself tonight",
      onTextDelta: silent,
    });

    expect(runTurn).not.toHaveBeenCalled();
    expect(classifyMessage).not.toHaveBeenCalled();
    expect(result.safety.copyRoute).toBe("crisis");
    expect(result.state).toBe("SAFETY_HOLD");

    const updated = await repository().getSession(session.id, USER);
    expect(updated?.status).toBe("safety_hold");
  });

  it("offers crisis resources for the person's own country and no other", async () => {
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "I want to die",
      onTextDelta: silent,
    });
    // No country on the profile yet, so generic guidance rather than a guess.
    expect(result.safety.countryCode).toBe("XX");
    expect(result.safety.resources).toHaveLength(0);
  });

  it("answers a medication question from reviewed copy without the model", async () => {
    classifyMessage.mockResolvedValue({
      level: RiskLevel.ELEVATED,
      category: "medication",
      immediateDanger: false,
      needsRestriction: true,
      version: "test",
    });
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "should I stop taking my sertraline",
      onTextDelta: silent,
    });
    expect(runTurn).not.toHaveBeenCalled();
    expect(result.safety.copyRoute).toBe("medication");
    expect(result.state).not.toBe("SAFETY_HOLD");
  });

  it("never lets a spent allowance block a turn that needed help", async () => {
    for (let i = 0; i < 6; i += 1) {
      await repository().incrementGuidedSessions(USER, `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}-01`);
    }
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "I want to die",
      onTextDelta: silent,
    });
    expect(result.blocked).toBeNull();
    expect(result.safety.copyRoute).toBe("crisis");
  });
});

describe("the allowance", () => {
  const period = (): string => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  };

  it("counts a session once, on its first reply", async () => {
    const session = await newSession();
    await runSessionTurn({ userId: USER, sessionId: session.id, message: "one", onTextDelta: silent });
    await runSessionTurn({ userId: USER, sessionId: session.id, message: "two", onTextDelta: silent });
    expect(await repository().countGuidedSessions(USER, period())).toBe(1);
  });

  it("refuses an ordinary turn once the allowance is spent, and says so kindly", async () => {
    for (let i = 0; i < 5; i += 1) {
      await repository().incrementGuidedSessions(USER, period());
    }
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "work is a lot",
      onTextDelta: silent,
    });
    expect(result.blocked).toBe("allowance_exhausted");
    expect(runTurn).not.toHaveBeenCalled();
    expect(result.text).toContain("exercise still works");
  });
});

describe("idempotency", () => {
  it("replays a retried turn instead of running it twice", async () => {
    const session = await newSession();
    const event = crypto.randomUUID();

    const first = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "hello",
      clientEventId: event,
      onTextDelta: silent,
    });
    const second = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "hello",
      clientEventId: event,
      onTextDelta: silent,
    });

    expect(runTurn).toHaveBeenCalledTimes(1);
    expect(second.replayed).toBe(true);
    expect(second.messageId).toBe(first.messageId);
  });
});

describe("privacy switches", () => {
  it("reads no history at all when personalisation is off", async () => {
    const repo = repository();
    vi.spyOn(repo, "getPreferences").mockResolvedValue({
      userId: USER,
      keepConversations: true,
      personalization: false,
      analyticsOptIn: false,
    });
    const listPatterns = vi.spyOn(repo, "listPatterns");

    const session = await newSession();
    await runSessionTurn({ userId: USER, sessionId: session.id, message: "hi", onTextDelta: silent });
    expect(listPatterns).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("drops the transcript when the session ends and history is off", async () => {
    const repo = repository();
    vi.spyOn(repo, "getPreferences").mockResolvedValue({
      userId: USER,
      keepConversations: false,
      personalization: true,
      analyticsOptIn: false,
    });
    runTurn.mockImplementation(stubReply({ next_state: "COMPLETE" }));

    const session = await newSession();
    await repo.updateSession(session.id, USER, { state: "REFLECT" });
    await runSessionTurn({ userId: USER, sessionId: session.id, message: "thanks", onTextDelta: silent });

    expect(await repo.listMessages(session.id, USER)).toHaveLength(0);
    vi.restoreAllMocks();
  });
});

describe("the wedge", () => {
  it("records an urge when the model names one", async () => {
    runTurn.mockImplementation(stubReply({ urge: { target: "search", wants_delay: true } }));
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "am I definitely not ill? I keep googling it",
      onTextDelta: silent,
    });
    expect(result.urge).not.toBeNull();
    const urges = await repository().listUrges(USER);
    expect(urges[0]?.target).toBe("search");
    expect(urges[0]?.resisted).toBeNull();
  });

  it("falls back to reading the target itself when the model does not name one", async () => {
    const session = await newSession();
    const result = await runSessionTurn({
      userId: USER,
      sessionId: session.id,
      message: "am I definitely fine? I keep checking my pulse",
      onTextDelta: silent,
    });
    expect(result.urge).not.toBeNull();
    expect((await repository().listUrges(USER))[0]?.target).toBe("body_check");
  });

  it("starts a wait on the server, and a reload cannot restart it", async () => {
    const urge = await repository().createUrge({
      userId: USER,
      sessionId: null,
      target: "search",
      delayMinutes: null,
    });

    const first = await startDelay({ userId: USER, urgeId: urge.id, minutes: 10 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await startDelay({ userId: USER, urgeId: urge.id, minutes: 30 });

    expect(second.startedAt.getTime()).toBe(first.startedAt.getTime());
    expect(second.minutes).toBe(10);
  });

  it("never infers whether someone resisted", async () => {
    const urge = await repository().createUrge({
      userId: USER,
      sessionId: null,
      target: "search",
      delayMinutes: null,
    });
    await startDelay({ userId: USER, urgeId: urge.id, minutes: 10 });
    expect((await repository().getUrge(urge.id, USER))?.resisted).toBeNull();

    await settleUrge({ userId: USER, urgeId: urge.id, resisted: true });
    expect((await repository().getUrge(urge.id, USER))?.resisted).toBe(true);
  });

  it("will not settle somebody else's urge", async () => {
    const urge = await repository().createUrge({
      userId: USER,
      sessionId: null,
      target: "search",
      delayMinutes: null,
    });
    await expect(
      settleUrge({ userId: OTHER, urgeId: urge.id, resisted: true }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("recording an exercise", () => {
  it("takes the before-intensity from the session, not the browser", async () => {
    const session = await newSession();
    await completeExercise({
      userId: USER,
      sessionId: session.id,
      intervention: "grounding",
      completed: true,
      intensityAfter: 4,
      helpfulness: 3,
    });
    const runs = await repository().listRuns(USER);
    expect(runs[0]?.intensityBefore).toBe(7);
    expect(runs[0]?.intensityAfter).toBe(4);
    expect((await repository().getSession(session.id, USER))?.intensityAfter).toBe(4);
  });

  it("refuses to record against somebody else's session", async () => {
    const session = await newSession(USER);
    await expect(
      completeExercise({
        userId: OTHER,
        sessionId: session.id,
        intervention: "grounding",
        completed: true,
        intensityAfter: 4,
        helpfulness: 3,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});
