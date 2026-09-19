/**
 * Whether a value read back from storage or a file is a plain object, the one
 * shape every saved record has. Arrays are objects too, so they are ruled out
 * by name.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
