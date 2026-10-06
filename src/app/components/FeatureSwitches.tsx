import { useId, type ReactNode } from 'react'
import { FEATURE_PARENT, FEATURES, isFeatureOn, type Feature, type FeaturesOff } from '../../core'
import { FEATURE_LABELS } from '../featureLabels'
import { VIEW_ICONS, type ViewIcon } from '../viewIcons'
import { BellIcon } from './BellIcon'
import { ChevronIcon } from './ChevronIcon'
import { OptionSwitch } from './OptionSwitch'
import { ProgressIcon } from './ProgressIcon'
import { QuoteIcon } from './QuoteIcon'

/** The glyph each switch carries: the one its page is navigated by, where it has a page. */
const FEATURE_ICONS: Readonly<Record<Feature, ViewIcon>> = {
  habits: VIEW_ICONS.habits,
  rewards: VIEW_ICONS.rewards,
  cases: VIEW_ICONS['rewards/cases'],
  lists: VIEW_ICONS.lists,
  tags: VIEW_ICONS.tags,
  balance: VIEW_ICONS.balance,
  activity: VIEW_ICONS.activity,
  modes: VIEW_ICONS.modes,
  progress: ProgressIcon,
  quote: QuoteIcon,
  reminders: BellIcon,
}

/** A feature's own settings, folded away under its switch until its chevron is pressed. */
export interface FeatureSettings {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly children: ReactNode
}

interface FeatureSwitchesProps {
  /** The features switched off, the account's (STORE-56). */
  off: FeaturesOff
  /** Whether the switches are still on their way from the account (FEAT-8). */
  loading: boolean
  onChange: (feature: Feature, on: boolean) => void
  /** What a feature has to set of its own (FEAT-10): drawn under its switch while it is on. */
  settings?: Partial<Record<Feature, FeatureSettings>>
}

/** The column in front of every switch, holding the chevron of a feature with settings of its own. */
const gutter = 'flex w-8 shrink-0 items-center justify-center'

const foldButton =
  'grid size-8 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/**
 * The switches under Features on Settings (FEAT-1): one for each part of the
 * app that can be done without, saying what it is under its name. A part of
 * another — Cases of Rewards, Balance of Tags — sits indented under it, and is
 * offered only while that one is on (FEAT-4): a switch that does nothing until
 * something else is turned on would only puzzle.
 *
 * A feature with settings of its own carries a chevron in front of it
 * (FEAT-10), which unfolds them under its name — the next step down the same
 * tree, joined to the feature by a line down from its icon. They are there only while the feature is on, as its pages are
 * (FEAT-3). Every switch keeps the chevron's column, so the switches start in
 * one line whether or not they have anything under them.
 *
 * Nothing is offered until the account has said how they stand (FEAT-8): a
 * switch drawn on a guess would send that guess back to the account.
 */
export function FeatureSwitches({ off, loading, onChange, settings = {} }: FeatureSwitchesProps) {
  const foldId = useId()

  if (loading) return <p className="text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>

  return (
    <div className="-mx-2 flex flex-col">
      {FEATURES.map((feature) => {
        const parent = FEATURE_PARENT[feature]
        if (parent !== undefined && !isFeatureOn(off, parent)) return null

        const { name, description } = FEATURE_LABELS[feature]
        const Icon = FEATURE_ICONS[feature]
        const own = isFeatureOn(off, feature) ? settings[feature] : undefined
        const ownId = `${foldId}-${feature}`

        return (
          // Indented under what it is part of, so it reads as part of it.
          <div key={feature} className={parent === undefined ? undefined : 'pl-8'}>
            <div className="flex items-center">
              <span className={gutter}>
                {own !== undefined && (
                  <button
                    type="button"
                    onClick={() => { own.onOpenChange(!own.open) }}
                    aria-expanded={own.open}
                    aria-controls={own.open ? ownId : undefined}
                    aria-label={`${name} settings`}
                    className={foldButton}
                  >
                    <ChevronIcon className={`size-4 transition-transform ${own.open ? '' : '-rotate-90'}`} />
                  </button>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <OptionSwitch
                  icon={<Icon />}
                  label={name}
                  description={description}
                  checked={!off.includes(feature)}
                  onChange={(on) => { onChange(feature, on) }}
                />
              </div>
            </div>
            {own?.open === true && (
              // A line down from the middle of the feature's icon, and the settings beside it under its name.
              <div
                id={ownId}
                role="group"
                aria-label={`${name} settings`}
                className="ml-14 flex flex-col border-l border-neutral-200 pl-[17px] dark:border-neutral-700"
              >
                {own.children}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
