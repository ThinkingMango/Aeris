/**
 * One turn, end to end.
 *
 * This is the only place that knows the order things happen in: ownership,
 * idempotency, the safety gate, the allowance, context assembly, generation,
 * persistence. Route handlers are transport around it, so the order can be
 * tested without HTTP anywhere near it.
 *
 * The order is not arbitrary. Safety runs before the allowance, so someone who
 * has used their five free sessions is never refused on a turn that needed
 * help. Safety runs before generation, so a redirect never reaches the model
 * at all.
 */
import {
  REVIEWED_REPLIES,
  resolveCrisisResources,
  type CrisisResource,
} from "@/core/copy";
import { isTerminal, safeFallbackState, type State } from "@/core/conversation/states";
import { assessPacing, computeStats } from "@/core/conversation/pacing";
import type { TurnDecision } from "@/core/conversation/turn-contract";
import { getIntervention, type InterventionSlug } from "@/core/interventions/catalog";
import { allowedInterventions } from "@/core/interventions/router";
import {
  hasPersonalEvidence,
  rankInterventions,
  summariseEffectiveness,
} from "@/core/interventions/ranking";
import { isDisplayable } from "@/core/patterns/evidence";
import { isPattern, type Pattern } from "@/core/patterns/taxonomy";
import { checkAllowance, periodStart } from "@/core/entitlements";
import { runSafetyGate, type CopyRoute, type SafetyRoute } from "@/core/safety";
import {
  detectReassuranceSeeking,
  detectUrgeTarget,
  isUrgeTarget,
  type UrgeTarget,
} from "@/core/urges";

import { usageAndAccessFor } from "../billing/access";
import { classifyMessage } from "../ai/classify";
import { restrictedGuidance } from "../ai/prompt";
import { runTurn } from "../ai/turn";
import { newRequestId } from "../ai/telemetry";
import { repository } from "../repo";
import type { SessionRow } from "../repo/types";

export interface TurnUi {
  readonly kind: TurnDecision["ui"]["kind"];
  readonly choices: readonly string[] | null;
}

export interface TurnSafety {
  readonly route: SafetyRoute;
  readonly copyRoute: CopyRoute | null;
  readonly countryCode: string | null;
  readonly resources: readonly CrisisResource[];
}

export interface SessionTurnResult {
  readonly messageId: string;
  readonly text: string;
  readonly state: State;
  readonly ui: TurnUi;
  readonly recommendedIntervention: InterventionSlug | null;
  /** True only when this person has a measured track record with it. */
  readonly interventionHelpedBefore: boolean;
  readonly safety: TurnSafety;
  /** Set when the turn captured an urge to check. */
  readonly urge: { readonly id: string; readonly target: UrgeTarget } | null;
  readonly degraded: boolean;
  readonly replayed: boolean;
  /** Set when an ordinary turn was refused for allowance reasons. */
  readonly blocked: "allowance_exhausted" | null;
}

export class SessionError extends Error {
  constructor(
    readonly code: "not_found" | "terminal" | "empty_message",
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
  }
}

export interface StartSessionInput {
  readonly userId: string;
  readonly intensityBefore: number | null;
  /** Read from the browser. The map cannot be built from UTC later. */
  readonly localHour: number | null;
  readonly localDow: number | null;
  readonly timezone: string | null;
}

export async function startSession(input: StartSessionInput): Promise<SessionRow> {
  return repository().createSession({
    userId: input.userId,
    intensityBefore: input.intensityBefore,
    localHour: input.localHour,
    localDow: input.localDow,
    tzAtStart: input.timezone,
  });
}

export interface RunSessionTurnInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly message: string;
  /** Makes a retried request replay rather than run the turn twice. */
  readonly clientEventId?: string;
  readonly onTextDelta: (delta: string) => void;
}

export async function runSessionTurn(input: RunSessionTurnInput): Promise<SessionTurnResult> {
  const repo = repository();
  const requestId = newRequestId();

  const message = input.message.trim();
  if (message.length === 0) {
    throw new SessionError("empty_message", "A turn needs something to respond to.");
  }

  const session = await repo.getSession(input.sessionId, input.userId);
  if (session === null) {
    throw new SessionError("not_found", "No such session.");
  }
  if (isTerminal(session.state)) {
    throw new SessionError("terminal", "This session has finished.");
  }

  // Idempotency first, before anything is written or any allowance is spent.
  if (input.clientEventId !== undefined) {
    const replay = await repo.findAssistantMessageByEvent(input.userId, input.clientEventId);
    if (replay !== null) {
      input.onTextDelta(replay.content);
      return {
        messageId: replay.id,
        text: replay.content,
        state: (replay.state ?? session.state) as State,
        ui: { kind: "text", choices: null },
        recommendedIntervention: null,
        interventionHelpedBefore: false,
        safety: { route: "normal", copyRoute: null, countryCode: null, resources: [] },
        urge: null,
        degraded: false,
        replayed: true,
        blocked: null,
      };
    }
  }

  await repo.appendMessage({
    sessionId: session.id,
    userId: input.userId,
    role: "user",
    content: message,
    state: null,
  });

  /* ---------------- safety, before anything else ---------------- */

  const gate = await runSafetyGate(message, (text) => classifyMessage(text, requestId));
  const profile = await repo.getProfile(input.userId);

  if (gate.copyRoute !== null) {
    return finishWithReviewedCopy({
      copyRoute: gate.copyRoute,
      route: gate.route,
      session,
      userId: input.userId,
      countryCode: profile.countryCode,
      clientEventId: input.clientEventId ?? null,
      onTextDelta: input.onTextDelta,
    });
  }

  /* ---------------- the allowance, for ordinary turns only ---------------- */

  const preferences = await repo.getPreferences(input.userId);
  const period = periodStart();
  // Read from our own database rather than from Paddle: a turn must not wait
  // on a billing API, and must not be refused because one is unavailable.
  const { usage } = await usageAndAccessFor(input.userId);
  const allowance = checkAllowance({
    summary: usage,
    safetyRoute: gate.route,
  });

  const priorMessages = await repo.listMessages(session.id, input.userId);
  const isFirstReply = priorMessages.every((row) => row.role !== "assistant");

  if (allowance.blocked) {
    const text =
      "You've used your guided sessions for this month. Every exercise still works, and your support options are always open — shall we go straight to one?";
    input.onTextDelta(text);
    const stored = await repo.appendMessage({
      sessionId: session.id,
      userId: input.userId,
      role: "assistant",
      content: text,
      state: session.state,
      clientEventId: input.clientEventId ?? null,
    });
    return {
      messageId: stored.id,
      text,
      state: session.state,
      ui: { kind: "text", choices: null },
      recommendedIntervention: null,
      interventionHelpedBefore: false,
      safety: { route: gate.route, copyRoute: null, countryCode: null, resources: [] },
      urge: null,
      degraded: false,
      replayed: false,
      blocked: "allowance_exhausted",
    };
  }

  /* ---------------- context, honouring the privacy switch ---------------- */

  const patterns = preferences.personalization ? await repo.listPatterns(input.userId) : [];
  const runs = preferences.personalization ? await repo.listRuns(input.userId) : [];

  const knownPatterns = patterns
    .filter((row) => isDisplayable(row.evidenceCount, row.hiddenByUser))
    .map((row) => ({ pattern: row.pattern, evidenceCount: row.evidenceCount }));

  const reassurance = detectReassuranceSeeking(message);

  const candidatePatterns: Pattern[] = [
    ...knownPatterns.map((entry) => entry.pattern),
    ...(reassurance.seeking ? (["reassurance_seeking"] as Pattern[]) : []),
  ];

  const effectiveness = summariseEffectiveness(runs);
  const allowed = rankInterventions(
    allowedInterventions(candidatePatterns, {
      ...(session.localHour !== null ? { localHour: session.localHour } : {}),
    }),
    effectiveness,
  );

  const history = priorMessages
    .filter((row) => row.content !== message || row.role !== "user")
    .map((row) => ({ role: row.role, content: row.content }));

  const stats = computeStats(
    priorMessages.map((row) => ({ role: row.role, content: row.content, state: row.state })),
  );
  const pacing = assessPacing(stats, session.state);

  /* ---------------- generation ---------------- */

  const turn = await runTurn({
    requestId,
    userMessage: message,
    history,
    promptContext: {
      currentState: session.state,
      tone: profile.tone,
      knownPatterns,
      allowedInterventions: gate.restricted ? [] : allowed,
      seekingReassurance: reassurance.seeking,
      pacingGuidance: pacing.guidance,
      safetyGuidance: gate.restricted ? restrictedGuidance(gate.decision.category) : null,
      localHour: session.localHour,
    },
    validation: {
      currentState: session.state,
      allowedInterventions: gate.restricted ? [] : allowed,
      pacing,
      seekingReassurance: reassurance.seeking,
    },
    onTextDelta: input.onTextDelta,
  });

  /* ---------------- persistence ---------------- */

  const decision = turn.decision;
  const nextState = decision.next_state;

  const stored = await repo.appendMessage({
    sessionId: session.id,
    userId: input.userId,
    role: "assistant",
    content: turn.text,
    state: nextState,
    // A degraded turn is deliberately not made idempotent: a later retry
    // should get a real answer, not this one replayed forever.
    clientEventId: turn.degraded ? null : (input.clientEventId ?? null),
  });

  if (isFirstReply && !turn.degraded) {
    await repo.incrementGuidedSessions(input.userId, period);
  }

  const topPattern = decision.patterns[0];
  await repo.updateSession(session.id, input.userId, {
    state: nextState,
    ...(nextState === "COMPLETE"
      ? { status: "completed" as const, completedAt: new Date() }
      : {}),
    ...(decision.trigger !== "unknown" ? { trigger: decision.trigger } : {}),
    ...(topPattern !== undefined && isPattern(topPattern.type)
      ? { primaryPattern: topPattern.type }
      : {}),
  });

  // "Don't keep my conversations" takes effect the moment the session ends.
  if (isTerminal(nextState) && !preferences.keepConversations) {
    await repo.purgeMessages(session.id, input.userId);
  }

  /* ---------------- the urge, if there was one ---------------- */

  let capturedUrge: { id: string; target: UrgeTarget } | null = null;
  const modelUrge = decision.urge;
  // The model's reading wins when it has one; otherwise the lexical reading
  // catches the urge so it is still counted rather than silently lost.
  const target: UrgeTarget | null =
    modelUrge !== null && isUrgeTarget(modelUrge.target)
      ? modelUrge.target
      : reassurance.seeking
        ? detectUrgeTarget(message)
        : null;

  if (target !== null) {
    const created = await repo.createUrge({
      userId: input.userId,
      sessionId: session.id,
      target,
      delayMinutes: null,
    });
    capturedUrge = { id: created.id, target };
  }

  const recommended = decision.recommended_intervention;
  const evidence =
    recommended === null
      ? false
      : hasPersonalEvidence(effectiveness.find((row) => row.intervention === recommended));

  return {
    messageId: stored.id,
    text: turn.text,
    state: nextState,
    ui: { kind: decision.ui.kind, choices: decision.ui.choices },
    recommendedIntervention: recommended,
    interventionHelpedBefore: evidence,
    safety: { route: gate.route, copyRoute: null, countryCode: null, resources: [] },
    urge: capturedUrge,
    degraded: turn.degraded,
    replayed: false,
    blocked: null,
  };
}

/* ------------------------------------------------------------------ */
/* Reviewed copy paths                                                 */
/* ------------------------------------------------------------------ */

async function finishWithReviewedCopy(params: {
  copyRoute: CopyRoute;
  route: SafetyRoute;
  session: SessionRow;
  userId: string;
  countryCode: string | null;
  clientEventId: string | null;
  onTextDelta: (delta: string) => void;
}): Promise<SessionTurnResult> {
  const repo = repository();
  const text = REVIEWED_REPLIES[params.copyRoute];
  params.onTextDelta(text);

  const crisis = params.copyRoute === "crisis" || params.copyRoute === "violence_abuse";
  const isHold = params.copyRoute === "crisis";
  // Reviewed copy that is not a crisis leaves the conversation where it was;
  // `safeFallbackState` is what makes "where it was" a legal place to be.
  const nextState: State = isHold ? "SAFETY_HOLD" : safeFallbackState(params.session.state);

  const stored = await repo.appendMessage({
    sessionId: params.session.id,
    userId: params.userId,
    role: "assistant",
    content: text,
    state: nextState,
    clientEventId: params.clientEventId,
  });

  if (isHold) {
    await repo.updateSession(params.session.id, params.userId, {
      state: "SAFETY_HOLD",
      status: "safety_hold",
    });
  }

  const resolved = crisis
    ? resolveCrisisResources(params.countryCode)
    : { countryCode: null, resources: [] as readonly CrisisResource[] };

  return {
    messageId: stored.id,
    text,
    state: nextState,
    ui: { kind: "text", choices: null },
    recommendedIntervention: null,
    interventionHelpedBefore: false,
    safety: {
      route: params.route,
      copyRoute: params.copyRoute,
      countryCode: resolved.countryCode,
      resources: resolved.resources,
    },
    urge: null,
    degraded: false,
    replayed: false,
    blocked: null,
  };
}

/* ------------------------------------------------------------------ */
/* Exercises and urges                                                 */
/* ------------------------------------------------------------------ */

export interface CompleteExerciseInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly intervention: InterventionSlug;
  readonly completed: boolean;
  readonly intensityAfter: number | null;
  readonly helpfulness: number | null;
}

/**
 * Records what an exercise did. The before-intensity comes from the session
 * rather than the client, so the measurement cannot be edited by the browser
 * into a better-looking result.
 */
export async function completeExercise(input: CompleteExerciseInput): Promise<void> {
  const repo = repository();
  const session = await repo.getSession(input.sessionId, input.userId);
  if (session === null) throw new SessionError("not_found", "No such session.");

  // Fails loudly on a slug that is not real, rather than storing a fiction.
  getIntervention(input.intervention);

  await repo.recordRun({
    userId: input.userId,
    sessionId: input.sessionId,
    intervention: input.intervention,
    completed: input.completed,
    intensityBefore: session.intensityBefore,
    intensityAfter: input.intensityAfter,
    helpfulness: input.helpfulness,
  });

  if (input.intensityAfter !== null) {
    await repo.updateSession(input.sessionId, input.userId, {
      intensityAfter: input.intensityAfter,
    });
  }
}

export interface StartDelayInput {
  readonly userId: string;
  readonly urgeId: string;
  readonly minutes: number;
}

/**
 * Begins a wait.
 *
 * The start time is recorded here rather than sent by the browser, and a
 * second call is a no-op, so neither a reload nor an edited request can make
 * a wait look longer than it was.
 */
export async function startDelay(input: StartDelayInput): Promise<{ startedAt: Date; minutes: number }> {
  const started = await repository().startDelay(input.urgeId, input.userId, input.minutes);
  if (started === null) throw new SessionError("not_found", "No such urge.");
  return {
    startedAt: started.delayStartedAt ?? new Date(),
    minutes: started.delayMinutes ?? input.minutes,
  };
}

export interface SettleUrgeInput {
  readonly userId: string;
  readonly urgeId: string;
  /** What the person says happened. Never inferred from a closed tab. */
  readonly resisted: boolean;
}

export async function settleUrge(input: SettleUrgeInput): Promise<void> {
  const settled = await repository().settleUrge(input.urgeId, input.userId, input.resisted);
  if (settled === null) throw new SessionError("not_found", "No such urge.");
}
