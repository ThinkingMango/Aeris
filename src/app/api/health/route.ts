import { NextResponse } from "next/server";

import { COVERED_COUNTRIES } from "@/core/copy/index";
import { PROMPT_VERSION } from "@/server/ai/models";
import { SAFETY_RULES_VERSION } from "@/core/safety/risk";
import { billingConfig, billingReadiness } from "@/server/billing/config";
import { isSupabaseConfigured } from "@/server/supabase/config";
import { repositoryKind } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deployment identity and the versions that matter.
 *
 * Every one of these is something that must be named in a release record: a
 * change to any of them means the safety evaluation has to be re-run before
 * the build ships.
 *
 * It also answers the question that costs the most time to debug by hand —
 * *is this deployment actually wired to anything?* A production instance
 * reporting `storage: "memory"` or `auth: false` is broken in a way that looks
 * completely healthy from the outside until somebody loses a conversation.
 *
 * Nothing here reveals a secret, a person, or a key. `billingMissing` names
 * environment variables, never their values.
 */
export function GET(): NextResponse {
  const billing = billingConfig();
  const readiness = billingReadiness(billing);

  return NextResponse.json(
    {
      ok: true,
      environment: process.env["APP_ENV"] ?? "unset",
      promptVersion: PROMPT_VERSION,
      safetyRulesVersion: SAFETY_RULES_VERSION,
      crisisCountries: COVERED_COUNTRIES.length,
      storage: repositoryKind(),
      auth: isSupabaseConfigured(),
      billing: {
        enabled: billing.enabled,
        environment: billing.environment,
        ready: readiness.ready,
        missing: readiness.missing,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
