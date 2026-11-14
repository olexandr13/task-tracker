import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useId, useState } from 'react'
import {
  journalHistory,
  journalLines,
  toLocalDay,
  type JournalDay,
  type JournalEntry,
  type JournalEntryId,
  type JournalSection as Section,
} from '../../core'
import { isJournalSectionFolded, type JournalLayout } from '../../storage/journalLayoutRepository'
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

/** A card rides straight up and down: the sections are one column. */
const straightUpAndDown: Modifier = ({ transform }) => ({ ...transform, x: 0 })

interface JournalPageProps {
  entries: readonly JournalEntry[]
  now: Date
  /** The order of the sections and which are folded, as this device keeps them (JRN-11, JRN-12). */
  layout: JournalLayout
  /** A section dropped where another one is (JRN-11). */
  onMove: (section: Section, over: Section) => void
  onFold: (section: Section, folded: boolean) => void
  onAdd: (section: Section, text: string, day: string) => void
  onChange: (id: JournalEntryId, text: string) => void
  onRemove: (entry: JournalEntry) => void
}

/**
 * The journal (JRN-1): today's insights, good things, achievements,
 * gratitude, what to improve and thoughts, a few lines each, and — on asking — the week before, to read back (JRN-6).
 *
 * The sections come in the order they were dragged into (JRN-11), each folded
 * away or not as it was left (JRN-12). Whether the week is shown is not kept:
 * the page opens on today alone, the day being written.
 */
export function JournalPage({ entries, now, layout, onMove, onFold, onAdd, onChange, onRemove }: JournalPageProps) {
  const today = toLocalDay(now)
  const [showHistory, setShowHistory] = useState(false)
  const historyId = useId()
  const { order } = layout

  // A few pixels with a mouse, a held moment with a finger, as a row asks
  // (TASK-39): a press on a heading is still a fold, and a swipe still scrolls.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const titleOf = (id: string | number) => JOURNAL_SECTION_LABELS[id as Section].title
  /** Where a section is, as a person counts. */
  const placeOf = (id: string | number) =>
    `position ${String(order.indexOf(id as Section) + 1)} of ${String(order.length)}`

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up “${titleOf(active.id)}”, ${placeOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over === null
        ? `“${titleOf(active.id)}” is not over the sections.`
        : `“${titleOf(active.id)}” is over ${placeOf(over.id)}.`,
    onDragEnd: ({ active, over }) =>
      over === null ? `“${titleOf(active.id)}” dropped.` : `“${titleOf(active.id)}” dropped at ${placeOf(over.id)}.`,
    onDragCancel: ({ active }) => `Moving “${titleOf(active.id)}” was cancelled.`,
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over === null || active.id === over.id) return
    onMove(active.id as Section, over.id as Section)
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[straightUpAndDown]}
        accessibility={{ announcements }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={[...order]} strategy={verticalListSortingStrategy}>
          {order.map((section) => (
            <JournalSection
              // A new day starts its sections afresh, nothing half typed carried into it.
              key={`${section}-${today}`}
              section={section}
              lines={journalLines(entries, today, section)}
              folded={isJournalSectionFolded(layout, section)}
              onFold={onFold}
              onAdd={(chosen, text) => { onAdd(chosen, text, today) }}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
      </DndContext>

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
          {showHistory && <JournalHistory days={journalHistory(entries, now)} order={order} now={now} />}
        </div>
      </div>
    </div>
  )
}

/**
 * The week gone by, to read back (JRN-6): a card a day with anything written,
 * latest first, its sections in the page's order (JRN-11).
 */
function JournalHistory({ days, order, now }: { days: readonly JournalDay[]; order: readonly Section[]; now: Date }) {
  if (days.length === 0) {
    return <p className="px-2 text-sm text-neutral-500 dark:text-neutral-400">{NOTHING_IN_HISTORY}</p>
  }

  return days.map(({ day, sections }) => (
    <section key={day} aria-label={describeJournalDay(day, now)} className={`${card} flex flex-col gap-3 px-4 py-3.5`}>
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{describeJournalDay(day, now)}</h3>
      {order.filter((section) => sections[section].length > 0).map((section) => (
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
