/**
 * Signs back in on another device, by email link.
 *
 * `shouldCreateUser: false` on purpose. A new visitor already has an account —
 * the anonymous one they got by opening the app — and letting this create a
 * second would leave their history behind on the first. Signing in is for
 * returning to an account that exists.
 */
import { json, optionalString, readJson } from "@/server/http";
import { supabaseRouteClient } from "@/server/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const email = optionalString(body["email"])?.trim().toLowerCase();
  if (email === undefined || !EMAIL.test(email) || email.length > 254) {
    return json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = await supabaseRouteClient();
  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });

  // Always the same answer, whether or not that address has an account.
  // Anything else tells a stranger who uses an anxiety app.
  return json({ sent: true });
}
