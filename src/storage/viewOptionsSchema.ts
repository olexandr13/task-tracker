import type { ViewOptions } from './viewOptionsRepository'

/**
 * The saved shape of the view options. Its own version, apart from the tasks'
 * and the quote's: how the views are shown has no reason to change shape with
 * either. Bump this whenever the shape below changes, and upgrade on reading.
 */
export const VIEW_OPTIONS_SCHEMA_VERSION = 1

export interface StoredViewOptions {
  version: number
  options: ViewOptions
}

export function toStoredViewOptions(options: ViewOptions): StoredViewOptions {
  return { version: VIEW_OPTIONS_SCHEMA_VERSION, options }
}

/**
 * Saved options in today's shape, or null when they can't be trusted — an
 * unknown version, or anything in them that is not what it should be.
 */
export function readViewOptions(data: unknown): ViewOptions | null {
  if (!isRecord(data) || data.version !== VIEW_OPTIONS_SCHEMA_VERSION || !isRecord(data.options)) return null

  const { showDetails } = data.options
  if (typeof showDetails !== 'boolean') return null

  return { showDetails }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
