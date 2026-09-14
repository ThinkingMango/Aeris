/**
 * The link in the email lands here.
 *
 * Covers both journeys, because Supabase distinguishes them by `type` and we
 * do not need to: confirming an email added to an anonymous account, and
 * signing back in to an existing one from a new device.
 */
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { supabaseRouteClient } from "@/server/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: readonly string[] = ["email", "email_change", "magiclink", "signup", "recovery"];

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (tokenHash === null || type === null || !ALLOWED.includes(type)) {
    redirect("/account?verified=failed");
  }

  const supabase = await supabaseRouteClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  // The reason is never put in the URL. "Expired" and "already used" are both
  // ordinary, and neither is worth leaking to anything reading the address bar.
  redirect(error === null ? "/account?verified=1" : "/account?verified=failed");
}
