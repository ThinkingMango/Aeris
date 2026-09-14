/**
 * Supabase configuration, read once and validated.
 *
 * Returns null rather than throwing when nothing is configured, because that
 * is a legitimate state: `npm run dev` with no infrastructure is how this
 * product is meant to be worked on. Production is the place that refuses.
 */
export interface SupabaseConfig {
  readonly url: string;
  /**
   * The browser-safe key. Supabase renamed these — `publishable` is current,
   * `anon` is the legacy name for the same thing — so both are accepted and
   * the current one wins.
   */
  readonly publishableKey: string;
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (url === undefined || url.length === 0) return null;
  if (key === undefined || key.length === 0) return null;
  return { url, publishableKey: key };
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfig() !== null;
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = supabaseConfig();
  if (config === null) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return config;
}

/**
 * The service role key bypasses row-level security completely.
 *
 * Read here and nowhere else, so there is exactly one place to check when
 * asking whether it can reach the browser. It cannot: nothing in `src/app`
 * imports this module, and the name does not begin with `NEXT_PUBLIC_`.
 */
export function serviceRoleKey(): string {
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (key === undefined || key.length === 0) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  return key;
}
