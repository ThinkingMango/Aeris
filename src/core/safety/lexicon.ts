/**
 * The deterministic phrase tiers.
 *
 * These exist so that literal, unambiguous language cannot be missed by a
 * model outage, a cautious classifier, or a prompt-injection frame. Every rule
 * here sets a **floor**: a minimum risk level for the turn. The classifier may
 * raise a floor. Nothing may lower one.
 *
 * Two deliberate omissions, because this is an anxiety product and
 * over-escalation destroys it for the people it is for:
 *
 *  - Panic symptoms (racing heart, dizziness, tingling, breathlessness on its
 *    own) are NOT safety signals. They are the single most common thing an
 *    anxious person reports, and routing them to a medical emergency would
 *    make the product unusable. They belong to the `physical_arousal` pattern
 *    and are handled by the conversation.
 *  - Reassurance-seeking is NOT a safety signal either. It is the product's
 *    core use case and lives in `core/urges`.
 */
import { RiskLevel, type Certainty, type SafetyCategory } from "./risk";

export interface LexicalRule {
  readonly id: string;
  readonly pattern: RegExp;
  readonly level: RiskLevel;
  readonly category: SafetyCategory;
  /**
   * `high` means the language is literal enough that the classifier is not
   * consulted at all — there is nothing it could add that would be allowed to
   * lower the level. `medium` means the floor stands but the classifier still
   * runs and may raise it.
   */
  readonly certainty: Certainty;
}

/**
 * Lowercases, straightens apostrophes, and reduces punctuation to spaces so
 * that word-boundary patterns behave the same on "I'm", "I’m" and "Im".
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Tier 3 — imminent danger. An act under way, means at hand, or a      */
/* stated timeframe. These are the cases a miss is unacceptable on.     */
/* ------------------------------------------------------------------ */

const IMMINENT: readonly LexicalRule[] = [
  {
    id: "imminent.means_at_hand",
    pattern:
      /\b(pills|tablets|knife|blade|razor|rope|gun|bleach)\b[^.]{0,40}\b(in my hand|in front of me|next to me|beside me|right here|in my lap)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.means_at_hand_reversed",
    pattern:
      /\b(i have|i'm holding|holding|got)\b[^.]{0,25}\b(pills|tablets|knife|blade|razor|rope|gun)\b[^.]{0,25}\b(now|right now|ready|in my hand)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.place_of_attempt",
    pattern:
      /\b(standing|stood|sitting|i'm) (on|at) the (bridge|roof|ledge|edge|tracks|platform)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.act_in_progress",
    pattern:
      /\bi'?(ve| have)? ?(already |just )?(taken|swallowed|cut myself|started)\b[^.]{0,30}\b(pills|tablets|them|it|everything)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.quantity_ingested",
    pattern:
      /\b(took|swallowed|taken)\b[^.]{0,20}\b(all|the whole|a handful of|loads of|too many)\b[^.]{0,20}\b(pills|tablets|meds|medication)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.farewell",
    pattern:
      /\b((goodbye|farewell) (letter|note|message)|written a note|wrote a note|left a note)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.timeframe",
    pattern:
      /\b(tonight|today|right now|this evening|in an hour|before morning)\b[^.]{0,40}\b(end it|end my life|kill myself|do it|go through with it)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "imminent.timeframe_reversed",
    pattern:
      /\b(end it|end my life|kill myself|do it|go through with it)\b[^.]{0,30}\b(tonight|today|right now|this evening|in an hour|before morning)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
];

/* ------------------------------------------------------------------ */
/* Tier 2 — an explicitly stated wish to die, with or without a plan.   */
/* ------------------------------------------------------------------ */

const EXPLICIT: readonly LexicalRule[] = [
  {
    id: "explicit.kill_myself",
    pattern: /\b(kill|killing) myself\b|\btake my own life\b|\bend my (own )?life\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.want_to_die",
    pattern: /\b(want|wanting|wish i could|wanna) to? ?(die|be dead)\b|\bwant to die\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.wish_dead",
    pattern: /\bwish i (was|were) (dead|gone|never born)\b|\b(be |am |i'm )?better off dead\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.not_want_to_live",
    // "I don't want to live" is the risk itself, not a denial of one. It is
    // matched here so that the denial scanner below cannot swallow it.
    pattern:
      /\bdon'?t want to (live|be alive|be here|exist|wake up)\b|\bdon'?t want to be here any ?more\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.better_off_without_me",
    pattern:
      /\b(everyone|they|my family|everybody)( would| 'd| would all)? be better off (without me|if i (was|were) (gone|dead))\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.self_label",
    pattern: /\b(i'?m |i am |feeling )suicidal\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.self_harm_act",
    pattern: /\b(cut|cutting|burn|burning|hurt|hurting) myself\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "explicit.live_through",
    pattern: /\b(can'?t|couldn'?t) (live|get) through another\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "medium",
  },
];

/* ------------------------------------------------------------------ */
/* Method seeking. Fires regardless of the frame it arrives in — a      */
/* fictional, hypothetical or "asking for a friend" wrapper does not    */
/* change what the answer would be used for.                            */
/* ------------------------------------------------------------------ */

const METHOD: readonly LexicalRule[] = [
  {
    id: "method.how_to",
    pattern:
      /\bhow (to|do i|would i|can i|does (one|someone)|would someone|could someone)\b[^.]{0,30}\b(kill (myself|yourself|themselves|someone)|end (it|my life|your life)|die|hang|overdose)\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "method.dose_lethality",
    pattern:
      /\bhow (many|much)\b[^.]{0,30}\b(pills|tablets|mg|paracetamol|ibuprofen|insulin)\b[^.]{0,30}\b(kill|die|lethal|fatal|enough to)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "method.dose_lethality_reversed",
    pattern:
      /\b(lethal|fatal|deadly) (dose|amount|quantity)\b|\bpainless (way|method|death)\b|\bquickest way to die\b/,
    level: RiskLevel.IMMEDIATE,
    category: "self_harm",
    certainty: "high",
  },
  {
    id: "method.concealment",
    pattern:
      /\b(make it look like an accident|without (anyone|them|people) (knowing|finding out|noticing)|so no one (knows|finds out))\b/,
    level: RiskLevel.HIGH,
    category: "self_harm",
    certainty: "high",
  },
];

/* ------------------------------------------------------------------ */
/* Tier 1 — passive hopelessness. No stated wish to die, but ordinary   */
/* conversation is not the right answer either.                          */
/* ------------------------------------------------------------------ */

const PASSIVE: readonly LexicalRule[] = [
  {
    id: "passive.no_point",
    pattern:
      /\bwhat'?s the point( of (any of )?(it|this|anything))?\b|\bno point (in )?(going on|living|carrying on|any ?more)\b/,
    level: RiskLevel.ELEVATED,
    category: "self_harm",
    certainty: "medium",
  },
  {
    id: "passive.burden",
    pattern: /\bi'?m a burden\b|\bburden (to|on) (everyone|them|my family|people)\b/,
    level: RiskLevel.ELEVATED,
    category: "self_harm",
    certainty: "medium",
  },
  {
    id: "passive.want_it_to_stop",
    pattern:
      /\bwant (it all|everything|this|it) to (stop|end|be over)\b|\bjust want (it|this) to stop\b/,
    level: RiskLevel.ELEVATED,
    category: "self_harm",
    certainty: "medium",
  },
  {
    id: "passive.cant_go_on",
    pattern:
      /\bcan'?t (go on|keep going|carry on|do this any ?more|take (it|this) any ?more)\b/,
    level: RiskLevel.ELEVATED,
    category: "self_harm",
    certainty: "medium",
  },
  {
    id: "passive.no_reason",
    pattern: /\bno reason to (keep going|carry on|get up|be here|live)\b/,
    level: RiskLevel.ELEVATED,
    category: "self_harm",
    certainty: "medium",
  },
  {
    id: "passive.tired_of_living",
    pattern: /\b(tired|sick) of (living|being alive|all of (it|this)|everything)\b/,
    level: RiskLevel.ELEVATED,
    category: "self_harm",
    certainty: "medium",
  },
];

/* ------------------------------------------------------------------ */
/* Acute medical. Deliberately narrow: only genuine red flags, never    */
/* the ordinary physical sensations of anxiety.                         */
/* ------------------------------------------------------------------ */

const MEDICAL_ACUTE: readonly LexicalRule[] = [
  {
    id: "medical.crushing_chest",
    pattern:
      // Deliberately does NOT fire on "chest pain and I can't breathe": that is
      // a textbook panic presentation and the single most common thing this
      // product hears. Radiation to the arm or jaw, or an explicitly crushing
      // quality, is what separates a red flag from an anxious chest.
      /\b(crushing|severe|worst) (chest )?(pain|pressure)\b|\bchest (pain|tightness)\b[^.]{0,30}\b(arm|jaw|shoulder)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "medical_emergency",
    certainty: "high",
  },
  {
    id: "medical.stroke_signs",
    pattern:
      /\b(slurred speech|face (has )?dropped|numb (down|on) one side|can'?t move my (arm|leg|side))\b/,
    level: RiskLevel.IMMEDIATE,
    category: "medical_emergency",
    certainty: "high",
  },
  {
    id: "medical.bleeding_unconscious",
    pattern:
      /\b(bleeding (heavily|badly|a lot|won'?t stop)|passed out|unconscious|coughing up blood|vomiting blood)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "medical_emergency",
    certainty: "high",
  },
  {
    id: "medical.overdose_reported",
    pattern: /\b(overdosed|took an overdose|od'?d)\b/,
    level: RiskLevel.IMMEDIATE,
    category: "medical_emergency",
    certainty: "high",
  },
  {
    id: "medical.red_flag_symptom",
    // Worth a clinician, not an ambulance. Restricts advice; never claims it
    // is "just anxiety" and never tells the person it is serious either.
    pattern:
      /\b(a lump|blood in my (stool|urine|pee)|losing weight without|a mole that (has )?changed)\b/,
    level: RiskLevel.ELEVATED,
    category: "medical_emergency",
    certainty: "medium",
  },
];

/* ------------------------------------------------------------------ */
/* Medication. Never advised on, always routed to a prescriber.         */
/* ------------------------------------------------------------------ */

const MEDICATION: readonly LexicalRule[] = [
  {
    id: "medication.change",
    pattern:
      /\b(stop|quit|come off|get off|start|restart) (taking )?(my|the|his|her) (meds|medication|antidepressant|ssri|snri|pills|prescription|tablets)\b/,
    level: RiskLevel.ELEVATED,
    category: "medication",
    certainty: "high",
  },
  {
    id: "medication.dose",
    pattern:
      /\b(double|triple|increase|reduce|lower|halve|skip|miss) (my|the|a) (dose|dosage|meds|medication|tablet)\b/,
    level: RiskLevel.ELEVATED,
    category: "medication",
    certainty: "high",
  },
  {
    id: "medication.named",
    pattern:
      /\bmy (antidepressant|ssri|snri|benzo|benzodiazepine|beta blocker|prescription|sertraline|fluoxetine|citalopram|propranolol|diazepam)\b/,
    level: RiskLevel.ELEVATED,
    category: "medication",
    certainty: "medium",
  },
];

/* ------------------------------------------------------------------ */
/* Violence, abuse, substances, reality-sensitive content.              */
/* ------------------------------------------------------------------ */

const OTHER: readonly LexicalRule[] = [
  {
    id: "violence.stated_intent",
    pattern:
      /\bi'?(m going to|m gonna| will| want to| am going to)\b[^.]{0,20}\b(kill|stab|shoot|attack|hurt|beat up)\b[^.]{0,20}\b(him|her|them|my|his|the|someone)\b/,
    level: RiskLevel.HIGH,
    category: "harm_to_others",
    certainty: "high",
  },
  {
    id: "abuse.being_harmed",
    pattern:
      /\b(he|she|they|my (partner|husband|wife|boyfriend|girlfriend|dad|mum|mom|father|mother)) (hits|hit|beats|beat|chokes|choked|strangled|hurts|hurt) me\b/,
    level: RiskLevel.HIGH,
    category: "abuse",
    certainty: "high",
  },
  {
    id: "abuse.threatened",
    pattern:
      /\bthreatened to (kill|hurt|hit) me\b|\b(afraid|scared|frightened) (of|for) my (partner|husband|wife|safety|life)\b/,
    level: RiskLevel.HIGH,
    category: "abuse",
    certainty: "high",
  },
  {
    id: "substance.dangerous_mix",
    pattern:
      /\b(mixed|mixing|took) (them|it|the pills|my meds) with (alcohol|booze|wine|vodka|drink)\b|\bdrank a (whole|full) bottle\b/,
    level: RiskLevel.IMMEDIATE,
    category: "substance_crisis",
    certainty: "high",
  },
  {
    id: "reality.surveillance",
    pattern:
      /\b(cameras|microphones|they'?re|someone is|people are) (watching|listening to|following|tracking) me\b/,
    level: RiskLevel.ELEVATED,
    category: "reality_sensitive",
    certainty: "medium",
  },
  {
    id: "reality.thought_interference",
    pattern:
      /\b(reading my (thoughts|mind)|(sending|putting|beaming) (messages|thoughts|voices) (in|into) my (head|brain|mind)|controlling my (thoughts|mind|body))\b/,
    level: RiskLevel.ELEVATED,
    category: "reality_sensitive",
    certainty: "high",
  },
  {
    id: "reality.voices",
    pattern: /\b(i (can )?hear|hearing) voices\b/,
    level: RiskLevel.ELEVATED,
    category: "reality_sensitive",
    certainty: "high",
  },
];

/**
 * Every rule, ordered most severe first so that the first high-certainty match
 * at the top of the list is also the strongest one.
 */
export const SAFETY_RULES: readonly LexicalRule[] = Object.freeze([
  ...IMMINENT,
  ...METHOD,
  ...MEDICAL_ACUTE,
  ...OTHER,
  ...EXPLICIT,
  ...MEDICATION,
  ...PASSIVE,
]);

/**
 * Denial and distancing language.
 *
 * A match here NEVER lowers a floor. It lowers **certainty**, which means the
 * classifier is consulted instead of the turn being redirected on the phrase
 * alone. "I would never actually do it" deserves a careful reading, not a
 * dismissal and not an ambulance.
 */
export const DENIAL_PATTERNS: readonly RegExp[] = Object.freeze([
  /\bi'?m not (going to|gonna|planning to) (kill|hurt|do)\b/,
  /\bi would never (actually|really)?\s?(do|kill|hurt)\b/,
  /\bi'?m not suicidal\b/,
  /\bno (plan|plans|intention|intentions) (to|of)\b/,
  /\b(a friend|my friend|someone i know) (said|told me|is)\b/,
  /\bin a (film|movie|book|game|song)\b/,
]);

/**
 * Bids for a relationship the product must not pretend to offer. Not a risk
 * level — these route to reviewed copy so the model never gets the chance to
 * imply romance, exclusivity, permanence or consciousness.
 */
export const RELATIONAL_BID_PATTERNS: readonly RegExp[] = Object.freeze([
  /\b(do you love me|i love you|are you in love)\b/,
  /\b(are you (conscious|sentient|real|alive|human)|do you have feelings)\b/,
  /\byou'?re my (only|best) friend\b/,
  /\b(don'?t leave me|will you always be here|promise you'?ll stay)\b/,
  /\byou'?re the only (one|thing) (who|that) (understands|gets) me\b/,
]);
