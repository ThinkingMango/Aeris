/**
 * The durable repository.
 *
 * Two things about this file are deliberate and worth not undoing.
 *
 * **It connects as the database owner, so row-level security does not apply
 * to it.** RLS is the boundary for the browser, which talks to Supabase with
 * an anon key and is confined to `user_id = auth.uid()`. This process is the
 * other side of that boundary, and its protection is the `userId` argument on
 * every method — which is why the interface demands one everywhere and why
 * every statement below filters on it. A query here that forgets the filter is
 * a data leak that RLS will not catch for you.
 *
 * **Every value read out of a text column is narrowed through a guard.** The
 * database is the one place a value can arrive that the type system never saw
 * written — an old row, a hand-run migration, a manual fix in the Supabase
 * console. Narrowing at the boundary means a bad value fails here, loudly,
 * rather than flowing into the conversation as a state nobody has a
 * transition for.
 */
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { isState, type State } from "@/core/conversation/states";
import {
  isBillingStatus,
  isPlan,
  type BillingStatus,
  type Plan,
} from "@/core/entitlements";
import { isInterventionSlug } from "@/core/interventions/catalog";
import type { RunRecord } from "@/core/interventions/ranking";
import {
  DEFAULT_TONE,
  isPattern,
  isTone,
  isTrigger,
  type Pattern,
  type Tone,
  type Trigger,
} from "@/core/patterns/taxonomy";
import { isUrgeTarget, type UrgeTarget } from "@/core/urges";
import {
  billingEvents,
  interventionRuns,
  messages,
  preferences as preferencesTable,
  profiles,
  sessions,
  subscriptions,
  urges,
  usageCounters,
  userPatterns,
} from "@/db/schema";

import { database, type Database } from "../db/client";
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
  SessionStatus,
  SubscriptionRow,
  UpsertSubscriptionInput,
  UrgeRow,
} from "./types";

/* ------------------------------------------------------------------ */
/* Narrowing at the boundary                                           */
/* ------------------------------------------------------------------ */

class RowError extends Error {
  constructor(table: string, column: string, value: unknown) {
    // Names the column and the table, never the value: a message column would
    // put what somebody typed into a log line.
    super(`${table}.${column} holds a value this build does not recognise.`);
    void value;
    this.name = "RowError";
  }
}

function toState(value: string, table: string): State {
  if (!isState(value)) throw new RowError(table, "state", value);
  return value;
}

function toNullableState(value: string | null, table: string): State | null {
  return value === null ? null : toState(value, table);
}

const SESSION_STATUSES: readonly string[] = ["active", "completed", "safety_hold"];

function toSessionStatus(value: string): SessionStatus {
  if (!SESSION_STATUSES.includes(value)) throw new RowError("sessions", "status", value);
  return value as SessionStatus;
}

function toRole(value: string): "user" | "assistant" {
  if (value !== "user" && value !== "assistant") throw new RowError("messages", "role", value);
  return value;
}

function toTrigger(value: string | null): Trigger | null {
  if (value === null) return null;
  return isTrigger(value) ? value : null;
}

function toPattern(value: string | null): Pattern | null {
  if (value === null) return null;
  return isPattern(value) ? value : null;
}

function toTone(value: string): Tone {
  return isTone(value) ? value : DEFAULT_TONE;
}

function toUrgeTarget(value: string): UrgeTarget {
  if (!isUrgeTarget(value)) throw new RowError("urges", "target", value);
  return value;
}

/** An unrecognised plan or status resolves to the free tier, never above it. */
function toPlan(value: string): Plan {
  return isPlan(value) ? value : "free";
}

function toBillingStatus(value: string): BillingStatus {
  return isBillingStatus(value) ? value : "unknown";
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */

type SessionRecord = typeof sessions.$inferSelect;
type MessageRecord = typeof messages.$inferSelect;
type UrgeRecord = typeof urges.$inferSelect;

function mapSession(row: SessionRecord): SessionRow {
  return {
    id: row.id,
    userId: row.userId,
    state: toState(row.state, "sessions"),
    status: toSessionStatus(row.status),
    trigger: toTrigger(row.trigger),
    primaryPattern: toPattern(row.primaryPattern),
    intensityBefore: row.intensityBefore,
    intensityAfter: row.intensityAfter,
    localHour: row.localHour,
    localDow: row.localDow,
    tzAtStart: row.tzAtStart,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

function mapMessage(row: MessageRecord): MessageRow {
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    role: toRole(row.role),
    content: row.content,
    state: toNullableState(row.state, "messages"),
    clientEventId: row.clientEventId,
    createdAt: row.createdAt,
  };
}

function mapUrge(row: UrgeRecord): UrgeRow {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    target: toUrgeTarget(row.target),
    delayMinutes: row.delayMinutes,
    delayStartedAt: row.delayStartedAt,
    resisted: row.resisted,
    createdAt: row.createdAt,
    settledAt: row.settledAt,
  };
}

const first = <T>(rows: readonly T[]): T | null => rows[0] ?? null;

/* ------------------------------------------------------------------ */
/* The repository                                                      */
/* ------------------------------------------------------------------ */

export function createPostgresRepository(db: Database = database()): Repository {
  /**
   * Every table carries a foreign key to `profiles`, and `profiles` mirrors
   * `auth.users`. A trigger creates the row on signup; this is the guard for
   * an account that predates the trigger or a request that raced it. It is a
   * single conflict-free insert, so calling it on a path that does not need it
   * costs one round trip and never fails.
   */
  async function ensureProfile(userId: string): Promise<void> {
    await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
  }

  return {
    async createSession(input: CreateSessionInput): Promise<SessionRow> {
      await ensureProfile(input.userId);
      const rows = await db
        .insert(sessions)
        .values({
          userId: input.userId,
          intensityBefore: input.intensityBefore,
          localHour: input.localHour,
          localDow: input.localDow,
          tzAtStart: input.tzAtStart,
        })
        .returning();
      const row = first(rows);
      if (row === null) throw new Error("Session insert returned no row.");
      return mapSession(row);
    },

    async getSession(sessionId: string, userId: string): Promise<SessionRow | null> {
      // The ownership predicate is in the WHERE clause rather than checked
      // afterwards, so a session belonging to somebody else is not read at all
      // and is indistinguishable from one that does not exist.
      const rows = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
        .limit(1);
      const row = first(rows);
      return row === null ? null : mapSession(row);
    },

    async updateSession(
      sessionId: string,
      userId: string,
      patch: SessionPatch,
    ): Promise<SessionRow | null> {
      const values: Partial<typeof sessions.$inferInsert> = {};
      if (patch.state !== undefined) values.state = patch.state;
      if (patch.status !== undefined) values.status = patch.status;
      if (patch.trigger !== undefined) values.trigger = patch.trigger;
      if (patch.primaryPattern !== undefined) values.primaryPattern = patch.primaryPattern;
      if (patch.intensityAfter !== undefined) values.intensityAfter = patch.intensityAfter;
      if (patch.completedAt !== undefined) values.completedAt = patch.completedAt;

      if (Object.keys(values).length === 0) {
        return this.getSession(sessionId, userId);
      }

      const rows = await db
        .update(sessions)
        .set(values)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
        .returning();
      const row = first(rows);
      return row === null ? null : mapSession(row);
    },

    async listSessions(userId: string, limit = 50): Promise<readonly SessionRow[]> {
      const rows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.startedAt))
        .limit(limit);
      return rows.map(mapSession);
    },

    async appendMessage(input: AppendMessageInput): Promise<MessageRow> {
      const rows = await db
        .insert(messages)
        .values({
          sessionId: input.sessionId,
          userId: input.userId,
          role: input.role,
          content: input.content,
          state: input.state,
          clientEventId: input.clientEventId ?? null,
        })
        .returning();
      const row = first(rows);
      if (row === null) throw new Error("Message insert returned no row.");
      return mapMessage(row);
    },

    async listMessages(sessionId: string, userId: string): Promise<readonly MessageRow[]> {
      const rows = await db
        .select()
        .from(messages)
        .where(and(eq(messages.sessionId, sessionId), eq(messages.userId, userId)))
        .orderBy(asc(messages.createdAt));
      return rows.map(mapMessage);
    },

    async findAssistantMessageByEvent(
      userId: string,
      clientEventId: string,
    ): Promise<MessageRow | null> {
      const rows = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.userId, userId),
            eq(messages.clientEventId, clientEventId),
            eq(messages.role, "assistant"),
          ),
        )
        .limit(1);
      const row = first(rows);
      return row === null ? null : mapMessage(row);
    },

    async purgeMessages(sessionId: string, userId: string): Promise<void> {
      await db
        .delete(messages)
        .where(and(eq(messages.sessionId, sessionId), eq(messages.userId, userId)));
    },

    async listPatterns(userId: string): Promise<readonly PatternRow[]> {
      const rows = await db.select().from(userPatterns).where(eq(userPatterns.userId, userId));
      // A pattern name this build does not know is skipped rather than thrown
      // on: the taxonomy can shrink between releases, and an unknown label
      // should quietly contribute nothing instead of breaking a session.
      return rows.flatMap((row) => {
        if (!isPattern(row.pattern)) return [];
        return [
          {
            id: row.id,
            userId: row.userId,
            pattern: row.pattern,
            evidenceCount: row.evidenceCount,
            confidence: row.confidence,
            hiddenByUser: row.hiddenByUser,
          },
        ];
      });
    },

    async recordRun(input: RecordRunInput): Promise<void> {
      await db.insert(interventionRuns).values({
        userId: input.userId,
        sessionId: input.sessionId,
        intervention: input.intervention,
        completed: input.completed,
        intensityBefore: input.intensityBefore,
        intensityAfter: input.intensityAfter,
        helpfulness: input.helpfulness,
      });
    },

    async listRuns(userId: string): Promise<readonly RunRecord[]> {
      const rows = await db
        .select()
        .from(interventionRuns)
        .where(eq(interventionRuns.userId, userId))
        .orderBy(asc(interventionRuns.createdAt));
      return rows.flatMap((row) => {
        if (!isInterventionSlug(row.intervention)) return [];
        return [
          {
            intervention: row.intervention,
            completed: row.completed,
            intensityBefore: row.intensityBefore,
            intensityAfter: row.intensityAfter,
            helpfulness: row.helpfulness,
          },
        ];
      });
    },

    async createUrge(input: CreateUrgeInput): Promise<UrgeRow> {
      await ensureProfile(input.userId);
      const rows = await db
        .insert(urges)
        .values({
          userId: input.userId,
          sessionId: input.sessionId,
          target: input.target,
          delayMinutes: input.delayMinutes,
        })
        .returning();
      const row = first(rows);
      if (row === null) throw new Error("Urge insert returned no row.");
      return mapUrge(row);
    },

    async getUrge(urgeId: string, userId: string): Promise<UrgeRow | null> {
      const rows = await db
        .select()
        .from(urges)
        .where(and(eq(urges.id, urgeId), eq(urges.userId, userId)))
        .limit(1);
      const row = first(rows);
      return row === null ? null : mapUrge(row);
    },

    /**
     * Starts a wait, once.
     *
     * The `delay_started_at IS NULL` predicate is what makes this idempotent,
     * and it has to be in the statement rather than in a read-then-write: two
     * tabs pressing start at the same moment would both see null and the
     * second would reset the clock. Here the second one updates no rows and
     * reads back the first start, which is the honest answer.
     */
    async startDelay(urgeId: string, userId: string, minutes: number): Promise<UrgeRow | null> {
      const started = await db
        .update(urges)
        .set({ delayMinutes: minutes, delayStartedAt: new Date() })
        .where(
          and(eq(urges.id, urgeId), eq(urges.userId, userId), isNull(urges.delayStartedAt)),
        )
        .returning();
      const row = first(started);
      if (row !== null) return mapUrge(row);
      return this.getUrge(urgeId, userId);
    },

    async settleUrge(urgeId: string, userId: string, resisted: boolean): Promise<UrgeRow | null> {
      const rows = await db
        .update(urges)
        .set({ resisted, settledAt: new Date() })
        .where(and(eq(urges.id, urgeId), eq(urges.userId, userId)))
        .returning();
      const row = first(rows);
      return row === null ? null : mapUrge(row);
    },

    async listUrges(userId: string): Promise<readonly UrgeRow[]> {
      const rows = await db
        .select()
        .from(urges)
        .where(eq(urges.userId, userId))
        .orderBy(desc(urges.createdAt));
      return rows.map(mapUrge);
    },

    async getProfile(userId: string): Promise<ProfileRow> {
      const rows = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      const row = first(rows);
      if (row === null) {
        return {
          userId,
          preferredName: null,
          tone: DEFAULT_TONE,
          timezone: null,
          countryCode: null,
        };
      }
      return {
        userId: row.id,
        preferredName: row.preferredName,
        tone: toTone(row.tone),
        timezone: row.timezone,
        countryCode: row.countryCode,
      };
    },

    /**
     * Preferences default to the privacy-preserving reading when no row
     * exists. `keepConversations` and `personalization` default true because
     * those are the settings a person chose by not changing them; analytics
     * defaults false because consent is not the absence of a refusal.
     */
    async getPreferences(userId: string): Promise<PreferencesRow> {
      const rows = await db
        .select()
        .from(preferencesTable)
        .where(eq(preferencesTable.userId, userId))
        .limit(1);
      const row = first(rows);
      if (row === null) {
        return { userId, keepConversations: true, personalization: true, analyticsOptIn: false };
      }
      return {
        userId: row.userId,
        keepConversations: row.keepConversations,
        personalization: row.personalization,
        analyticsOptIn: row.analyticsOptIn,
      };
    },

    async countGuidedSessions(userId: string, period: string): Promise<number> {
      const rows = await db
        .select({ used: usageCounters.guidedSessions })
        .from(usageCounters)
        .where(and(eq(usageCounters.userId, userId), eq(usageCounters.periodStart, period)))
        .limit(1);
      return first(rows)?.used ?? 0;
    },

    /** One statement, so concurrent turns cannot both read 4 and both write 5. */
    async incrementGuidedSessions(userId: string, period: string): Promise<void> {
      await ensureProfile(userId);
      await db
        .insert(usageCounters)
        .values({ userId, periodStart: period, guidedSessions: 1 })
        .onConflictDoUpdate({
          target: [usageCounters.userId, usageCounters.periodStart],
          set: {
            guidedSessions: sql`${usageCounters.guidedSessions} + 1`,
            updatedAt: new Date(),
          },
        });
    },

    /* ---------------- billing ---------------- */

    async getSubscription(userId: string): Promise<SubscriptionRow | null> {
      const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);
      const row = first(rows);
      if (row === null) return null;
      return {
        userId: row.userId,
        plan: toPlan(row.plan),
        status: toBillingStatus(row.status),
        environment: row.environment,
        provider: row.provider,
        providerCustomerId: row.providerCustomerId,
        providerSubscriptionId: row.providerSubscriptionId,
        providerPriceId: row.providerPriceId,
        currentPeriodEnd: row.currentPeriodEnd,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        lastEventAt: row.lastEventAt,
      };
    },

    /**
     * Writes a subscription, unless a newer one is already stored.
     *
     * Paddle does not guarantee delivery order, and the retry of an older
     * event can land after a newer one. The `setWhere` clause makes the write
     * conditional inside the statement, so an out-of-order webhook updates
     * nothing rather than resurrecting a cancelled plan.
     */
    async upsertSubscription(input: UpsertSubscriptionInput): Promise<void> {
      await ensureProfile(input.userId);
      const values = {
        userId: input.userId,
        plan: input.plan,
        status: input.status,
        environment: input.environment,
        provider: input.provider,
        providerCustomerId: input.providerCustomerId,
        providerSubscriptionId: input.providerSubscriptionId,
        providerPriceId: input.providerPriceId,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        lastEventAt: input.lastEventAt,
        updatedAt: new Date(),
      };
      await db
        .insert(subscriptions)
        .values(values)
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: values,
          setWhere: sql`${subscriptions.lastEventAt} is null or ${subscriptions.lastEventAt} <= ${input.lastEventAt}`,
        });
    },

    async findUserIdByCustomer(provider: string, customerId: string): Promise<string | null> {
      const rows = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.provider, provider),
            eq(subscriptions.providerCustomerId, customerId),
          ),
        )
        .limit(1);
      return first(rows)?.userId ?? null;
    },

    /**
     * The replay guard, and the retry gate.
     *
     * A unique index does the work rather than an existence check, because two
     * concurrent deliveries of the same event would both see "not there" and
     * both process it. Letting the database decide means the second one loses.
     *
     * The `setWhere` is what makes retries work. An event that previously
     * failed is reset to `received` and claimed again, so the 500 we sent
     * Paddle actually buys another attempt. Without it the guard would swallow
     * every retry of exactly the events that need one, and the failure would be
     * permanent and silent — the worst of both.
     */
    async recordBillingEvent(input: RecordBillingEventInput): Promise<boolean> {
      const claimed = await db
        .insert(billingEvents)
        .values({
          provider: input.provider,
          eventId: input.eventId,
          eventType: input.eventType,
          environment: input.environment,
          occurredAt: input.occurredAt,
          status: "received",
        })
        .onConflictDoUpdate({
          target: [billingEvents.provider, billingEvents.eventId],
          set: { status: "received", errorCode: null, receivedAt: new Date() },
          setWhere: sql`${billingEvents.status} = 'failed'`,
        })
        .returning({ id: billingEvents.id });
      return claimed.length > 0;
    },

    async markBillingEvent(
      provider: string,
      eventId: string,
      status: "processed" | "ignored" | "failed",
      errorCode: string | null,
    ): Promise<void> {
      await db
        .update(billingEvents)
        .set({ status, errorCode })
        .where(and(eq(billingEvents.provider, provider), eq(billingEvents.eventId, eventId)));
    },

    ensureProfile,
  };
}
