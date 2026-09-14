/**
 * Attaches an email to the account someone already has.
 *
 * This is the upgrade, and the reason the identity is a Supabase anonymous
 * user rather than a cookie: `updateUser` keeps the **same user id**, so every
 * session, pattern and urge already recorded belongs to the permanent account
 * the moment the email is confirmed. Nothing is migrated and nothing is lost.
 */
import { identityFor, json, optionalString, readJson } from "@/server/http";
import { supabaseRouteClient } from "@/server/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request): Promise<Response> {
  await identityFor(request);

  const body = await readJson(request);
  const email = optionalString(body["email"])?.trim().toLowerCase();
  if (email === undefined || !EMAIL.test(email) || email.length > 254) {
    return json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = await supabaseRouteClient();
  const { error } = await supabase.auth.updateUser({ email });

  if (error !== null) {
    // Never echoes the provider's message: it distinguishes "already
    // registered" from "rate limited", and the first is an account-existence
    // oracle for anyone who wants to probe.
    return json({ error: "could_not_send" }, { status: 400 });
  }

  return json({ sent: true });
}
