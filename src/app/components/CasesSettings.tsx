import { COUNT_UNPAID_DESCRIPTION, COUNT_UNPAID_LABEL, PRACTICE_DESCRIPTION, PRACTICE_LABEL } from '../caseLabels'
import { Loading } from './Loading'
import { OptionSwitch } from './OptionSwitch'

/** Practice (CHST-21), where the build offers it: whether it is on, and the way to turn it. */
export interface CasesPractice {
  readonly practising: boolean
  readonly onChange: (practising: boolean) => void
}

interface CasesSettingsProps {
  /** Whether tasks without points add to what a case can pay (CHST-32), and whether the account has said yet. */
  counting: { readonly countUnpaid: boolean; readonly loading: boolean }
  onCountUnpaidChange: (countUnpaid: boolean) => void
  /** Practice, or nothing where the build does not offer it (`DEV_FLAGS`). */
  practice?: CasesPractice
}

/**
 * Cases' own settings, folded under its switch in Features on Settings
 * (FEAT-10): whether tasks without points count towards what a case can pay
 * (CHST-32), and practice where the build offers it (CHST-21).
 *
 * Counting is the account's, saved with what Cases asks of a day; until the
 * account has said, it says it is loading rather than offering a switch
 * whose press would save the defaults over what the account holds.
 *
 * Practice is a way to try Cases rather than a way to set it, so it is kept
 * off Cases' own page, where it would sit beside every real opening. Kept
 * nowhere: it is off whenever the app is opened.
 */
export function CasesSettings({ counting, onCountUnpaidChange, practice }: CasesSettingsProps) {
  return (
    <>
      {counting.loading ? (
        <Loading size="line" />
      ) : (
        <OptionSwitch
          label={COUNT_UNPAID_LABEL}
          description={COUNT_UNPAID_DESCRIPTION}
          checked={counting.countUnpaid}
          onChange={onCountUnpaidChange}
        />
      )}
      {practice !== undefined && (
        <OptionSwitch
          label={PRACTICE_LABEL}
          description={PRACTICE_DESCRIPTION}
          checked={practice.practising}
          onChange={practice.onChange}
        />
      )}
    </>
  )
}
