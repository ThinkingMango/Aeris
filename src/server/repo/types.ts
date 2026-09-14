/**
 * What the application needs from storage, and nothing more.
 *
 * Declared as an interface so the session can be built, run and tested before
 * a database exists. Two implementations follow: an in-memory store for
 * development and tests, and a Postgres store for everything else. Swapping
 * one for the other is a one-line change in `index.ts`, which is the point.
 *
 * Every method takes `userId` explicitly. Row-level security is the real
 * boundary in production, but a repository that cannot express "somebody
 * else's row" is a second one, and the two disagree loudly rather than
 * quietly.
 */
import type { State } from "@/core/conversation/states";
import type { InterventionSlug } from "@/core/interventions/catalog";
import type { RunRecord } from "@/core/interventions/ranking";
import type { Pattern, Tone, Trigger } from "@/core/patterns/taxonomy";
import type { UrgeTarget } from "@/core/urges";

export type SessionStatus = "active" | "completed" | "safety_hold";

export interface SessionRow {
  readonly id: string;
  readonly userId: string;
  readonly state: State;
  readonly status: SessionStatus;
  readonly trigger: Trigger | null;
  readonly primaryPattern: Pattern | null;
  readonly intensityBefore: number | null;
  readonly intensityAfter: number | null;
  /** Captured at creation. Never back-filled by guessing. */
  readonly localHour: number | null;
  readonly localDow: number | null;
  readonly tzAtStart: string | null;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
}

export interface MessageRow {
  readonly id: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly state: State | null;
  readonly clientEventId: string | null;
  readonly createdAt: Date;
}

export interface UrgeRow {
  readonly id: string;
  readonly userId: string;
  readonly sessionId: string | null;
  readonly target: UrgeTarget;
  readonly delayMinutes: number | null;
  /**
   * When the wait actually began, which is later than when the urge was
   * noticed. The countdown is computed from this on the server, so closing
   * the tab cannot shorten it and reopening the page cannot restart it.
   */
  readonly delayStartedAt: Date | null;
  /** Null until the person says. Never inferred from a closed tab. */
  readonly resisted: boolean | null;
  readonly createdAt: Date;
  readonly settledAt: Date | null;
}

export interface PatternRow {
  readonly id: string;
  readonly userId: string;
  readonly pattern: Pattern;
  readonly evidenceCount: number;
  readonly confidence: number;
  readonly hiddenByUser: boolean;
}

export interface ProfileRow {
  readonly userId: string;
  readonly preferredName: string | null;
  readonly tone: Tone;
  readonly timezone: string | null;
  readonly countryCode: string | null;
}

export interface PreferencesRow {
  readonly userId: string;
  readonly keepConversations: boolean;
  readonly personalization: boolean;
  readonly analyticsOptIn: boolean;
}

export interface CreateSessionInput {
  readonly userId: string;
  readonly intensityBefore: number | null;
  readonly localHour: number | null;
  readonly localDow: number | null;
  readonly tzAtStart: string | null;
}

export interface AppendMessageInput {
  readonly sessionId: string;
  readonly userId: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly state: State | null;
  readonly clientEventId?: string | null;
}

export interface RecordRunInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly intervention: InterventionSlug;
  readonly completed: boolean;
  readonly intensityBefore: number | null;
  readonly intensityAfter: number | null;
  readonly helpfulness: number | null;
}

export interface CreateUrgeInput {
  readonly userId: string;
  readonly sessionId: string | null;
  readonly target: UrgeTarget;
  readonly delayMinutes: number | null;
}

export interface SessionPatch {
  readonly state?: State;
  readonly status?: SessionStatus;
  readonly trigger?: Trigger | null;
  readonly primaryPattern?: Pattern | null;
  readonly intensityAfter?: number | null;
  readonly completedAt?: Date | null;
}

export interface Repository {
  /* Sessions */
  createSession(input: CreateSessionInput): Promise<SessionRow>;
  /** Returns null for a session that does not exist *and* for one owned by
   *  somebody else, so the two are indistinguishable to a caller. */
  getSession(id: string, userId: string): Promise<SessionRow | null>;
  updateSession(id: string, userId: string, patch: SessionPatch): Promise<SessionRow | null>;
  listSessions(userId: string, limit?: number): Promise<readonly SessionRow[]>;

  /* Messages */
  appendMessage(input: AppendMessageInput): Promise<MessageRow>;
  listMessages(sessionId: string, userId: string): Promise<readonly MessageRow[]>;
  /** Powers idempotent retries: the same event id replays instead of re-running. */
  findAssistantMessageByEvent(userId: string, clientEventId: string): Promise<MessageRow | null>;
  /** "Don't keep my conversations": drops the text and nothing else. */
  purgeMessages(sessionId: string, userId: string): Promise<void>;

  /* Patterns and exercises */
  listPatterns(userId: string): Promise<readonly PatternRow[]>;
  recordRun(input: RecordRunInput): Promise<void>;
  listRuns(userId: string): Promise<readonly RunRecord[]>;

  /* Urges — the wedge */
  createUrge(input: CreateUrgeInput): Promise<UrgeRow>;
  getUrge(id: string, userId: string): Promise<UrgeRow | null>;
  startDelay(id: string, userId: string, minutes: number): Promise<UrgeRow | null>;
  settleUrge(id: string, userId: string, resisted: boolean): Promise<UrgeRow | null>;
  listUrges(userId: string): Promise<readonly UrgeRow[]>;

  /* Person */
  getProfile(userId: string): Promise<ProfileRow>;
  getPreferences(userId: string): Promise<PreferencesRow>;

  /* Allowance */
  countGuidedSessions(userId: string, periodStart: string): Promise<number>;
  incrementGuidedSessions(userId: string, periodStart: string): Promise<void>;
}
