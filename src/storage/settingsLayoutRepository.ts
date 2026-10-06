/**
 * The parts of Settings that fold away (UI-35): its sections, and a feature's
 * own settings under that feature's switch. A new one is a name here and how
 * it starts below; no version changes, a layout saved before it simply never
 * mentions it.
 */
export const SETTINGS_FOLDS = ['account', 'features', 'appearance', 'habits', 'cases'] as const

export type SettingsFold = (typeof SETTINGS_FOLDS)[number]

/**
 * Which parts of Settings are open, for those the owner has folded or unfolded.
 * One never touched is as it starts (`SETTINGS_FOLD_STARTS_OPEN`).
 */
export type SettingsLayout = Readonly<Partial<Record<SettingsFold, boolean>>>

/** Nothing folded or unfolded yet: every part as it starts. */
export const DEFAULT_SETTINGS_LAYOUT: SettingsLayout = {}

/**
 * How each part starts: the sections open, so the page shows everything the
 * first time; a feature's own settings folded under its switch, so the list of
 * features stays a list.
 */
export const SETTINGS_FOLD_STARTS_OPEN: Readonly<Record<SettingsFold, boolean>> = {
  account: true,
  features: true,
  appearance: true,
  habits: false,
  cases: false,
}

/** Whether one part of Settings is open, as the layout has it. */
export function isSettingsFoldOpen(layout: SettingsLayout, fold: SettingsFold): boolean {
  return layout[fold] ?? SETTINGS_FOLD_STARTS_OPEN[fold]
}

/**
 * Where Settings' layout is kept between visits.
 *
 * It belongs to the device rather than the account, as the sidebar's does
 * (STORE-31): how much of a page someone wants open is the screen's business.
 * Kept in the browser, it is there the moment the page opens, so nothing folds
 * or unfolds once it is drawn.
 */
export interface SettingsLayoutRepository {
  load(): SettingsLayout
  save(layout: SettingsLayout): void
}
