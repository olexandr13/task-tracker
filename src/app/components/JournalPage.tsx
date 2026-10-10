import { useId, useState } from 'react'
import {
  journalHistory,
  journalLines,
  JOURNAL_SECTIONS,
  toLocalDay,
  type JournalDay,
  type JournalEntry,
  type JournalEntryId,
  type JournalSection as Section,
} from '../../core'
import {
  describeJournalDay,
  describeToday,
  HISTORY_TOGGLE,
  JOURNAL_HEADING,
  JOURNAL_INTRO,
  JOURNAL_SECTION_LABELS,
  NOTHING_IN_HISTORY,
} from '../journalLabels'
import { ChevronIcon } from './ChevronIcon'
import { InfoButton } from './InfoButton'
import { JournalSection } from './JournalSection'

const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const reveal =
  'flex h-8 items-center gap-1 self-start rounded-lg px-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:h-7 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

interface JournalPageProps {
  entries: readonly JournalEntry[]
  now: Date
  onAdd: (section: Section, text: string, day: string) => void
  onChange: (id: JournalEntryId, text: string) => void
  onRemove: (entry: JournalEntry) => void
}

/**
 * The journal (JRN-1): today's good things, achievements and gratitude, a few
 * lines each, and — on asking — the week before, to read back (JRN-6).
 *
 * Whether the week is shown is not kept: the page opens on today alone, the day
 * being written.
 */
export function JournalPage({ entries, now, onAdd, onChange, onRemove }: JournalPageProps) {
  const today = toLocalDay(now)
  const [showHistory, setShowHistory] = useState(false)
  const historyId = useId()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{JOURNAL_HEADING}</h2>
          <InfoButton label={JOURNAL_HEADING}>
            {JOURNAL_INTRO.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </InfoButton>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{describeToday(now)}</p>
      </div>

      {JOURNAL_SECTIONS.map((section) => (
        <JournalSection
          // A new day starts its sections afresh, nothing half typed carried into it.
          key={`${section}-${today}`}
          section={section}
          lines={journalLines(entries, today, section)}
          onAdd={(chosen, text) => { onAdd(chosen, text, today) }}
          onChange={onChange}
          onRemove={onRemove}
        />
      ))}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => { setShowHistory(!showHistory) }}
          aria-expanded={showHistory}
          aria-controls={historyId}
          className={reveal}
        >
          <ChevronIcon className={`size-3.5${showHistory ? ' rotate-180' : ''}`} />
          {showHistory ? HISTORY_TOGGLE.hide : HISTORY_TOGGLE.show}
        </button>

        <div id={historyId} hidden={!showHistory} className="flex flex-col gap-3">
          {showHistory && <JournalHistory days={journalHistory(entries, now)} now={now} />}
        </div>
      </div>
    </div>
  )
}

/** The week gone by, to read back (JRN-6): a card a day with anything written, latest first. */
function JournalHistory({ days, now }: { days: readonly JournalDay[]; now: Date }) {
  if (days.length === 0) {
    return <p className="px-2 text-sm text-neutral-500 dark:text-neutral-400">{NOTHING_IN_HISTORY}</p>
  }

  return days.map(({ day, sections }) => (
    <section key={day} aria-label={describeJournalDay(day, now)} className={`${card} flex flex-col gap-3 px-4 py-3.5`}>
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{describeJournalDay(day, now)}</h3>
      {JOURNAL_SECTIONS.filter((section) => sections[section].length > 0).map((section) => (
        <div key={section} className="flex flex-col gap-1">
          <h4 className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span aria-hidden="true">{JOURNAL_SECTION_LABELS[section].emoji}</span>
            {JOURNAL_SECTION_LABELS[section].pastTitle}
          </h4>
          <ol className="flex list-decimal flex-col gap-0.5 pl-9 text-sm break-words text-neutral-700 marker:text-neutral-400 dark:text-neutral-200 dark:marker:text-neutral-500">
            {sections[section].map((entry) => (
              <li key={entry.id}>{entry.text}</li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  ))
}
