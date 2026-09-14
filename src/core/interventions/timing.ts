/**
 * Time, for the exercises that depend on it.
 *
 * Everything here is a pure function of **elapsed milliseconds**. Nothing
 * counts ticks, because a counter incremented by `setInterval` drifts, and
 * browsers throttle or suspend timers in a backgrounded tab entirely.
 *
 * That distinction is not academic for the delay timer. Someone starts a
 * ten-minute wait and switches away from the tab — which is the whole point,
 * they are trying not to look at their phone. A tick counter would come back
 * reporting two minutes. Computing from a start timestamp comes back with the
 * truth, and the truth is the only thing worth telling someone about their own
 * progress.
 */

/* ------------------------------------------------------------------ */
/* Breathing                                                           */
/* ------------------------------------------------------------------ */

/** The short second inhale in a physiological sigh. */
export const SNIFF_SECONDS = 1;

export interface BreathPattern {
  readonly inhaleSeconds: number;
  readonly exhaleSeconds: number;
  /** A second short inhale on top of the first, as in a physiological sigh. */
  readonly secondInhale?: boolean;
  readonly cycles: number;
}

export const BREATH_PHASES = ["inhale", "sniff", "exhale", "done"] as const;
export type BreathPhase = (typeof BREATH_PHASES)[number];

export interface BreathState {
  readonly phase: BreathPhase;
  /** 1-based, so it can be read straight into "breath 3 of 8". */
  readonly cycle: number;
  readonly totalCycles: number;
  readonly phaseElapsedMs: number;
  readonly phaseDurationMs: number;
  /** 0–1 through the current phase. Drives the circle. */
  readonly phaseProgress: number;
  readonly totalRemainingMs: number;
  readonly complete: boolean;
}

const seconds = (value: number): number => Math.max(0, value) * 1000;

interface Segment {
  readonly phase: Exclude<BreathPhase, "done">;
  readonly durationMs: number;
}

function segmentsFor(pattern: BreathPattern): readonly Segment[] {
  const segments: Segment[] = [{ phase: "inhale", durationMs: seconds(pattern.inhaleSeconds) }];
  if (pattern.secondInhale === true) {
    segments.push({ phase: "sniff", durationMs: seconds(SNIFF_SECONDS) });
  }
  segments.push({ phase: "exhale", durationMs: seconds(pattern.exhaleSeconds) });
  return segments;
}

export function cycleDurationMs(pattern: BreathPattern): number {
  return segmentsFor(pattern).reduce((total, segment) => total + segment.durationMs, 0);
}

export function totalDurationMs(pattern: BreathPattern): number {
  return cycleDurationMs(pattern) * Math.max(0, Math.floor(pattern.cycles));
}

const COMPLETE: BreathState = Object.freeze({
  phase: "done",
  cycle: 0,
  totalCycles: 0,
  phaseElapsedMs: 0,
  phaseDurationMs: 0,
  phaseProgress: 1,
  totalRemainingMs: 0,
  complete: true,
});

/**
 * Where the breath is at a given point.
 *
 * Out of range in either direction resolves to a sane end of the exercise
 * rather than throwing: a clock that jumped should stop the animation, not
 * crash the screen someone is using at three in the morning.
 */
export function breathStateAt(pattern: BreathPattern, elapsedMs: number): BreathState {
  const cycles = Math.max(0, Math.floor(pattern.cycles));
  const cycleMs = cycleDurationMs(pattern);
  const totalMs = cycleMs * cycles;

  if (cycles === 0 || cycleMs === 0) return { ...COMPLETE, totalCycles: cycles };

  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= totalMs) return { ...COMPLETE, cycle: cycles, totalCycles: cycles };

  const cycleIndex = Math.floor(elapsed / cycleMs);
  let withinCycle = elapsed - cycleIndex * cycleMs;

  for (const segment of segmentsFor(pattern)) {
    if (withinCycle < segment.durationMs) {
      return Object.freeze({
        phase: segment.phase,
        cycle: cycleIndex + 1,
        totalCycles: cycles,
        phaseElapsedMs: withinCycle,
        phaseDurationMs: segment.durationMs,
        phaseProgress: segment.durationMs === 0 ? 1 : withinCycle / segment.durationMs,
        totalRemainingMs: totalMs - elapsed,
        complete: false,
      });
    }
    withinCycle -= segment.durationMs;
  }

  /* c8 ignore next 2 -- the segments always sum to cycleMs, so this is unreachable */
  return { ...COMPLETE, cycle: cycles, totalCycles: cycles };
}

export interface PhaseBoundary {
  readonly phase: Exclude<BreathPhase, "done">;
  /** Where this phase starts within one cycle, 0-100. */
  readonly startPercent: number;
  readonly endPercent: number;
}

/**
 * Where each phase sits within a cycle, as percentages.
 *
 * This is what lets the breathing circle run as a single CSS animation rather
 * than a React state update per frame. An expanding circle re-rendered at
 * 60fps is wasteful everywhere and visibly janky on the cheap phone someone is
 * holding at 1 a.m., which is the only device that matters here.
 */
export function phaseBoundaries(pattern: BreathPattern): readonly PhaseBoundary[] {
  const cycleMs = cycleDurationMs(pattern);
  if (cycleMs === 0) return [];

  const boundaries: PhaseBoundary[] = [];
  let elapsed = 0;
  for (const segment of segmentsFor(pattern)) {
    const startPercent = (elapsed / cycleMs) * 100;
    elapsed += segment.durationMs;
    boundaries.push({
      phase: segment.phase,
      startPercent: Math.round(startPercent * 100) / 100,
      endPercent: Math.round((elapsed / cycleMs) * 10000) / 100,
    });
  }
  return boundaries;
}

/** What to say during a phase. Short, because reading while breathing is hard. */
export const BREATH_LABELS: Readonly<Record<BreathPhase, string>> = Object.freeze({
  inhale: "In",
  sniff: "And a little more",
  exhale: "Out",
  done: "Done",
});

/* ------------------------------------------------------------------ */
/* The delay timer                                                     */
/* ------------------------------------------------------------------ */

export interface DelayState {
  readonly totalMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
  /** 0–1. Drives the ring. */
  readonly progress: number;
  readonly complete: boolean;
}

/**
 * How far through a delay someone is.
 *
 * Both arguments are absolute times, so this is correct across a backgrounded
 * tab, a closed laptop, or a page reload an hour later. A clock that runs
 * backwards clamps to zero rather than reporting negative progress.
 */
export function delayStateAt(startedAtMs: number, minutes: number, nowMs: number): DelayState {
  const totalMs = Math.max(0, minutes) * 60_000;
  const elapsedMs = Math.min(Math.max(0, nowMs - startedAtMs), totalMs);
  const remainingMs = totalMs - elapsedMs;
  return Object.freeze({
    totalMs,
    elapsedMs,
    remainingMs,
    progress: totalMs === 0 ? 1 : elapsedMs / totalMs,
    complete: remainingMs <= 0,
  });
}

/** "9:04". Always two-digit seconds, never a negative. */
export function formatRemaining(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds_ = total % 60;
  return `${minutes}:${String(seconds_).padStart(2, "0")}`;
}

/**
 * Which line of the holding script to show.
 *
 * The script is spread evenly across the wait so the words change every few
 * minutes. A wait with nothing to read is a wait spent watching a number.
 */
export function holdingLineAt(
  script: readonly string[],
  elapsedMs: number,
  totalMs: number,
): string | null {
  if (script.length === 0) return null;
  if (totalMs <= 0) return script[0] ?? null;
  const slot = Math.floor((Math.max(0, elapsedMs) / totalMs) * script.length);
  return script[Math.min(slot, script.length - 1)] ?? null;
}

/* ------------------------------------------------------------------ */
/* Step-based exercises                                                */
/* ------------------------------------------------------------------ */

export interface StepProgress {
  readonly index: number;
  readonly total: number;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  /** 1-based position, for "3 of 6". */
  readonly position: number;
}

/** Clamps a step index into range rather than trusting it. */
export function stepProgress(index: number, total: number): StepProgress {
  const safeTotal = Math.max(0, Math.floor(total));
  const safeIndex = safeTotal === 0 ? 0 : Math.min(Math.max(0, Math.floor(index)), safeTotal - 1);
  return Object.freeze({
    index: safeIndex,
    total: safeTotal,
    isFirst: safeIndex === 0,
    isLast: safeTotal === 0 || safeIndex === safeTotal - 1,
    position: safeIndex + 1,
  });
}
