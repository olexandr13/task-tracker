/**
 * The parts of the app that can be switched off on Settings (FEAT-1): each a
 * page, a panel or a notice someone may simply not want, the tasks themselves
 * being the one thing every account keeps.
 *
 * A feature switched off is hidden, not emptied (FEAT-3): what it holds stays
 * where it is, and switching it on again finds everything as it was. So what
 * is stored is only which ones are off — none, for an account that never
 * touched a switch — and a feature added later starts on for everyone, never
 * having been switched off.
 *
 * Some are part of another, and are off whenever that one is, whatever their
 * own switch says (FEAT-4): Cases is a way of earning points, and Balance
 * divides logged time by the tags. Their own switch is kept meanwhile, so the
 * part comes back as it was left when the whole does.
 */

/** Every feature there is, in the order Settings lists them. */
export const FEATURES = [
  'habits',
  'rewards',
  'cases',
  'lists',
  'tags',
  'balance',
  'activity',
  'journal',
  'modes',
  'progress',
  'quote',
  'reminders',
] as const

export type Feature = (typeof FEATURES)[number]

/** Which features are switched off, in the order of `FEATURES`; none is everything on. */
export type FeaturesOff = readonly Feature[]

/** Nothing switched off: how every account starts. */
export const ALL_FEATURES_ON: FeaturesOff = []

/** What a feature is part of, and so off with (FEAT-4). */
export const FEATURE_PARENT: Readonly<Partial<Record<Feature, Feature>>> = {
  cases: 'rewards',
  balance: 'tags',
}

export function isFeature(value: unknown): value is Feature {
  return typeof value === 'string' && (FEATURES as readonly string[]).includes(value)
}

/** Whether a feature is in use: its own switch on, and whatever it is part of on too. */
export function isFeatureOn(off: FeaturesOff, feature: Feature): boolean {
  if (off.includes(feature)) return false
  const parent = FEATURE_PARENT[feature]
  return parent === undefined || isFeatureOn(off, parent)
}

/**
 * The features off once one switch is turned. Only that switch moves: a part
 * keeps its own switch while the whole is off (FEAT-4).
 */
export function switchFeature(off: FeaturesOff, feature: Feature, on: boolean): FeaturesOff {
  return FEATURES.filter((candidate) => (candidate === feature ? !on : off.includes(candidate)))
}

/** Every feature, as on or off. */
export function featuresOn(off: FeaturesOff): Readonly<Record<Feature, boolean>> {
  return Object.fromEntries(FEATURES.map((feature) => [feature, isFeatureOn(off, feature)])) as Record<Feature, boolean>
}

/** The modes, by the name each is kept under. */
export type FeatureMode = 'procrastination' | 'warmUp' | 'nudge' | 'checkIn'

/**
 * What each mode needs switched on to be there at all (FEAT-9): every mode
 * needs the modes, the warm-up the habits it lets in, and the check-in the
 * activity log it asks to be written in.
 */
const MODE_NEEDS: Readonly<Record<FeatureMode, readonly Feature[]>> = {
  procrastination: ['modes'],
  warmUp: ['modes', 'habits'],
  nudge: ['modes'],
  checkIn: ['modes', 'activity'],
}

/**
 * Whether a mode is there to be used. One that is not does nothing, whatever
 * its own switch says — a mode that cannot be seen should not be felt either —
 * and its switch is kept as it is, so it carries on when what it needs is back.
 */
export function isModeAvailable(off: FeaturesOff, mode: FeatureMode): boolean {
  return MODE_NEEDS[mode].every((feature) => isFeatureOn(off, feature))
}
