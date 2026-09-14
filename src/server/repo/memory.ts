/**
 * An in-memory repository.
 *
 * Exists so the whole product can be run, used and tested before a database
 * exists. It enforces the same ownership checks the Postgres implementation
 * will get from row-level security, so code written against it does not
 * quietly depend on being able to read somebody else's rows.
 *
 * State hangs off `globalThis` so that Next's hot reload does not wipe a
 * session mid-conversation while you are working on the screen rendering it.
 */
import { DEFAULT_TONE } from "@/core/patterns/taxonomy";
import type { RunRecord } from "@/core/interventions/ranking";

import type {
  AppendMessageInput,
  CreateSessionInput,
  CreateUrgeInput,
  MessageRow,
  PatternRow,
  PreferencesRow,
  ProfileRow,
  RecordBillingEventInput,
  RecordRunInput,
  Repository,
  SessionPatch,
  SessionRow,
  SubscriptionRow,
  UpsertSubscriptionInput,
  UrgeRow,
} from "./types";

interface Store {
  sessions: Map<string, SessionRow>;
  messages: MessageRow[];
  urges: UrgeRow[];
  patterns: PatternRow[];
  runs: (RunRecord & { userId: string })[];
  usage: Map<string, number>;
  profiles: Map<string, ProfileRow>;
  preferences: Map<string, PreferencesRow>;
  subscriptions: Map<string, SubscriptionRow>;
  /** Event id to status. Presence is the replay guard. */
  billingEvents: Map<string, string>;
}

const KEY = Symbol.for("aeris.memory.store");

function store(): Store {
  const holder = globalThis as unknown as Record<symbol, Store | undefined>;
  const existing = holder[KEY];
  if (existing !== undefined) return existing;
  const fresh: Store = {
    sessions: new Map(),
    messages: [],
    urges: [],
    patterns: [],
    runs: [],
    usage: new Map(),
    profiles: new Map(),
    preferences: new Map(),
    subscriptions: new Map(),
    billingEvents: new Map(),
  };
  holder[KEY] = fresh;
  return fresh;
}

/** Wipes everything. Tests only. */
export function resetMemoryStore(): void {
  const holder = globalThis as unknown as Record<symbol, Store | undefined>;
  holder[KEY] = undefined;
}

const id = (): string => crypto.randomUUID();

export function createMemoryRepository(): Repository {
  return {
    async createSession(input: CreateSessionInput): Promise<SessionRow> {
      const row: SessionRow = {
        id: id(),
        userId: input.userId,
        state: "START",
        status: "active",
        trigger: null,
        primaryPattern: null,
        intensityBefore: input.intensityBefore,
        intensityAfter: null,
        localHour: input.localHour,
        localDow: input.localDow,
        tzAtStart: input.tzAtStart,
        startedAt: new Date(),
        completedAt: null,
      };
      store().sessions.set(row.id, row);
      return row;
    },

    async getSession(sessionId: string, userId: string): Promise<SessionRow | null> {
      const row = store().sessions.get(sessionId);
      // A session owned by somebody else and one that does not exist answer
      // identically, so neither reveals the other.
      if (row === undefined || row.userId !== userId) return null;
      return row;
    },

    async updateSession(
      sessionId: string,
      userId: string,
      patch: SessionPatch,
    ): Promise<SessionRow | null> {
      const current = store().sessions.get(sessionId);
      if (current === undefined || current.userId !== userId) return null;
      const next: SessionRow = { ...current, ...patch };
      store().sessions.set(sessionId, next);
      return next;
    },

    async listSessions(userId: string, limit = 50): Promise<readonly SessionRow[]> {
      return [...store().sessions.values()]
        .filter((row) => row.userId === userId)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, limit);
    },

    async appendMessage(input: AppendMessageInput): Promise<MessageRow> {
      const row: MessageRow = {
        id: id(),
        sessionId: input.sessionId,
        userId: input.userId,
        role: input.role,
        content: input.content,
        state: input.state,
        clientEventId: input.clientEventId ?? null,
        createdAt: new Date(),
      };
      store().messages.push(row);
      return row;
    },

    async listMessages(sessionId: string, userId: string): Promise<readonly MessageRow[]> {
      return store()
        .messages.filter((row) => row.sessionId === sessionId && row.userId === userId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    async findAssistantMessageByEvent(
      userId: string,
      clientEventId: string,
    ): Promise<MessageRow | null> {
      return (
        store().messages.find(
          (row) =>
            row.userId === userId &&
            row.role === "assistant" &&
            row.clientEventId === clientEventId,
        ) ?? null
      );
    },

    async purgeMessages(sessionId: string, userId: string): Promise<void> {
      const current = store();
      current.messages = current.messages.filter(
        (row) => !(row.sessionId === sessionId && row.userId === userId),
      );
    },

    async listPatterns(userId: string): Promise<readonly PatternRow[]> {
      return store().patterns.filter((row) => row.userId === userId);
    },

    async recordRun(input: RecordRunInput): Promise<void> {
      store().runs.push({
        userId: input.userId,
        intervention: input.intervention,
        completed: input.completed,
        intensityBefore: input.intensityBefore,
        intensityAfter: input.intensityAfter,
        helpfulness: input.helpfulness,
      });
    },

    async listRuns(userId: string): Promise<readonly RunRecord[]> {
      return store()
        .runs.filter((row) => row.userId === userId)
        .map((row) => ({
          intervention: row.intervention,
          completed: row.completed,
          intensityBefore: row.intensityBefore,
          intensityAfter: row.intensityAfter,
          helpfulness: row.helpfulness,
        }));
    },

    async createUrge(input: CreateUrgeInput): Promise<UrgeRow> {
      const row: UrgeRow = {
        id: id(),
        userId: input.userId,
        sessionId: input.sessionId,
        target: input.target,
        delayMinutes: input.delayMinutes,
        delayStartedAt: null,
        resisted: null,
        createdAt: new Date(),
        settledAt: null,
      };
      store().urges.push(row);
      return row;
    },

    async getUrge(urgeId: string, userId: string): Promise<UrgeRow | null> {
      return store().urges.find((row) => row.id === urgeId && row.userId === userId) ?? null;
    },

    async startDelay(urgeId: string, userId: string, minutes: number): Promise<UrgeRow | null> {
      const current = store();
      const index = current.urges.findIndex((row) => row.id === urgeId && row.userId === userId);
      if (index === -1) return null;
      const existing = current.urges[index];
      /* c8 ignore next */
      if (existing === undefined) return null;
      // Starting a wait twice keeps the first start, so a reload cannot reset
      // the clock in the person's favour.
      if (existing.delayStartedAt !== null) return existing;
      const next: UrgeRow = { ...existing, delayMinutes: minutes, delayStartedAt: new Date() };
      current.urges[index] = next;
      return next;
    },

    async settleUrge(urgeId: string, userId: string, resisted: boolean): Promise<UrgeRow | null> {
      const current = store();
      const index = current.urges.findIndex((row) => row.id === urgeId && row.userId === userId);
      if (index === -1) return null;
      const existing = current.urges[index];
      /* c8 ignore next */
      if (existing === undefined) return null;
      const next: UrgeRow = { ...existing, resisted, settledAt: new Date() };
      current.urges[index] = next;
      return next;
    },

    async listUrges(userId: string): Promise<readonly UrgeRow[]> {
      return store()
        .urges.filter((row) => row.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async getProfile(userId: string): Promise<ProfileRow> {
      return (
        store().profiles.get(userId) ?? {
          userId,
          preferredName: null,
          tone: DEFAULT_TONE,
          timezone: null,
          countryCode: null,
        }
      );
    },

    async getPreferences(userId: string): Promise<PreferencesRow> {
      return (
        store().preferences.get(userId) ?? {
          userId,
          keepConversations: true,
          personalization: true,
          analyticsOptIn: false,
        }
      );
    },

    async countGuidedSessions(userId: string, periodStart: string): Promise<number> {
      return store().usage.get(`${userId}:${periodStart}`) ?? 0;
    },

    async incrementGuidedSessions(userId: string, periodStart: string): Promise<void> {
      const key = `${userId}:${periodStart}`;
      const current = store();
      current.usage.set(key, (current.usage.get(key) ?? 0) + 1);
    },

    /* ---------------- billing ---------------- */

    async getSubscription(userId: string): Promise<SubscriptionRow | null> {
      return store().subscriptions.get(userId) ?? null;
    },

    async upsertSubscription(input: UpsertSubscriptionInput): Promise<void> {
      const current = store();
      const existing = current.subscriptions.get(input.userId);
      // Mirrors the Postgres `setWhere`: an event older than the stored row
      // changes nothing, so an out-of-order delivery cannot revive a plan.
      if (
        existing !== undefined &&
        existing.lastEventAt !== null &&
        existing.lastEventAt.getTime() > input.lastEventAt.getTime()
      ) {
        return;
      }
      current.subscriptions.set(input.userId, { ...input });
    },

    async findUserIdByCustomer(provider: string, customerId: string): Promise<string | null> {
      for (const row of store().subscriptions.values()) {
        if (row.provider === provider && row.providerCustomerId === customerId) return row.userId;
      }
      return null;
    },

    async recordBillingEvent(input: RecordBillingEventInput): Promise<boolean> {
      const current = store();
      const key = `${input.provider}:${input.eventId}`;
      // Mirrors the Postgres `setWhere`: a previously failed event may be
      // claimed again, so a retry is not swallowed as a replay.
      const existing = current.billingEvents.get(key);
      if (existing !== undefined && existing !== "failed") return false;
      current.billingEvents.set(key, "received");
      return true;
    },

    async markBillingEvent(
      provider: string,
      eventId: string,
      status: "processed" | "ignored" | "failed",
    ): Promise<void> {
      const current = store();
      const key = `${provider}:${eventId}`;
      if (current.billingEvents.has(key)) current.billingEvents.set(key, status);
    },

    /** Nothing to guarantee: there are no foreign keys in a Map. */
    async ensureProfile(): Promise<void> {},
  };
}

/* ------------------------------------------------------------------ */
/* Seeding, for trying the product out                                 */
/* ------------------------------------------------------------------ */

/** Puts a person's history in place so the insight thresholds have data. */
export function seedHistory(userId: string, patterns: readonly PatternRow[]): void {
  const current = store();
  current.patterns = [...current.patterns.filter((row) => row.userId !== userId), ...patterns];
}
