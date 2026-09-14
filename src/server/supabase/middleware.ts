/**
 * Token refresh, on every request that carries an identity.
 *
 * Supabase access tokens are short-lived. Without a refresh somewhere that can
 * write cookies, a conversation open in a tab overnight fails its next turn —
 * which, for this product, is the wrong hour to ask someone to sign in again.
 *
 * Middleware is the only place that sees every request and can rewrite the
 * response, so it lives here. The rule for the response object is strict and
 * easy to get wrong: cookies must be written to the *same* response that is
 * returned, or the rotated token never reaches the browser and the session
 * silently drops on the request after next.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseConfig } from "./config";

type Cookie = { name: string; value: string; options?: Record<string, unknown> };

export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  const config = supabaseConfig();
  // Not configured is a supported state in development. Pass through.
  if (config === null) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: Cookie[]) => {
        for (const cookie of list) request.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request });
        for (const cookie of list) {
          response.cookies.set(cookie.name, cookie.value, cookie.options ?? {});
        }
      },
    },
  });

  // This call is what performs the refresh. Removing it makes the middleware
  // look like it works right up until a token expires.
  await supabase.auth.getUser();

  return response;
}
