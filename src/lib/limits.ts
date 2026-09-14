/**
 * The handful of limits the browser needs to know about.
 *
 * Duplicated deliberately rather than imported from the server config: a
 * client component that imports server code drags an SDK into the bundle. The
 * numbers are checked against each other by a test.
 */
export const LIMITS = {
  maxInputChars: 4000,
} as const;
