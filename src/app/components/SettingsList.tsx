import type { Feature, FeaturesOff } from '../../core'
import type { Account } from '../../storage/authService'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import { isSettingsFoldOpen, type SettingsFold, type SettingsLayout } from '../../storage/settingsLayoutRepository'
import type { Theme } from '../../storage/themeRepository'
import { FEATURES_HINT } from '../featureLabels'
import { LIMIT_RESTS_DESCRIPTION, LIMIT_RESTS_LABEL } from '../habitLabels'
import type { BackupStatus } from '../useBackup'
import { AccountSummary } from './AccountSummary'
import { BackupActions } from './BackupActions'
import { CasesSettings, type CasesPractice } from './CasesSettings'
import { FeatureSwitches, type FeatureSettings } from './FeatureSwitches'
import { Loading } from './Loading'
import { OptionSwitch } from './OptionSwitch'
import { SettingsSection } from './SettingsSection'
import { TelegramLink } from './TelegramLink'
import { ThemePicker } from './ThemePicker'

interface SettingsListProps {
  account: Account
  onSignOut: () => void
  backup: BackupStatus
  onExport: () => void
  onImport: (file: File) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  habitView: HabitViewOptions
  onHabitViewChange: (options: HabitViewOptions) => void
  /** Whether habits' rests are limited (HAB-36), and whether the account has said yet. */
  habitRests: { readonly on: boolean; readonly loading: boolean }
  onHabitRestsChange: (on: boolean) => void
  /** Whether Cases counts tasks without points (CHST-32), and whether the account has said yet. */
  casesCounting: { readonly countUnpaid: boolean; readonly loading: boolean }
  onCasesCountUnpaidChange: (countUnpaid: boolean) => void
  /** Cases practice (CHST-21), only where the build offers it (`DEV_FLAGS`). */
  casesPractice?: CasesPractice
  /** The features switched off (FEAT-1), and whether the account has said yet (FEAT-8). */
  features: { readonly off: FeaturesOff; readonly loading: boolean }
  onFeatureChange: (feature: Feature, on: boolean) => void
  /** Which sections, and which features' own settings, are folded on this device (STORE-57). */
  layout: SettingsLayout
  onFoldChange: (part: SettingsFold, open: boolean) => void
}

/**
 * The settings page (UI-35), in sections that fold away: **Account** — who is
 * signed in and the way out, and the account's data as a file to keep and a
 * file to bring back — then **Features**, which parts of the app are in use
 * (FEAT-1), then **Appearance**, the theme, then **Contact**, how to write to
 * the author (UI-87). Under them, which build of the app this is. Anything else there is to set goes in the section it belongs to,
 * and a setting of one feature goes under that feature's switch (FEAT-10):
 * how the habit cards start out and whether rests are limited under Habits
 * (HAB-23, HAB-36), counting tasks without points under Cases (CHST-32), and
 * practice beside it where the build offers it (CHST-21).
 *
 * A feature's settings go with it while it is switched off (FEAT-3), as its
 * pages do.
 *
 * What belongs to one mode is set on that mode's own page rather than here
 * (MODE-12): the nudge's span and hours are read beside what the nudge does.
 */
export function SettingsList({
  account,
  onSignOut,
  backup,
  onExport,
  onImport,
  theme,
  onThemeChange,
  habitView,
  onHabitViewChange,
  habitRests,
  onHabitRestsChange,
  casesCounting,
  onCasesCountUnpaidChange,
  casesPractice,
  features,
  onFeatureChange,
  layout,
  onFoldChange,
}: SettingsListProps) {
  function fold(part: SettingsFold) {
    return {
      open: isSettingsFoldOpen(layout, part),
      onOpenChange: (open: boolean) => { onFoldChange(part, open) },
    }
  }

  const featureSettings: Partial<Record<Feature, FeatureSettings>> = {
    habits: {
      ...fold('habits'),
      children: (
        <>
          <OptionSwitch
            label="Show habit details by default"
            checked={habitView.showDetails}
            onChange={(showDetails) => { onHabitViewChange({ ...habitView, showDetails }) }}
          />
          {/* The account's: until it has said, no switch whose press would save a guess over it. */}
          {habitRests.loading ? (
            <Loading size="line" />
          ) : (
            <OptionSwitch
              label={LIMIT_RESTS_LABEL}
              description={LIMIT_RESTS_DESCRIPTION}
              checked={habitRests.on}
              onChange={onHabitRestsChange}
            />
          )}
        </>
      ),
    },
    cases: {
      ...fold('cases'),
      children: (
        <CasesSettings
          counting={casesCounting}
          onCountUnpaidChange={onCasesCountUnpaidChange}
          practice={casesPractice}
        />
      ),
    },
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSection title="Account" {...fold('account')}>
        <AccountSummary account={account} onSignOut={onSignOut} />
        <div className="mt-3.5 border-t border-neutral-200 pt-3.5 dark:border-neutral-800">
          <BackupActions status={backup} onExport={onExport} onImport={onImport} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Features"
        info={FEATURES_HINT.map((line) => <p key={line}>{line}</p>)}
        {...fold('features')}
      >
        <FeatureSwitches
          off={features.off}
          loading={features.loading}
          onChange={onFeatureChange}
          settings={featureSettings}
        />
      </SettingsSection>

      <SettingsSection title="Appearance" {...fold('appearance')}>
        <ThemePicker theme={theme} onChange={onThemeChange} />
      </SettingsSection>

      <SettingsSection title="Contact" {...fold('contact')}>
        <TelegramLink />
      </SettingsSection>

      <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">Version {__APP_VERSION__}</p>
    </div>
  )
}
