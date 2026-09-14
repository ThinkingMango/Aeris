/**
 * Runs before every page and route that carries an identity.
 *
 * Its only job is refreshing the Supabase access token, which is short-lived.
 * It deliberately does **not** create accounts: middleware sees crawlers,
 * prefetches and asset requests, and minting an anonymous user for each of
 * those would fill `auth.users` with people who do not exist. Account creation
 * lives in the route layer, where a request has actually asked for something.
 */
import type { NextRequest, NextResponse } from "next/server";

import { refreshSession } from "@/server/supabase/middleware";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  return refreshSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - Next's static output and image optimiser, which have no session
     *  - the Paddle webhook, which is signature-authenticated, carries no
     *    cookies, and must not have its body touched by anything upstream
     *  - image files
     */
    "/((?!_next/static|_next/image|favicon.ico|api/billing/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
