import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { repository, repositoryKind, setRepositoryForTesting } from "./index";
import { createMemoryRepository, resetMemoryStore } from "./memory";
import type { Repository, UpsertSubscriptionInput } from "./types";

const USER = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const OTHER = "9c858901-8a57-4791-81fe-4c455b099bc9";

let repo: Repository;

beforeEach(() => {
  resetMemoryStore();
  repo = createMemoryRepository();
});

const upsert = (overrides: Partial<UpsertSubscriptionInput> = {}): UpsertSubscriptionInput => ({
  userId: USER,
  plan: "plus",
  status: "active",
  environment: "sandbox",
  provider: "paddle",
  providerCustomerId: "ctm_1",
  providerSubscriptionId: "sub_1",
  providerPriceId: "pri_plus",
  currentPeriodEnd: new Date("2026-10-01T00:00:00Z"),
  cancelAtPeriodEnd: false,
  lastEventAt: new Date("2026-09-01T00:00:00Z"),
  ...overrides,
});

describe("ownership", () => {
  it("answers identically for a stranger's session and one that never existed", () => {
    return (async () => {
      const session = await repo.createSession({
        userId: USER,
        intensityBefore: 6,
        localHour: 1,
        localDow: 3,
        tzAtStart: "Asia/Hong_Kong",
      });
      expect(await repo.getSession(session.id, OTHER)).toBeNull();
      expect(await repo.getSession("00000000-0000-0000-0000-000000000000", OTHER)).toBeNull();
    })();
  });
});

describe("the delay clock", () => {
  it("cannot be restarted, so a reload never shortens a wait", async () => {
    const urge = await repo.createUrge({
      userId: USER,
      sessionId: null,
      target: "ask_person",
      delayMinutes: null,
    });

    const first = await repo.startDelay(urge.id, USER, 10);
    expect(first?.delayStartedAt).not.toBeNull();

    const second = await repo.startDelay(urge.id, USER, 30);
    // The second call keeps the first start. Anything else would let someone
    // close the tab, reopen it, and be told they had waited longer than they
    // had — which is the one thing this exercise must never do.
    expect(second?.delayStartedAt?.getTime()).toBe(first?.delayStartedAt?.getTime());
  });

  it("records nothing as resisted until the person says so", async () => {
    const urge = await repo.createUrge({
      userId: USER,
      sessionId: null,
      target: "search",
      delayMinutes: null,
    });
    await repo.startDelay(urge.id, USER, 10);
    expect((await repo.getUrge(urge.id, USER))?.resisted).toBeNull();

    await repo.settleUrge(urge.id, USER, false);
    expect((await repo.getUrge(urge.id, USER))?.resisted).toBe(false);
  });
});

describe("subscription writes", () => {
  it("stores what the provider said", async () => {
    await repo.upsertSubscription(upsert());
    const row = await repo.getSubscription(USER);
    expect(row?.plan).toBe("plus");
    expect(row?.status).toBe("active");
  });

  it("discards a webhook older than what is already stored", async () => {
    // The scenario: a cancellation is processed, then a retry of the original
    // `subscription.created` arrives. Without the guard it reinstates a plan
    // the person has cancelled.
    await repo.upsertSubscription(
      upsert({ status: "canceled", lastEventAt: new Date("2026-09-10T00:00:00Z") }),
    );
    await repo.upsertSubscription(
      upsert({ status: "active", lastEventAt: new Date("2026-09-01T00:00:00Z") }),
    );
    expect((await repo.getSubscription(USER))?.status).toBe("canceled");
  });

  it("applies a webhook newer than what is stored", async () => {
    await repo.upsertSubscription(
      upsert({ status: "active", lastEventAt: new Date("2026-09-01T00:00:00Z") }),
    );
    await repo.upsertSubscription(
      upsert({ status: "past_due", lastEventAt: new Date("2026-09-10T00:00:00Z") }),
    );
    expect((await repo.getSubscription(USER))?.status).toBe("past_due");
  });

  it("finds the account behind a customer id", async () => {
    await repo.upsertSubscription(upsert());
    expect(await repo.findUserIdByCustomer("paddle", "ctm_1")).toBe(USER);
    expect(await repo.findUserIdByCustomer("paddle", "ctm_unknown")).toBeNull();
    expect(await repo.findUserIdByCustomer("stripe", "ctm_1")).toBeNull();
  });
});

describe("webhook replay and retry", () => {
  const event = { provider: "paddle", eventType: "subscription.created", environment: "sandbox" };

  it("claims an event once", async () => {
    expect(await repo.recordBillingEvent({ ...event, eventId: "evt_1", occurredAt: null })).toBe(
      true,
    );
    expect(await repo.recordBillingEvent({ ...event, eventId: "evt_1", occurredAt: null })).toBe(
      false,
    );
  });

  it("does not re-claim an event that was processed", async () => {
    await repo.recordBillingEvent({ ...event, eventId: "evt_1", occurredAt: null });
    await repo.markBillingEvent("paddle", "evt_1", "processed", null);
    expect(await repo.recordBillingEvent({ ...event, eventId: "evt_1", occurredAt: null })).toBe(
      false,
    );
  });

  it("re-claims an event that failed, so a retry is not swallowed", async () => {
    // We answer 500 on a processing failure to ask Paddle to retry. If the
    // replay guard then rejected the retry, the failure would be permanent
    // and silent — the guard would defeat the very thing it asked for.
    await repo.recordBillingEvent({ ...event, eventId: "evt_1", occurredAt: null });
    await repo.markBillingEvent("paddle", "evt_1", "failed", "processing_error");
    expect(await repo.recordBillingEvent({ ...event, eventId: "evt_1", occurredAt: null })).toBe(
      true,
    );
  });
});

describe("the monthly allowance", () => {
  it("counts per person and per period", async () => {
    await repo.incrementGuidedSessions(USER, "2026-09-01");
    await repo.incrementGuidedSessions(USER, "2026-09-01");
    await repo.incrementGuidedSessions(USER, "2026-10-01");

    expect(await repo.countGuidedSessions(USER, "2026-09-01")).toBe(2);
    expect(await repo.countGuidedSessions(USER, "2026-10-01")).toBe(1);
    expect(await repo.countGuidedSessions(OTHER, "2026-09-01")).toBe(0);
  });
});

describe("choosing a repository", () => {
  const original = { url: process.env["DATABASE_URL"], env: process.env["APP_ENV"] };

  afterEach(() => {
    process.env["DATABASE_URL"] = original.url;
    process.env["APP_ENV"] = original.env;
    setRepositoryForTesting(null);
  });

  it("uses the in-memory store when no database is configured", () => {
    delete process.env["DATABASE_URL"];
    expect(repositoryKind()).toBe("memory");
  });

  it("uses Postgres the moment a database is configured", () => {
    process.env["DATABASE_URL"] = "postgresql://u:p@host:6543/postgres";
    expect(repositoryKind()).toBe("postgres");
  });

  it("refuses to back production with the in-memory store", () => {
    // The failure being prevented is not a crash. It is a deployment that
    // looks completely healthy while losing every conversation each time an
    // instance recycles.
    delete process.env["DATABASE_URL"];
    process.env["APP_ENV"] = "production";
    setRepositoryForTesting(null);
    expect(() => repository()).toThrow(/DATABASE_URL is not set/);
  });
});
