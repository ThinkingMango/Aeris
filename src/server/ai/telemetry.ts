/**
 * Operational telemetry for model calls.
 *
 * Structurally incapable of carrying private content: there is no field here
 * that can hold a message, a worry, a trigger, a pattern or a risk category.
 * A leak would have to be a deliberate schema change, not an accident.
 */
export interface UsageRecord {
  readonly requestId: string;
  readonly operation: "turn" | "classify" | "summary";
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  readonly latencyMs: number;
  readonly ok: boolean;
  readonly failureKind?: string;
  /** Guard ids that fired, if any. Ids only — never the text they matched. */
  readonly guards?: readonly string[];
}

export function formatUsage(record: UsageRecord): string {
  const parts = [
    "[aeris/ai]",
    `request_id=${record.requestId}`,
    `op=${record.operation}`,
    `model=${record.model}`,
    `in=${record.inputTokens}`,
    `out=${record.outputTokens}`,
    `cache_read=${record.cacheReadTokens}`,
    `cache_write=${record.cacheWriteTokens}`,
    `latency_ms=${record.latencyMs}`,
    `ok=${record.ok}`,
  ];
  if (record.failureKind !== undefined) parts.push(`failure=${record.failureKind}`);
  if (record.guards !== undefined && record.guards.length > 0) {
    parts.push(`guards=${record.guards.join(",")}`);
  }
  return parts.join(" ");
}

export function recordUsage(record: UsageRecord): void {
  console.info(formatUsage(record));
}

export function newRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/**
 * Cache health. If this stays at zero across turns, something volatile has
 * crept into the cached prefix and the largest cost lever in the app is off.
 */
export function cacheHitRate(records: readonly UsageRecord[]): number | null {
  const relevant = records.filter((record) => record.operation === "turn");
  if (relevant.length === 0) return null;
  const hits = relevant.filter((record) => record.cacheReadTokens > 0).length;
  return Math.round((hits / relevant.length) * 100) / 100;
}
