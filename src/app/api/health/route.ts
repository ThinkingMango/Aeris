import { NextResponse } from "next/server";

import { COVERED_COUNTRIES } from "@/core/copy/index";
import { PROMPT_VERSION } from "@/server/ai/models";
import { SAFETY_RULES_VERSION } from "@/core/safety/risk";

export const dynamic = "force-dynamic";

/**
 * Deployment identity and the versions that matter.
 *
 * Every one of these is something that must be named in a release record: a
 * change to any of them means the safety evaluation has to be re-run before
 * the build ships. Nothing here reveals a secret or a person.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      environment: process.env["APP_ENV"] ?? "unset",
      promptVersion: PROMPT_VERSION,
      safetyRulesVersion: SAFETY_RULES_VERSION,
      crisisCountries: COVERED_COUNTRIES.length,
      billingEnabled: process.env["BILLING_ENABLED"] === "true",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
