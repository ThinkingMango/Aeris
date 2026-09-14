/**
 * The exercises, owned entirely by the application.
 *
 * The model may **recommend** a slug from an allowed list. It never writes a
 * word of an exercise. Every instruction a person follows is in this file,
 * which means the pacing, the wording and the clinical framing are fixed,
 * reviewable, and cannot drift when a model changes.
 *
 * Framing rules, applied per entry:
 *  - Breathing is acute down-regulation. It never "stops" panic: breathing
 *    used to avoid sensations becomes a safety behaviour.
 *  - Grounding is a coping skill, not a treatment.
 *  - Worry postponement is a daily-worry tool, not a treatment for anything.
 *  - Nothing here diagnoses, and nothing promises an outcome.
 */

export const INTERVENTION_SLUGS = [
  "grounding",
  "slow_breathing",
  "physiological_sigh",
  "untangle_thought",
  "control_circle",
  "next_step",
  "delay_the_check",
  "sit_with_not_knowing",
  "worry_postponement",
  "wind_down",
] as const;

export type InterventionSlug = (typeof INTERVENTION_SLUGS)[number];

export function isInterventionSlug(value: unknown): value is InterventionSlug {
  return typeof value === "string" && (INTERVENTION_SLUGS as readonly string[]).includes(value);
}

export const INTERVENTION_KINDS = [
  "grounding",
  "breathing",
  "cognitive",
  "behavioural",
  "response_prevention",
] as const;

export type InterventionKind = (typeof INTERVENTION_KINDS)[number];

export interface Step {
  readonly instruction: string;
  readonly hint?: string;
  /** An optional jot. Always optional: nothing is ever required to continue. */
  readonly capture?: { readonly question: string; readonly placeholder: string };
}

export type Content =
  | { readonly kind: "sequence"; readonly steps: readonly Step[] }
  | {
      readonly kind: "breath";
      readonly inhaleSeconds: number;
      readonly exhaleSeconds: number;
      readonly secondInhale?: boolean;
      readonly cycles: number;
      readonly note: string;
    }
  | { readonly kind: "prompts"; readonly prompts: readonly { readonly question: string; readonly hint?: string }[] }
  | {
      readonly kind: "two_column";
      readonly leftTitle: string;
      readonly rightTitle: string;
      readonly leftHint: string;
      readonly rightHint: string;
      readonly closing: string;
    }
  | {
      readonly kind: "timer";
      readonly offeredMinutes: readonly number[];
      readonly holdingScript: readonly string[];
      readonly closingQuestion: string;
    };

export interface Intervention {
  readonly slug: InterventionSlug;
  readonly kind: InterventionKind;
  readonly title: string;
  /** One quiet line about what this is. */
  readonly intro: string;
  readonly duration: string;
  /** Shown once, under the title. Keeps the claim honest. */
  readonly framing: string;
  /** Internal only. Never rendered. Justifies the exercise to a reviewer. */
  readonly evidenceNote: string;
  readonly content: Content;
  readonly version: number;
}

const GROUNDING: Intervention = {
  slug: "grounding",
  kind: "grounding",
  title: "Ground me",
  intro: "We'll use what's around you right now. Nothing to get right.",
  duration: "About 2–3 minutes",
  framing: "A coping skill for right now, not a treatment.",
  evidenceNote:
    "Sensory grounding. A component of CBT and trauma-focused protocols; no standalone RCT. Framed as a skill, never as treatment.",
  content: {
    kind: "sequence",
    steps: [
      { instruction: "Notice your feet touching the floor.", hint: "Just the contact. Warm, cool, firm, soft." },
      {
        instruction: "Notice what is holding your weight.",
        hint: "A chair, a bed, the ground. Let it take the weight for a moment.",
      },
      {
        instruction: "Find three things you can see.",
        capture: { question: "Three things you can see", placeholder: "A lamp, a mug, the window…" },
      },
      {
        instruction: "Find two sounds you can hear.",
        capture: { question: "Two sounds", placeholder: "Traffic, a fan…" },
      },
      {
        instruction: "Notice one sensation in your body.",
        hint: "Anywhere. It doesn't have to be pleasant or interesting.",
        capture: { question: "One sensation", placeholder: "Tight shoulders, cool hands…" },
      },
      { instruction: "Look around the room once, slowly.", hint: "You're here." },
    ],
  },
  version: 1,
};

const SLOW_BREATHING: Intervention = {
  slug: "slow_breathing",
  kind: "breathing",
  title: "Slow my breathing",
  intro: "A slower breath, at whatever pace feels doable. No holding.",
  duration: "About 2 minutes",
  framing: "This settles the body a little. It isn't meant to make the feeling disappear.",
  evidenceNote:
    "Slow breathing with an extended exhale. Balban et al., Cell Reports Medicine 2023. Deliberately not framed as stopping panic: breathing used to avoid sensations becomes a safety behaviour.",
  content: {
    kind: "breath",
    inhaleSeconds: 4,
    exhaleSeconds: 6,
    cycles: 8,
    note: "In for about 4, out for about 6. Never hold your breath. Stop whenever you like.",
  },
  version: 1,
};

const PHYSIOLOGICAL_SIGH: Intervention = {
  slug: "physiological_sigh",
  kind: "breathing",
  title: "Reset my breath",
  intro: "Two breaths in through the nose, one long breath out. Five times.",
  duration: "About 1 minute",
  framing: "The fastest thing here. It takes the edge off; it doesn't fix the worry.",
  evidenceNote:
    "Cyclic sighing. Balban et al. 2023 found it outperformed mindfulness on mood over a month; a 2026 ecological-momentary pilot found a one-minute dose reduced state anxiety.",
  content: {
    kind: "breath",
    inhaleSeconds: 3,
    exhaleSeconds: 6,
    secondInhale: true,
    cycles: 5,
    note: "A second short sniff on top of the first breath in, then a long slow breath out through the mouth.",
  },
  version: 1,
};

const UNTANGLE_THOUGHT: Intervention = {
  slug: "untangle_thought",
  kind: "cognitive",
  title: "Untangle a thought",
  intro: "A few plain questions to separate what you know from what you're predicting.",
  duration: "About 4 minutes",
  framing: "CBT-informed questions. This isn't therapy, and there's no right answer.",
  evidenceNote:
    "Cognitive restructuring. CBT for anxiety disorders g=0.56 vs placebo across 41 placebo-controlled RCTs (Carpenter 2018).",
  content: {
    kind: "prompts",
    prompts: [
      { question: "What actually happened?", hint: "Just the events, as plainly as you can." },
      { question: "What is your mind predicting?", hint: "The version it keeps showing you." },
      { question: "What supports that prediction?", hint: "Take this seriously. It counts too." },
      { question: "What doesn't support it?" },
      { question: "What else could be true?", hint: "Other possibilities, not nicer ones." },
      { question: "How would you describe the situation to someone you trust?" },
    ],
  },
  version: 1,
};

const CONTROL_CIRCLE: Intervention = {
  slug: "control_circle",
  kind: "cognitive",
  title: "What's in my control",
  intro: "Sorting this into what's yours to carry and what isn't.",
  duration: "About 4 minutes",
  framing: "A sorting exercise. Some of what's outside your control will still matter.",
  evidenceNote: "Problem-solving orientation, a standard CBT component.",
  content: {
    kind: "two_column",
    leftTitle: "Within my control",
    rightTitle: "Outside my control",
    leftHint: "Things you could actually do or decide.",
    rightHint: "Other people, outcomes, the past, the timing.",
    closing: "What's one useful thing you could do with the part that's yours?",
  },
  version: 1,
};

const NEXT_STEP: Intervention = {
  slug: "next_step",
  kind: "behavioural",
  title: "Find my next step",
  intro: "Not solving everything. One small thing that would help.",
  duration: "About 3 minutes",
  framing: "Small and finishable beats important and vague.",
  evidenceNote:
    "Behavioural activation. 28-trial meta-analysis g=0.37 on anxiety (Psychological Medicine 2020); digital formats effective (JMIR 2025).",
  content: {
    kind: "prompts",
    prompts: [
      { question: "What's the smallest useful next step?", hint: "Something you could finish today." },
      { question: "When will you do it?", hint: "A rough time is fine." },
      { question: "What would make it easier to start?" },
    ],
  },
  version: 1,
};

const DELAY_THE_CHECK: Intervention = {
  slug: "delay_the_check",
  kind: "response_prevention",
  title: "Delay the check",
  intro: "Not never. Just not yet. You choose how long.",
  duration: "You choose: 10, 20 or 30 minutes",
  framing:
    "Checking works for a few minutes and then the doubt comes back stronger. Waiting is how that loop loosens.",
  evidenceNote:
    "Response delay, the self-help-safe relative of response prevention. Framed as a wellness skill, never as ERP, and never offered to someone who has said they are in treatment for OCD without also pointing at their clinician.",
  content: {
    kind: "timer",
    offeredMinutes: [10, 20, 30],
    holdingScript: [
      "The urge will rise, peak, and come down on its own. You don't have to do anything to it.",
      "You are not trying to stop wanting to check. You are finding out what happens if you wait.",
      "If the urge gets louder, that's the loop arguing. It isn't new information.",
      "Whatever you were going to check will still be there afterwards.",
    ],
    closingQuestion: "Did you check?",
  },
  version: 1,
};

const SIT_WITH_NOT_KNOWING: Intervention = {
  slug: "sit_with_not_knowing",
  kind: "cognitive",
  title: "Sit with not knowing",
  intro: "Four questions about the thing you can't be certain of.",
  duration: "About 3 minutes",
  framing: "The aim isn't to feel certain. It's to need certainty a little less.",
  evidenceNote:
    "Uncertainty tolerance, the cognitive companion to response delay. Targets intolerance of uncertainty, the maintaining factor behind reassurance seeking.",
  content: {
    kind: "prompts",
    prompts: [
      { question: "What is it you want to be sure about?", hint: "One sentence." },
      { question: "What would being sure actually change?", hint: "Practically, today." },
      {
        question: "What has checking done for this before?",
        hint: "How long did the relief last?",
      },
      { question: "What could you do while it stays unresolved?" },
    ],
  },
  version: 1,
};

const WORRY_POSTPONEMENT: Intervention = {
  slug: "worry_postponement",
  kind: "cognitive",
  title: "Park it until later",
  intro: "Write the worry down and give it a time slot.",
  duration: "About 2 minutes",
  framing: "A daily-worry tool. It parks the thought; it doesn't answer it.",
  evidenceNote:
    "Worry postponement. Effective for daily worry in non-clinical samples; evidence in diagnosed GAD is weaker, so it is framed as a tool rather than a treatment.",
  content: {
    kind: "prompts",
    prompts: [
      { question: "What's the worry, in one line?" },
      { question: "When will you come back to it?", hint: "A specific time tomorrow." },
      { question: "What are you doing instead, for now?" },
    ],
  },
  version: 1,
};

const WIND_DOWN: Intervention = {
  slug: "wind_down",
  kind: "behavioural",
  title: "Put the day down",
  intro: "Tomorrow's first step, and anything still circling.",
  duration: "About 3 minutes",
  framing: "One component of a sleep routine, not a sleep programme.",
  evidenceNote:
    "A constructive-worry component of CBT-I. Digital CBT-I reduces anxiety (SMD −0.29); sleep improvement mediates most of the anxiety effect.",
  content: {
    kind: "prompts",
    prompts: [
      { question: "What's the first thing you'll do tomorrow?", hint: "One thing. Small." },
      { question: "What else is still circling?", hint: "List it. You're not solving it now." },
      { question: "What would help you put this down?" },
    ],
  },
  version: 1,
};

export const INTERVENTIONS: Readonly<Record<InterventionSlug, Intervention>> = Object.freeze({
  grounding: GROUNDING,
  slow_breathing: SLOW_BREATHING,
  physiological_sigh: PHYSIOLOGICAL_SIGH,
  untangle_thought: UNTANGLE_THOUGHT,
  control_circle: CONTROL_CIRCLE,
  next_step: NEXT_STEP,
  delay_the_check: DELAY_THE_CHECK,
  sit_with_not_knowing: SIT_WITH_NOT_KNOWING,
  worry_postponement: WORRY_POSTPONEMENT,
  wind_down: WIND_DOWN,
});

export function getIntervention(slug: InterventionSlug): Intervention {
  return INTERVENTIONS[slug];
}
