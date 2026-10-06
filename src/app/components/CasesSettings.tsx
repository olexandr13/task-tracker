import { COUNT_UNPAID_DESCRIPTION, COUNT_UNPAID_LABEL, PRACTICE_DESCRIPTION, PRACTICE_LABEL } from '../caseLabels'
import { OptionSwitch } from './OptionSwitch'

interface CasesSettingsProps {
  /** Whether tasks without points add to what a case can pay (CHST-32), and whether the account has said yet. */
  counting: { readonly countUnpaid: boolean; readonly loading: boolean }
  onCountUnpaidChange: (countUnpaid: boolean) => void
  practising: boolean
  onPractisingChange: (practising: boolean) => void
}

/**
 * Cases' own settings, folded under its switch in Features on Settings
 * (FEAT-10): whether tasks without points count towards what a case can pay
 * (CHST-32), and practice (CHST-21).
 *
 * Counting is the account's, saved with what Cases asks of a day; until the
 * account has said, it says it is loading rather than offering a switch
 * whose press would save the defaults over what the account holds.
 *
 * Practice is a way to try Cases rather than a way to set it, so it is kept
 * off Cases' own page, where it would sit beside every real opening. Kept
 * nowhere: it is off whenever the app is opened.
 */
export function CasesSettings({ counting, onCountUnpaidChange, practising, onPractisingChange }: CasesSettingsProps) {
  return (
    <>
      {counting.loading ? (
        <p className="px-2 py-2 text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      ) : (
        <OptionSwitch
          label={COUNT_UNPAID_LABEL}
          description={COUNT_UNPAID_DESCRIPTION}
          checked={counting.countUnpaid}
          onChange={onCountUnpaidChange}
        />
      )}
      <OptionSwitch label={PRACTICE_LABEL} description={PRACTICE_DESCRIPTION} checked={practising} onChange={onPractisingChange} />
    </>
  )
}
