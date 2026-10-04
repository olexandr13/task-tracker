import { Fragment, useId } from 'react'
import { FEATURE_PARENT, FEATURES, isFeatureOn, type Feature, type FeaturesOff } from '../../core'
import { FEATURE_LABELS, FEATURES_HINT } from '../featureLabels'
import { VIEW_ICONS, type ViewIcon } from '../viewIcons'
import { BellIcon } from './BellIcon'
import { InfoButton } from './InfoButton'
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

interface FeaturesCardProps {
  /** The features switched off, the account's (STORE-56). */
  off: FeaturesOff
  /** Whether the switches are still on their way from the account (FEAT-8). */
  loading: boolean
  onChange: (feature: Feature, on: boolean) => void
}

/**
 * The switches on Settings (FEAT-1): one for each part of the app that can be
 * done without, saying what it is under its name. A part of another — Cases
 * of Rewards, Balance of Tags — sits indented under it, and is offered only
 * while that one is on (FEAT-4): a switch that does nothing until something
 * else is turned on would only puzzle.
 *
 * Nothing is offered until the account has said how they stand (FEAT-8): a
 * switch drawn on a guess would send that guess back to the account.
 */
export function FeaturesCard({ off, loading, onChange }: FeaturesCardProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-1.5">
        <h2 id={headingId} className="text-sm font-medium">
          Features
        </h2>
        <InfoButton label="Features">
          {FEATURES_HINT.map((line) => <p key={line}>{line}</p>)}
        </InfoButton>
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      ) : (
        <div className="mt-2 -mx-2 flex flex-col">
          {FEATURES.map((feature) => {
            const parent = FEATURE_PARENT[feature]
            if (parent !== undefined && !isFeatureOn(off, parent)) return null

            const { name, description } = FEATURE_LABELS[feature]
            const Icon = FEATURE_ICONS[feature]
            const line = (
              <OptionSwitch
                icon={<Icon />}
                label={name}
                description={description}
                checked={!off.includes(feature)}
                onChange={(on) => { onChange(feature, on) }}
              />
            )
            // Indented under what it is part of, so it reads as part of it.
            return parent === undefined ? (
              <Fragment key={feature}>{line}</Fragment>
            ) : (
              <div key={feature} className="pl-8">
                {line}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
