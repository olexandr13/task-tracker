import { useId } from 'react'
import { PRACTICE_DESCRIPTION, PRACTICE_HINT, PRACTICE_LABEL } from '../caseLabels'
import { InfoButton } from './InfoButton'
import { OptionSwitch } from './OptionSwitch'

interface CasesPracticeCardProps {
  practising: boolean
  onChange: (practising: boolean) => void
}

/**
 * Cases' practice switch on Settings (CHST-21): a way to try Cases
 * rather than a way to set it, so it is kept off Cases' own page, where
 * it would sit beside every real opening. Kept nowhere: it is off whenever the
 * app is opened.
 */
export function CasesPracticeCard({ practising, onChange }: CasesPracticeCardProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-1.5">
        <h2 id={headingId} className="text-sm font-medium">
          Cases
        </h2>
        <InfoButton label="Cases practice">
          <p>{PRACTICE_HINT}</p>
        </InfoButton>
      </div>

      <div className="mt-2 -mx-2">
        <OptionSwitch label={PRACTICE_LABEL} description={PRACTICE_DESCRIPTION} checked={practising} onChange={onChange} />
      </div>
    </section>
  )
}
