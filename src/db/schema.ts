/**
 * The database.
 *
 * Three rules are visible in the shape of this file:
 *
 *  1. Every user-owned table carries `userId`, and every one of them gets an
 *     RLS policy of `user_id = auth.uid()`. There are no exceptions and no
 *     "we'll add it later" tables.
 *  2. Server-only tables — safety events, safety metrics, billing events,
 *     tombstones — have RLS enabled with no policies and no grants to the
 *     browser roles. They are reachable only with the service role.
 *  3. `messages` is the only table holding what a person actually typed. That
 *     makes "don't keep my conversations" a purge of one table, and it means
 *     no operational store can leak content by accident.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const now = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export const profiles = pgTable("profiles", {
  /** Mirrors auth.users.id. */
  id: uuid("id").primaryKey(),
  preferredName: text("preferred_name"),
  tone: text("tone").notNull().default("balanced"),
  /** IANA zone. No default: an unset zone must contribute nothing, not UTC. */
  timezone: text("timezone"),
  /** ISO 3166-1 alpha-2, used only to pick crisis resources. */
  countryCode: text("country_code"),
  ageConfirmed: boolean("age_confirmed").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preferences = pgTable("preferences", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  /** When false, raw message text is purged at the end of every session. */
  keepConversations: boolean("keep_conversations").notNull().default(true),
  /** When false, no historical context is read at all — not even to the model. */
  personalization: boolean("personalization").notNull().default(true),
  analyticsOptIn: boolean("analytics_opt_in").notNull().default(false),
  theme: text("theme").notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only. A new version or a revocation adds a row; nothing is rewritten. */
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    document: text("document").notNull(),
    version: text("version").notNull(),
    granted: boolean("granted").notNull(),
    createdAt: now(),
  },
  (table) => [index("consents_user_document_idx").on(table.userId, table.document)],
);

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    state: text("state").notNull().default("START"),
    status: text("status").notNull().default("active"),
    entryPoint: text("entry_point").notNull().default("help_now"),
    trigger: text("trigger"),
    primaryPattern: text("primary_pattern"),
    intensityBefore: smallint("intensity_before"),
    intensityAfter: smallint("intensity_after"),
    /**
     * Captured at creation, never back-filled by guessing. The anxiety map
     * cannot be built later from UTC alone, and an inferred local hour would
     * be a fabricated observation about someone's life.
     */
    localHour: smallint("local_hour"),
    localDow: smallint("local_dow"),
    tzAtStart: text("tz_at_start"),
    startedAt: now(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("sessions_user_started_idx").on(table.userId, table.startedAt),
    index("sessions_user_status_idx").on(table.userId, table.status),
  ],
);

/**
 * Append-only event log.
 *
 * Makes a session auditable after the fact and makes pattern aggregation a
 * pure fold rather than writes scattered across the request. Payloads carry
 * structure only — never message text.
 */
export const sessionEvents = pgTable(
  "session_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: now(),
  },
  (table) => [uniqueIndex("session_events_seq_idx").on(table.sessionId, table.seq)],
);

/** The only table containing what a person typed. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    state: text("state"),
    /** Makes a retried request replay instead of running the turn twice. */
    clientEventId: uuid("client_event_id"),
    createdAt: now(),
  },
  (table) => [
    index("messages_session_created_idx").on(table.sessionId, table.createdAt),
    uniqueIndex("messages_client_event_idx").on(table.userId, table.clientEventId),
  ],
);

export const sessionSummaries = pgTable("session_summaries", {
  sessionId: uuid("session_id").primaryKey().references(() => sessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  triggerSummary: text("trigger_summary"),
  thoughtSummary: text("thought_summary"),
  helpfulSummary: text("helpful_summary"),
  nextAction: text("next_action"),
  /** Nothing feeds personalisation until the person says it is right. */
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* The wedge                                                           */
/* ------------------------------------------------------------------ */

export const urges = pgTable(
  "urges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    target: text("target").notNull(),
    intensity: smallint("intensity"),
    delayMinutes: smallint("delay_minutes"),
    /** Null while a delay is still running. */
    resisted: boolean("resisted"),
    createdAt: now(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (table) => [index("urges_user_created_idx").on(table.userId, table.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Patterns and exercises                                              */
/* ------------------------------------------------------------------ */

export const sessionPatterns = pgTable(
  "session_patterns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    pattern: text("pattern").notNull(),
    confidence: real("confidence").notNull(),
    createdAt: now(),
  },
  (table) => [index("session_patterns_session_idx").on(table.sessionId)],
);

export const userPatterns = pgTable(
  "user_patterns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    pattern: text("pattern").notNull(),
    evidenceCount: integer("evidence_count").notNull().default(1),
    confidence: real("confidence").notNull().default(0),
    /** "Not true for me". Hidden patterns never gain evidence again. */
    hiddenByUser: boolean("hidden_by_user").notNull().default(false),
    firstSeen: now(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_patterns_unique_idx").on(table.userId, table.pattern)],
);

/** The seeded catalog. Versioned so a change to an exercise is traceable. */
export const interventions = pgTable("interventions", {
  slug: text("slug").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  version: integer("version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  reviewedAt: date("reviewed_at"),
});

export const interventionRuns = pgTable(
  "intervention_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    intervention: text("intervention").notNull().references(() => interventions.slug),
    completed: boolean("completed").notNull().default(false),
    intensityBefore: smallint("intensity_before"),
    intensityAfter: smallint("intensity_after"),
    /** 1 not really, 2 somewhat, 3 very. */
    helpfulness: smallint("helpfulness"),
    createdAt: now(),
  },
  (table) => [index("intervention_runs_user_idx").on(table.userId, table.intervention)],
);

/* ------------------------------------------------------------------ */
/* Server-only. RLS enabled, no policies, no browser grants.           */
/* ------------------------------------------------------------------ */

/** Metadata about a safety decision. Structurally cannot hold message text. */
export const safetyEvents = pgTable(
  "safety_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    sessionId: uuid("session_id"),
    messageId: uuid("message_id"),
    requestId: text("request_id"),
    riskLevel: smallint("risk_level").notNull(),
    category: text("category").notNull(),
    action: text("action").notNull(),
    route: text("route").notNull(),
    /** Rule ids only. Never the text they matched. */
    signals: text("signals").array().notNull().default(sql`'{}'::text[]`),
    classifierVersion: text("classifier_version").notNull(),
    promptVersion: text("prompt_version").notNull(),
    createdAt: now(),
  },
  (table) => [index("safety_events_created_idx").on(table.createdAt)],
);

/** Hourly counts. Holds no reference to any account at all. */
export const safetyMetrics = pgTable(
  "safety_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucketHour: timestamp("bucket_hour", { withTimezone: true }).notNull(),
    metric: text("metric").notNull(),
    dimension: text("dimension").notNull().default(""),
    count: integer("count").notNull().default(0),
  },
  (table) => [uniqueIndex("safety_metrics_unique_idx").on(table.bucketHour, table.metric, table.dimension)],
);

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("none"),
  /** Which environment produced this row. A sandbox event cannot touch live. */
  environment: text("environment").notNull().default("sandbox"),
  provider: text("provider"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  /** Set when a Teams seat, rather than a personal subscription, grants access. */
  orgId: uuid("org_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Server-only. Deduplication, replay detection, reconciliation, audit. */
export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    environment: text("environment").notNull(),
    status: text("status").notNull().default("received"),
    errorCode: text("error_code"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    receivedAt: now(),
  },
  (table) => [uniqueIndex("billing_events_unique_idx").on(table.provider, table.eventId)],
);

export const usageCounters = pgTable(
  "usage_counters",
  {
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    /** First day of the month, UTC. */
    periodStart: date("period_start").notNull(),
    guidedSessions: integer("guided_sessions").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("usage_counters_pk").on(table.userId, table.periodStart)],
);

/* ------------------------------------------------------------------ */
/* Teams and practitioners — the revenue layer                         */
/* ------------------------------------------------------------------ */

export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id),
  seats: integer("seats").notNull().default(0),
  status: text("status").notNull().default("none"),
  providerSubscriptionId: text("provider_subscription_id"),
  createdAt: now(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: now(),
  },
  (table) => [uniqueIndex("org_members_pk").on(table.orgId, table.userId)],
);

/**
 * A practitioner link.
 *
 * Consent-scoped and revocable. Sharing is per-summary and opt-in; a
 * practitioner never sees message text, and never sees anything at all until
 * the client grants it.
 */
export const practitionerLinks = pgTable(
  "practitioner_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    practitionerId: uuid("practitioner_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("invited"),
    shareSummaries: boolean("share_summaries").notNull().default(false),
    shareSafetyAlerts: boolean("share_safety_alerts").notNull().default(false),
    createdAt: now(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("practitioner_links_pk").on(table.practitionerId, table.clientId)],
);

/**
 * Deletion tombstones. Server-only.
 *
 * Stops a late provider webhook reviving a deleted account, and records
 * whether the billing side of a closure actually completed.
 */
export const deletedAccounts = pgTable("deleted_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  requestId: text("request_id").notNull(),
  provider: text("provider"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  billingClosure: text("billing_closure").notNull().default("pending"),
  requestedAt: now(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const sessionRelations = relations(sessions, ({ many, one }) => ({
  messages: many(messages),
  events: many(sessionEvents),
  patterns: many(sessionPatterns),
  runs: many(interventionRuns),
  summary: one(sessionSummaries, {
    fields: [sessions.id],
    references: [sessionSummaries.sessionId],
  }),
}));

export const profileRelations = relations(profiles, ({ many, one }) => ({
  sessions: many(sessions),
  patterns: many(userPatterns),
  urges: many(urges),
  subscription: one(subscriptions, {
    fields: [profiles.id],
    references: [subscriptions.userId],
  }),
}));

/** Tables a person's own data must be erased from on account deletion. */
export const USER_OWNED_TABLES = [
  "consents",
  "intervention_runs",
  "messages",
  "preferences",
  "profiles",
  "safety_events",
  "session_events",
  "session_patterns",
  "session_summaries",
  "sessions",
  "subscriptions",
  "urges",
  "usage_counters",
  "user_patterns",
] as const;

/** Tables the browser may never reach, on any policy. */
export const SERVER_ONLY_TABLES = [
  "billing_events",
  "deleted_accounts",
  "safety_events",
  "safety_metrics",
] as const;
