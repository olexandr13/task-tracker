import { FEATURES, type Feature, type FeaturesOff } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the switches on Settings (FEAT-1). Its own version, apart
 * from everything else's; bump it whenever the shape below changes and migrate
 * on load (STORE-5). The sender that pushes check-ins reads it too
 * (`functions/`), so a change of shape is a change there as well.
 */
export const FEATURES_SCHEMA_VERSION = 1

/** The one document the switches are ever kept as, under this name. */
export const FEATURES_RECORD = 'features'

/** A feature saved under an earlier name. Cases was `chest`. */
const FORMER_NAME: Readonly<Partial<Record<Feature, string>>> = {
  cases: 'chest',
}

export interface StoredFeatures {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof FEATURES_RECORD
  /** The features switched off, by name. */
  off: string[]
}

/** What to save, or null for everything on — no record at all is that. */
export function toStoredFeatures(off: FeaturesOff): StoredFeatures | null {
  if (off.length === 0) return null
  return { version: FEATURES_SCHEMA_VERSION, name: FEATURES_RECORD, off: [...off] }
}

/**
 * The saved switches in today's shape, or null when they cannot be trusted — an
 * unknown version, or anything that is not a record of them. Unreadable reads
 * as everything on (STORE-7): hiding part of the app on a guess would look like
 * losing it. A name the app does not know — a feature a newer app has — is
 * passed over rather than costing the rest.
 */
export function readFeatures(data: unknown): FeaturesOff | null {
  if (!isRecord(data) || data.version !== FEATURES_SCHEMA_VERSION || !Array.isArray(data.off)) return null
  const off: readonly unknown[] = data.off
  return FEATURES.filter((feature) => off.includes(feature) || off.includes(FORMER_NAME[feature]))
}
