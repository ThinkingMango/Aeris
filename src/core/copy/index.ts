/**
 * Reviewed copy and the crisis registry.
 *
 * Every word here is application-owned. Where a turn routes to one of these,
 * the model is not consulted at all, because these are the moments when an
 * improvised sentence is worse than a fixed one.
 *
 * The crisis registry has one absolute rule: **no number is ever inferred.**
 * An entry exists only with a named source and a verification date. A country
 * without curated entries falls back to guidance that names no number at all,
 * because a wrong emergency number is worse than none.
 */
import type { CopyRoute } from "../safety/index";

/* ------------------------------------------------------------------ */
/* Crisis resources                                                    */
/* ------------------------------------------------------------------ */

export type ResourceKind = "call" | "text" | "chat" | "emergency";

export interface CrisisResource {
  readonly countryCode: string;
  /** The service's own published name. */
  readonly label: string;
  readonly kind: ResourceKind;
  /** Exactly as the service publishes it. */
  readonly value: string;
  readonly availability: string;
  /** The page the entry was taken from. */
  readonly source: string;
  readonly lastVerified: string;
}

export const GENERIC_COUNTRY = "XX";

const RESOURCES: readonly CrisisResource[] = Object.freeze([
  // United States
  { countryCode: "US", label: "988 Suicide & Crisis Lifeline", kind: "call", value: "988", availability: "24/7", source: "https://988lifeline.org/", lastVerified: "2026-09-13" },
  { countryCode: "US", label: "988 Suicide & Crisis Lifeline", kind: "text", value: "Text 988", availability: "24/7", source: "https://988lifeline.org/", lastVerified: "2026-09-13" },
  { countryCode: "US", label: "Emergency services", kind: "emergency", value: "911", availability: "24/7", source: "https://www.usa.gov/emergency-services", lastVerified: "2026-09-13" },

  // United Kingdom
  { countryCode: "GB", label: "Samaritans", kind: "call", value: "116 123", availability: "24/7, free", source: "https://www.samaritans.org/how-we-can-help/contact-samaritan/talk-us-phone/", lastVerified: "2026-09-13" },
  { countryCode: "GB", label: "Shout", kind: "text", value: "Text SHOUT to 85258", availability: "24/7", source: "https://giveusashout.org/get-help/", lastVerified: "2026-09-13" },
  { countryCode: "GB", label: "NHS 111, option 2", kind: "call", value: "111", availability: "24/7 urgent mental health support", source: "https://www.england.nhs.uk/2024/08/nhs-111-offering-crisis-mental-health-support-for-the-first-time/", lastVerified: "2026-09-13" },
  { countryCode: "GB", label: "Emergency services", kind: "emergency", value: "999", availability: "24/7", source: "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/", lastVerified: "2026-09-13" },

  // Hong Kong
  { countryCode: "HK", label: "The Samaritans Hong Kong", kind: "call", value: "2896 0000", availability: "24/7, multilingual", source: "https://samaritans.org.hk/", lastVerified: "2026-09-13" },
  { countryCode: "HK", label: "Suicide Prevention Services", kind: "call", value: "2382 0000", availability: "24/7", source: "https://www.sps.org.hk/", lastVerified: "2026-09-13" },
  { countryCode: "HK", label: "Open Up", kind: "text", value: "WhatsApp or SMS 9101 2012", availability: "24/7 online chat", source: "https://www.openup.hk/en-us/service", lastVerified: "2026-09-13" },
  { countryCode: "HK", label: "Mental Health Support Hotline", kind: "call", value: "18111", availability: "24/7", source: "https://www.shallwetalk.hk/en/get-help/mental-health-support-hotline-18111/", lastVerified: "2026-09-13" },
  { countryCode: "HK", label: "Emergency services", kind: "emergency", value: "999", availability: "24/7", source: "https://www.gov.hk/en/residents/housing/emergency/", lastVerified: "2026-09-13" },

  // Singapore
  { countryCode: "SG", label: "Samaritans of Singapore", kind: "call", value: "1767", availability: "24/7", source: "https://www.sos.org.sg/", lastVerified: "2026-09-13" },
  { countryCode: "SG", label: "Emergency services", kind: "emergency", value: "995", availability: "24/7", source: "https://www.scdf.gov.sg/", lastVerified: "2026-09-13" },

  // Australia
  { countryCode: "AU", label: "Lifeline", kind: "call", value: "13 11 14", availability: "24/7", source: "https://www.lifeline.org.au/", lastVerified: "2026-09-13" },
  { countryCode: "AU", label: "Emergency services", kind: "emergency", value: "000", availability: "24/7", source: "https://www.triplezero.gov.au/", lastVerified: "2026-09-13" },
]);

/** Countries with curated entries. Everything else gets generic guidance. */
export const COVERED_COUNTRIES: readonly string[] = Object.freeze([
  ...new Set(RESOURCES.map((resource) => resource.countryCode)),
]);

/**
 * Resources for a country.
 *
 * A country that is not covered returns an empty list, never another
 * country's numbers. The caller renders generic guidance in that case.
 */
export function resolveCrisisResources(countryCode: string | null): {
  readonly countryCode: string;
  readonly resources: readonly CrisisResource[];
} {
  const code = (countryCode ?? "").toUpperCase();
  if (code === "" || !COVERED_COUNTRIES.includes(code)) {
    return Object.freeze({ countryCode: GENERIC_COUNTRY, resources: Object.freeze([]) });
  }
  return Object.freeze({
    countryCode: code,
    resources: Object.freeze(RESOURCES.filter((resource) => resource.countryCode === code)),
  });
}

export const GENERIC_CRISIS_GUIDANCE =
  "If you are in danger right now, please call your local emergency number. If you can, tell someone near you what is happening, or reach a crisis line in your country — searching for \"crisis line\" and your country will find one.";

/* ------------------------------------------------------------------ */
/* Reviewed replies                                                    */
/* ------------------------------------------------------------------ */

export const REVIEWED_REPLIES: Readonly<Record<CopyRoute, string>> = Object.freeze({
  crisis:
    "I'm glad you told me. What you're describing is more than I'm built for, and I don't want to be the only thing in the way. Please reach one of the options below — a person, right now. I'll stay out of the way of that.",

  medication:
    "I can't help with anything to do with medication — not the dose, not stopping, not starting. That has to be your prescriber or a pharmacist, and they can usually answer quickly. If you've already taken more than you should have, please treat that as urgent and call for help now.",

  reality_sensitive:
    "That sounds frightening, and I'm not going to pretend I can tell you what's real here. What I can say is that this is worth talking through with someone who can actually be with you — a doctor you trust, or someone close to you. Is there anyone you could tell today?",

  violence_abuse:
    "Thank you for saying that. Your safety comes before anything else here, and this is beyond what a self-help tool should be handling. The support options below are for exactly this. If you're in danger right now, please call your local emergency number.",

  relational:
    "I'm an AI — I'm not a person, and I won't pretend to be one, because you deserve better than something that pretends. I can be useful at the moment anxiety hits. The rest of it, the part that actually holds you, has to come from people. Who's closest to that for you right now?",

  constrained:
    "Something on my side isn't working properly at the moment, so I'm going to keep this short rather than guess. Your exercises all still work, and your support options are always open. Would one of those help right now?",
});

/** Shown when a guard aborts a reply mid-stream. */
export const GUARD_FALLBACK_REPLY =
  "Let me put that a different way. I can't tell you how this turns out, and I don't want to pretend otherwise. What I can do is help you with the part that's in front of you right now. Shall we try something small?";

/** Shown when the provider fails entirely. */
export const DEGRADED_REPLY =
  "I can't reach the part of me that writes replies at the moment. Everything else still works — the exercises run entirely on your device, and your support options are always open.";

/** The line shown at the start of every session. Required by several regimes. */
export const AI_DISCLOSURE =
  "Aeris is an AI. It isn't a person, a therapist, or an emergency service.";

export const BOUNDARY_STATEMENT =
  "Aeris is a self-help tool for anxious moments. It doesn't diagnose or treat anything, and it isn't a substitute for care from a person.";
